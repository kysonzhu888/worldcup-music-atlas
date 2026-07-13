import assert from "node:assert/strict";
import test from "node:test";

import {
  artistNames,
  artistSlug,
  buildArtistProfiles,
  buildCollectionOverview,
  isCuratedArtist,
} from "../tools/lib/content-model.mjs";

const sampleSongs = [
  {
    slug: "waka-waka",
    title: "Waka Waka",
    artist: "Shakira featuring Freshlyground",
    year: "2010",
    country: "South Africa",
    language: "English / Spanish",
    status: "Classic official song",
    type: "classic",
  },
  {
    slug: "dai-dai",
    title: "Dai Dai",
    artist: "Shakira and Burna Boy",
    year: "2026",
    country: "Global",
    language: "Multilingual",
    status: "Official song",
    type: "official",
  },
];

test("artistNames separates common collaboration credits", () => {
  assert.deepEqual(artistNames(sampleSongs[0]), ["Shakira", "Freshlyground"]);
  assert.deepEqual(artistNames(sampleSongs[1]), ["Shakira", "Burna Boy"]);
  assert.deepEqual(artistNames({ artist: "A, B & C feat. D" }), ["A", "B", "C", "D"]);
});

test("artistSlug normalizes accents and punctuation", () => {
  assert.equal(artistSlug("Carín León"), "carin-leon");
  assert.equal(artistSlug("K'naan"), "k-naan");
});

test("isCuratedArtist requires original context, timestamps, and two sources", () => {
  const base = {
    slug: "shakira",
    name: "Shakira",
    summary: "A Colombian artist whose World Cup catalogue spans multiple tournament cycles.",
    worldCupContext: "Her official-song credits make her a useful guide to how tournament music changed after 2006.",
    contentUpdatedAt: "2026-07-13",
    sources: [
      { label: "FIFA", url: "https://www.fifa.com/example" },
      { label: "Wikidata", url: "https://www.wikidata.org/wiki/Q34424" },
    ],
  };

  assert.equal(isCuratedArtist(base), true);
  assert.equal(isCuratedArtist({ ...base, sources: base.sources.slice(0, 1) }), false);
  assert.equal(isCuratedArtist({ ...base, worldCupContext: "" }), false);
  assert.equal(isCuratedArtist({ ...base, contentUpdatedAt: "" }), false);
});

test("buildArtistProfiles merges curated records with inferred song connections", () => {
  const profiles = buildArtistProfiles(sampleSongs, [
    {
      slug: "shakira",
      name: "Shakira",
      summary: "A Colombian artist whose World Cup catalogue spans multiple tournament cycles.",
      worldCupContext: "Her official-song credits make her a useful guide to how tournament music changed after 2006.",
      contentUpdatedAt: "2026-07-13",
      sources: [
        { label: "FIFA", url: "https://www.fifa.com/example" },
        { label: "Wikidata", url: "https://www.wikidata.org/wiki/Q34424" },
      ],
    },
  ]);

  const shakira = profiles.find((artist) => artist.slug === "shakira");
  const burnaBoy = profiles.find((artist) => artist.slug === "burna-boy");

  assert.equal(shakira.isCurated, true);
  assert.deepEqual(shakira.songSlugs, ["waka-waka", "dai-dai"]);
  assert.equal(burnaBoy.isCurated, false);
  assert.deepEqual(burnaBoy.songSlugs, ["dai-dai"]);
});

test("buildCollectionOverview derives useful, non-invented collection facts", () => {
  const overview = buildCollectionOverview({
    label: "Shakira",
    kind: "artist",
    items: sampleSongs,
  });

  assert.equal(overview.itemCount, 2);
  assert.deepEqual(overview.years, ["2026", "2010"]);
  assert.deepEqual(overview.languages, ["English", "Multilingual", "Spanish"]);
  assert.equal(overview.officialCount, 2);
  assert.match(overview.lead, /2010 to 2026/);
  assert.match(overview.facts.join(" "), /two tournament cycles/i);
});
