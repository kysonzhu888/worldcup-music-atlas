import assert from "node:assert/strict";
import test from "node:test";

import { onRequest } from "../functions/_middleware.js";
import { classifyRequestPath } from "../functions/path-policy.js";
import { absolutizeInternalUrls } from "../tools/internal-url.mjs";

test("allows published content, static assets, APIs, and ordinary missing pages", () => {
  const allowedPaths = [
    "/",
    "/songs/dai-dai/",
    "/artists/shakira/",
    "/artists/",
    "/years/2026/",
    "/timeline/",
    "/assets/favicon.svg",
    "/styles.css",
    "/api/comments?pageKey=worldcup%3Asong%3Adai-dai",
    "/not-a-real-page/",
  ];

  for (const pathname of allowedPaths) {
    assert.deepEqual(classifyRequestPath(pathname), {
      action: "continue",
      reason: "not-a-composed-content-path",
    });
  }
});

test("blocks recursively composed content paths without inspecting user agent", () => {
  const blockedPaths = [
    "/songs/partidazo/years/2010/timeline/about/glossary/countries/italy/",
    "/songs/dai-dai/years/2026/",
    "/countries/italy/songs/un-estate-italiana/",
    "/years/2026/years/2022/",
    "/artists/shakira/unexpected/child/",
  ];

  for (const pathname of blockedPaths) {
    assert.deepEqual(classifyRequestPath(pathname), {
      action: "block",
      reason: "composed-content-path",
    });
  }
});

test("turns recursive internal URLs into root-absolute URLs", () => {
  const html = `
    <a href="../../songs/dai-dai/">Song</a>
    <a href="../years/2026/">Year</a>
    <a href="../">Home</a>
    <a href="songs/dna/">DNA</a>
    <link href="../../styles.css" rel="stylesheet">
    <script src="../script.js"></script>
    <a href="https://www.fifa.com/en/">FIFA</a>
    <a href="#details">Details</a>
  `;

  const result = absolutizeInternalUrls(html);

  assert.match(result, /href="\/songs\/dai-dai\/"/);
  assert.match(result, /href="\/years\/2026\/"/);
  assert.match(result, /href="\/"/);
  assert.match(result, /href="\/songs\/dna\/"/);
  assert.match(result, /href="\/styles\.css"/);
  assert.match(result, /src="\/script\.js"/);
  assert.match(result, /href="https:\/\/www\.fifa\.com\/en\/"/);
  assert.match(result, /href="#details"/);
});

test("middleware preserves normal request side effects and short-circuits only composed paths", async () => {
  let nextCalls = 0;
  const normalResponse = await onRequest({
    request: new Request("https://worldcupmusicatlas.com/api/comments?pageKey=home", {
      headers: { "User-Agent": "Googlebot" },
    }),
    next: async () => {
      nextCalls += 1;
      return new Response("continued");
    },
  });

  assert.equal(await normalResponse.text(), "continued");
  assert.equal(nextCalls, 1);

  const blockedResponse = await onRequest({
    request: new Request(
      "https://worldcupmusicatlas.com/songs/partidazo/years/2010/timeline/about/",
      { headers: { "User-Agent": "Googlebot" } }
    ),
    next: async () => {
      nextCalls += 1;
      return new Response("unexpected");
    },
  });

  assert.equal(blockedResponse.status, 404);
  assert.equal(blockedResponse.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.match(await blockedResponse.text(), /href="\/"/);
  assert.equal(nextCalls, 1);
});
