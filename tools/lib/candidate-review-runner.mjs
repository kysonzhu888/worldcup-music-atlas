import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { applyCandidateReviews } from "./song-verification.mjs";
import { serializeSongLibrary } from "./song-json.mjs";

export async function runCandidateReview({
  candidatesPath,
  reviewsPath,
  songsPath,
  summaryPath,
  markdownPath,
  writeSongs = false,
}) {
  const [candidateDocument, reviewDocument, canonicalSongs] = await Promise.all([
    readJson(candidatesPath),
    readJson(reviewsPath),
    readJson(songsPath),
  ]);
  const candidates = requireArray(candidateDocument?.candidates, "candidates");
  const reviews = requireArray(reviewDocument?.reviews, "reviews");
  if (reviewDocument?.schemaVersion !== 1) {
    throw new Error("Review document schemaVersion must be 1.");
  }

  const applied = applyCandidateReviews({
    canonicalSongs,
    candidates,
    reviews,
  });
  const summaryDocument = {
    schemaVersion: 1,
    reviewedAt: reviewDate(reviews),
    source: {
      candidates: candidatesPath,
      reviews: reviewsPath,
      songs: songsPath,
    },
    summary: applied.summary,
    decisions: reviews.map((review) => ({
      candidate: review.candidate,
      verdict: review.verdict,
      reasonCode: review.reasonCode,
      canonicalSlug: review.canonicalSlug || null,
      proposedSlug: review.proposedSong?.slug || null,
    })),
  };

  const writes = [
    atomicWrite(summaryPath, `${JSON.stringify(summaryDocument, null, 2)}\n`),
  ];
  if (markdownPath) {
    writes.push(atomicWrite(markdownPath, renderMarkdown(summaryDocument)));
  }
  if (writeSongs && applied.summary.accepted > 0) {
    writes.push(atomicWrite(songsPath, serializeSongLibrary(applied.songs)));
  }
  await Promise.all(writes);

  return {
    songs: applied.songs,
    summary: applied.summary,
    summaryDocument,
  };
}

function reviewDate(reviews) {
  const dates = new Set(reviews.map((review) => review.reviewedAt));
  if (dates.size !== 1) {
    throw new Error("All candidate decisions in one review run must share reviewedAt.");
  }
  return [...dates][0];
}

function renderMarkdown(document) {
  const rows = document.decisions.length
    ? document.decisions.map((decision) => (
      `| ${escapeCell(decision.candidate.year)} | ${escapeCell(decision.candidate.title)} | `
        + `${escapeCell(decision.verdict)} | ${escapeCell(decision.reasonCode)} | `
        + `${escapeCell(decision.proposedSlug || decision.canonicalSlug || "—")} |`
    )).join("\n")
    : "| — | No candidates | — | — | — |";

  return `# Candidate verification report\n\n`
    + `Reviewed: ${document.reviewedAt}\n\n`
    + `- Discovered: ${document.summary.discovered}\n`
    + `- Accepted: ${document.summary.accepted}\n`
    + `- Duplicates: ${document.summary.duplicates}\n`
    + `- Rejected: ${document.summary.rejected}\n`
    + `- Needs review: ${document.summary.needsReview}\n\n`
    + `| Year | Candidate | Verdict | Reason | Canonical result |\n`
    + `|---:|---|---|---|---|\n${rows}\n`;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value;
}

function escapeCell(value) {
  return String(value || "").replace(/\|/g, "\\|");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function atomicWrite(filePath, contents) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  await writeFile(temporaryPath, contents);
  await rename(temporaryPath, filePath);
}
