import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL(
  "../.github/workflows/song-library-audit.yml",
  import.meta.url,
);

test("library audit runs twice weekly and only publishes review artifacts", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  assert.match(workflow, /cron:\s*["']47 9 \* \* 2,5["']/);
  assert.match(workflow, /timezone:\s*["']Asia\/Shanghai["']/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\s*\n\s+contents:\s*read/);
  assert.match(workflow, /npm run audit:library/);
  assert.match(workflow, /\.updates\/library-audit\.json/);
  assert.match(workflow, /\.updates\/library-audit\.md/);
  assert.match(workflow, /retention-days:\s*30/);
  assert.doesNotMatch(workflow, /git\s+push|gh\s+pr\s+create|wrangler\s+pages\s+deploy/);
});
