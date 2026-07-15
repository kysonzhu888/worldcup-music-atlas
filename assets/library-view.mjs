export const DEFAULT_LIBRARY_LIMIT = 6;

export function selectLibrarySongs({
  songs = [],
  query = "",
  activeFilter = "all",
  expanded = false,
  limit = DEFAULT_LIBRARY_LIMIT,
} = {}) {
  const source = Array.isArray(songs) ? songs : [];
  const normalizedQuery = normalize(query);
  const normalizedFilter = normalize(activeFilter) || "all";
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIBRARY_LIMIT;
  const matchingSongs = source.filter((song) => {
    const matchesType = normalizedFilter === "all" || normalize(song.type) === normalizedFilter;
    const haystack = normalize(
      [
        song.title,
        song.artist,
        song.year,
        song.tournament,
        song.country,
        song.language,
        song.type,
        song.status,
        song.summary,
      ].join(" ")
    );
    return matchesType && haystack.includes(normalizedQuery);
  });
  const isDefaultView = normalizedFilter === "all" && !normalizedQuery;
  const canToggle = isDefaultView && matchingSongs.length > safeLimit;
  const isExpanded = canToggle && Boolean(expanded);
  const visibleSongs = canToggle && !isExpanded
    ? matchingSongs.slice(0, safeLimit)
    : matchingSongs;

  return {
    matchingSongs,
    visibleSongs,
    canToggle,
    expanded: isExpanded,
  };
}

function normalize(value) {
  return String(value ?? "").toLowerCase().trim();
}
