import assert from "node:assert/strict";
import test from "node:test";

import {
  artistCreditIndex,
  artistEditorialSections,
  artistSummary,
} from "../tools/lib/artist-content.mjs";

const songs = [
  {
    slug: "waka-waka",
    title: "Waka Waka",
    year: "2010",
    status: "Classic official song",
    sourceUrl: "https://www.fifa.com/example",
    sourceLabel: "FIFA source",
  },
];

const curatedArtist = {
  slug: "shakira",
  name: "Shakira",
  kind: "Artist",
  isCurated: true,
  summary: "Original summary.",
  background: "Focused background.",
  worldCupContext: "Tournament context.",
  facts: ["Verified note."],
  sources: [
    { label: "FIFA <official>", url: "https://www.fifa.com/profile" },
    { label: "Wikidata", url: "https://www.wikidata.org/wiki/Q1" },
  ],
  contentUpdatedAt: "2026-07-13",
  lastCheckedAt: "2026-07-13",
};

test("curated artist sections render original context, sources, and timestamps", () => {
  const html = artistEditorialSections(
    curatedArtist,
    songs,
    { url: "image" },
    "Reusable image policy.",
  );

  assert.match(html, /World Cup music context/);
  assert.match(html, /Verified profile notes/);
  assert.match(html, /2026-07-13/);
  assert.match(html, /FIFA &lt;official&gt;/);
  assert.match(html, /Reusable image policy/);
  assert.equal(artistSummary(curatedArtist, songs, true), "Original summary.");
});

test("research-pending artists receive a transparent index-only explanation", () => {
  const artist = { slug: "aisha", name: "Aisha", kind: "Artist", isCurated: false };
  const html = artistEditorialSections(artist, songs, null, "No image yet.");

  assert.match(html, /Research status/);
  assert.match(html, /not a finished editorial profile/);
  assert.match(artistSummary(artist, songs, false), /text-first/);
});

test("credit index reports song counts without needing build-script globals", () => {
  const artists = [{ slug: "aisha", name: "Aisha" }];
  const byArtist = new Map([["aisha", songs]]);
  const html = artistCreditIndex(artists, byArtist, "../");

  assert.match(html, /artists\/aisha\//);
  assert.match(html, /1 song credit/);
});
