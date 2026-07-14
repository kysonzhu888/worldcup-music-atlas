const FIFA_LINEUP_URL =
  "https://inside.fifa.com/organisation/media-releases/justin-bieber-world-cup-2026-final-halftime-show-madonna-shakira-bts";
const FIFA_OFFICIAL_SONG_URL =
  "https://inside.fifa.com/organisation/media-releases/shakira-burna-boy-dai-dai-official-world-cup-2026";

export const finalHalftimeShow = Object.freeze({
  path: "/world-cup-2026-final-halftime-show/",
  title: "World Cup 2026 Final Halftime Show: Performers, Songs and Date",
  description:
    "A source-checked guide to the 2026 World Cup Final Halftime Show lineup, date, venue, 11-minute format, Dai Dai connection, and open set-list questions.",
  publishedAt: "2026-07-14",
  updatedAt: "2026-07-14",
  eventDate: "2026-07-19",
  venue: "New York New Jersey Stadium",
  durationMinutes: 11,
  coHeadliners: ["Justin Bieber", "Madonna", "Shakira", "BTS"],
  additionalPerformers: [
    "Burna Boy",
    "Gustavo Dudamel",
    "PS22 Chorus featuring Coldplay",
  ],
  sources: [
    {
      label: "FIFA: updated Final Halftime Show lineup",
      url: FIFA_LINEUP_URL,
      note: "Confirms the July 19 event, venue, co-headliners, additional performers, and 11-minute broadcast.",
    },
    {
      label: "FIFA: Dai Dai official-song release",
      url: FIFA_OFFICIAL_SONG_URL,
      note: "Confirms Dai Dai by Shakira and Burna Boy as the Official FIFA World Cup 2026 Song.",
    },
  ],
});

const allPerformers = [
  ...finalHalftimeShow.coHeadliners,
  ...finalHalftimeShow.additionalPerformers,
];

const frequentlyAskedQuestions = [
  {
    question: "Who is performing at the 2026 World Cup Final Halftime Show?",
    answer:
      "FIFA names Justin Bieber, Madonna, Shakira, and BTS as co-headliners. Burna Boy, Gustavo Dudamel, and PS22 Chorus featuring Coldplay are also confirmed to perform.",
  },
  {
    question: "When and where is the Final Halftime Show?",
    answer:
      "It is scheduled for Sunday, July 19, 2026, during the World Cup final at New York New Jersey Stadium. The exact on-air moment depends on when the match reaches halftime.",
  },
  {
    question: "How long is the World Cup Final Halftime Show?",
    answer:
      "FIFA describes it as an 11-minute broadcast. That is the confirmed show length, not a prediction based on a normal football halftime interval.",
  },
  {
    question: "Will Shakira and Burna Boy perform Dai Dai?",
    answer:
      "Dai Dai is the Official FIFA World Cup 2026 Song and connects Shakira and Burna Boy directly to the tournament. FIFA's July 8 lineup announcement does not publish a complete song-by-song running order, so this guide does not present an unannounced set list as confirmed.",
  },
  {
    question: "Has the complete World Cup halftime set list been announced?",
    answer:
      "No complete song order appears in FIFA's July 8 lineup release. Performer announcements, fan predictions, and a confirmed set list are different things; this page will update when an official running order is published.",
  },
];

export function renderFinalHalftimeShowBody() {
  return `<main class="article-page" data-page="world-cup-2026-final-halftime-show">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="../index.html">Home</a>
      <span>/</span>
      <a href="../years/2026/">2026 music</a>
      <span>/</span>
      <span>Final Halftime Show</span>
    </nav>

    <section class="detail-hero">
      <p class="kicker">Updated July 14 · official lineup checked</p>
      <h1>2026 World Cup Final Halftime Show</h1>
      <p>Justin Bieber, Madonna, Shakira, and BTS will co-headline the first World Cup Final Halftime Show. This guide separates FIFA's confirmed facts from the song choices and running order that have not been announced.</p>
      <div class="hero-actions">
        <a class="button primary" href="#confirmed-lineup">See the confirmed lineup</a>
        <a class="button secondary" href="../songs/dai-dai/">Open the Dai Dai guide</a>
      </div>
    </section>

    <section class="detail-grid">
      <article class="detail-main">
        <section class="explainer-block" aria-labelledby="quick-answer-title">
          <h2 id="quick-answer-title">Quick answer</h2>
          <p>The show is scheduled for Sunday, July 19, 2026, at New York New Jersey Stadium. FIFA says the broadcast will run for 11 minutes. The July 8 update confirms seven named headline or supporting performer credits, but it does not publish the full song order.</p>
          <ul class="context-facts">
            <li><strong>Co-headliners:</strong> ${escapeHtml(naturalList(finalHalftimeShow.coHeadliners))}.</li>
            <li><strong>Also performing:</strong> ${escapeHtml(naturalList(finalHalftimeShow.additionalPerformers))}.</li>
            <li><strong>Format:</strong> the first FIFA World Cup Final Halftime Show, presented as an 11-minute broadcast.</li>
            <li><strong>Venue:</strong> ${escapeHtml(finalHalftimeShow.venue)}.</li>
          </ul>
        </section>

        <section class="related-section" id="confirmed-lineup" aria-labelledby="confirmed-lineup-title">
          <div class="section-heading compact">
            <p class="kicker">Official roster</p>
            <h2 id="confirmed-lineup-title">Confirmed lineup</h2>
            <p>The role labels below follow FIFA's July 8 announcement. They do not imply a performance order.</p>
          </div>
          <div class="cards-grid">
            ${performerCard("Co-headliners", finalHalftimeShow.coHeadliners)}
            ${performerCard("Also set to perform", finalHalftimeShow.additionalPerformers)}
          </div>
        </section>

        <section class="explainer-block" aria-labelledby="music-connection-title">
          <h2 id="music-connection-title">The confirmed music connection</h2>
          <p><a class="text-link" href="../songs/dai-dai/">Dai Dai</a> is the clearest documented bridge between the tournament soundtrack and this lineup. FIFA identifies the Shakira and Burna Boy release as the Official FIFA World Cup 2026 Song. That status is confirmed independently of what the final broadcast ultimately includes.</p>
          <p>BTS also has an earlier World Cup route in the atlas through Jung Kook's 2022 ceremony track <a class="text-link" href="../songs/dreamers/">Dreamers</a>. That history helps explain the search connection, but it is not evidence that Dreamers will appear in the 2026 set.</p>
        </section>

        <section class="explainer-block" aria-labelledby="not-confirmed-title">
          <h2 id="not-confirmed-title">What is not confirmed yet</h2>
          <p>FIFA's updated release names the performers and the 11-minute format, but a full song-by-song set list has not been published. It also does not provide an exact minute-by-minute running order. The show happens at halftime, so the real start moment depends on match progress.</p>
          <p>This page will not turn social predictions into facts. If FIFA or Global Citizen publishes a running order, broadcast guide, or post-show set list, the update will be dated and linked to the source.</p>
        </section>

        <section class="reference-section" aria-labelledby="official-sources-title">
          <div class="reference-heading">
            <p class="kicker">Primary sources</p>
            <h2 id="official-sources-title">Official sources used</h2>
            <p>Both references are FIFA releases. No fan post or entertainment roundup is used as the source of record.</p>
          </div>
          <div class="reference-grid">
            ${finalHalftimeShow.sources.map(referenceCard).join("")}
          </div>
        </section>

        <section class="faq-section" aria-labelledby="halftime-faq-title">
          <p class="kicker">Fast answers</p>
          <h2 id="halftime-faq-title">2026 Final Halftime Show FAQ</h2>
          ${frequentlyAskedQuestions.map(faqItem).join("")}
        </section>
      </article>

      <aside class="detail-aside" aria-label="Final Halftime Show facts and related guides">
        <section class="explainer-block">
          <p class="kicker">Event card</p>
          <h2>At a glance</h2>
          <ul class="context-facts">
            <li><strong>Date:</strong> Sunday, July 19, 2026</li>
            <li><strong>Venue:</strong> ${escapeHtml(finalHalftimeShow.venue)}</li>
            <li><strong>Length:</strong> ${finalHalftimeShow.durationMinutes}-minute broadcast</li>
            <li><strong>Lineup source checked:</strong> July 14, 2026</li>
          </ul>
        </section>
        <aside class="ad-slot detail-ad" aria-label="Related World Cup music guides">
          <span>Keep exploring</span>
          <strong>Follow the 2026 soundtrack</strong>
          <p>Compare the official song, anthem, album tracks, and earlier ceremony music without mixing their labels.</p>
          <div class="ad-slot-links">
            <a class="text-link" href="../years/2026/">2026 collection</a>
            <a class="text-link" href="../songs/dai-dai/">Dai Dai</a>
            <a class="text-link" href="../songs/dna/">DNA</a>
            <a class="text-link" href="../timeline/">Timeline</a>
          </div>
        </aside>
      </aside>
    </section>
  </main>`;
}

export function finalHalftimeShowSchema(siteUrl) {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
  const pageUrl = `${normalizedSiteUrl}${finalHalftimeShow.path}`;
  const performers = allPerformers.map((name) => ({
    "@type": "PerformingGroup",
    name,
  }));

  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: finalHalftimeShow.title,
      description: finalHalftimeShow.description,
      mainEntityOfPage: pageUrl,
      datePublished: finalHalftimeShow.publishedAt,
      dateModified: finalHalftimeShow.updatedAt,
      author: { "@type": "Organization", name: "World Cup Music Atlas" },
      publisher: {
        "@type": "Organization",
        name: "World Cup Music Atlas",
        url: normalizedSiteUrl,
      },
      citation: finalHalftimeShow.sources.map((source) => source.url),
      about: allPerformers,
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: "FIFA World Cup 2026 Final Halftime Show",
      description: finalHalftimeShow.description,
      startDate: finalHalftimeShow.eventDate,
      duration: `PT${finalHalftimeShow.durationMinutes}M`,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: finalHalftimeShow.venue,
        address: {
          "@type": "PostalAddress",
          addressLocality: "East Rutherford",
          addressRegion: "NJ",
          addressCountry: "US",
        },
      },
      performer: performers,
      organizer: [
        { "@type": "Organization", name: "FIFA", url: "https://www.fifa.com/" },
        { "@type": "Organization", name: "Global Citizen", url: "https://www.globalcitizen.org/" },
      ],
      url: pageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: "2026 World Cup Final Halftime Show FAQ",
      url: pageUrl,
      mainEntity: frequentlyAskedQuestions.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
      inLanguage: "en",
    },
  ];
}

function performerCard(label, names) {
  return `<article class="song-card">
    <div class="song-meta">
      <span class="pill official">Confirmed</span>
      <span class="pill">${escapeHtml(label)}</span>
    </div>
    <h3>${escapeHtml(label)}</h3>
    <p class="note">${escapeHtml(naturalList(names))}</p>
  </article>`;
}

function referenceCard(source) {
  return `<article class="reference-card reference-primary-source">
    <span>Official</span>
    <h3>${escapeHtml(source.label)}</h3>
    <p>${escapeHtml(source.note)}</p>
    <a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">Open FIFA source</a>
  </article>`;
}

function faqItem({ question, answer }) {
  return `<article class="faq-item">
    <h3>${escapeHtml(question)}</h3>
    <p>${escapeHtml(answer)}</p>
  </article>`;
}

function naturalList(values) {
  if (values.length < 2) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
