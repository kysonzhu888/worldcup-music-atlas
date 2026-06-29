const grid = document.querySelector("#songGrid");
const searchInput = document.querySelector("#searchInput");
const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
const generatedLinks = document.querySelector("#generatedLinks");
let activeFilter = "all";
let songs = [];

init();

async function init() {
  try {
    const response = await fetch("data/songs.json");
    songs = await response.json();
    applyInitialSearch();
    renderSongs();
    renderGeneratedLinks();
  } catch (error) {
    grid.innerHTML =
      '<div class="empty-state">The song library could not load right now. Try refreshing the page.</div>';
    console.error(error);
  }
}

function normalize(value) {
  return String(value).toLowerCase().trim();
}

function renderSongs() {
  const query = normalize(searchInput.value);
  const visibleSongs = songs.filter((song) => {
    const matchesType = activeFilter === "all" || song.type === activeFilter;
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
    return matchesType && haystack.includes(query);
  });

  if (!visibleSongs.length) {
    grid.innerHTML = '<div class="empty-state">No songs match that search yet.</div>';
    return;
  }

  grid.innerHTML = visibleSongs
    .map(
      (song) => `
        <article class="song-card">
          <div class="song-meta">
            <span class="pill ${escapeHtml(song.type)}">${escapeHtml(song.status)}</span>
            <span class="pill">${escapeHtml(song.year)}</span>
            <span class="pill">${escapeHtml(song.country)}</span>
            <span class="pill">${escapeHtml(song.language)}</span>
          </div>
          <h3>${escapeHtml(song.title)}</h3>
          <p class="artist">${escapeHtml(song.artist)}</p>
          <p class="note">${escapeHtml(song.summary)}</p>
          <a href="songs/${encodeURIComponent(song.slug)}/">Open detail page</a>
        </article>
      `
    )
    .join("");
}

function renderGeneratedLinks() {
  const countries = unique(songs.map((song) => [song.countrySlug, song.country]));
  const years = unique(songs.map((song) => [song.year, song.year]));
  generatedLinks.innerHTML = `
    <div>
      <h3>Browse by context</h3>
      <p>Open a timeline, glossary, country, or tournament year to keep following the story.</p>
    </div>
    <div class="link-cloud">
      <a href="timeline/">Timeline</a>
      <a href="glossary/">Glossary</a>
      ${countries
        .slice(0, 8)
        .map(([slug, label]) => `<a href="countries/${encodeURIComponent(slug)}/">${escapeHtml(label)}</a>`)
        .join("")}
      ${years
        .slice(0, 8)
        .map(([year]) => `<a href="years/${encodeURIComponent(year)}/">${escapeHtml(year)}</a>`)
        .join("")}
    </div>
  `;
}

function unique(entries) {
  return Array.from(new Map(entries).entries()).map(([key, value]) => [key, value]);
}

function applyInitialSearch() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");
  if (query) searchInput.value = query;
}

function updateSearchUrl() {
  const params = new URLSearchParams(window.location.search);
  const query = searchInput.value.trim();
  if (query) {
    params.set("q", query);
  } else {
    params.delete("q");
  }
  const nextQuery = params.toString();
  const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
  window.history.replaceState(null, "", nextUrl);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderSongs();
  });
});

searchInput.addEventListener("input", () => {
  updateSearchUrl();
  renderSongs();
});
