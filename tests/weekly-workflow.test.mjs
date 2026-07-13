import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL(
  "../.github/workflows/weekly-content-discovery.yml",
  import.meta.url,
);

test("weekly discovery workflow is review-only and runs in Shanghai time", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  assert.match(workflow, /cron:\s*["']17 9 \* \* 1["']/);
  assert.match(workflow, /timezone:\s*["']Asia\/Shanghai["']/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\s*\n\s+contents:\s*read/);
  assert.match(workflow, /GH_TOKEN:\s*\$\{\{ github\.token \}\}/);
  assert.match(workflow, /npm run update:weekly/);
  assert.match(workflow, /\.updates\/weekly-candidates\.json/);
  assert.match(workflow, /\.updates\/weekly-report\.md/);
  assert.match(workflow, /GITHUB_STEP_SUMMARY/);
  assert.doesNotMatch(workflow, /git\s+push|wrangler\s+pages\s+deploy|data\/songs\.json/);
});
