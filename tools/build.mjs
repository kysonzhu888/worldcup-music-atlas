import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const songs = JSON.parse(fs.readFileSync(path.join(root, "data", "songs.json"), "utf8"));
const config = JSON.parse(fs.readFileSync(path.join(root, "site.config.json"), "utf8"));

const site = {
  name: config.name,
  url: normalizeSiteUrl(config.siteUrl),
  description: config.description,
  contactEmail: config.contactEmail,
  googleAnalyticsId: config.googleAnalyticsId.trim(),
  adsenseClientId: config.adsenseClientId.trim(),
  adsensePublisherId: config.adsensePublisherId.trim(),
  searchConsoleVerification: config.searchConsoleVerification.trim(),
};

const byYear = groupBy(songs, (song) => song.year);
const byCountry = groupBy(songs, (song) => song.countrySlug);
const siteUpdatedAt = latestDate(songs.map((song) => song.lastChecked));

cleanGenerated();
generateSongPages();
generateCountryPages();
generateYearPages();
generateTimelinePage();
generateUtilityPages();
updateHomeIntegrations();
updateHomeStaticLinks();
generateSitemap();
generateRobots();
generateAdsTxt();

console.log(
  `Generated ${songs.length} song pages, ${byCountry.size} country pages, ${byYear.size} year pages.`
);

function cleanGenerated() {
  for (const dir of ["songs", "countries", "years", "timeline", "glossary", "about", "contact", "privacy"]) {
    fs.rmSync(path.join(root, dir), { recursive: true, force: true });
  }
  fs.rmSync(path.join(root, "sitemap.xml"), { force: true });
  fs.rmSync(path.join(root, "robots.txt"), { force: true });
  fs.rmSync(path.join(root, "ads.txt"), { force: true });
}

function generateSongPages() {
  for (const song of songs) {
    const related = songs
      .filter((candidate) => candidate.slug !== song.slug)
      .filter(
        (candidate) =>
          candidate.year === song.year ||
          candidate.countrySlug === song.countrySlug ||
          candidate.type === song.type
      )
      .slice(0, 4);

    writePage(
      ["songs", song.slug],
      layout({
        title: `${song.title} World Cup Song: Year, Artist and Context`,
        description: song.summary,
        depth: 2,
        path: `/songs/${song.slug}/`,
        type: "article",
        schema: articleSchema(song),
        body: `
          <main class="article-page">
            ${breadcrumb("Songs")}
            <section class="detail-hero">
              <p class="kicker">${escapeHtml(song.status)} · ${escapeHtml(song.tournament)}</p>
              <h1>${escapeHtml(song.title)}</h1>
              <p>${escapeHtml(song.summary)}</p>
            </section>
            <section class="detail-grid">
              <article class="detail-main">
                ${watchSection(song)}
                ${songContextSection(song)}
                <h2>Why it matters</h2>
                <p>${escapeHtml(song.whyItMatters)}</p>
                <h2>Search angles</h2>
                <ul>
                  ${song.searchAngles.map((angle) => `<li>${escapeHtml(angle)}</li>`).join("")}
                </ul>
                <h2>Source note</h2>
                <p>
                  This page uses short original context only. It does not reproduce lyrics or host
                  audio. Use the official or reputable source links on this page for listening,
                  watching, or verification.
                </p>
                <a class="text-link" href="${song.sourceUrl}" target="_blank" rel="noreferrer">${escapeHtml(song.sourceLabel)}</a>
              </article>
              <aside class="detail-aside">
                ${statList(song)}
                ${adBox()}
              </aside>
            </section>
            ${relatedList("Related songs", related, "../../")}
          </main>
        `,
      })
    );
  }
}

function generateCountryPages() {
  for (const [countrySlug, countrySongs] of byCountry.entries()) {
    const country = countrySongs[0].country;
    writePage(
      ["countries", countrySlug],
      layout({
        title: `${country} World Cup Songs and Anthems`,
        description: `Browse World Cup songs, anthems, and soundtrack entries connected to ${country}.`,
        depth: 2,
        path: `/countries/${countrySlug}/`,
        schema: collectionSchema({
          title: `${country} World Cup music`,
          description: `Official songs, soundtrack entries, and useful music-history pages connected to ${country}.`,
          path: `/countries/${countrySlug}/`,
          items: countrySongs,
        }),
        body: `
          <main class="article-page">
            ${breadcrumb("Countries")}
            <section class="detail-hero">
              <p class="kicker">Country collection</p>
              <h1>${escapeHtml(country)} World Cup music</h1>
              <p>Official songs, soundtrack entries, and useful music-history pages connected to ${escapeHtml(country)}.</p>
            </section>
            ${collectionGrid(countrySongs, "../../")}
          </main>
        `,
      })
    );
  }
}

function generateYearPages() {
  for (const [year, yearSongs] of byYear.entries()) {
    writePage(
      ["years", year],
      layout({
        title: `${year} World Cup Songs and Soundtrack Guide`,
        description: `Browse World Cup songs and music context for ${year}.`,
        depth: 2,
        path: `/years/${year}/`,
        schema: collectionSchema({
          title: `${year} World Cup songs`,
          description: `A compact music guide for the ${year} tournament cycle.`,
          path: `/years/${year}/`,
          items: yearSongs,
        }),
        body: `
          <main class="article-page">
            ${breadcrumb("Years")}
            <section class="detail-hero">
              <p class="kicker">Tournament year</p>
              <h1>${escapeHtml(year)} World Cup songs</h1>
              <p>A compact music guide for the ${escapeHtml(year)} tournament cycle.</p>
            </section>
            ${collectionGrid(yearSongs, "../../")}
          </main>
        `,
      })
    );
  }
}

function generateTimelinePage() {
  const timelineSongs = timelineItems();
  const timelineYears = new Set(timelineSongs.map((song) => song.year));

  writePage(
    ["timeline"],
    layout({
      title: "World Cup Songs Timeline",
      description: "Browse World Cup songs, anthems, fan chants, and soundtrack entries by tournament year.",
      depth: 1,
      path: "/timeline/",
      schema: collectionSchema({
        title: "World Cup songs timeline",
        description:
          "A curated visual timeline of World Cup songs, anthems, fan chants, and soundtrack moments.",
        path: "/timeline/",
        items: timelineSongs,
      }),
      body: `
        <main class="article-page timeline-page">
          ${simpleBreadcrumb("Timeline", "../")}
          <section class="timeline-hero">
            <div>
              <p class="kicker">Visual timeline</p>
              <h1>World Cup songs through time</h1>
              <p>Not every track needs the spotlight. This timeline follows the music moments people keep searching for: official songs, fan anthems, ceremony tracks, and the hits that outlived their tournament.</p>
            </div>
            <div class="timeline-summary" aria-label="Timeline summary">
              <strong>${timelineSongs.length}</strong>
              <span>featured moments</span>
              <strong>${timelineYears.size}</strong>
              <span>tournament years</span>
            </div>
          </section>
          <section class="timeline-track" aria-label="World Cup music timeline">
            ${timelineSongs
              .map((song, index) => timelineNode(song, index, timelineSongs.findIndex((item) => item.year === song.year) === index))
              .join("")}
          </section>
          ${timelineAnimationScript()}
        </main>
      `,
    })
  );
}

function timelineItems() {
  const featured = songs.filter((song) => song.timelineFeatured);
  const source = featured.length ? featured : Array.from(byYear.values()).flatMap((yearSongs) => sortedSongs(yearSongs).slice(0, 1));
  return source.sort((left, right) => {
    const yearDelta = Number(right.year) - Number(left.year);
    if (yearDelta !== 0) return yearDelta;
    return (left.timelineRank ?? 99) - (right.timelineRank ?? 99);
  });
}

function timelineNode(song, index, isFirstInYear) {
  const allYearSongs = byYear.get(song.year) || [];
  const hiddenCount = Math.max(0, allYearSongs.length - allYearSongs.filter((item) => item.timelineFeatured).length);
  const note = song.timelineNote || song.summary;
  const side = index % 2 === 0 ? "right" : "left";
  const delay = `${Math.min(index * 70, 560)}ms`;

  return `<article class="timeline-node ${side}" style="--reveal-delay: ${delay}">
    <div class="timeline-dot" aria-hidden="true"></div>
    <div class="timeline-date">
      <span>${escapeHtml(song.year)}</span>
      <small>${escapeHtml(song.status)}</small>
    </div>
    <div class="timeline-card">
      <div class="song-meta">
        <span class="pill ${song.type}">${escapeHtml(song.type)}</span>
        <span class="pill">${escapeHtml(song.country)}</span>
        <span class="pill">${escapeHtml(song.language)}</span>
      </div>
      <h2>${escapeHtml(song.title)}</h2>
      <p class="artist">${escapeHtml(song.artist)}</p>
      <p>${escapeHtml(note)}</p>
      <div class="timeline-actions">
        <a class="button primary" href="../songs/${encodeURIComponent(song.slug)}/">Open story</a>
        <a class="button secondary" href="../years/${encodeURIComponent(song.year)}/">${escapeHtml(song.year)} collection</a>
      </div>
      ${
        isFirstInYear && hiddenCount > 0
          ? `<p class="timeline-more">${hiddenCount} more ${escapeHtml(song.year)} ${hiddenCount === 1 ? "entry" : "entries"} in the full collection.</p>`
          : ""
      }
    </div>
  </article>`;
}

function timelineAnimationScript() {
  return `<script>
    (() => {
      const page = document.querySelector(".timeline-page");
      const nodes = Array.from(document.querySelectorAll(".timeline-node"));
      const reveal = () => {
        nodes.forEach((node) => {
          const rect = node.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.82) node.classList.add("is-visible");
        });
        const track = document.querySelector(".timeline-track");
        if (!track || !page) return;
        const rect = track.getBoundingClientRect();
        const total = rect.height - window.innerHeight * 0.35;
        const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.2 - rect.top) / total));
        page.style.setProperty("--timeline-progress", progress.toFixed(3));
      };
      reveal();
      window.addEventListener("scroll", reveal, { passive: true });
      window.addEventListener("resize", reveal);
    })();
  </script>`;
}

function generateSitemap() {
  const urls = [
    { path: "/", lastmod: siteUpdatedAt, changefreq: "daily", priority: "1.0" },
    { path: "/timeline/", lastmod: siteUpdatedAt, changefreq: "weekly", priority: "0.8" },
    { path: "/glossary/", lastmod: siteUpdatedAt, changefreq: "monthly", priority: "0.7" },
    { path: "/about/", lastmod: siteUpdatedAt, changefreq: "monthly", priority: "0.3" },
    { path: "/contact/", lastmod: siteUpdatedAt, changefreq: "monthly", priority: "0.2" },
    { path: "/privacy/", lastmod: siteUpdatedAt, changefreq: "yearly", priority: "0.1" },
  ];
  for (const song of songs) {
    urls.push({
      path: `/songs/${song.slug}/`,
      lastmod: song.lastChecked,
      changefreq: song.year === "2026" ? "daily" : "monthly",
      priority: song.year === "2026" ? "0.9" : "0.7",
    });
  }
  for (const [countrySlug, countrySongs] of byCountry.entries()) {
    urls.push({
      path: `/countries/${countrySlug}/`,
      lastmod: latestDate(countrySongs.map((song) => song.lastChecked)),
      changefreq: "weekly",
      priority: "0.6",
    });
  }
  for (const [year, yearSongs] of byYear.entries()) {
    urls.push({
      path: `/years/${year}/`,
      lastmod: latestDate(yearSongs.map((song) => song.lastChecked)),
      changefreq: year === "2026" ? "daily" : "monthly",
      priority: year === "2026" ? "0.8" : "0.5",
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) => `  <url>
    <loc>${site.url}${entry.path}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(root, "sitemap.xml"), xml);
}

function generateRobots() {
  const content = `User-agent: *
Allow: /

Sitemap: ${site.url}/sitemap.xml
`;
  fs.writeFileSync(path.join(root, "robots.txt"), content);
}

function generateAdsTxt() {
  if (!site.adsensePublisherId) return;
  const content = `google.com, ${site.adsensePublisherId}, DIRECT, f08c47fec0942fa0
`;
  fs.writeFileSync(path.join(root, "ads.txt"), content);
}

function updateHomeIntegrations() {
  const indexPath = path.join(root, "index.html");
  const html = fs.readFileSync(indexPath, "utf8");
  const integrations = headIntegrations();
  const markerRegex =
    /    <!-- GOOGLE_INTEGRATIONS_START -->[\s\S]*?    <!-- GOOGLE_INTEGRATIONS_END -->/;
  const block = `    <!-- GOOGLE_INTEGRATIONS_START -->\n${indentBlock(integrations, 4)}\n    <!-- GOOGLE_INTEGRATIONS_END -->`;
  const nextHtml = markerRegex.test(html)
    ? html.replace(markerRegex, block)
    : html.replace(
        "    <!-- Google integrations are injected into generated pages by tools/build.mjs after site.config.json is filled. -->",
        block
      );
  fs.writeFileSync(indexPath, nextHtml);
}

function updateHomeStaticLinks() {
  const indexPath = path.join(root, "index.html");
  const html = fs.readFileSync(indexPath, "utf8");
  const block = homepageStaticLinks();
  const nextHtml = html.replace(
    /<div class="generated-links" id="generatedLinks" aria-live="polite">[\s\S]*?<\/div>\s*<\/section>/,
    `<div class="generated-links" id="generatedLinks" aria-live="polite">\n${indentBlock(block, 10)}\n        </div>\n      </section>`
  );
  fs.writeFileSync(indexPath, nextHtml);
}

function homepageStaticLinks() {
  const countries = Array.from(byCountry.entries())
    .map(([slug, countrySongs]) => [slug, countrySongs[0].country])
    .sort((left, right) => left[1].localeCompare(right[1]));
  const years = Array.from(byYear.keys()).sort((left, right) => Number(right) - Number(left));
  const indexablePageCount = songs.length + countries.length + years.length + 1;

  return `<div>
  <h3>Indexable pages</h3>
  <p>${songs.length} song pages, ${countries.length} country pages, ${years.length} year pages, a timeline, and a glossary are linked directly from this page.</p>
</div>
<div class="link-cloud" aria-label="Indexable site links">
  <a href="timeline/">Timeline</a>
  <a href="glossary/">Glossary</a>
  ${songs.map((song) => `<a href="songs/${encodeURIComponent(song.slug)}/">${escapeHtml(song.title)}</a>`).join("\n  ")}
  ${countries.map(([slug, label]) => `<a href="countries/${encodeURIComponent(slug)}/">${escapeHtml(label)}</a>`).join("\n  ")}
  ${years.map((year) => `<a href="years/${encodeURIComponent(year)}/">${escapeHtml(year)}</a>`).join("\n  ")}
</div>
<p class="index-note">${indexablePageCount} public content pages are available without JavaScript.</p>`;
}

function generateUtilityPages() {
  writePage(
    ["glossary"],
    layout({
      title: "World Cup Music Glossary",
      description:
        "Plain-English definitions for official song, anthem, fan anthem, chant, and soundtrack terms in World Cup music.",
      depth: 1,
      path: "/glossary/",
      schema: faqPageSchema(),
      body: `
        <main class="article-page glossary-page">
          ${simpleBreadcrumb("Glossary", "../")}
          <section class="detail-hero">
            <p class="kicker">Glossary</p>
            <h1>World Cup music terms, explained</h1>
            <p>Use this page when a song is everywhere but the label is confusing: official song, anthem, soundtrack single, fan anthem, chant, or ceremony track.</p>
          </section>
          <section class="glossary-grid" aria-label="World Cup music glossary">
            ${glossaryEntries().map((entry) => glossaryCard(entry)).join("")}
          </section>
          <section class="faq-section" aria-labelledby="faq-title">
            <h2 id="faq-title">Quick answers</h2>
            ${glossaryFaqs().map((item) => faqItem(item)).join("")}
          </section>
        </main>
      `,
    })
  );

  writePage(
    ["about"],
    layout({
      title: "About",
      description: `About ${site.name}.`,
      depth: 1,
      path: "/about/",
      schema: simplePageSchema("About", `About ${site.name}.`, "/about/"),
      body: `
        <main class="article-page utility-page">
          ${simpleBreadcrumb("About", "../")}
          <section class="detail-hero">
            <p class="kicker">About</p>
            <h1>About ${escapeHtml(site.name)}</h1>
            <p>${escapeHtml(site.description)}</p>
          </section>
          <article class="detail-main">
            <h2>What this site does</h2>
            <p>
              ${escapeHtml(site.name)} is a lightweight editorial reference for World Cup music:
              official songs, tournament anthems, fan songs, soundtrack entries, and the cultural
              context around them.
            </p>
            <h2>Editorial approach</h2>
            <p>
              We use short original summaries and link to primary or reputable public sources.
              We do not reproduce lyrics, upload audio, or present unofficial fan chants as official
              tournament songs.
            </p>
          </article>
        </main>
      `,
    })
  );

  writePage(
    ["contact"],
    layout({
      title: "Contact",
      description: `Contact ${site.name}.`,
      depth: 1,
      path: "/contact/",
      schema: simplePageSchema("Contact", `Contact ${site.name}.`, "/contact/"),
      body: `
        <main class="article-page utility-page">
          ${simpleBreadcrumb("Contact", "../")}
          <section class="detail-hero">
            <p class="kicker">Contact</p>
            <h1>Contact us</h1>
            <p>Send corrections, source suggestions, advertising questions, or rights concerns.</p>
          </section>
          <article class="detail-main">
            <h2>Email</h2>
            <p>
              <a class="text-link" href="mailto:${escapeHtml(site.contactEmail)}">${escapeHtml(site.contactEmail)}</a>
            </p>
            <h2>Corrections</h2>
            <p>
              Music credits and tournament context can change as official releases are updated.
              Please include a source link when submitting a correction.
            </p>
          </article>
        </main>
      `,
    })
  );

  writePage(
    ["privacy"],
    layout({
      title: "Privacy Policy",
      description: `${site.name} privacy policy.`,
      depth: 1,
      path: "/privacy/",
      schema: simplePageSchema("Privacy Policy", `${site.name} privacy policy.`, "/privacy/"),
      body: `
        <main class="article-page utility-page">
          ${simpleBreadcrumb("Privacy", "../")}
          <section class="detail-hero">
            <p class="kicker">Privacy</p>
            <h1>Privacy Policy</h1>
            <p>This policy explains the basic analytics, advertising, and contact-data practices for this static website.</p>
          </section>
          <article class="detail-main">
            <h2>Analytics</h2>
            <p>
              If Google Analytics is enabled, this site may collect aggregate usage data such as
              page views, referring pages, approximate geography, browser, and device information.
            </p>
            <h2>Advertising</h2>
            <p>
              If Google AdSense or another advertising partner is enabled, advertising providers may
              use cookies or similar technologies to measure ads and personalize or limit ad delivery
              according to their own policies.
            </p>
            <h2>Contact</h2>
            <p>
              If you email us, we use your message and email address only to respond to your request.
            </p>
            <h2>Content and rights</h2>
            <p>
              This site links to external music and source pages instead of hosting copyrighted audio
              or reproducing lyrics. Contact us if a correction or rights review is needed.
            </p>
            <h2>Contact</h2>
            <p>
              Questions can be sent to
              <a class="text-link" href="mailto:${escapeHtml(site.contactEmail)}">${escapeHtml(site.contactEmail)}</a>.
            </p>
            <p class="policy-date">Last updated: June 29, 2026.</p>
          </article>
        </main>
      `,
    })
  );
}

function layout({ title, description, depth, path: pagePath, type = "website", schema, body }) {
  const prefix = "../".repeat(depth);
  const canonicalUrl = `${site.url}${pagePath}`;
  const imageUrl = `${site.url}/assets/hero-world-cup-music.png`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} | ${site.name}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:site_name" content="${escapeHtml(site.name)}" />
    <meta property="og:type" content="${escapeHtml(type)}" />
    <meta property="og:title" content="${escapeHtml(title)} | ${escapeHtml(site.name)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)} | ${escapeHtml(site.name)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    ${headIntegrations()}
    <link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${prefix}styles.css" />
    ${schema ? `<script type="application/ld+json">${escapeJsonLd(schema)}</script>` : ""}
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="${prefix}index.html" aria-label="${site.name} home">
        <span class="brand-mark">♪</span>
        <span>${site.name}</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="${prefix}index.html#trending">Trending</a>
        <a href="${prefix}index.html#library">Library</a>
        <a href="${prefix}timeline/">Timeline</a>
        <a href="${prefix}glossary/">Glossary</a>
        <a href="${prefix}about/">About</a>
      </nav>
    </header>
    ${body}
    <footer class="site-footer">
      <p>${site.name} publishes original summaries and links to official or reputable music sources.</p>
      <div class="footer-links">
        <a href="${prefix}timeline/">Timeline</a>
        <a href="${prefix}glossary/">Glossary</a>
        <a href="${prefix}about/">About</a>
        <a href="${prefix}contact/">Contact</a>
        <a href="${prefix}privacy/">Privacy</a>
        <a href="${prefix}index.html">Home</a>
      </div>
    </footer>
  </body>
</html>
`;
}

function breadcrumb(label) {
  return `<nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="../../index.html">Home</a>
    <span>/</span>
    <a href="../../index.html#library">${escapeHtml(label)}</a>
  </nav>`;
}

function simpleBreadcrumb(label, homeHref) {
  return `<nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="${homeHref}index.html">Home</a>
    <span>/</span>
    <span>${escapeHtml(label)}</span>
  </nav>`;
}

function headIntegrations() {
  const tags = [];
  if (site.searchConsoleVerification) {
    tags.push(
      `<meta name="google-site-verification" content="${escapeHtml(site.searchConsoleVerification)}" />`
    );
  }
  if (site.googleAnalyticsId) {
    tags.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(site.googleAnalyticsId)}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${escapeJs(site.googleAnalyticsId)}');
    </script>`);
  }
  if (site.adsenseClientId) {
    tags.push(
      `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(site.adsenseClientId)}" crossorigin="anonymous"></script>`
    );
  }
  return tags.join("\n    ");
}

function articleSchema(song) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${song.title} World Cup Song: Year, Artist and Context`,
    description: song.summary,
    mainEntityOfPage: `${site.url}/songs/${song.slug}/`,
    dateModified: song.lastChecked,
    author: {
      "@type": "Organization",
      name: site.name,
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
    about: [
      song.title,
      song.artist,
      song.tournament,
      song.country,
      song.status,
    ],
    citation: song.sourceUrl,
    inLanguage: "en",
  };
}

function collectionSchema({ title, description, path: pagePath, items }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: `${site.url}${pagePath}`,
    isPartOf: {
      "@type": "WebSite",
      name: site.name,
      url: site.url,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((song, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: song.title,
        url: `${site.url}/songs/${song.slug}/`,
      })),
    },
    inLanguage: "en",
  };
}

function simplePageSchema(title, description, pagePath) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `${site.url}${pagePath}`,
    isPartOf: {
      "@type": "WebSite",
      name: site.name,
      url: site.url,
    },
    inLanguage: "en",
  };
}

function faqPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: "World Cup Music Glossary",
    description:
      "Plain-English definitions for official song, anthem, fan anthem, chant, and soundtrack terms in World Cup music.",
    url: `${site.url}/glossary/`,
    mainEntity: glossaryFaqs().map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    inLanguage: "en",
  };
}

function glossaryEntries() {
  return [
    {
      term: "Official song",
      label: "Organizer label",
      text: "A song presented by FIFA or tournament organizers as an official tournament song. It is usually the safest label to use only when the source clearly says official song.",
      link: "songs/waka-waka/",
      linkText: "Example: Waka Waka",
    },
    {
      term: "Official anthem",
      label: "Organizer label",
      text: "An anthem can be part of the official music program, but it is not always the same thing as the main official song. The exact label should follow the source.",
      link: "songs/dna/",
      linkText: "Example: DNA",
    },
    {
      term: "Soundtrack single",
      label: "Music program",
      text: "A track released as part of a broader tournament album or music program. Useful pages explain where it sits in the album instead of calling every track the song.",
      link: "years/2026/",
      linkText: "Browse 2026 tracks",
    },
    {
      term: "Fan anthem",
      label: "Supporter culture",
      text: "A song supporters adopt and repeat around a team, player, or tournament moment. It may be culturally huge while still being unofficial.",
      link: "songs/muchachos-argentina/",
      linkText: "Example: Muchachos",
    },
    {
      term: "Chant",
      label: "Stadium use",
      text: "A short crowd vocal pattern, often adapted from an existing song. A chant page should explain context and origin without reproducing lyrics.",
      link: "countries/argentina/",
      linkText: "Browse fan songs",
    },
    {
      term: "Ceremony track",
      label: "Event moment",
      text: "Music tied to an opening ceremony, live performance, or broadcast moment. It can drive search demand even when it is not the headline tournament song.",
      link: "songs/dreamers/",
      linkText: "Example: Dreamers",
    },
  ];
}

function glossaryFaqs() {
  return [
    {
      question: "Is a fan anthem an official World Cup song?",
      answer:
        "Usually no. A fan anthem is a supporter-adopted song unless FIFA, a federation, or another official source explicitly labels it official.",
    },
    {
      question: "Why does one tournament have several songs?",
      answer:
        "Modern tournaments can have a main song, an anthem, ceremony music, and album tracks. A useful guide separates those labels instead of treating every release as the same thing.",
    },
    {
      question: "Can this site show lyrics or host songs?",
      answer:
        "No. The site uses original summaries and links to official or reputable listening sources. It does not reproduce lyrics, host audio, or upload copied video.",
    },
    {
      question: "What should I check before calling a song official?",
      answer:
        "Check the source label first. If FIFA or the organizer says official song, anthem, album track, or soundtrack single, use that exact wording.",
    },
  ];
}

function glossaryCard(entry) {
  return `<article class="definition-card">
    <span>${escapeHtml(entry.label)}</span>
    <h2>${escapeHtml(entry.term)}</h2>
    <p>${escapeHtml(entry.text)}</p>
    <a class="text-link" href="../${entry.link}">${escapeHtml(entry.linkText)}</a>
  </article>`;
}

function faqItem(item) {
  return `<article class="faq-item">
    <h3>${escapeHtml(item.question)}</h3>
    <p>${escapeHtml(item.answer)}</p>
  </article>`;
}

function statList(song) {
  const stats = [
    ["Artist", song.artist],
    ["Year", song.year],
    ["Tournament", song.tournament],
    ["Country", song.country],
    ["Language", song.language],
    ["Type", song.status],
    ["Checked", song.lastChecked],
  ];
  return `<dl class="stat-list">
    ${stats
      .map(
        ([key, value]) => `<div>
          <dt>${escapeHtml(key)}</dt>
          <dd>${escapeHtml(value)}</dd>
        </div>`
      )
      .join("")}
  </dl>`;
}

function watchSection(song) {
  const primaryUrl = song.watchUrl || song.sourceUrl;
  const primaryLabel = song.watchLabel || song.sourceLabel || "Open source";
  const actions = [{ label: primaryLabel, url: primaryUrl, style: "primary" }];
  if (song.sourceUrl !== primaryUrl) {
    actions.push({ label: song.sourceLabel, url: song.sourceUrl, style: "secondary" });
  }
  const embed = song.youtubeId
    ? `<div class="video-frame">
        <iframe
          src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(song.youtubeId)}"
          title="${escapeHtml(song.title)} official video"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>`
    : `<div class="watch-placeholder">
        <strong>${song.watchUrl ? "Watch on the official platform" : "Official embed not confirmed yet"}</strong>
        <p>${
          song.watchUrl
            ? "This official video may only play on its original platform, so we link out instead of showing a blocked player."
            : "Use the source link below for verified information. We do not embed unofficial uploads."
        }</p>
      </div>`;

  return `<section class="watch-section" aria-labelledby="watch-title-${escapeHtml(song.slug)}">
    <div class="watch-heading">
      <p class="kicker">Watch / Listen</p>
      <h2 id="watch-title-${escapeHtml(song.slug)}">Official ways to follow this song</h2>
    </div>
    ${embed}
    <div class="watch-actions">
      ${actions
        .map(
          (action) =>
            `<a class="button ${action.style}" href="${action.url}" target="_blank" rel="noreferrer">${escapeHtml(action.label)}</a>`
        )
        .join("")}
    </div>
    <p class="rights-note">No lyrics, audio files, or copied video are hosted on this site.</p>
  </section>`;
}

function songContextSection(song) {
  const hasStory = Boolean(song.story);
  const hasFacts = Array.isArray(song.facts) && song.facts.length > 0;
  const hasPeople = Array.isArray(song.people) && song.people.length > 0;
  if (!hasStory && !hasFacts && !hasPeople) return "";

  return `<section class="context-section" aria-labelledby="context-title-${escapeHtml(song.slug)}">
    <p class="kicker">Background notes</p>
    <h2 id="context-title-${escapeHtml(song.slug)}">Story behind the song</h2>
    ${hasStory ? `<p>${escapeHtml(song.story)}</p>` : ""}
    ${
      hasFacts
        ? `<ul class="context-facts">
            ${song.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("")}
          </ul>`
        : ""
    }
    ${
      hasPeople
        ? `<div class="people-links" aria-label="People and sources">
            ${song.people.map((person) => personLink(person)).join("")}
          </div>`
        : ""
    }
  </section>`;
}

function personLink(person) {
  return `<a href="${escapeHtml(person.url)}" target="_blank" rel="noreferrer">
    <span>${escapeHtml(person.role)}</span>
    <strong>${escapeHtml(person.name)}</strong>
  </a>`;
}

function relatedList(title, items, prefix) {
  if (!items.length) return "";
  return `<section class="related-section">
    <h2>${escapeHtml(title)}</h2>
    <div class="cards-grid">
      ${items.map((song) => songCard(song, prefix)).join("")}
    </div>
  </section>`;
}

function collectionGrid(items, prefix) {
  return `<section class="related-section">
    <div class="cards-grid">
      ${items.map((song) => songCard(song, prefix)).join("")}
    </div>
  </section>`;
}

function songCard(song, prefix) {
  return `<article class="song-card">
    <div class="song-meta">
      <span class="pill ${song.type}">${escapeHtml(song.status)}</span>
      <span class="pill">${escapeHtml(song.year)}</span>
      <span class="pill">${escapeHtml(song.country)}</span>
    </div>
    <h3>${escapeHtml(song.title)}</h3>
    <p class="artist">${escapeHtml(song.artist)}</p>
    <p class="note">${escapeHtml(song.summary)}</p>
    <a href="${prefix}songs/${song.slug}/">Open detail page</a>
  </article>`;
}

function sortedSongs(items) {
  return Array.from(items).sort((left, right) => {
    const typeRank = { official: 0, classic: 1, fan: 2 };
    const typeDelta = (typeRank[left.type] ?? 9) - (typeRank[right.type] ?? 9);
    if (typeDelta !== 0) return typeDelta;
    return left.title.localeCompare(right.title);
  });
}

function adBox() {
  return `<aside class="ad-slot detail-ad" aria-label="Reserved advertising space">
    <span>Ad space</span>
    <strong>Reserved for review</strong>
    <p>AdSense review is in progress. This space will stay quiet until ads are approved.</p>
  </aside>`;
}

function writePage(segments, html) {
  const dir = path.join(root, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

function groupBy(items, getKey) {
  const map = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJs(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

function escapeJsonLd(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function normalizeSiteUrl(url) {
  return String(url).trim().replace(/\/+$/, "");
}

function latestDate(values) {
  return values.filter(Boolean).sort().at(-1) || new Date().toISOString().slice(0, 10);
}

function indentBlock(value, spaces) {
  if (!value) return " ".repeat(spaces) + "<!-- Fill site.config.json to enable Google integrations. -->";
  return value
    .split("\n")
    .map((line) => " ".repeat(spaces) + line)
    .join("\n");
}
