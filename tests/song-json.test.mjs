import assert from "node:assert/strict";
import test from "node:test";

import { serializeSongLibrary } from "../tools/lib/song-json.mjs";

test("song serialization preserves compact search-angle arrays", () => {
  const output = serializeSongLibrary([{
    slug: "example",
    searchAngles: ["first query", "second query"],
    facts: ["first fact", "second fact"],
  }]);

  assert.match(
    output,
    /"searchAngles": \["first query", "second query"\]/,
  );
  assert.match(output, /"facts": \[\n/);
  assert.equal(JSON.parse(output)[0].searchAngles.length, 2);
});
