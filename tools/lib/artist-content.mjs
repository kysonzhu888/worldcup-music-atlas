export function artistCreditIndex(indexOnlyArtists, byArtist, prefix) {
  return `<ul class="context-facts artist-song-list">
    ${indexOnlyArtists.map((artist) => {
      const count = (byArtist.get(artist.slug) || []).length;
      return `<li><a class="text-link" href="${prefix}artists/${artist.slug}/">${escapeHtml(artist.name)}</a> · ${count} ${count === 1 ? "song credit" : "song credits"} · research pending</li>`;
    }).join("")}
  </ul>`;
}

export function artistSummary(artist, artistSongs, hasMedia) {
  if (artist.isCurated) return artist.summary;
  const imageNote = hasMedia
    ? "The image is sourced from Wikimedia Commons with attribution."
    : "This profile is text-first until reusable image rights are confirmed.";
  return `${artist.name} appears in the atlas through ${artistConnectionSummary(artistSongs)} ${imageNote}`;
}

export function artistWhyHere(artist, artistSongs) {
  if (artist.isCurated) return artist.background;
  const songTitles = naturalList(artistSongs.map((song) => song.title));
  if (artist.kind === "Supporter group") {
    return `${artist.name} is included because supporter-led music can become part of World Cup memory even when it is not an official tournament release. Related page: ${songTitles}.`;
  }
  const subject = artistSongs.length === 1 ? `${songTitles} connects` : `${songTitles} connect`;
  return `${artist.name} is included because ${subject} the artist to World Cup music search, tournament context, or fan discovery.`;
}

export function artistConnectionSummary(artistSongs) {
  if (!artistSongs.length) return "no current song entries.";
  const years = [...new Set(artistSongs.map((song) => song.year))]
    .sort((left, right) => Number(right) - Number(left));
  const labels = [...new Set(artistSongs.map((song) => song.status))].join(", ");
  return `${artistSongs.length} ${artistSongs.length === 1 ? "song entry" : "song entries"} across ${naturalList(years)}: ${labels}.`;
}

export function artistEditorialSections(artist, artistSongs, artistMedia, imagePolicy) {
  if (!artist.isCurated) {
    return `<section class="explainer-stack" aria-label="${escapeHtml(artist.name)} credit index">
      <section class="explainer-block">
        <h2>Why this name appears here</h2>
        <p>${escapeHtml(artistWhyHere(artist, artistSongs))}</p>
      </section>
      <section class="explainer-block">
        <h2>World Cup music connections</h2>
        <p>${escapeHtml(artistConnectionSummary(artistSongs))}</p>
        ${artistSongLinks(artistSongs)}
      </section>
      <section class="explainer-block">
        <h2>Research status</h2>
        <p>This is a navigation record generated from verified song credits, not a finished editorial profile. Search engines are asked not to index it until an editor adds original tournament context, a dated review, and at least two reliable identity or organiser sources.</p>
        ${artistExternalLinks(artist, artistSongs)}
      </section>
    </section>`;
  }

  return `<section class="explainer-stack" aria-label="${escapeHtml(artist.name)} artist profile">
    <section class="explainer-block">
      <h2>Profile scope</h2>
      <p>${escapeHtml(artist.background)}</p>
    </section>
    <section class="explainer-block">
      <h2>World Cup music context</h2>
      <p>${escapeHtml(artist.worldCupContext)}</p>
      ${artistSongLinks(artistSongs)}
    </section>
    <section class="explainer-block">
      <h2>Verified profile notes</h2>
      <ul class="context-facts">
        ${artist.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("")}
      </ul>
    </section>
    <section class="explainer-block">
      <h2>Sources and update record</h2>
      <p>This original profile was content-updated on <time datetime="${escapeHtml(artist.contentUpdatedAt)}">${escapeHtml(artist.contentUpdatedAt)}</time> and its links were checked on <time datetime="${escapeHtml(artist.lastCheckedAt)}">${escapeHtml(artist.lastCheckedAt)}</time>. Social posts are discovery leads, not factual sources.</p>
      ${artistExternalLinks(artist, artistSongs)}
    </section>
    <section class="explainer-block">
      <h2>Image policy</h2>
      <p>${escapeHtml(imagePolicy)}</p>
    </section>
  </section>`;
}

export function artistStatRows(artist, artistSongs, imageLabel) {
  const years = [...new Set(artistSongs.map((song) => song.year))]
    .sort((left, right) => Number(right) - Number(left));
  const countries = [...new Set(artistSongs.map((song) => song.country))].sort();
  return [
    ["Type", artist.kind],
    ["Editorial status", artist.isCurated ? "Curated profile" : "Research pending"],
    ["Songs", String(artistSongs.length)],
    ["Years", naturalList(years)],
    ["Countries", naturalList(countries)],
    ...(artist.isCurated ? [["Content updated", artist.contentUpdatedAt], ["Sources checked", artist.lastCheckedAt]] : []),
    ["Image", imageLabel],
  ];
}

function artistSongLinks(artistSongs) {
  return `<ul class="context-facts artist-song-list">
    ${artistSongs.map((song) => (
      `<li><a class="text-link" href="../../songs/${song.slug}/">${escapeHtml(song.title)}</a> · ${escapeHtml(song.year)} · ${escapeHtml(song.status)}</li>`
    )).join("")}
  </ul>`;
}

function artistExternalLinks(artist, artistSongs) {
  const links = new Map();
  for (const source of artist.sources || []) {
    if (source.url) links.set(source.url, source.label || source.kind || "Profile source");
  }
  for (const song of artistSongs) {
    if (song.sourceUrl) links.set(song.sourceUrl, song.sourceLabel || "Source");
    if (song.watchUrl) links.set(song.watchUrl, song.watchLabel || "Watch");
    if (song.spotifyUrl) links.set(song.spotifyUrl, "Spotify");
  }
  if (!links.size) return "";
  return `<div class="source-links artist-source-links">
    ${[...links.entries()].map(([url, label]) => (
      `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`
    )).join("")}
  </div>`;
}

function naturalList(items) {
  if (!items.length) return "artist, year, country, and song type";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
