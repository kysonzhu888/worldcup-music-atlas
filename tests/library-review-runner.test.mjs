import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { runLibraryReview } from "../tools/lib/library-review-runner.mjs";

const testDirectory = path.resolve(
  ".updates",
  `library-review-runner-test-${process.pid}`,
);

test("library review runner validates full coverage before writing verification", async () => {
  await mkdir(testDirectory, { recursive: true });
  const songsPath = path.join(testDirectory, "songs.json");
  const reportPath = path.join(testDirectory, "review.json");
  const summaryPath = path.join(testDirectory, "summary.json");
  const song = {
    slug: "world-cup-willie",
    title: "World Cup Willie",
    artist: "Lonnie Donegan",
    year: "1966",
    sourceUrl: "https://inside.fifa.com/example/world-cup-willie",
    lastChecked: "2026-01-01",
  };
  const tournamentEvidence = {
    url: song.sourceUrl,
    publisher: "FIFA",
    kind: "fifa",
    supports: "official-song",
    sourceTitle: "World Cup Willie",
    quote: "FIFA identifies the recording as official World Cup music.",
    checkedAt: "2026-07-20",
  };
  const musicEvidence = {
    url: "https://open.spotify.com/track/example",
    platform: "spotify",
    matchedTitle: true,
    matchedArtist: true,
    checkedAt: "2026-07-20",
  };

  await Promise.all([
    writeFile(songsPath, JSON.stringify([song])),
    writeFile(reportPath, JSON.stringify({
      schemaVersion: 1,
      checkedAt: "2026-07-20",
      reviewer: { model: "gpt-5.6-sol", reasoningEffort: "ultra" },
      results: [{
        slug: song.slug,
        verdict: "verified",
        rationale: "Primary tournament evidence and the licensed recording identity agree.",
        verification: {
          status: "verified",
          relationship: "official-song",
          reviewedAt: "2026-07-20",
          rationale: "FIFA and Spotify evidence identify the same tournament recording.",
          tournamentEvidence: [tournamentEvidence],
          musicEvidence: [musicEvidence],
        },
      }],
    })),
  ]);

  try {
    const result = await runLibraryReview({
      songsPath,
      reportPath,
      summaryPath,
      writeSongs: true,
    });
    const storedSongs = JSON.parse(await readFile(songsPath, "utf8"));

    assert.equal(result.summary.verified, 1);
    assert.equal(storedSongs[0].lastChecked, "2026-07-20");
    assert.equal(storedSongs[0].verification.relationship, "official-song");
  } finally {
    await rm(testDirectory, { recursive: true, force: true });
  }
});
