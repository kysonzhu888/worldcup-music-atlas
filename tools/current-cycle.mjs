const CURRENT_CYCLE_YEAR = "2026";
const CURRENT_CYCLE_CHECKED_LABEL = "Checked 15 July 2026";

export function currentCycleSection(year, yearSongs) {
  if (year !== CURRENT_CYCLE_YEAR) return "";

  const updates = yearSongs.filter((song) => song.currentUpdate).slice(0, 3);
  if (!updates.length) return "";

  return `<section class="usage-section current-cycle-section" aria-labelledby="current-cycle-title">
    <div class="usage-heading">
      <p class="kicker">${CURRENT_CYCLE_CHECKED_LABEL}</p>
      <h2 id="current-cycle-title">Final week: three music roles to track</h2>
      <p>The Final Halftime Show on 19 July has a confirmed performer lineup, but its complete song order has not been published. These notes keep the official song, official anthem, and album-track labels separate.</p>
      <a class="text-link" href="/world-cup-2026-final-halftime-show/">Open the source-checked Final Halftime Show guide</a>
    </div>
    <div class="usage-grid">
      ${updates.map(currentUpdateCard).join("")}
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
