import assert from "node:assert/strict";
import test from "node:test";

import {
  applyLibraryAuditReport,
  auditSongLibrary,
  validateLibraryAuditReport,
} from "../tools/lib/song-library-audit.mjs";

const tournamentEvidence = {
  url: "https://inside.fifa.com/media-releases/example-song",
  publisher: "FIFA",
  kind: "fifa",
  supports: "official-song",
  sourceTitle: "Example Song",
  quote: "FIFA confirms Example Song as official tournament music.",
  checkedAt: "2026-07-20",
};

const musicEvidence = {
  url: "https://open.spotify.com/track/example",
  platform: "spotify",
  matchedTitle: true,
  matchedArtist: true,
  checkedAt: "2026-07-20",
};

function verifiedSong(overrides = {}) {
  return {
    slug: "example-song",
    title: "Example Song",
    artist: "Example Artist",
    year: "2026",
    tournament: "2026 FIFA World Cup",
    status: "Official song",
    sourceUrl: tournamentEvidence.url,
    lastChecked: "2026-07-20",
    verification: {
      status: "verified",
      relationship: "official-song",
      reviewedAt: "2026-07-20",
      rationale: "FIFA and a licensed platform agree.",
      tournamentEvidence: [tournamentEvidence],
      musicEvidence: [musicEvidence],
    },
    ...overrides,
  };
}

test("structural audit sends legacy and stale entries to semantic review", () => {
  const report = auditSongLibrary({
    songs: [
      {
        slug: "legacy-song",
        title: "Legacy Song",
        artist: "Legacy Artist",
        year: "1994",
        tournament: "1994 FIFA World Cup",
        sourceUrl: "https://en.wikipedia.org/wiki/Legacy_Song",
        lastChecked: "2026-01-01",
      },
      verifiedSong(),
    ],
    checkedAt: "2026-07-20",
    maxReviewAgeDays: 120,
  });

  assert.equal(report.summary.totalSongs, 2);
  assert.equal(report.summary.verified, 1);
  assert.equal(report.summary.needsSemanticReview, 1);
  assert.deepEqual(
    report.findings
      .filter((finding) => finding.slug === "legacy-song")
      .map((finding) => finding.code)
      .sort(),
    ["review-stale", "verification-missing", "weak-tournament-source"],
  );
});

test("duplicate slugs and song identities are blocking findings", () => {
  const report = auditSongLibrary({
    songs: [
      verifiedSong(),
      verifiedSong({ artist: "Another Credit" }),
      verifiedSong({ slug: "another-slug" }),
    ],
    checkedAt: "2026-07-20",
  });

  assert.equal(report.summary.blockingFindings, 2);
  assert.deepEqual(
    report.findings
      .filter((finding) => finding.severity === "blocking")
      .map((finding) => finding.code)
      .sort(),
    ["duplicate-identity", "duplicate-slug"],
  );
});

test("semantic audit report must cover every canonical song exactly once", () => {
  const songs = [verifiedSong(), verifiedSong({
    slug: "second-song",
    title: "Second Song",
  })];
  const report = {
    schemaVersion: 1,
    checkedAt: "2026-07-20",
    reviewer: { model: "gpt-5.6-sol", reasoningEffort: "ultra" },
    results: [{
      slug: "example-song",
      verdict: "verified",
      rationale: "Primary tournament and music identity sources agree.",
      verification: verifiedSong().verification,
    }],
  };

  assert.throws(
    () => validateLibraryAuditReport({ songs, report }),
    /cover every canonical song/i,
  );
});

test("unrelated verdict requires a second independent review and is never auto-removed", () => {
  const songs = [verifiedSong()];
  const report = {
    schemaVersion: 1,
    checkedAt: "2026-07-20",
    reviewer: { model: "gpt-5.6-sol", reasoningEffort: "ultra" },
    results: [{
      slug: "example-song",
      verdict: "unrelated",
      rationale: "The checked sources identify the recording but do not connect it to a World Cup.",
      reasonCode: "tournament_relationship_not_verified",
      secondReviewRequired: true,
      evidenceChecked: [tournamentEvidence.url, musicEvidence.url],
    }],
  };

  assert.doesNotThrow(() => validateLibraryAuditReport({ songs, report }));
  const applied = applyLibraryAuditReport({ songs, report });
  assert.equal(applied.songs.length, 1);
  assert.equal(applied.songs[0].slug, "example-song");
  assert.equal(applied.summary.unrelatedPendingSecondReview, 1);

  report.results[0].secondReviewRequired = false;
  assert.throws(
    () => validateLibraryAuditReport({ songs, report }),
    /second independent review/i,
  );
});
