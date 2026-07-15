const grid = document.querySelector("#songGrid");
const searchInput = document.querySelector("#searchInput");
const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
const generatedLinks = document.querySelector("#generatedLinks");
const libraryCount = document.querySelector("[data-library-count]");
const libraryToggle = document.querySelector("[data-library-toggle]");
let activeFilter = "all";
let libraryExpanded = false;
let selectLibrarySongs;
let songs = [];

enhancePrimaryNavigation();

if (grid && searchInput) {
  init();
}

async function init() {
  try {
    const [libraryView, response] = await Promise.all([
      import("/assets/library-view.mjs"),
      fetch("/data/songs.json"),
    ]);
    selectLibrarySongs = libraryView.selectLibrarySongs;
    songs = await response.json();
    applyInitialSearch();
    renderSongs();
    renderGeneratedLinks();
  } catch (error) {
    grid.innerHTML =
      '<div class="empty-state">The song library could not load right now. Try refreshing the page.</div>';
    updateLibraryControls({ unavailable: true });
    console.error(error);
  }
}

function renderSongs() {
  if (typeof selectLibrarySongs !== "function") {
    updateLibraryControls({ loading: true });
    return;
  }

  const view = selectLibrarySongs({
    songs,
    query: searchInput.value,
    activeFilter,
    expanded: libraryExpanded,
  });
  updateLibraryControls(view);

  if (!view.matchingSongs.length) {
    grid.innerHTML = '<div class="empty-state">No songs match that search yet.</div>';
    return;
  }

  grid.innerHTML = view.visibleSongs
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
          <a href="/songs/${encodeURIComponent(song.slug)}/">Open detail page</a>
        </article>
      `
    )
    .join("");
}

function updateLibraryControls({
  matchingSongs = [],
  visibleSongs = [],
  canToggle = false,
  expanded = false,
  loading = false,
  unavailable = false,
} = {}) {
  if (libraryCount) {
    if (unavailable) {
      libraryCount.textContent = "Song count unavailable.";
    } else if (loading) {
      libraryCount.textContent = "Loading songs...";
    } else if (matchingSongs.length === visibleSongs.length) {
      libraryCount.textContent = `${matchingSongs.length} songs`;
    } else {
      libraryCount.textContent = `Showing ${visibleSongs.length} of ${matchingSongs.length} songs`;
    }
  }

  if (libraryToggle) {
    libraryToggle.hidden = !canToggle;
    libraryToggle.textContent = expanded ? "Show fewer" : `Show all ${matchingSongs.length} songs`;
    libraryToggle.setAttribute("aria-expanded", String(expanded));
  }
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
      <a href="/timeline/">Timeline</a>
      <a href="/glossary/">Glossary</a>
      ${countries
        .slice(0, 8)
        .map(([slug, label]) => `<a href="/countries/${encodeURIComponent(slug)}/">${escapeHtml(label)}</a>`)
        .join("")}
      ${years
        .slice(0, 8)
        .map(([year]) => `<a href="/years/${encodeURIComponent(year)}/">${escapeHtml(year)}</a>`)
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

function enhancePrimaryNavigation() {
  const nav = document.querySelector('.site-header nav[aria-label="Primary navigation"]');
  if (nav && !nav.querySelector(".nav-more")) {
    const primaryLabels = new Set(["Trending", "Library", "Timeline"]);
    const secondaryLinks = Array.from(nav.children).filter(
      (node) => node.matches("a") && !primaryLabels.has(node.textContent.trim())
    );

    if (secondaryLinks.length) {
      nav.classList.add("primary-nav");
      secondaryLinks.forEach((link) => link.classList.add("nav-secondary"));

      const details = document.createElement("details");
      details.className = "nav-more";
      const summary = document.createElement("summary");
      summary.textContent = "More";
      const menu = document.createElement("div");
      menu.className = "nav-more-menu";
      secondaryLinks.forEach((link) => menu.append(link.cloneNode(true)));
      details.append(summary, menu);
      nav.append(details);
      document.documentElement.classList.add("mobile-nav-enhanced");
    }
  }
}

if (grid && searchInput) {
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

  libraryToggle?.addEventListener("click", () => {
    libraryExpanded = !libraryExpanded;
    renderSongs();
  });
}

document.querySelectorAll("[data-comment-section]").forEach((section) => {
  const pageKey = section.dataset.commentKey;
  const form = section.querySelector("[data-comment-form]");
  const list = section.querySelector("[data-comment-list]");
  const status = section.querySelector("[data-comment-status]");
  const count = section.querySelector("[data-comment-count]");
  const submit = section.querySelector("[data-comment-submit]");

  if (!pageKey || !form || !list) return;

  const setStatus = (message, tone = "") => {
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
  };

  const setLoading = (isLoading) => {
    if (!submit) return;
    submit.disabled = isLoading;
    submit.textContent = isLoading ? "Posting..." : "Post";
  };

  const fetchComments = async () => {
    const response = await fetch(`/api/comments?pageKey=${encodeURIComponent(pageKey)}`, {
      headers: { Accept: "application/json" },
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(payload.error || "Could not load comments.");
    }
    return Array.isArray(payload.comments) ? payload.comments : [];
  };

  const postComment = async (name, comment) => {
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pageKey, name, comment }),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(payload.error || "Could not post comment.");
    }
    return Array.isArray(payload.comments) ? payload.comments : [];
  };

  const formatDate = (value) => {
    try {
      return value ? new Date(value).toLocaleDateString() : "";
    } catch {
      return "";
    }
  };

  const render = (comments) => {
    list.replaceChildren();
    if (count) {
      count.textContent = comments.length === 1 ? "1 comment" : `${comments.length} comments`;
    }

    if (!comments.length) {
      const empty = document.createElement("p");
      empty.className = "comment-empty";
      empty.textContent = "No comments yet. Add the first note.";
      list.append(empty);
      return;
    }

    comments.forEach((comment) => {
      const item = document.createElement("article");
      item.className = "comment-item";

      const meta = document.createElement("div");
      meta.className = "comment-meta";

      const name = document.createElement("strong");
      name.textContent = comment.name || "Visitor";

      const time = document.createElement("time");
      time.dateTime = comment.createdAt || "";
      time.textContent = formatDate(comment.createdAt);

      const text = document.createElement("p");
      text.textContent = comment.body || "";

      meta.append(name, time);
      item.append(meta, text);
      list.append(item);
    });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "Visitor").trim().slice(0, 40) || "Visitor";
    const text = String(data.get("comment") || "").trim().slice(0, 600);
    if (!text) {
      setStatus("Write a comment before posting.", "error");
      return;
    }

    setLoading(true);
    setStatus("Posting...");
    postComment(name, text)
      .then((comments) => {
        form.reset();
        render(comments);
        setStatus("Posted. Thanks for the note.", "success");
      })
      .catch((error) => {
        setStatus(error.message || "Could not post comment.", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  });

  fetchComments()
    .then((comments) => {
      render(comments);
      setStatus("");
    })
    .catch((error) => {
      render([]);
      setStatus(error.message || "Comments are temporarily unavailable.", "error");
    });
});

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Comments API is unavailable on this local server. Start the site with Wrangler Pages dev.");
  }
  return response.json();
}

import("/conversion-tracking.js").catch(() => {
  // Measurement must never interfere with browsing or comments.
});
