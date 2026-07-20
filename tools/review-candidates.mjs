import path from "node:path";
import { fileURLToPath } from "node:url";

import { runCandidateReview } from "./lib/candidate-review-runner.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidatesPath = requiredPath("--candidates");
const reviewsPath = requiredPath("--reviews");
const songsPath = optionalPath("--songs", "data/songs.json");
const summaryPath = optionalPath(
  "--summary",
  ".updates/candidate-review-summary.json",
);
const markdownPath = optionalPath(
  "--markdown",
  ".updates/candidate-review-summary.md",
);

const result = await runCandidateReview({
  candidatesPath,
  reviewsPath,
  songsPath,
  summaryPath,
  markdownPath,
  writeSongs: process.argv.includes("--write-songs"),
});

console.log(
  `Candidate review complete: ${result.summary.accepted} accepted, `
    + `${result.summary.duplicates} duplicates, `
    + `${result.summary.rejected} rejected, `
    + `${result.summary.needsReview} need review.`,
);
if (result.summary.accepted > 0 && !process.argv.includes("--write-songs")) {
  console.log("Validation only: rerun with --write-songs to update the canonical database.");
}

function requiredPath(flag) {
  const value = argumentValue(flag);
  if (!value) {
    throw new Error(`${flag} is required.`);
  }
  return path.resolve(projectRoot, value);
}

function optionalPath(flag, fallback) {
  return path.resolve(projectRoot, argumentValue(flag) || fallback);
}

function argumentValue(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? "" : process.argv[index + 1] || "";
}
