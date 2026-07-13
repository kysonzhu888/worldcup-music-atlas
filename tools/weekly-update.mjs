import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCandidateReport } from "./lib/weekly-update.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, ".updates");
const fetchedAt = process.env.WEEKLY_UPDATE_FETCHED_AT || new Date().toISOString();
const seedFile = argumentValue("--seed-file");

const [canonicalSongs, updateSources] = await Promise.all([
  readJson(path.join(projectRoot, "data/songs.json")),
  readJson(path.join(projectRoot, "data/update-sources.json")),
]);

await mkdir(outputDirectory, { recursive: true });

const reports = [];
for (const source of updateSources) {
  const snapshot = seedFile
    ? { seed: await readJson(path.resolve(seedFile)), revision: "local-fixture" }
    : fetchGitHubSnapshot(source);
  reports.push(buildCandidateReport({
    canonicalSongs,
    seed: snapshot.seed,
    source,
    fetchedAt,
    revision: snapshot.revision,
  }));
}

const combined = combineReports(reports, fetchedAt);
const jsonPath = path.join(outputDirectory, "weekly-candidates.json");
const markdownPath = path.join(outputDirectory, "weekly-report.md");
await Promise.all([
  writeFile(jsonPath, `${JSON.stringify(combined, null, 2)}\n`),
  writeFile(markdownPath, renderMarkdown(combined)),
]);

console.log(`Weekly discovery complete: ${combined.summary.needsReview} candidates need review.`);
console.log(`JSON: ${path.relative(projectRoot, jsonPath)}`);
console.log(`Report: ${path.relative(projectRoot, markdownPath)}`);

function fetchGitHubSnapshot(source) {
  const endpoint = `repos/${source.repository}/contents/${source.path}`;
  let response;
  try {
    response = JSON.parse(execFileSync("gh", ["api", endpoint], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }));
  } catch (error) {
    const details = error.stderr?.toString().trim() || error.message;
    throw new Error(`Unable to fetch ${source.id} through GitHub CLI: ${details}`);
  }

  return {
    revision: response.sha,
    seed: JSON.parse(Buffer.from(response.content, "base64").toString("utf8")),
  };
}

function combineReports(reports, generatedAt) {
  const candidates = reports
    .flatMap((report) => report.candidates)
    .sort((left, right) => (
      Number(left.year) - Number(right.year) || left.title.localeCompare(right.title)
    ));

  return {
    schemaVersion: 1,
    generatedAt,
    policy: "Discovery only. Every candidate needs primary-source verification and original writing before publication.",
    summary: {
      sourcesChecked: reports.length,
      discovered: reports.reduce((total, report) => total + report.summary.discovered, 0),
      alreadyIndexed: reports.reduce((total, report) => total + report.summary.alreadyIndexed, 0),
      needsReview: candidates.length,
    },
    sources: reports.map((report) => report.source),
    candidates,
  };
}

function renderMarkdown(report) {
  const rows = report.candidates.length
    ? report.candidates.map((candidate) => (
      `| ${candidate.year} | ${escapeCell(candidate.title)} | ${escapeCell(candidate.artist)} | ${candidate.state} |`
    )).join("\n")
    : "| — | No new candidates | — | — |";

  return `# Weekly World Cup music discovery\n\nGenerated: ${report.generatedAt}\n\n` +
    `This report is candidate-only. Verify tournament status with primary sources and write original context before publishing.\n\n` +
    `- Sources checked: ${report.summary.sourcesChecked}\n` +
    `- Seed entries discovered: ${report.summary.discovered}\n` +
    `- Already indexed: ${report.summary.alreadyIndexed}\n` +
    `- Needs review: ${report.summary.needsReview}\n\n` +
    `| Year | Candidate | Artist | State |\n|---:|---|---|---|\n${rows}\n`;
}

function escapeCell(value) {
  return String(value || "").replace(/\|/g, "\\|");
}

function argumentValue(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? "" : process.argv[index + 1] || "";
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}
