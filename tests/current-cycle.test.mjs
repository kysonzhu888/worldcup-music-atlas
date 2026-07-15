import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  currentCycleSection,
  songCurrentUpdateSection,
} from "../tools/current-cycle.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const songs = JSON.parse(fs.readFileSync(path.join(root, "data", "songs.json"), "utf8"));
const prioritySongs = ["dai-dai", "dna", "game-time"].map((slug) =>
  songs.find((song) => song.slug === slug)
);

test("priority 2026 updates keep roles and source checks explicit", () => {
  assert.ok(prioritySongs.every(Boolean));
  assert.ok(prioritySongs.every((song) => song.currentUpdate?.checked === "2026-07-15"));

  const [daiDai, dna, gameTime] = prioritySongs;
  assert.match(daiDai.currentUpdate.body, /complete song-by-song set list has not been published/i);
  assert.doesNotMatch(daiDai.currentUpdate.body, /will perform Dai Dai/i);
  assert.match(dna.currentUpdate.body, /official anthem/i);
  assert.match(gameTime.currentUpdate.body, /official album track/i);
});

test("current-cycle rendering stays limited to 2026 and escapes source-backed content", () => {
  assert.equal(currentCycleSection("2022", prioritySongs), "");

  const section = currentCycleSection("2026", prioritySongs);
  assert.match(section, /Final week: three music roles to track/);
  assert.match(section, /Closing Ceremony starts 90 minutes before kick-off/);
  assert.match(section, /world-cup-2026-closing-ceremony/);
  assert.match(section, /Final Halftime Show happens during the match interval/);
  assert.match(section, /Checked 15 July 2026/);

  const songSection = songCurrentUpdateSection({
    ...prioritySongs[0],
    title: "Dai <Dai>",
  });
  assert.match(songSection, /Dai &lt;Dai&gt;/);
  assert.doesNotMatch(songSection, /Dai <Dai>/);
});
