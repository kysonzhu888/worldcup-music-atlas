import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildArtistProfiles, isCuratedArtist } from "../tools/lib/content-model.mjs";

const [songs, artistRecords, updateSources] = await Promise.all([
  readJson("data/songs.json"),
  readJson("data/artists.json"),
  readJson("data/update-sources.json"),
]);

test("every dedicated artist record passes the public quality gate", () => {
  const slugs = artistRecords.map((artist) => artist.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  artistRecords.forEach((artist) => {
    assert.equal(isCuratedArtist(artist), true, `${artist.slug} must be fully curated`);
    assert.match(artist.lastCheckedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(artist.facts.length >= 3, `${artist.slug} needs verified notes`);
    assert.ok(
      artist.sources.every((source) => !/instagram|reddit|x\.com/i.test(source.url)),
      `${artist.slug} must not use social discovery as profile evidence`,
    );
  });
});

test("every curated artist is connected to at least one canonical song", () => {
  const profiles = buildArtistProfiles(songs, artistRecords);
  for (const artist of artistRecords) {
    const profile = profiles.find((candidate) => candidate.slug === artist.slug);
    assert.ok(profile?.songSlugs.length, `${artist.slug} needs a canonical song connection`);
  }
});

test("canonical FIFA album sources use the current organisation route", () => {
  const serialized = JSON.stringify({ songs, artistRecords });
  assert.doesNotMatch(
    serialized,
    /inside\.fifa\.com\/media-releases\/unveils-official-album/,
  );
});

test("weekly sources remain licensed, explicit, and discovery-only", () => {
  assert.ok(updateSources.length > 0);
  updateSources.forEach((source) => {
    assert.equal(source.purpose, "candidate-discovery");
    assert.ok(source.license);
    assert.match(source.sourceUrl, /^https:\/\/github\.com\//);
  });
});

async function readJson(relativePath) {
  return JSON.parse(await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8"));
}
