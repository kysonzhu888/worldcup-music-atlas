const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS_URL_PATTERN = /^https:\/\//i;

const VERDICTS = new Set([
  "accepted",
  "duplicate",
  "rejected",
  "needs-review",
]);

const RELATIONSHIPS = new Set([
  "official-song",
  "official-anthem",
  "official-soundtrack",
  "ceremony-performance",
  "licensed-campaign",
  "fan-anthem",
]);

const PRIMARY_TOURNAMENT_KINDS = new Set([
  "fifa",
  "tournament-organizer",
  "football-association",
  "artist-official",
  "label-official",
]);

const TOURNAMENT_EVIDENCE_KINDS = new Set([
  ...PRIMARY_TOURNAMENT_KINDS,
  "reputable-editorial",
]);

const MUSIC_PLATFORMS = new Map([
  ["spotify", ["open.spotify.com"]],
  ["apple-music", ["music.apple.com"]],
  ["youtube-music", ["music.youtube.com", "youtube.com", "www.youtube.com"]],
  ["deezer", ["deezer.com", "www.deezer.com"]],
  ["tidal", ["tidal.com", "www.tidal.com"]],
  ["artist-official", null],
  ["label-official", null],
]);

export function candidateReviewKey(candidate) {
  return [
    String(candidate?.year || "").trim(),
    normalizeComparableText(candidate?.title),
    normalizeComparableText(candidate?.artist),
  ].join(":");
}

export function normalizeComparableText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function validateCandidateReview({ candidate, review, canonicalSongs }) {
  requireObject(review, "candidate review");
  if (review.schemaVersion !== 1) {
    throw new Error("Candidate review schemaVersion must be 1.");
  }
  if (!VERDICTS.has(review.verdict)) {
    throw new Error(`Unsupported candidate review verdict: ${review.verdict || "missing"}.`);
  }
  if (candidateReviewKey(candidate) !== candidateReviewKey(review.candidate)) {
    throw new Error("Candidate identity does not match the review record.");
  }
  const expectedSourceId = String(candidate?.provenance?.sourceId || "");
  if (expectedSourceId && review.candidate?.sourceId !== expectedSourceId) {
    throw new Error("Candidate sourceId does not match the discovery provenance.");
  }
  requireText(review.reasonCode, "reasonCode");
  requireText(review.rationale, "rationale", 30);
  requireDate(review.reviewedAt, "reviewedAt");
  requireText(review.reviewer?.model, "reviewer.model");
  requireText(review.reviewer?.reasoningEffort, "reviewer.reasoningEffort");

  const songs = Array.isArray(canonicalSongs) ? canonicalSongs : [];
  if (review.verdict === "duplicate") {
    const duplicate = songs.find((song) => song.slug === review.canonicalSlug);
    if (!duplicate) {
      throw new Error(`Duplicate review canonicalSlug does not exist: ${review.canonicalSlug || "missing"}.`);
    }
    if (review.proposedSong) {
      throw new Error("Duplicate review must not include a proposedSong.");
    }
    return review;
  }

  if (review.verdict !== "accepted") {
    if (review.proposedSong) {
      throw new Error(`${review.verdict} review must not include a proposedSong.`);
    }
    return review;
  }

  validateAcceptedReview({ candidate, review, canonicalSongs: songs });
  return review;
}

export function validateSongVerification(song) {
  requireObject(song?.verification, `${song?.slug || "song"}.verification`);
  const verification = song.verification;
  if (verification.status !== "verified") {
    throw new Error(`${song.slug}.verification.status must be verified.`);
  }
  if (!RELATIONSHIPS.has(verification.relationship)) {
    throw new Error(`${song.slug}.verification.relationship is unsupported.`);
  }
  requireDate(verification.reviewedAt, `${song.slug}.verification.reviewedAt`);
  requireText(verification.rationale, `${song.slug}.verification.rationale`, 20);
  validateTournamentEvidence(
    verification.tournamentEvidence,
    verification.relationship,
  );
  validateMusicEvidence(verification.musicEvidence);
  return verification;
}

export function applyCandidateReviews({ canonicalSongs, candidates, reviews }) {
  const songs = Array.isArray(canonicalSongs) ? [...canonicalSongs] : [];
  const discovered = Array.isArray(candidates) ? candidates : [];
  const decisions = Array.isArray(reviews) ? reviews : [];
  const reviewsByKey = new Map();

  for (const review of decisions) {
    const key = candidateReviewKey(review?.candidate);
    if (reviewsByKey.has(key)) {
      throw new Error(`Duplicate review decision for candidate ${key}.`);
    }
    reviewsByKey.set(key, review);
  }
  if (reviewsByKey.size !== discovered.length) {
    throw new Error("Candidate reviews must cover every discovered candidate exactly once.");
  }

  const summary = {
    discovered: discovered.length,
    accepted: 0,
    duplicates: 0,
    rejected: 0,
    needsReview: 0,
  };

  for (const candidate of discovered) {
    const key = candidateReviewKey(candidate);
    const review = reviewsByKey.get(key);
    if (!review) {
      throw new Error(`Missing review for candidate ${key}.`);
    }
    validateCandidateReview({ candidate, review, canonicalSongs: songs });

    if (review.verdict === "accepted") {
      songs.push(review.proposedSong);
      summary.accepted += 1;
    } else if (review.verdict === "duplicate") {
      summary.duplicates += 1;
    } else if (review.verdict === "rejected") {
      summary.rejected += 1;
    } else {
      summary.needsReview += 1;
    }
  }

  return { songs, summary };
}

function validateAcceptedReview({ candidate, review, canonicalSongs }) {
  validateTournamentEvidence(review.tournamentEvidence, relationshipFor(review));
  validateMusicEvidence(review.musicEvidence);
  validateProposedSong(review.proposedSong, candidate);

  const proposed = review.proposedSong;
  const duplicateSlug = canonicalSongs.some((song) => song.slug === proposed.slug);
  if (duplicateSlug) {
    throw new Error(`Accepted candidate slug already exists: ${proposed.slug}.`);
  }
  const duplicateIdentity = canonicalSongs.some((song) => (
    candidateReviewKey(song) === candidateReviewKey(proposed)
  ));
  if (duplicateIdentity) {
    throw new Error(`Accepted candidate identity already exists: ${proposed.slug}.`);
  }

  const verification = validateSongVerification(proposed);
  if (verification.reviewedAt !== review.reviewedAt) {
    throw new Error("Proposed song verification date must match reviewedAt.");
  }
  if (verification.relationship !== relationshipFor(review)) {
    throw new Error("Proposed song relationship does not match tournament evidence.");
  }

  const reviewedTournamentURLs = urlSet(review.tournamentEvidence);
  const storedTournamentURLs = urlSet(verification.tournamentEvidence);
  const reviewedMusicURLs = urlSet(review.musicEvidence);
  const storedMusicURLs = urlSet(verification.musicEvidence);
  if (!sameSet(reviewedTournamentURLs, storedTournamentURLs)) {
    throw new Error("Proposed song must preserve all reviewed tournament evidence.");
  }
  if (!sameSet(reviewedMusicURLs, storedMusicURLs)) {
    throw new Error("Proposed song must preserve all reviewed music evidence.");
  }

  const referenceURLs = new Set(proposed.references.map((reference) => reference.url));
  for (const url of [...reviewedTournamentURLs, ...reviewedMusicURLs]) {
    if (!referenceURLs.has(url)) {
      throw new Error(`Proposed song references omit reviewed evidence: ${url}.`);
    }
  }
}

function validateProposedSong(song, candidate) {
  requireObject(song, "proposedSong");
  for (const field of [
    "slug",
    "title",
    "artist",
    "year",
    "tournament",
    "country",
    "countrySlug",
    "language",
    "type",
    "status",
    "summary",
    "whyItMatters",
    "sourceLabel",
    "sourceUrl",
  ]) {
    requireText(song[field], `proposedSong.${field}`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(song.slug)) {
    throw new Error("proposedSong.slug must be a lowercase kebab-case slug.");
  }
  if (String(song.year) !== String(candidate.year)) {
    throw new Error("Proposed song year must match the candidate.");
  }
  if (normalizeComparableText(song.artist) !== normalizeComparableText(candidate.artist)) {
    throw new Error("Proposed song artist must match the candidate.");
  }
  if (normalizeComparableText(song.title) !== normalizeComparableText(candidate.title)) {
    throw new Error("Proposed song title must match the candidate.");
  }
  if (!Array.isArray(song.searchAngles) || song.searchAngles.length < 2) {
    throw new Error("Proposed song needs at least two searchAngles.");
  }
  if (!Array.isArray(song.references) || song.references.length < 2) {
    throw new Error("Proposed song needs at least two references.");
  }
  if (!Array.isArray(song.facts) || song.facts.length < 3) {
    throw new Error("Proposed song needs at least three verified facts.");
  }
  requireDate(song.lastChecked, "proposedSong.lastChecked");
  if (!HTTPS_URL_PATTERN.test(song.sourceUrl)) {
    throw new Error("Proposed song sourceUrl must use HTTPS.");
  }
}

function validateTournamentEvidence(evidence, relationship) {
  if (!RELATIONSHIPS.has(relationship)) {
    throw new Error(`Unsupported tournament relationship: ${relationship || "missing"}.`);
  }
  if (!Array.isArray(evidence) || evidence.length === 0) {
    throw new Error("Accepted review requires tournament evidence.");
  }
  for (const item of evidence) {
    requireObject(item, "tournament evidence");
    requireHTTPSURL(item.url, "tournament evidence URL");
    requireText(item.publisher, "tournament evidence publisher");
    if (!TOURNAMENT_EVIDENCE_KINDS.has(item.kind)) {
      throw new Error(`Unsupported tournament evidence kind: ${item.kind || "missing"}.`);
    }
    if (item.supports !== relationship) {
      throw new Error("Tournament evidence relationship does not match the review.");
    }
    requireText(item.sourceTitle, "tournament evidence sourceTitle");
    requireText(item.quote, "tournament evidence quote", 12);
    requireDate(item.checkedAt, "tournament evidence checkedAt");
    if (item.kind === "fifa" && !hostMatches(item.url, ["fifa.com"])) {
      throw new Error("FIFA evidence must use an official fifa.com host.");
    }
  }

  if (relationship === "fan-anthem") {
    const hosts = new Set(evidence.map((item) => new URL(item.url).hostname));
    if (hosts.size < 2) {
      throw new Error("Fan anthem requires two independent tournament evidence hosts.");
    }
    if (!evidence.some((item) => (
      item.kind === "football-association"
        || item.kind === "tournament-organizer"
        || item.kind === "fifa"
    ))) {
      throw new Error("Fan anthem needs an organizer or football-association source.");
    }
    return;
  }

  if (!evidence.some((item) => PRIMARY_TOURNAMENT_KINDS.has(item.kind))) {
    throw new Error("Official tournament relationship requires primary tournament evidence.");
  }
}

function validateMusicEvidence(evidence) {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    throw new Error("Accepted review requires music evidence.");
  }
  for (const item of evidence) {
    requireObject(item, "music evidence");
    requireHTTPSURL(item.url, "music evidence URL");
    if (!MUSIC_PLATFORMS.has(item.platform)) {
      throw new Error(`Unsupported music evidence platform: ${item.platform || "missing"}.`);
    }
    if (item.matchedTitle !== true || item.matchedArtist !== true) {
      throw new Error("Music evidence must match both title and artist.");
    }
    requireDate(item.checkedAt, "music evidence checkedAt");
    const allowedHosts = MUSIC_PLATFORMS.get(item.platform);
    if (allowedHosts && !hostMatches(item.url, allowedHosts)) {
      throw new Error(`${item.platform} evidence uses an unexpected host.`);
    }
  }
}

function relationshipFor(review) {
  const relationships = new Set(
    (review.tournamentEvidence || []).map((item) => item.supports),
  );
  if (relationships.size !== 1) {
    throw new Error("Tournament evidence must agree on one relationship.");
  }
  return [...relationships][0];
}

function hostMatches(value, allowedHosts) {
  const hostname = new URL(value).hostname.toLowerCase();
  return allowedHosts.some((allowed) => (
    hostname === allowed || hostname.endsWith(`.${allowed}`)
  ));
}

function requireHTTPSURL(value, label) {
  if (!HTTPS_URL_PATTERN.test(String(value || ""))) {
    throw new Error(`${label} must use HTTPS.`);
  }
  new URL(value);
}

function requireDate(value, label) {
  if (!ISO_DATE_PATTERN.test(String(value || ""))) {
    throw new Error(`${label} must use YYYY-MM-DD.`);
  }
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function requireText(value, label, minimumLength = 1) {
  if (typeof value !== "string" || value.trim().length < minimumLength) {
    throw new Error(`${label} must contain at least ${minimumLength} characters.`);
  }
}

function urlSet(values) {
  return new Set((values || []).map((value) => value.url));
}

function sameSet(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value));
}
