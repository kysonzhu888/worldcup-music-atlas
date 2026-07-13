export function yearIntroduction(year) {
  if (year === "2026") {
    return "The official song, official anthem, album tracks, and fan moments for the live 2026 tournament cycle, with source checks separated from speculation.";
  }
  return `A compact music guide for the ${year} tournament cycle.`;
}

export function currentCycleSection(year, yearSongs) {
  if (year !== "2026") return "";
  const updates = yearSongs.filter((song) => song.currentUpdate).slice(0, 3);
  if (!updates.length) return "";

  return `<section class="usage-section current-cycle-section" aria-labelledby="current-cycle-title">
    <div class="usage-heading">
      <p class="kicker">Checked 13 July 2026</p>
      <h2 id="current-cycle-title">Final week: three music roles to track</h2>
      <p>The tournament final is scheduled for 19 July. These notes keep FIFA's official song, official anthem, and album-track labels separate as the final week begins.</p>
      <a class="text-link" href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums" target="_blank" rel="noreferrer noopener">Check the official FIFA match schedule</a>
    </div>
    <div class="usage-grid">
      ${updates.map((song) => currentUpdateCard(song)).join("")}
    </div>
  </section>`;
}

export function songCurrentUpdateSection(song) {
  const update = song.currentUpdate;
  if (!update) return "";

  return `<section class="usage-section current-song-update" aria-labelledby="current-update-${escapeHtml(song.slug)}">
    <div class="usage-heading">
      <p class="kicker">${escapeHtml(update.label)}</p>
      <h2 id="current-update-${escapeHtml(song.slug)}">Where ${escapeHtml(song.title)} stands now</h2>
      <p>${escapeHtml(update.body)}</p>
      <a class="text-link" href="${escapeHtml(update.sourceUrl)}" target="_blank" rel="noreferrer noopener">${escapeHtml(update.sourceLabel)}</a>
      <small>Checked ${escapeHtml(formatCheckedDate(update.checked))}</small>
    </div>
  </section>`;
}

function currentUpdateCard(song) {
  const update = song.currentUpdate;
  return `<article class="usage-card">
    <span>${escapeHtml(song.status)}</span>
    <strong>${escapeHtml(song.title)}</strong>
    <p>${escapeHtml(update.body)}</p>
    <a class="text-link" href="${escapeHtml(update.sourceUrl)}" target="_blank" rel="noreferrer noopener">${escapeHtml(update.sourceLabel)}</a>
  </article>`;
}

function formatCheckedDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return value || "";
  const [year, month, day] = value.split("-");
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${Number(day)} ${monthNames[Number(month) - 1]} ${year}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
