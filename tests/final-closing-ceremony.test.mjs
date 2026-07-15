import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  finalClosingCeremony,
  finalClosingCeremonySchema,
  renderFinalClosingCeremonyBody,
} from "../tools/lib/final-closing-ceremony.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("closing ceremony data preserves FIFA's confirmed role labels", () => {
  assert.equal(finalClosingCeremony.path, "/world-cup-2026-closing-ceremony/");
  assert.equal(finalClosingCeremony.startDate, "2026-07-19T13:30:00-04:00");
  assert.equal(finalClosingCeremony.gatesOpen, "2026-07-19T11:00:00-04:00");
  assert.equal(finalClosingCeremony.minutesBeforeKickoff, 90);
  assert.deepEqual(finalClosingCeremony.performers, [
    "Laura Pausini",
    "Nicole Scherzinger",
    "Robbie Williams",
    "IShowSpeed",
  ]);
  assert.equal(finalClosingCeremony.specialAppearance, "Tom Cruise");
  assert.equal(finalClosingCeremony.nationalAnthemPerformer, "Jennifer Hudson");
  assert.ok(
    finalClosingCeremony.sources.every(
      (source) => new URL(source.url).hostname === "inside.fifa.com"
    )
  );
});

test("closing ceremony page distinguishes the pre-match event from halftime", () => {
  const body = renderFinalClosingCeremonyBody();

  assert.match(body, /90 minutes before kick-off/i);
  assert.match(body, /closing ceremony is a pre-match event/i);
  assert.match(body, /not the Final Halftime Show/i);
  assert.match(body, /complete song-by-song running order has not been published/i);
  assert.match(body, /Champion/);
  assert.match(body, /world-cup-2026-final-halftime-show/);
  assert.match(body, /does not say that IShowSpeed will perform Champion/i);
  assert.doesNotMatch(body, /<p>IShowSpeed will perform Champion/i);
});

test("closing ceremony schema uses the confirmed local start time and roles", () => {
  const schema = finalClosingCeremonySchema("https://worldcupmusicatlas.com/");
  const event = schema.find((entry) => entry["@type"] === "Event");
  const faq = schema.find((entry) => entry["@type"] === "FAQPage");

  assert.ok(event);
  assert.equal(event.startDate, "2026-07-19T13:30:00-04:00");
  assert.equal(event.doorTime, "2026-07-19T11:00:00-04:00");
  assert.equal(event.location.name, "New York New Jersey Stadium");
  assert.deepEqual(
    event.performer.map((performer) => performer.name),
    finalClosingCeremony.performers
  );
  assert.equal(
    event.url,
    "https://worldcupmusicatlas.com/world-cup-2026-closing-ceremony/"
  );
  assert.ok(faq.mainEntity.length >= 4);
});

test("generated site exposes the closing ceremony from the homepage and sitemap", () => {
  const page = fs.readFileSync(
    path.join(projectRoot, "world-cup-2026-closing-ceremony", "index.html"),
    "utf8"
  );
  const homepage = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const sitemap = fs.readFileSync(path.join(projectRoot, "sitemap.xml"), "utf8");

  assert.match(page, /2026 World Cup Closing Ceremony/);
  assert.match(homepage, /world-cup-2026-closing-ceremony\//);
  assert.match(
    sitemap,
    /https:\/\/worldcupmusicatlas\.com\/world-cup-2026-closing-ceremony\//
  );
});
