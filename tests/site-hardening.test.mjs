import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { onRequestGet as serveSearchConsoleVerification } from "../functions/google1089c0cca1aa4f0a.html.js";
import { absolutizeInternalUrls } from "../tools/internal-url.mjs";

test("Pages Functions do not install a root middleware", () => {
  assert.equal(
    fs.existsSync(new URL("../functions/_middleware.js", import.meta.url)),
    false
  );
  assert.equal(
    fs.existsSync(new URL("../functions/path-policy.js", import.meta.url)),
    false
  );
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

test("dedicated Function serves the exact Search Console verification response", async () => {
  const response = await serveSearchConsoleVerification();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "text/plain; charset=UTF-8");
  assert.equal(
    await response.text(),
    "google-site-verification: google1089c0cca1aa4f0a.html\n"
  );
});
