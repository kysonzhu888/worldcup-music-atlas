import assert from "node:assert/strict";
import test from "node:test";

import {
  appendCampaignToHref,
  buildConversionPayload,
  classifyConversionLink,
  parseCampaign,
} from "../conversion-tracking.js";

const trackedSearch =
  "?utm_source=x&utm_medium=organic_social&utm_campaign=wc26_final_week_202607&utm_content=20260715_x_thread_closing_vs_halftime_v1";

test("campaign parsing accepts the agreed lowercase UTM contract", () => {
  assert.deepEqual(parseCampaign(trackedSearch), {
    utmSource: "x",
    utmMedium: "organic_social",
    utmCampaign: "wc26_final_week_202607",
    utmContent: "20260715_x_thread_closing_vs_halftime_v1",
  });

  assert.equal(parseCampaign("?utm_source=x&utm_medium=organic_social"), null);
  assert.equal(
    parseCampaign(
      "?utm_source=X%20spam&utm_medium=organic_social&utm_campaign=wc26_final_week_202607"
    ),
    null
  );
});

test("related links receive UTM parameters without copying unrelated query data", () => {
  const campaign = parseCampaign(trackedSearch);
  const href = appendCampaignToHref(
    "/songs/champion-ishowspeed/?preview=true#listen",
    "https://worldcupmusicatlas.com/world-cup-2026-closing-ceremony/",
    campaign
  );
  const url = new URL(href);

  assert.equal(url.origin, "https://worldcupmusicatlas.com");
  assert.equal(url.pathname, "/songs/champion-ishowspeed/");
  assert.equal(url.searchParams.get("preview"), null);
  assert.equal(url.searchParams.get("utm_source"), "x");
  assert.equal(url.hash, "#listen");
});

test("conversion classification allows explicit related links and licensed platforms", () => {
  const pageUrl = "https://worldcupmusicatlas.com/world-cup-2026-closing-ceremony/";

  assert.deepEqual(
    classifyConversionLink(
      {
        href: "/songs/champion-ishowspeed/",
        conversion: "related_page",
        targetKey: "champion",
      },
      pageUrl
    ),
    { destinationType: "related_page", targetKey: "champion" }
  );
  assert.deepEqual(
    classifyConversionLink({ href: "https://open.spotify.com/track/abc" }, pageUrl),
    { destinationType: "spotify", targetKey: "track" }
  );
  assert.deepEqual(
    classifyConversionLink({ href: "https://www.youtube.com/watch?v=abc" }, pageUrl),
    { destinationType: "youtube", targetKey: "video" }
  );
  assert.equal(
    classifyConversionLink({ href: "https://example.com/track/abc" }, pageUrl),
    null
  );
});

test("client payload contains only aggregate-safe fields", () => {
  const payload = buildConversionPayload({
    eventName: "conversion_clicked",
    sourcePath: "/world-cup-2026-closing-ceremony/",
    target: { destinationType: "related_page", targetKey: "champion" },
    campaign: parseCampaign(trackedSearch),
  });

  assert.deepEqual(Object.keys(payload).sort(), [
    "destinationType",
    "eventName",
    "sourcePath",
    "targetKey",
    "utmCampaign",
    "utmContent",
    "utmMedium",
    "utmSource",
  ]);
  assert.doesNotMatch(JSON.stringify(payload), /referrer|userAgent|email|fullUrl|cookie/i);
});
