import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("generated 404 is lightweight and excluded from search", () => {
  const html = read("404.html");
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /href="\/years\/2026\/"/);
  assert.doesNotMatch(html, /googletagmanager|pagead2/);
});

test("generated navigation uses root-absolute internal URLs", () => {
  const representativePages = [
    "index.html",
    "songs/dai-dai/index.html",
    "artists/shakira/index.html",
    "years/2026/index.html",
    "timeline/index.html",
  ];

  for (const page of representativePages) {
    const html = read(page);
    assert.doesNotMatch(html, /(?:href|src)="(?:\.\.\/)+/, page);
    assert.doesNotMatch(
      html,
      /(?:href|src)="(?:index\.html|styles\.css|script\.js|assets\/|songs\/|artists\/|countries\/|years\/|timeline\/|listen\/|glossary\/|about\/|contact\/|privacy\/)/,
      page
    );
  }
});

test("2026 hub and priority song pages show the checked final-week update", () => {
  const hub = read("years/2026/index.html");
  assert.match(hub, /Final week: three music roles to track/);
  assert.match(hub, /Final Halftime Show on 19 July/);
  assert.match(hub, /Checked 13 July 2026/);

  assert.match(read("songs/dai-dai/index.html"), /first FIFA World Cup Final Halftime Show/);
  assert.match(read("songs/dna/index.html"), /verified role remains the tournament-wide official anthem/);
  assert.match(read("songs/game-time/index.html"), /verified role remains an official album track/);
});

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}
