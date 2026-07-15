export function notFoundPage(siteName) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>Page not found | ${escapeHtml(siteName)}</title>
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <main class="article-page utility-page">
      <section class="detail-hero">
        <p class="kicker">404</p>
        <h1>That page is not in the atlas</h1>
        <p>The address may be incomplete or may combine sections that do not belong together.</p>
        <div class="hero-actions">
          <a class="button primary" href="/">Return home</a>
          <a class="button secondary" href="/years/2026/">Browse 2026 music</a>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
