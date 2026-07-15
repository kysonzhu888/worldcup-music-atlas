const CONTENT_SECTION_DEPTH = new Map([
  ["songs", 2],
  ["artists", 2],
  ["countries", 2],
  ["years", 2],
  ["timeline", 1],
  ["listen", 1],
  ["glossary", 1],
  ["about", 1],
  ["contact", 1],
  ["privacy", 1],
]);

export function classifyRequestPath(input) {
  const pathname = pathnameFromInput(input);
  const segments = pathname.split("/").filter(Boolean);
  const maximumDepth = CONTENT_SECTION_DEPTH.get(segments[0]);

  if (maximumDepth !== undefined && segments.length > maximumDepth) {
    return { action: "block", reason: "composed-content-path" };
  }

  return { action: "continue", reason: "not-a-composed-content-path" };
}

function pathnameFromInput(input) {
  try {
    return new URL(String(input), "https://worldcupmusicatlas.com").pathname;
  } catch {
    return "/";
  }
}
