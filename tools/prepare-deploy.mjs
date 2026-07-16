import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultProjectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

export const DEPLOYMENT_ENTRIES = Object.freeze([
  "404.html",
  "_routes.json",
  "about",
  "ads.txt",
  "artists",
  "assets",
  "contact",
  "conversion-tracking.js",
  "countries",
  "data/media.json",
  "data/songs.json",
  "glossary",
  "google1089c0cca1aa4f0a.html",
  "index.html",
  "listen",
  "privacy",
  "promo-assets",
  "robots.txt",
  "script.js",
  "sitemap.xml",
  "songs",
  "styles.css",
  "timeline",
  "world-cup-2026-closing-ceremony",
  "world-cup-2026-final-halftime-show",
  "years",
]);

export function prepareDeployment({
  projectRoot = defaultProjectRoot,
  outputDirectory = path.join(projectRoot, ".deploy"),
} = {}) {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedOutputDirectory = path.resolve(outputDirectory);
  const defaultOutputDirectory = path.join(resolvedProjectRoot, ".deploy");

  if (isSameOrParentDirectory(resolvedOutputDirectory, resolvedProjectRoot)) {
    throw new Error("Deployment output must not replace the project or its parent directory.");
  }
  if (
    isSameOrParentDirectory(resolvedProjectRoot, resolvedOutputDirectory) &&
    resolvedOutputDirectory !== defaultOutputDirectory
  ) {
    throw new Error("Deployment output inside the project must use the .deploy directory.");
  }

  const missingEntries = DEPLOYMENT_ENTRIES.filter(
    (entry) => !fs.existsSync(path.join(resolvedProjectRoot, entry))
  );
  if (missingEntries.length > 0) {
    throw new Error(`Missing deployment entries: ${missingEntries.join(", ")}`);
  }

  fs.rmSync(resolvedOutputDirectory, { recursive: true, force: true });
  fs.mkdirSync(resolvedOutputDirectory, { recursive: true });

  for (const entry of DEPLOYMENT_ENTRIES) {
    const destinationPath = path.join(resolvedOutputDirectory, entry);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.cpSync(
      path.join(resolvedProjectRoot, entry),
      destinationPath,
      { recursive: true }
    );
  }

  return {
    outputDirectory: resolvedOutputDirectory,
    fileCount: listFiles(resolvedOutputDirectory).length,
  };
}

function isSameOrParentDirectory(candidateDirectory, targetDirectory) {
  const relativePath = path.relative(candidateDirectory, targetDirectory);
  return (
    relativePath === "" ||
    (!relativePath.startsWith(`..${path.sep}`) &&
      relativePath !== ".." &&
      !path.isAbsolute(relativePath))
  );
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = prepareDeployment();
  console.log(
    `Prepared ${result.fileCount} deployment files in ${path.relative(
      defaultProjectRoot,
      result.outputDirectory
    )}.`
  );
}
