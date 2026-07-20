import path from "node:path";
import { fileURLToPath } from "node:url";

import { runLibraryReview } from "./lib/library-review-runner.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = requiredPath("--report");
const songsPath = optionalPath("--songs", "data/songs.json");
const summaryPath = optionalPath(
  "--summary",
  ".updates/library-review-summary.json",
);
const markdownPath = optionalPath(
  "--markdown",
  ".updates/library-review-summary.md",
);
const writeSongs = process.argv.includes("--write-songs");

const result = await runLibraryReview({
  songsPath,
  reportPath,
  summaryPath,
  markdownPath,
  writeSongs,
});

console.log(
  `Library review complete: ${result.summary.verified} verified, `
    + `${result.summary.needsReview} need review, `
    + `${result.summary.unrelatedPendingSecondReview} unrelated verdicts need a second review.`,
);
if (result.summary.verified > 0 && !writeSongs) {
  console.log("Validation only: rerun with --write-songs to update canonical verification.");
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
