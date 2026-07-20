export function serializeSongLibrary(songs) {
  const formatted = JSON.stringify(songs, null, 2).replace(
    /"searchAngles": \[\n((?:\s+"(?:[^"\\]|\\.)*"(?:,)?\n)+)\s+\]/g,
    (_match, body) => {
      const values = JSON.parse(`[${body.trim()}]`);
      const compact = values.map((value) => JSON.stringify(value)).join(", ");
      return `"searchAngles": [${compact}]`;
    },
  );
  return `${formatted}\n`;
}
