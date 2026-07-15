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
  assert.doesNotMatch(html, /googletagmanager|pagead2|cloudflareinsights/);
});

test("generated navigation uses root-absolute internal URLs", () => {
  const representativePages = [
    "index.html",
    "songs/dai-dai/index.html",
    "artists/shakira/index.html",
    "years/2026/index.html",
    "timeline/index.html",
    "world-cup-2026-closing-ceremony/index.html",
    "world-cup-2026-final-halftime-show/index.html",
  ];

  for (const page of representativePages) {
    const html = read(page);
    assert.doesNotMatch(html, /(?:href|src)="(?:\.\.\/)+/, page);
    assert.doesNotMatch(
      html,
      /(?:href|src)="(?:index\.html|styles\.css|script\.js|assets\/|data\/|songs\/|artists\/|countries\/|years\/|timeline\/|listen\/|glossary\/|about\/|contact\/|privacy\/|world-cup-2026-closing-ceremony\/|world-cup-2026-final-halftime-show\/)/,
      page
    );
  }
});

test("2026 hub keeps final-week updates inside the confirmed fact boundary", () => {
  const hub = read("years/2026/index.html");
  assert.match(hub, /Final week: three music roles to track/);
  assert.match(hub, /Closing Ceremony starts 90 minutes before kick-off/);
  assert.match(hub, /Final Halftime Show happens during the match interval/);
  assert.match(hub, /Checked 15 July 2026/);

  const daiDai = read("songs/dai-dai/index.html");
  assert.match(daiDai, /complete song-by-song set list has not been published/i);
  assert.doesNotMatch(daiDai, /will perform Dai Dai/i);
  assert.match(
    read("songs/dna/index.html"),
    /verified role remains the tournament-wide official anthem/
  );
  assert.match(
    read("songs/game-time/index.html"),
    /verified role remains an official album track/
  );
});

test("Search Console verification file keeps Google's exact public contract", () => {
  assert.equal(
    read("google1089c0cca1aa4f0a.html"),
    "google-site-verification: google1089c0cca1aa4f0a.html\n"
  );
});

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}
