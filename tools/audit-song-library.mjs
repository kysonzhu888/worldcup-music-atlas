import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { auditSongLibrary } from "./lib/song-library-audit.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkedAt = process.env.AUDIT_CHECKED_AT || new Date().toISOString().slice(0, 10);
const maxReviewAgeDays = positiveInteger(
  process.env.AUDIT_MAX_REVIEW_AGE_DAYS || "120",
  "AUDIT_MAX_REVIEW_AGE_DAYS",
);
const songs = JSON.parse(await readFile(path.join(projectRoot, "data/songs.json"), "utf8"));
const report = auditSongLibrary({ songs, checkedAt, maxReviewAgeDays });
const outputDirectory = path.join(projectRoot, ".updates");

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  atomicWrite(
    path.join(outputDirectory, "library-audit.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  ),
  atomicWrite(
    path.join(outputDirectory, "library-audit.md"),
    renderMarkdown(report),
  ),
]);

console.log(
  `Library audit complete: ${report.summary.totalSongs} songs; `
    + `${report.summary.needsSemanticReview} need semantic review; `
    + `${report.summary.blockingFindings} blocking findings.`,
);

if (report.summary.blockingFindings > 0) {
  process.exitCode = 1;
}

function renderMarkdown(report) {
  const findings = report.findings.length
    ? report.findings.map((finding) => (
      `| ${finding.severity} | ${finding.slug || "—"} | ${finding.code} | ${escapeCell(finding.detail)} |`
    )).join("\n")
    : "| — | — | none | No structural findings. |";

  return `# World Cup song library audit\n\n`
    + `Checked: ${report.checkedAt}\n\n`
    + `This is a deterministic preflight. Every review finding still requires semantic source verification; `
    + `no song is removed automatically.\n\n`
    + `- Canonical songs: ${report.summary.totalSongs}\n`
    + `- Structurally verified: ${report.summary.verified}\n`
    + `- Need semantic review: ${report.summary.needsSemanticReview}\n`
    + `- Blocking findings: ${report.summary.blockingFindings}\n\n`
    + `| Severity | Song | Code | Detail |\n`
    + `|---|---|---|---|\n`
    + `${findings}\n`;
}

function positiveInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return parsed;
}

function escapeCell(value) {
  return String(value || "").replace(/\|/g, "\\|");
}

async function atomicWrite(filePath, contents) {
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  await writeFile(temporaryPath, contents);
  await rename(temporaryPath, filePath);
}
