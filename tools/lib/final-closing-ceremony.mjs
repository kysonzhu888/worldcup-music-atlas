const FIFA_CLOSING_CEREMONY_URL =
  "https://inside.fifa.com/organisation/media-releases/world-cup-2026-closing-ceremony-celebrate-historic-tournament-ahead-final";

export const finalClosingCeremony = Object.freeze({
  path: "/world-cup-2026-closing-ceremony/",
  title:
    "World Cup 2026 Closing Ceremony: Performers, Time and Halftime Difference",
  description:
    "A source-checked guide to the World Cup 2026 closing ceremony performers, July 19 start time, national anthem, and difference from the halftime show.",
  publishedAt: "2026-07-15",
  updatedAt: "2026-07-15",
  startDate: "2026-07-19T13:30:00-04:00",
  gatesOpen: "2026-07-19T11:00:00-04:00",
  minutesBeforeKickoff: 90,
  venue: "New York New Jersey Stadium",
  performers: [
    "Laura Pausini",
    "Nicole Scherzinger",
    "Robbie Williams",
    "IShowSpeed",
  ],
  specialAppearance: "Tom Cruise",
  nationalAnthemPerformer: "Jennifer Hudson",
  sources: [
    {
      label: "FIFA: World Cup 2026 closing ceremony announcement",
      url: FIFA_CLOSING_CEREMONY_URL,
      note: "Confirms the July 19 schedule, venue, named performers, special appearance, national anthem performer, and that more guests are still to be announced.",
    },
  ],
});

const frequentlyAskedQuestions = [
  {
    question: "What time is the 2026 World Cup closing ceremony?",
    answer:
      "FIFA says the closing ceremony starts at 13:30 local time on Sunday, July 19, 2026, at New York New Jersey Stadium. That is 90 minutes before the final kicks off. Stadium gates open at 11:00 local time.",
  },
  {
    question: "Who is performing at the World Cup closing ceremony?",
    answer:
      "FIFA confirms performances from Laura Pausini, Nicole Scherzinger, Robbie Williams, and IShowSpeed, plus a special appearance by Tom Cruise. FIFA also says more artists and special guests will be announced.",
  },
  {
    question: "Is the closing ceremony the same as the Final Halftime Show?",
    answer:
      "No. The closing ceremony is a pre-match event scheduled for 13:30 local time, 90 minutes before kick-off. The separately announced Final Halftime Show takes place during the match interval.",
  },
  {
    question: "Is Jennifer Hudson performing in the closing ceremony?",
    answer:
      "FIFA says Jennifer Hudson will perform the United States national anthem ahead of the final. Its announcement describes that anthem performance separately from the closing ceremony lineup, so this guide keeps the role separate too.",
  },
  {
    question: "Will IShowSpeed perform Champion at the closing ceremony?",
    answer:
      "IShowSpeed is confirmed as a closing ceremony performer, and Champion is an official FIFA World Cup 2026 album track. FIFA's announcement does not publish a song-by-song running order, so a Champion performance is not presented here as confirmed.",
  },
];

export function renderFinalClosingCeremonyBody() {
  return `<main class="article-page" data-page="world-cup-2026-closing-ceremony">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="../index.html">Home</a>
      <span>/</span>
      <a href="../years/2026/">2026 music</a>
      <span>/</span>
      <span>Closing Ceremony</span>
    </nav>

    <section class="detail-hero">
      <p class="kicker">Updated July 15 · FIFA announcement checked</p>
      <h1>2026 World Cup Closing Ceremony</h1>
      <p>The pre-match ceremony starts at 13:30 local time on July 19, 90 minutes before the final. This guide keeps the confirmed performers, special appearance, national anthem, and separate halftime show in their correct roles.</p>
      <div class="hero-actions">
        <a class="button primary" href="#confirmed-lineup">See the confirmed lineup</a>
        <a class="button secondary" href="../world-cup-2026-final-halftime-show/">Compare the halftime show</a>
      </div>
    </section>

    <section class="detail-grid">
      <article class="detail-main">
        <section class="explainer-block" aria-labelledby="quick-answer-title">
          <h2 id="quick-answer-title">Quick answer</h2>
          <p>The closing ceremony is a pre-match event at New York New Jersey Stadium on Sunday, July 19, 2026. It begins at 13:30 local time, 90 minutes before kick-off. Gates open at 11:00. FIFA names four performers, one special appearance, and a separate United States national anthem performance.</p>
          <ul class="context-facts">
            <li><strong>Closing ceremony performers:</strong> ${escapeHtml(naturalList(finalClosingCeremony.performers))}.</li>
            <li><strong>Special appearance:</strong> ${escapeHtml(finalClosingCeremony.specialAppearance)}.</li>
            <li><strong>United States national anthem:</strong> ${escapeHtml(finalClosingCeremony.nationalAnthemPerformer)}.</li>
            <li><strong>Schedule:</strong> 13:30 local time; gates open at 11:00.</li>
          </ul>
        </section>

        <section class="related-section" id="confirmed-lineup" aria-labelledby="confirmed-lineup-title">
          <div class="section-heading compact">
            <p class="kicker">Confirmed roles</p>
            <h2 id="confirmed-lineup-title">Who FIFA has announced</h2>
            <p>These labels follow FIFA's July 14 announcement. They do not imply a performance order or an unannounced song choice.</p>
          </div>
          <div class="cards-grid">
            ${roleCard("Closing ceremony performers", finalClosingCeremony.performers)}
            ${roleCard("Special appearance", [finalClosingCeremony.specialAppearance])}
            ${roleCard("National anthem ahead of the final", [finalClosingCeremony.nationalAnthemPerformer])}
          </div>
        </section>

        <section class="explainer-block" aria-labelledby="halftime-difference-title">
          <h2 id="halftime-difference-title">Closing ceremony versus halftime show</h2>
          <p>The closing ceremony is a pre-match event, not the Final Halftime Show. It starts 90 minutes before kick-off and celebrates the tournament before the final begins. The <a class="text-link" href="../world-cup-2026-final-halftime-show/">Final Halftime Show</a> is a separate 11-minute broadcast during the match interval with a separately announced lineup.</p>
          <p>That timing distinction matters because search results and social posts can combine the two rosters. A performer confirmed for one event should not automatically be listed for the other.</p>
        </section>

        <section class="explainer-block" aria-labelledby="music-connection-title">
          <h2 id="music-connection-title">The IShowSpeed and Champion connection</h2>
          <p>IShowSpeed is confirmed for the closing ceremony. His track <a class="text-link" href="../songs/champion-ishowspeed/">Champion</a> is also part of the official FIFA World Cup 2026 album, which makes it a relevant route through the music atlas.</p>
          <p>Those are two confirmed facts, but they do not create a confirmed set list. FIFA's closing ceremony announcement does not say that IShowSpeed will perform Champion.</p>
        </section>

        <section class="explainer-block" aria-labelledby="not-confirmed-title">
          <h2 id="not-confirmed-title">What has not been announced</h2>
          <p>A complete song-by-song running order has not been published. FIFA also says more artists and special guests will be announced over the coming days, so the July 14 lineup is confirmed but may not be final.</p>
          <p>This page will date any update and keep performer announcements, song predictions, and a confirmed set list separate.</p>
        </section>

        <section class="reference-section" aria-labelledby="official-source-title">
          <div class="reference-heading">
            <p class="kicker">Primary source</p>
            <h2 id="official-source-title">Official source used</h2>
            <p>The schedule and role labels come from FIFA's July 14 media release.</p>
          </div>
          <div class="reference-grid">
            ${finalClosingCeremony.sources.map(referenceCard).join("")}
          </div>
        </section>

        <section class="faq-section" aria-labelledby="closing-faq-title">
          <p class="kicker">Fast answers</p>
          <h2 id="closing-faq-title">2026 World Cup Closing Ceremony FAQ</h2>
          ${frequentlyAskedQuestions.map(faqItem).join("")}
        </section>
      </article>

      <aside class="detail-aside" aria-label="Closing ceremony facts and related guides">
        <section class="explainer-block">
          <p class="kicker">Event card</p>
          <h2>At a glance</h2>
          <ul class="context-facts">
            <li><strong>Date:</strong> Sunday, July 19, 2026</li>
            <li><strong>Start:</strong> 13:30 local time</li>
            <li><strong>Gates:</strong> 11:00 local time</li>
            <li><strong>Venue:</strong> ${escapeHtml(finalClosingCeremony.venue)}</li>
            <li><strong>Source checked:</strong> July 15, 2026</li>
          </ul>
        </section>
        <aside class="ad-slot detail-ad" aria-label="Related World Cup music guides">
          <span>Keep exploring</span>
          <strong>Follow final-week music</strong>
          <p>Compare the pre-match ceremony, halftime lineup, and 2026 soundtrack without mixing their labels.</p>
          <div class="ad-slot-links">
            <a class="text-link" href="../world-cup-2026-final-halftime-show/">Final Halftime Show</a>
            <a class="text-link" href="../songs/champion-ishowspeed/">Champion</a>
            <a class="text-link" href="../artists/ishowspeed/">IShowSpeed</a>
            <a class="text-link" href="../years/2026/">2026 collection</a>
          </div>
        </aside>
      </aside>
    </section>
  </main>`;
}

export function finalClosingCeremonySchema(siteUrl) {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
  const pageUrl = `${normalizedSiteUrl}${finalClosingCeremony.path}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: finalClosingCeremony.title,
      description: finalClosingCeremony.description,
      mainEntityOfPage: pageUrl,
      datePublished: finalClosingCeremony.publishedAt,
      dateModified: finalClosingCeremony.updatedAt,
      author: { "@type": "Organization", name: "World Cup Music Atlas" },
      publisher: {
        "@type": "Organization",
        name: "World Cup Music Atlas",
        url: normalizedSiteUrl,
      },
      citation: finalClosingCeremony.sources.map((source) => source.url),
      about: [
        ...finalClosingCeremony.performers,
        finalClosingCeremony.specialAppearance,
        finalClosingCeremony.nationalAnthemPerformer,
      ],
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: "FIFA World Cup 2026 Closing Ceremony",
      description: finalClosingCeremony.description,
      startDate: finalClosingCeremony.startDate,
      doorTime: finalClosingCeremony.gatesOpen,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: finalClosingCeremony.venue,
        address: {
          "@type": "PostalAddress",
          addressLocality: "East Rutherford",
          addressRegion: "NJ",
          addressCountry: "US",
        },
      },
      performer: finalClosingCeremony.performers.map((name) => ({
        "@type": "Person",
        name,
      })),
      organizer: {
        "@type": "Organization",
        name: "FIFA",
        url: "https://www.fifa.com/",
      },
      url: pageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: "2026 World Cup Closing Ceremony FAQ",
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

function roleCard(label, names) {
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
