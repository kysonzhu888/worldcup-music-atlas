import {
  candidateReviewKey,
  validateSongVerification,
} from "./song-verification.mjs";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WEAK_TOURNAMENT_HOSTS = new Set([
  "en.wikipedia.org",
  "wikipedia.org",
  "www.espn.com",
  "espn.com",
  "www.goal.com",
  "goal.com",
  "nypost.com",
  "www.nypost.com",
]);
const AUDIT_VERDICTS = new Set(["verified", "needs-review", "unrelated"]);

export function auditSongLibrary({
  songs,
  checkedAt,
  maxReviewAgeDays = 120,
}) {
  const canonicalSongs = Array.isArray(songs) ? songs : [];
  requireDate(checkedAt, "checkedAt");
  const findings = [];
  const slugs = new Map();
  const identities = new Map();

  for (const song of canonicalSongs) {
    const slug = String(song?.slug || "");
    const identity = candidateReviewKey(song);
    recordDuplicate(slugs, slug, song, "duplicate-slug", findings);
    recordDuplicate(identities, identity, song, "duplicate-identity", findings);

    if (!song?.verification) {
      findings.push(reviewFinding(song, "verification-missing", "Song has no semantic verification contract."));
    } else {
      try {
        validateSongVerification(song);
      } catch (error) {
        findings.push({
          severity: "blocking",
          code: "verification-invalid",
          slug,
          detail: error.message,
        });
      }
    }

    if (isWeakTournamentSource(song?.sourceUrl)) {
      findings.push(reviewFinding(
        song,
        "weak-tournament-source",
        "Primary source is an editorial or discovery source and needs authoritative confirmation.",
      ));
    }
    if (isReviewStale(song?.lastChecked, checkedAt, maxReviewAgeDays)) {
      findings.push(reviewFinding(
        song,
        "review-stale",
        `Song has not been checked within ${maxReviewAgeDays} days.`,
      ));
    }
  }

  const slugsNeedingReview = new Set(
    findings
      .filter((finding) => finding.severity === "review")
      .map((finding) => finding.slug),
  );
  const verified = canonicalSongs.filter((song) => (
    song.verification?.status === "verified"
      && !findings.some((finding) => finding.slug === song.slug)
  )).length;

  return {
    schemaVersion: 1,
    checkedAt,
    policy: {
      maxReviewAgeDays,
      removal: "Never auto-remove. An unrelated verdict requires a second independent review.",
    },
    summary: {
      totalSongs: canonicalSongs.length,
      verified,
      needsSemanticReview: slugsNeedingReview.size,
      blockingFindings: findings.filter((finding) => finding.severity === "blocking").length,
    },
    findings: findings.sort(compareFindings),
  };
}

export function validateLibraryAuditReport({ songs, report }) {
  const canonicalSongs = Array.isArray(songs) ? songs : [];
  if (report?.schemaVersion !== 1) {
    throw new Error("Library audit report schemaVersion must be 1.");
  }
  requireDate(report.checkedAt, "checkedAt");
  requireText(report.reviewer?.model, "reviewer.model");
  requireText(report.reviewer?.reasoningEffort, "reviewer.reasoningEffort");
  if (!Array.isArray(report.results)) {
    throw new Error("Library audit report results must be an array.");
  }

  const canonicalSlugs = new Set(canonicalSongs.map((song) => song.slug));
  const resultSlugs = new Set(report.results.map((result) => result.slug));
  if (
    canonicalSlugs.size !== resultSlugs.size
      || [...canonicalSlugs].some((slug) => !resultSlugs.has(slug))
      || report.results.length !== resultSlugs.size
  ) {
    throw new Error("Library audit report must cover every canonical song exactly once.");
  }

  for (const result of report.results) {
    if (!canonicalSlugs.has(result.slug)) {
      throw new Error(`Library audit result references unknown slug: ${result.slug}.`);
    }
    if (!AUDIT_VERDICTS.has(result.verdict)) {
      throw new Error(`Unsupported library audit verdict: ${result.verdict || "missing"}.`);
    }
    requireText(result.rationale, `${result.slug}.rationale`, 20);
    if (result.verdict === "verified") {
      validateSongVerification({
        slug: result.slug,
        verification: result.verification,
      });
      if (result.verification.reviewedAt !== report.checkedAt) {
        throw new Error(`${result.slug} verification date must match report checkedAt.`);
      }
    }
    if (result.verdict === "unrelated") {
      if (result.secondReviewRequired !== true) {
        throw new Error(`${result.slug} unrelated verdict requires a second independent review.`);
      }
      requireText(result.reasonCode, `${result.slug}.reasonCode`);
      if (!Array.isArray(result.evidenceChecked) || result.evidenceChecked.length < 2) {
        throw new Error(`${result.slug} unrelated verdict needs at least two checked evidence URLs.`);
      }
    }
  }
  return report;
}

export function applyLibraryAuditReport({ songs, report }) {
  validateLibraryAuditReport({ songs, report });
  const resultsBySlug = new Map(report.results.map((result) => [result.slug, result]));
  const summary = {
    verified: 0,
    needsReview: 0,
    unrelatedPendingSecondReview: 0,
  };

  const updatedSongs = songs.map((song) => {
    const result = resultsBySlug.get(song.slug);
    if (result.verdict === "verified") {
      summary.verified += 1;
      return {
        ...song,
        lastChecked: report.checkedAt,
        verification: result.verification,
      };
    }
    if (result.verdict === "unrelated") {
      summary.unrelatedPendingSecondReview += 1;
    } else {
      summary.needsReview += 1;
    }
    return song;
  });

  return { songs: updatedSongs, summary };
}

function recordDuplicate(map, key, song, code, findings) {
  if (!key) {
    findings.push({
      severity: "blocking",
      code: code === "duplicate-slug" ? "slug-missing" : "identity-missing",
      slug: String(song?.slug || ""),
      detail: "Song is missing a stable identity field.",
    });
    return;
  }
  if (map.has(key)) {
    findings.push({
      severity: "blocking",
      code,
      slug: String(song?.slug || ""),
      detail: `Conflicts with canonical slug ${map.get(key).slug}.`,
    });
    return;
  }
  map.set(key, song);
}

function reviewFinding(song, code, detail) {
  return {
    severity: "review",
    code,
    slug: String(song?.slug || ""),
    detail,
  };
}

function isWeakTournamentSource(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return WEAK_TOURNAMENT_HOSTS.has(host);
  } catch {
    return true;
  }
}

function isReviewStale(lastChecked, checkedAt, maxReviewAgeDays) {
  if (!ISO_DATE_PATTERN.test(String(lastChecked || ""))) return true;
  const lastCheckedMs = Date.parse(`${lastChecked}T00:00:00Z`);
  const checkedAtMs = Date.parse(`${checkedAt}T00:00:00Z`);
  return (checkedAtMs - lastCheckedMs) / 86_400_000 > maxReviewAgeDays;
}

function compareFindings(left, right) {
  return (
    left.severity.localeCompare(right.severity)
      || left.slug.localeCompare(right.slug)
      || left.code.localeCompare(right.code)
  );
}

function requireDate(value, label) {
  if (!ISO_DATE_PATTERN.test(String(value || ""))) {
    throw new Error(`${label} must use YYYY-MM-DD.`);
  }
}

function requireText(value, label, minimumLength = 1) {
  if (typeof value !== "string" || value.trim().length < minimumLength) {
    throw new Error(`${label} must contain at least ${minimumLength} characters.`);
  }
}
