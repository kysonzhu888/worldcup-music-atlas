import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { applyLibraryAuditReport } from "./song-library-audit.mjs";

export async function runLibraryReview({
  songsPath,
  reportPath,
  summaryPath,
  markdownPath,
  writeSongs = false,
}) {
  const [songs, report] = await Promise.all([
    readJson(songsPath),
    readJson(reportPath),
  ]);
  const applied = applyLibraryAuditReport({ songs, report });
  const summaryDocument = {
    schemaVersion: 1,
    checkedAt: report.checkedAt,
    source: {
      report: reportPath,
      songs: songsPath,
    },
    totalSongs: songs.length,
    summary: applied.summary,
    decisions: report.results.map((result) => ({
      slug: result.slug,
      verdict: result.verdict,
      reasonCode: result.reasonCode || null,
      secondReviewRequired: result.secondReviewRequired === true,
    })),
  };
  const writes = [
    atomicWrite(summaryPath, `${JSON.stringify(summaryDocument, null, 2)}\n`),
  ];
  if (markdownPath) {
    writes.push(atomicWrite(markdownPath, renderMarkdown(summaryDocument)));
  }
  if (writeSongs && applied.summary.verified > 0) {
    writes.push(atomicWrite(songsPath, `${JSON.stringify(applied.songs, null, 2)}\n`));
  }
  await Promise.all(writes);

  return {
    songs: applied.songs,
    summary: applied.summary,
    summaryDocument,
  };
}

function renderMarkdown(document) {
  const rows = document.decisions.map((decision) => (
    `| ${decision.slug} | ${decision.verdict} | ${decision.reasonCode || "—"} | `
      + `${decision.secondReviewRequired ? "yes" : "no"} |`
  )).join("\n");

  return `# Canonical song semantic review\n\n`
    + `Checked: ${document.checkedAt}\n\n`
    + `- Canonical songs: ${document.totalSongs}\n`
    + `- Verified: ${document.summary.verified}\n`
    + `- Need review: ${document.summary.needsReview}\n`
    + `- Unrelated pending second review: `
    + `${document.summary.unrelatedPendingSecondReview}\n\n`
    + `| Song | Verdict | Reason | Second review required |\n`
    + `|---|---|---|---|\n${rows}\n`;
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
