import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { runCandidateReview } from "../tools/lib/candidate-review-runner.mjs";

const testDirectory = path.resolve(
  ".updates",
  `candidate-review-runner-test-${process.pid}`,
);

test("candidate review runner covers discovery and writes an auditable summary", async () => {
  await mkdir(testDirectory, { recursive: true });
  const candidatesPath = path.join(testDirectory, "candidates.json");
  const reviewsPath = path.join(testDirectory, "reviews.json");
  const songsPath = path.join(testDirectory, "songs.json");
  const summaryPath = path.join(testDirectory, "summary.json");
  const canonicalSong = {
    slug: "the-cup-of-life",
    title: "The Cup of Life",
    artist: "Ricky Martin",
    year: "1998",
  };
  const candidate = {
    year: "1998",
    title: "La Copa de la Vida (The Cup of Life)",
    artist: "Ricky Martin",
    provenance: { sourceId: "seed" },
  };

  await Promise.all([
    writeFile(candidatesPath, JSON.stringify({ candidates: [candidate] })),
    writeFile(reviewsPath, JSON.stringify({
      schemaVersion: 1,
      reviews: [{
        schemaVersion: 1,
        candidate: {
          year: candidate.year,
          title: candidate.title,
          artist: candidate.artist,
          sourceId: candidate.provenance.sourceId,
        },
        verdict: "duplicate",
        reasonCode: "translated_title_duplicate",
        rationale: "The licensed title is a translation of the existing canonical recording.",
        reviewedAt: "2026-07-20",
        reviewer: { model: "gpt-5.6-sol", reasoningEffort: "ultra" },
        canonicalSlug: canonicalSong.slug,
      }],
    })),
    writeFile(songsPath, JSON.stringify([canonicalSong])),
  ]);

  try {
    const result = await runCandidateReview({
      candidatesPath,
      reviewsPath,
      songsPath,
      summaryPath,
      writeSongs: true,
    });
    const storedSongs = JSON.parse(await readFile(songsPath, "utf8"));
    const storedSummary = JSON.parse(await readFile(summaryPath, "utf8"));

    assert.deepEqual(storedSongs, [canonicalSong]);
    assert.equal(result.summary.duplicates, 1);
    assert.equal(storedSummary.source.candidates, candidatesPath);
    assert.equal(storedSummary.summary.accepted, 0);
  } finally {
    await rm(testDirectory, { recursive: true, force: true });
  }
});
