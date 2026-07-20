import assert from "node:assert/strict";
import test from "node:test";

import {
  applyCandidateReviews,
  candidateReviewKey,
  validateCandidateReview,
} from "../tools/lib/song-verification.mjs";

const candidate = {
  year: "1966",
  title: "World Cup Willie",
  artist: "Lonnie Donegan",
  provenance: {
    sourceId: "beatify-world-cup-anthems",
    revision: "abc123",
  },
};

const tournamentEvidence = {
  url: "https://www.fifa.com/tournaments/mens/worldcup/1966/world-cup-willie",
  publisher: "FIFA",
  kind: "fifa",
  supports: "official-song",
  sourceTitle: "World Cup Willie",
  quote: "The official song for the 1966 FIFA World Cup.",
  checkedAt: "2026-07-20",
};

const musicEvidence = {
  url: "https://open.spotify.com/track/6otZIO8NVB7xV3seYqUfGt",
  platform: "spotify",
  matchedTitle: true,
  matchedArtist: true,
  checkedAt: "2026-07-20",
};

function acceptedReview(overrides = {}) {
  return {
    schemaVersion: 1,
    candidate: {
      year: candidate.year,
      title: candidate.title,
      artist: candidate.artist,
      sourceId: candidate.provenance.sourceId,
    },
    verdict: "accepted",
    reasonCode: "verified_official_song",
    rationale: "FIFA identifies the track as tournament music and Spotify confirms the recording identity.",
    reviewedAt: "2026-07-20",
    reviewer: {
      model: "gpt-5.6-sol",
      reasoningEffort: "ultra",
    },
    tournamentEvidence: [tournamentEvidence],
    musicEvidence: [musicEvidence],
    proposedSong: {
      slug: "world-cup-willie",
      title: "World Cup Willie",
      artist: "Lonnie Donegan",
      year: "1966",
      tournament: "1966 FIFA World Cup",
      country: "England",
      countrySlug: "england",
      language: "English",
      type: "official",
      status: "Official song",
      summary: "A verified 1966 tournament song entry centered on the first World Cup mascot era.",
      whyItMatters: "It documents how official tournament music developed before modern global soundtrack campaigns.",
      searchAngles: [
        "World Cup Willie song",
        "1966 World Cup official song",
      ],
      sourceLabel: "FIFA tournament record",
      sourceUrl: tournamentEvidence.url,
      references: [
        {
          kind: "Official",
          label: "FIFA tournament record",
          url: tournamentEvidence.url,
          note: "Confirms the tournament relationship.",
        },
        {
          kind: "Licensed platform",
          label: "Spotify recording",
          url: musicEvidence.url,
          note: "Confirms the title and artist credit.",
        },
      ],
      facts: [
        "The song is tied to the 1966 tournament.",
        "Lonnie Donegan is the credited performer.",
        "The record belongs to the mascot-led World Cup era.",
      ],
      lastChecked: "2026-07-20",
      verification: {
        status: "verified",
        relationship: "official-song",
        reviewedAt: "2026-07-20",
        rationale: "Primary tournament evidence and licensed recording identity agree.",
        tournamentEvidence: [tournamentEvidence],
        musicEvidence: [musicEvidence],
      },
    },
    ...overrides,
  };
}

test("candidateReviewKey is stable across punctuation and accents", () => {
  assert.equal(
    candidateReviewKey(candidate),
    candidateReviewKey({
      year: 1966,
      title: "World-Cup Willie!",
      artist: "Lonnie Donegan",
    }),
  );
});

test("accepted official-song review requires tournament and music evidence", () => {
  assert.doesNotThrow(() => validateCandidateReview({
    candidate,
    review: acceptedReview(),
    canonicalSongs: [],
  }));

  assert.throws(
    () => validateCandidateReview({
      candidate,
      review: acceptedReview({ musicEvidence: [] }),
      canonicalSongs: [],
    }),
    /music evidence/i,
  );
});

test("fan anthem needs two independent tournament evidence hosts", () => {
  const fanCandidate = {
    ...candidate,
    year: "2022",
    title: "Supporter Song",
    artist: "Supporters",
  };
  const oneEditorialSource = {
    ...tournamentEvidence,
    url: "https://www.espn.com/soccer/story/supporter-song",
    publisher: "ESPN",
    kind: "reputable-editorial",
    supports: "fan-anthem",
  };
  const review = acceptedReview({
    candidate: {
      year: fanCandidate.year,
      title: fanCandidate.title,
      artist: fanCandidate.artist,
      sourceId: candidate.provenance.sourceId,
    },
    tournamentEvidence: [oneEditorialSource],
    proposedSong: {
      ...acceptedReview().proposedSong,
      slug: "supporter-song",
      title: fanCandidate.title,
      artist: fanCandidate.artist,
      year: fanCandidate.year,
      tournament: "2022 FIFA World Cup",
      type: "fan",
      status: "Fan anthem",
      sourceUrl: oneEditorialSource.url,
      verification: {
        ...acceptedReview().proposedSong.verification,
        relationship: "fan-anthem",
        tournamentEvidence: [oneEditorialSource],
      },
    },
  });

  assert.throws(
    () => validateCandidateReview({
      candidate: fanCandidate,
      review,
      canonicalSongs: [],
    }),
    /two independent/i,
  );

  const associationSource = {
    ...oneEditorialSource,
    url: "https://www.thefa.com/news/2022/12/01/supporter-song",
    publisher: "The Football Association",
    kind: "football-association",
  };
  review.tournamentEvidence.push(associationSource);
  review.proposedSong.verification.tournamentEvidence.push(associationSource);
  review.proposedSong.references.push({
    kind: "Editorial",
    label: "Independent supporter coverage",
    url: oneEditorialSource.url,
    note: "Provides the independent source required for a fan-anthem decision.",
  });
  review.proposedSong.references.push({
    kind: "Official",
    label: "Association supporter record",
    url: associationSource.url,
    note: "Confirms tournament adoption.",
  });

  assert.doesNotThrow(() => validateCandidateReview({
    candidate: fanCandidate,
    review,
    canonicalSongs: [],
  }));
});

test("duplicate verdict links to a canonical slug and never appends a song", () => {
  const canonicalSongs = [{
    slug: "the-cup-of-life",
    title: "The Cup of Life",
    artist: "Ricky Martin",
    year: "1998",
  }];
  const duplicateCandidate = {
    year: "1998",
    title: "La Copa de la Vida (The Cup of Life)",
    artist: "Ricky Martin",
    provenance: { sourceId: "beatify-world-cup-anthems" },
  };
  const review = {
    schemaVersion: 1,
    candidate: {
      year: duplicateCandidate.year,
      title: duplicateCandidate.title,
      artist: duplicateCandidate.artist,
      sourceId: duplicateCandidate.provenance.sourceId,
    },
    verdict: "duplicate",
    reasonCode: "translated_title_duplicate",
    rationale: "The licensed recording is the Spanish title of the existing canonical entry.",
    reviewedAt: "2026-07-20",
    reviewer: { model: "gpt-5.6-sol", reasoningEffort: "ultra" },
    canonicalSlug: "the-cup-of-life",
    tournamentEvidence: [tournamentEvidence],
    musicEvidence: [musicEvidence],
  };

  const result = applyCandidateReviews({
    canonicalSongs,
    candidates: [duplicateCandidate],
    reviews: [review],
  });

  assert.equal(result.songs.length, 1);
  assert.equal(result.summary.duplicates, 1);
  assert.equal(result.summary.accepted, 0);
});

test("candidate review cannot be applied to a different candidate", () => {
  assert.throws(
    () => validateCandidateReview({
      candidate: { ...candidate, title: "Different Song" },
      review: acceptedReview(),
      canonicalSongs: [],
    }),
    /candidate identity/i,
  );
});
