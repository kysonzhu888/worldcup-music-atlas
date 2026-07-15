import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { onRequestPost } from "../functions/api/conversions.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const endpointURL = "https://worldcupmusicatlas.com/api/conversions";

test("stores a conversion click as one anonymous daily aggregate upsert", async () => {
  const database = fakeDatabase();
  const response = await onRequestPost({
    request: conversionRequest({
      eventName: "conversion_clicked",
      sourcePath: "/world-cup-2026-closing-ceremony/",
      destinationType: "related_page",
      targetKey: "song:champion-ishowspeed",
      utmSource: "x",
      utmMedium: "organic_social",
      utmCampaign: "wc26_final_week_202607",
      utmContent: "20260715_x_thread_closing_vs_halftime_v1",
      email: "must-not-be-stored@example.com",
      fullURL: "https://example.com/?secret=must-not-be-stored",
      userAgent: "must-not-be-stored",
    }),
    env: { COMMENTS_DB: database.binding },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(await response.text(), "");
  assert.equal(database.prepareCalls.length, 1);
  assert.match(database.prepareCalls[0], /INSERT INTO conversion_daily_counts/);
  assert.match(database.prepareCalls[0], /ON CONFLICT/);
  assert.match(database.prepareCalls[0], /event_count = event_count \+ 1/);
  assert.equal(database.runCalls, 1);
  assert.deepEqual(database.boundValues, [
    "conversion_clicked",
    "/world-cup-2026-closing-ceremony/",
    "related_page",
    "song:champion-ishowspeed",
    "x",
    "organic_social",
    "wc26_final_week_202607",
    "20260715_x_thread_closing_vs_halftime_v1",
  ]);
  assert.equal(database.boundValues.some((value) => String(value).includes("must-not-be-stored")), false);
});

test("stores a campaign landing view without destination dimensions", async () => {
  const database = fakeDatabase();
  const response = await onRequestPost({
    request: conversionRequest({
      eventName: "campaign_landing_viewed",
      sourcePath: "/world-cup-2026-closing-ceremony/",
      destinationType: "",
      targetKey: "",
      utmSource: "tiktok",
      utmMedium: "organic_social",
      utmCampaign: "wc26_final_week_202607",
      utmContent: "20260715_short_closing_vs_halftime_v1",
    }),
    env: { COMMENTS_DB: database.binding },
  });

  assert.equal(response.status, 204);
  assert.equal(database.runCalls, 1);
  assert.deepEqual(database.boundValues.slice(0, 4), [
    "campaign_landing_viewed",
    "/world-cup-2026-closing-ceremony/",
    "",
    "",
  ]);
});

test("allows conversion clicks without campaign attribution", async () => {
  const database = fakeDatabase();
  const response = await onRequestPost({
    request: conversionRequest({
      eventName: "conversion_clicked",
      sourcePath: "/songs/champion-ishowspeed/",
      destinationType: "spotify",
      targetKey: "search",
    }),
    env: { COMMENTS_DB: database.binding },
  });

  assert.equal(response.status, 204);
  assert.deepEqual(database.boundValues.slice(4), ["", "", "", ""]);
});

test("requires source, medium, and campaign for campaign landing views", async () => {
  const requiredCampaignFields = ["utmSource", "utmMedium", "utmCampaign"];

  for (const missingField of requiredCampaignFields) {
    const database = fakeDatabase();
    const payload = {
      eventName: "campaign_landing_viewed",
      sourcePath: "/world-cup-2026-closing-ceremony/",
      destinationType: "",
      targetKey: "",
      utmSource: "x",
      utmMedium: "organic_social",
      utmCampaign: "wc26_final_week_202607",
      utmContent: "",
      [missingField]: "",
    };
    const response = await onRequestPost({
      request: conversionRequest(payload),
      env: { COMMENTS_DB: database.binding },
    });

    assert.equal(response.status, 400, missingField);
    assert.equal(database.prepareCalls.length, 0, missingField);
    assert.equal(database.runCalls, 0, missingField);
  }
});

test("rejects malformed, oversized, cross-origin, and non-JSON requests without writing", async () => {
  const invalidRequests = [
    { expectedStatus: 400, request: rawRequest("{") },
    { expectedStatus: 413, request: rawRequest(JSON.stringify({ padding: "x".repeat(2200) })) },
    {
      expectedStatus: 403,
      request: conversionRequest(validClick(), { origin: "https://attacker.example" }),
    },
    { expectedStatus: 403, request: conversionRequest(validClick(), { origin: null }) },
    {
      expectedStatus: 415,
      request: rawRequest(JSON.stringify(validClick()), { contentType: "text/plain" }),
    },
  ];

  for (const { expectedStatus, request } of invalidRequests) {
    const database = fakeDatabase();
    const response = await onRequestPost({ request, env: { COMMENTS_DB: database.binding } });
    assert.equal(response.status, expectedStatus);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(database.prepareCalls.length, 0);
    assert.equal(database.runCalls, 0);
  }
});

test("rejects invalid event dimensions and UTM values without writing", async () => {
  const invalidPayloads = [
    { ...validClick(), eventName: "user_identified" },
    { ...validClick(), sourcePath: "https://worldcupmusicatlas.com/private?email=a@example.com" },
    { ...validClick(), sourcePath: "/songs/champion/?secret=yes" },
    { ...validClick(), destinationType: "fifa" },
    { ...validClick(), targetKey: "https://open.spotify.com/track/secret" },
    { ...validClick(), utmSource: "Person@Example.com" },
    { ...validClick(), utmCampaign: "x".repeat(81) },
    { ...validClick(), destinationType: "", targetKey: "" },
    {
      ...validClick(),
      eventName: "campaign_landing_viewed",
      destinationType: "spotify",
      targetKey: "playlist",
    },
  ];

  for (const payload of invalidPayloads) {
    const database = fakeDatabase();
    const response = await onRequestPost({
      request: conversionRequest(payload),
      env: { COMMENTS_DB: database.binding },
    });
    assert.equal(response.status, 400);
    assert.equal(database.prepareCalls.length, 0);
    assert.equal(database.runCalls, 0);
  }
});

test("returns service unavailable without claiming success when D1 cannot persist", async () => {
  const missingBindingResponse = await onRequestPost({
    request: conversionRequest(validClick()),
    env: {},
  });
  assert.equal(missingBindingResponse.status, 503);

  const database = fakeDatabase({ runError: new Error("D1 unavailable") });
  const failedWriteResponse = await onRequestPost({
    request: conversionRequest(validClick()),
    env: { COMMENTS_DB: database.binding },
  });
  assert.equal(failedWriteResponse.status, 503);
  assert.equal(database.runCalls, 1);
});

test("schema defines aggregate-only conversion storage without user identifiers", () => {
  const schema = fs.readFileSync(path.join(root, "schema.sql"), "utf8");

  assert.match(schema, /CREATE TABLE IF NOT EXISTS conversion_daily_counts/);
  assert.match(schema, /PRIMARY KEY\s*\(/);
  assert.match(schema, /event_count INTEGER NOT NULL DEFAULT 0/);
  assert.doesNotMatch(schema, /\b(?:email|ip_address|user_agent|referrer|cookie|session_id|user_id)\b/i);
});

function validClick() {
  return {
    eventName: "conversion_clicked",
    sourcePath: "/world-cup-2026-closing-ceremony/",
    destinationType: "youtube",
    targetKey: "playlist",
    utmSource: "x",
    utmMedium: "organic_social",
    utmCampaign: "wc26_final_week_202607",
    utmContent: "20260715_x_thread_closing_vs_halftime_v1",
  };
}

function conversionRequest(payload, { origin = "https://worldcupmusicatlas.com" } = {}) {
  return rawRequest(JSON.stringify(payload), { origin });
}

function rawRequest(
  body,
  { contentType = "application/json", origin = "https://worldcupmusicatlas.com" } = {}
) {
  const headers = new Headers({ "Content-Type": contentType });
  if (origin !== null) headers.set("Origin", origin);
  return new Request(endpointURL, { method: "POST", headers, body });
}

function fakeDatabase({ runError } = {}) {
  const database = {
    boundValues: [],
    prepareCalls: [],
    runCalls: 0,
  };

  database.binding = {
    prepare(sql) {
      database.prepareCalls.push(sql);
      return {
        bind(...values) {
          database.boundValues = values;
          return {
            async run() {
              database.runCalls += 1;
              if (runError) throw runError;
              return { success: true };
            },
          };
        },
      };
    },
  };

  return database;
}
