import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DEPLOYMENT_ENTRIES,
  prepareDeployment,
} from "../tools/prepare-deploy.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedRoutes = {
  version: 1,
  include: [
    "/api/comments",
    "/api/conversions",
    "/google1089c0cca1aa4f0a.html",
  ],
  exclude: [],
};

test("Pages Functions use an explicit invocation allowlist", () => {
  const routes = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "_routes.json"), "utf8")
  );

  assert.deepEqual(routes, expectedRoutes);
  assert.equal(routes.include.some((route) => route.includes("*")), false);
});

test("every Function source is covered by the invocation allowlist", () => {
  const functionFiles = listFiles(path.join(projectRoot, "functions")).map((filePath) =>
    path.relative(path.join(projectRoot, "functions"), filePath)
  );

  assert.deepEqual(functionFiles, [
    "api/comments.js",
    "api/conversions.js",
    "google1089c0cca1aa4f0a.html.js",
  ]);
  assert.equal(functionFiles.some((filePath) => filePath.endsWith("_middleware.js")), false);
});

test("deployment preparation runs every local quality gate", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
  );

  assert.equal(
    packageJson.scripts["deploy:prepare"],
    "npm run build && npm run check && npm test && node tools/prepare-deploy.mjs"
  );
});

test("deployment instructions publish only the validated artifact", () => {
  const readme = fs.readFileSync(path.join(projectRoot, "README.md"), "utf8");

  assert.match(readme, /npm run deploy:prepare/);
  assert.match(readme, /wrangler pages deploy \.deploy/);
  assert.doesNotMatch(readme, /deployed from the repository root/i);
});

test("deployment preparation copies the route contract and excludes source-only files", (t) => {
  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "worldcup-music-atlas-deploy-")
  );
  const outputDirectory = path.join(temporaryRoot, "site");
  t.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));

  const result = prepareDeployment({ projectRoot, outputDirectory });

  for (const entry of DEPLOYMENT_ENTRIES) {
    assert.equal(fs.existsSync(path.join(outputDirectory, entry)), true);
  }
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(outputDirectory, "_routes.json"), "utf8")),
    expectedRoutes
  );
  assert.equal(result.fileCount, listFiles(outputDirectory).length);
  assert.ok(result.fileCount > 150);

  for (const excludedEntry of [
    ".git",
    "functions",
    "tests",
    "tools",
    "site.config.json",
    "schema.sql",
    "wrangler.toml",
    "data/artists.json",
    "data/update-sources.json",
  ]) {
    assert.equal(fs.existsSync(path.join(outputDirectory, excludedEntry)), false);
  }
});

test("deployment preparation refuses unsafe output paths inside the project", () => {
  assert.throws(
    () =>
      prepareDeployment({
        projectRoot,
        outputDirectory: path.join(projectRoot, "assets", ".deploy"),
      }),
    /inside the project must use the \.deploy directory/
  );
});

function listFiles(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    });
}
