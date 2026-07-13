import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCandidateReport,
  normalizeSongKey,
  validateSourceConfig,
} from "../tools/lib/weekly-update.mjs";

const source = {
  id: "beatify-world-cup-anthems",
  repository: "mholzi/beatify",
  path: "custom_components/beatify/playlists/world-cup-anthems.json",
  license: "MIT",
  purpose: "candidate-discovery",
};

const seed = {
  songs: [
    {
      year: 2010,
      artist: "Shakira",
      title: "Waka Waka (This Time for Africa)",
      uri: "spotify:track:existing",
      uri_youtube_music: "https://music.youtube.com/watch?v=existing",
      fun_fact: "Third-party prose that must not enter our candidate record.",
    },
    {
      year: 1962,
      artist: "Los Ramblers",
      title: "El Rock del Mundial",
      uri: null,
      uri_youtube_music: "https://music.youtube.com/watch?v=discovery",
      fun_fact: "Third-party prose that must not enter our candidate record.",
    },
  ],
};

test("validateSourceConfig requires provenance and candidate-only purpose", () => {
  assert.doesNotThrow(() => validateSourceConfig(source));
  assert.throws(
    () => validateSourceConfig({ ...source, license: "" }),
    /license/i,
  );
  assert.throws(
    () => validateSourceConfig({ ...source, purpose: "auto-publish" }),
    /candidate-discovery/i,
  );
});

test("normalizeSongKey ignores punctuation and parenthetical title variants", () => {
  assert.equal(
    normalizeSongKey({ year: 2010, title: "Waka Waka (This Time for Africa)" }),
    normalizeSongKey({ year: "2010", title: "Waka Waka" }),
  );
});

test("buildCandidateReport produces review-only records without copied prose", () => {
  const report = buildCandidateReport({
    canonicalSongs: [{ year: "2010", title: "Waka Waka" }],
    seed,
    source,
    fetchedAt: "2026-07-13T08:00:00.000Z",
    revision: "abc123",
  });

  assert.equal(report.summary.discovered, 2);
  assert.equal(report.summary.alreadyIndexed, 1);
  assert.equal(report.summary.needsReview, 1);
  assert.equal(report.candidates[0].state, "candidate");
  assert.equal(report.candidates[0].title, "El Rock del Mundial");
  assert.equal(report.candidates[0].provenance.revision, "abc123");
  assert.equal("fun_fact" in report.candidates[0], false);
  assert.deepEqual(report.candidates[0].platformLinks, {
    youtubeMusic: "https://music.youtube.com/watch?v=discovery",
  });
});

test("candidate output is deterministic regardless of seed order", () => {
  const input = {
    canonicalSongs: [],
    source,
    fetchedAt: "2026-07-13T08:00:00.000Z",
    revision: "abc123",
  };
  const forward = buildCandidateReport({ ...input, seed });
  const reverse = buildCandidateReport({ ...input, seed: { songs: [...seed.songs].reverse() } });

  assert.deepEqual(forward.candidates, reverse.candidates);
});
