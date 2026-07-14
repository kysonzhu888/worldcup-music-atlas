import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  finalHalftimeShow,
  finalHalftimeShowSchema,
  renderFinalHalftimeShowBody,
} from "../tools/lib/final-halftime-show.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("final halftime show data keeps confirmed facts separate from open questions", () => {
  assert.equal(finalHalftimeShow.path, "/world-cup-2026-final-halftime-show/");
  assert.equal(finalHalftimeShow.eventDate, "2026-07-19");
  assert.equal(finalHalftimeShow.durationMinutes, 11);
  assert.deepEqual(finalHalftimeShow.coHeadliners, [
    "Justin Bieber",
    "Madonna",
    "Shakira",
    "BTS",
  ]);
  assert.deepEqual(finalHalftimeShow.additionalPerformers, [
    "Burna Boy",
    "Gustavo Dudamel",
    "PS22 Chorus featuring Coldplay",
  ]);
  assert.ok(finalHalftimeShow.sources.length >= 2);
  assert.ok(finalHalftimeShow.sources.every((source) => new URL(source.url).hostname.endsWith("fifa.com")));
});

test("final halftime show page answers current intent without inventing a set list", () => {
  const body = renderFinalHalftimeShowBody();

  assert.match(body, /Confirmed lineup/);
  assert.match(body, /full song-by-song set list has not been published/i);
  assert.match(body, /Dai Dai/);
  assert.match(body, /world-cup-2026-final-halftime-show/);
  assert.doesNotMatch(body, /lyrics/i);
});

test("event schema uses the confirmed date without inventing a start time", () => {
  const schema = finalHalftimeShowSchema("https://worldcupmusicatlas.com");
  const event = schema.find((entry) => entry["@type"] === "Event");

  assert.ok(event);
  assert.equal(event.startDate, "2026-07-19");
  assert.equal(event.location.name, "New York New Jersey Stadium");
  assert.equal(event.url, "https://worldcupmusicatlas.com/world-cup-2026-final-halftime-show/");
  assert.doesNotMatch(event.startDate, /T/);
});

test("generated site exposes the event from the homepage and sitemap", () => {
  const page = fs.readFileSync(
    path.join(projectRoot, "world-cup-2026-final-halftime-show", "index.html"),
    "utf8"
  );
  const homepage = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const sitemap = fs.readFileSync(path.join(projectRoot, "sitemap.xml"), "utf8");

  assert.match(page, /2026 World Cup Final Halftime Show/);
  assert.match(homepage, /world-cup-2026-final-halftime-show\//);
  assert.match(
    sitemap,
    /https:\/\/worldcupmusicatlas\.com\/world-cup-2026-final-halftime-show\//
  );
});
