import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_LIBRARY_LIMIT,
  selectLibrarySongs,
} from "../assets/library-view.mjs";

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

test("homepage library starts with six songs and expands only in the unfiltered view", () => {
  const songs = Array.from({ length: 8 }, (_, index) => ({
    title: `Song ${index + 1}`,
    type: index % 2 === 0 ? "official" : "fan",
  }));

  const initial = selectLibrarySongs({ songs });
  assert.equal(DEFAULT_LIBRARY_LIMIT, 6);
  assert.equal(initial.matchingSongs.length, 8);
  assert.equal(initial.visibleSongs.length, 6);
  assert.equal(initial.canToggle, true);
  assert.equal(initial.expanded, false);

  const expanded = selectLibrarySongs({ songs, expanded: true });
  assert.equal(expanded.visibleSongs.length, 8);
  assert.equal(expanded.canToggle, true);
  assert.equal(expanded.expanded, true);

  const filtered = selectLibrarySongs({ songs, activeFilter: "official" });
  assert.equal(filtered.matchingSongs.length, 4);
  assert.equal(filtered.visibleSongs.length, 4);
  assert.equal(filtered.canToggle, false);

  const searched = selectLibrarySongs({ songs, query: "song 8" });
  assert.deepEqual(searched.visibleSongs.map((song) => song.title), ["Song 8"]);
  assert.equal(searched.canToggle, false);
});

test("homepage keeps library controls and every song detail link in static HTML", () => {
  const homepage = read("index.html");
  const songs = JSON.parse(read("data/songs.json"));

  assert.match(homepage, /id="libraryActions"/);
  assert.match(homepage, /data-library-count/);
  assert.match(homepage, /data-library-toggle/);
  for (const song of songs) {
    assert.match(homepage, new RegExp(`href="/songs/${song.slug}/"`), song.slug);
  }
});

test("browser shell wires progressive library controls and mobile navigation enhancement", () => {
  const script = read("script.js");
  const styles = read("styles.css");

  assert.match(script, /import\("\/assets\/library-view\.mjs"\)/);
  assert.match(script, /\[data-library-toggle\]/);
  assert.match(script, /enhancePrimaryNavigation\(\)/);
  assert.match(styles, /\.library-actions\s*\{/);
  assert.match(styles, /\.nav-more\s*\{/);
  assert.match(styles, /\.mobile-nav-enhanced/);
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

test("generated pages expose one privacy-safe conversion client and explicit related CTAs", () => {
  const closing = read("world-cup-2026-closing-ceremony/index.html");
  const song = read("songs/champion-ishowspeed/index.html");
  const homepage = read("index.html");
  const privacy = read("privacy/index.html");

  for (const html of [closing, song, homepage]) {
    assert.equal(
      (html.match(/src="\/script\.js"/g) || []).length,
      1
    );
  }
  assert.match(read("script.js"), /import\("\/conversion-tracking\.js"\)/);
  assert.match(
    closing,
    /data-conversion="related_page" data-target-key="champion"/
  );
  assert.match(privacy, /Cloudflare Web Analytics/);
  assert.match(privacy, /anonymous daily totals/i);
  assert.doesNotMatch(privacy, /unique visitors from the conversion counter/i);
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
