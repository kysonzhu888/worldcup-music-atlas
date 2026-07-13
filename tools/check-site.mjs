import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artistProfiles = readJson("data/artists.json");
const htmlFiles = listFiles(projectRoot, (filePath) => filePath.endsWith(".html"));
const sitemap = fs.readFileSync(path.join(projectRoot, "sitemap.xml"), "utf8");
const failures = [];

checkInternalLinks();
checkArtistQualityGate();
checkSitemapQualityGate();

if (failures.length) {
  console.error(`Site check failed with ${failures.length} problem(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  const noindexCount = htmlFiles.filter((filePath) => read(filePath).includes('content="noindex, follow"')).length;
  console.log(`Site check passed: ${htmlFiles.length} HTML files, 0 broken internal links.`);
  console.log(`Artist quality gate: ${artistProfiles.length} curated profiles indexed, ${noindexCount} research-pending pages noindexed.`);
}

function checkInternalLinks() {
  for (const filePath of htmlFiles) {
    const html = read(filePath);
    for (const href of attributeValues(html, "href")) {
      if (isExternalOrFragment(href)) continue;
      const target = resolveInternalTarget(filePath, href);
      if (!fs.existsSync(target)) {
        failures.push(`${relative(filePath)} links to missing ${href}`);
      }
    }
  }
}

function checkArtistQualityGate() {
  const curatedSlugs = new Set(artistProfiles.map((profile) => profile.slug));
  const artistDirectory = path.join(projectRoot, "artists");
  for (const name of fs.readdirSync(artistDirectory)) {
    const pagePath = path.join(artistDirectory, name, "index.html");
    if (!fs.existsSync(pagePath)) continue;
    const html = read(pagePath);
    const isCurated = curatedSlugs.has(name);
    const wordCount = visibleWordCount(html);

    if (isCurated && !html.includes('content="index, follow"')) {
      failures.push(`artists/${name}/ is curated but not indexable`);
    }
    if (isCurated && wordCount < 300) {
      failures.push(`artists/${name}/ has only ${wordCount} visible words; expected at least 300`);
    }
    if (!isCurated && !html.includes('content="noindex, follow"')) {
      failures.push(`artists/${name}/ lacks noindex while editorial research is pending`);
    }
  }
}

function checkSitemapQualityGate() {
  for (const profile of artistProfiles) {
    const expectedUrl = `/artists/${profile.slug}/`;
    if (!sitemap.includes(expectedUrl)) {
      failures.push(`sitemap omits curated profile ${expectedUrl}`);
    }
  }

  for (const filePath of htmlFiles) {
    const html = read(filePath);
    if (!html.includes('content="noindex, follow"')) continue;
    const route = routeForHtml(filePath);
    if (sitemap.includes(`<loc>${route}</loc>`)) {
      failures.push(`sitemap includes noindex route ${route}`);
    }
  }
}

function resolveInternalTarget(sourcePath, rawHref) {
  const href = rawHref.split(/[?#]/)[0];
  const decoded = decodeURIComponent(href);
  const resolved = decoded.startsWith("/")
    ? path.join(projectRoot, decoded)
    : path.resolve(path.dirname(sourcePath), decoded);
  if (decoded.endsWith("/") || (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory())) {
    return path.join(resolved, "index.html");
  }
  return resolved;
}

function routeForHtml(filePath) {
  const relativePath = relative(filePath).replace(/index\.html$/, "");
  return `${readJson("site.config.json").siteUrl.replace(/\/$/, "")}/${relativePath}`.replace(/\/$/, "/");
}

function attributeValues(html, attribute) {
  const values = [];
  const pattern = new RegExp(`${attribute}=["']([^"']+)["']`, "gi");
  for (const match of html.matchAll(pattern)) values.push(match[1]);
  return values;
}

function isExternalOrFragment(href) {
  return /^(?:[a-z][a-z0-9+.-]*:|#)/i.test(href);
}

function visibleWordCount(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}

function listFiles(directory, predicate) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", ".deploy", ".updates", ".wrangler", "node_modules"].includes(entry.name)) continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(entryPath, predicate));
    if (entry.isFile() && predicate(entryPath)) files.push(entryPath);
  }
  return files;
}

function readJson(relativePath) {
  return JSON.parse(read(path.join(projectRoot, relativePath)));
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function relative(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}
