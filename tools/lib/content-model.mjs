const COLLABORATION_SEPARATOR = /\s*(?:,|&|\b(?:and|featuring|with|x)\b|\bfeat\b\.?)\s*/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function artistSlug(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function splitArtistNames(value) {
  return [...new Set(
    String(value || "")
      .split(COLLABORATION_SEPARATOR)
      .map((name) => name.trim())
      .filter(Boolean),
  )];
}

export function artistNames(song) {
  return splitArtistNames(song?.artist);
}

export function artistKind(name) {
  const normalized = String(name || "").toLowerCase();
  if (normalized.includes("supporters")) return "Supporter group";
  if (normalized.includes("team")) return "Team context";
  return "Artist";
}

export function isCuratedArtist(profile) {
  const sources = Array.isArray(profile?.sources) ? profile.sources : [];

  return Boolean(
    profile?.summary?.trim()
      && profile?.worldCupContext?.trim()
      && ISO_DATE_PATTERN.test(profile?.contentUpdatedAt || "")
      && sources.length >= 2
      && sources.every((source) => (
        source?.label?.trim()
          && /^https?:\/\//.test(source?.url || "")
      )),
  );
}

export function buildArtistProfiles(songs, profileRecords = []) {
  const inferredProfiles = new Map();

  for (const song of songs) {
    for (const name of artistNames(song)) {
      const slug = artistSlug(name);
      const existing = inferredProfiles.get(slug) || {
        slug,
        name,
        kind: artistKind(name),
        songSlugs: [],
      };

      if (!existing.songSlugs.includes(song.slug)) {
        existing.songSlugs.push(song.slug);
      }
      inferredProfiles.set(slug, existing);
    }
  }

  for (const record of profileRecords) {
    const slug = record.slug || artistSlug(record.name);
    const inferred = inferredProfiles.get(slug) || {
      slug,
      name: record.name,
      kind: record.kind || artistKind(record.name),
      songSlugs: [],
    };
    const merged = {
      ...inferred,
      ...record,
      slug,
      songSlugs: inferred.songSlugs,
    };
    inferredProfiles.set(slug, merged);
  }

  return [...inferredProfiles.values()]
    .map((profile) => ({
      ...profile,
      isCurated: isCuratedArtist(profile),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function buildCollectionOverview({ label, kind, items }) {
  const years = [...new Set(items.map((item) => String(item.year)).filter(Boolean))]
    .sort((left, right) => Number(right) - Number(left));
  const languages = [...new Set(
    items.flatMap((item) => String(item.language || "").split("/"))
      .map((language) => language.trim())
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right));
  const officialCount = items.filter((item) => (
    /official|classic/i.test(`${item.status || ""} ${item.type || ""}`)
  )).length;
  const artists = [...new Set(items.flatMap(artistNames))]
    .sort((left, right) => left.localeCompare(right));
  const countries = [...new Set(items.map((item) => item.country).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
  const oldestYear = years.at(-1);
  const newestYear = years[0];
  const cycleCount = years.length;
  const cyclePhrase = numberWord(cycleCount);
  const subject = kind === "artist" ? `${label}'s World Cup music` : `The ${label} collection`;
  const range = oldestYear && newestYear
    ? (oldestYear === newestYear ? oldestYear : `${oldestYear} to ${newestYear}`)
    : "the indexed tournament years";

  return {
    itemCount: items.length,
    years,
    languages,
    artists,
    countries,
    officialCount,
    lead: `${subject} in this atlas spans ${range}, based on the entries currently documented here.`,
    facts: [
      `${items.length} documented ${items.length === 1 ? "entry" : "entries"} across ${cyclePhrase} tournament ${cycleCount === 1 ? "cycle" : "cycles"}.`,
      `${officialCount} ${officialCount === 1 ? "entry is" : "entries are"} identified as official or classic tournament music in the source data.`,
      languages.length
        ? `The indexed language labels are ${joinNaturalLanguage(languages)}.`
        : "No language label is currently recorded for this collection.",
      `${artists.length} credited ${artists.length === 1 ? "artist or group appears" : "artists or groups appear"} across these entries.`,
      countries.length
        ? `The collection's country labels are ${joinNaturalLanguage(countries)}.`
        : "No country label is currently recorded for this collection.",
    ],
  };
}

function numberWord(value) {
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  return words[value] || String(value);
}

function joinNaturalLanguage(values) {
  if (values.length < 2) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}
