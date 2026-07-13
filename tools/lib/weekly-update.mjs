const REQUIRED_SOURCE_FIELDS = ["id", "repository", "path", "license"];

export function validateSourceConfig(source) {
  for (const field of REQUIRED_SOURCE_FIELDS) {
    if (!source?.[field]?.trim()) {
      throw new Error(`Update source requires a non-empty ${field}.`);
    }
  }
  if (source.purpose !== "candidate-discovery") {
    throw new Error("Update sources must use the candidate-discovery purpose.");
  }
}

export function normalizeSongKey(song) {
  const year = String(song?.year || "").trim();
  const title = String(song?.title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return `${year}:${title}`;
}

export function buildCandidateReport({
  canonicalSongs,
  seed,
  source,
  fetchedAt,
  revision,
}) {
  validateSourceConfig(source);
  if (!Array.isArray(seed?.songs)) {
    throw new Error("Update seed must contain a songs array.");
  }

  const canonicalKeys = new Set(canonicalSongs.map(normalizeSongKey));
  const discovered = deduplicateSeed(seed.songs);
  const candidates = discovered
    .filter((song) => !canonicalKeys.has(normalizeSongKey(song)))
    .map((song) => candidateRecord(song, source, fetchedAt, revision))
    .sort(compareCandidate);

  return {
    schemaVersion: 1,
    generatedAt: fetchedAt,
    source: {
      id: source.id,
      repository: source.repository,
      path: source.path,
      license: source.license,
      purpose: source.purpose,
      revision,
    },
    summary: {
      discovered: discovered.length,
      alreadyIndexed: discovered.length - candidates.length,
      needsReview: candidates.length,
    },
    candidates,
  };
}

function deduplicateSeed(songs) {
  const unique = new Map();
  for (const song of songs) {
    const key = normalizeSongKey(song);
    if (!key.startsWith(":")) unique.set(key, song);
  }
  return [...unique.values()];
}

function candidateRecord(song, source, fetchedAt, revision) {
  const platformLinks = compactObject({
    spotify: song.uri,
    appleMusic: song.uri_apple_music,
    youtubeMusic: song.uri_youtube_music,
    tidal: song.uri_tidal,
    deezer: song.uri_deezer,
  });

  return {
    state: "candidate",
    year: String(song.year),
    title: String(song.title || "").trim(),
    artist: String(song.artist || "").trim(),
    alternateArtists: Array.isArray(song.alt_artists) ? song.alt_artists : [],
    platformLinks,
    reviewChecklist: [
      "Confirm tournament relationship with a primary or authoritative source.",
      "Confirm artist and title spelling against an official platform page.",
      "Write original context; do not copy seed descriptions.",
      "Add at least two citations before moving into data/songs.json.",
    ],
    provenance: {
      sourceId: source.id,
      repository: source.repository,
      path: source.path,
      license: source.license,
      revision,
      fetchedAt,
    },
  };
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => Boolean(fieldValue)),
  );
}

function compareCandidate(left, right) {
  const byYear = Number(left.year) - Number(right.year);
  return byYear || left.title.localeCompare(right.title);
}
