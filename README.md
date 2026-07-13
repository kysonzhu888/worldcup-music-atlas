# World Cup Music Atlas

A static guide to World Cup songs, official anthems, soundtrack tracks, and fan music culture.

## Local Build

```bash
npm run build
npm run check
npm test
```

The build regenerates song, artist, country, year, timeline, glossary, about, contact, privacy, sitemap, robots, and ads files from the versioned data files and `site.config.json`.

## Content Storage

Editorial content does not need a separate database at the current scale:

- `data/songs.json` is the canonical song collection.
- `data/artists.json` contains researched artist profiles with original context, sources, and `contentUpdatedAt` / `lastCheckedAt` dates.
- `data/media.json` stores reusable-media metadata and attribution.
- Cloudflare D1 remains limited to visitor comments through `functions/api/comments.js` and `schema.sql`.

Keeping editorial records in Git makes every weekly change reviewable, reversible, and deployable with the static site. Reconsider a content database only when multiple editors need concurrent writes, an admin UI becomes necessary, or the collection grows beyond a practical reviewed-file workflow.

## Weekly Discovery Workflow

GitHub Actions runs the discovery pass every Monday at 09:17 in
`Asia/Shanghai`. It can also be started manually from the Actions tab. To run
the same pass locally:

```bash
npm run update:weekly
```

The command reads approved sources from `data/update-sources.json` and writes local review artifacts to `.updates/`:

- `.updates/weekly-candidates.json` contains structured candidate records and provenance.
- `.updates/weekly-report.md` is the human review list.

The scheduled run uploads both files as a 30-day Actions artifact and copies
the Markdown report into the run summary. It has read-only repository
permission and does not commit, deploy, or edit canonical content.

The discovery script never edits `data/songs.json` and never republishes third-party descriptions. For each candidate:

1. Confirm its World Cup relationship with a FIFA, organiser, label, artist, or similarly authoritative source.
2. Confirm the title and artist credit on an official or licensed music platform.
3. Write original context and add at least two citations.
4. Add or update `contentUpdatedAt`; use `lastChecked` / `lastCheckedAt` for the source-review date.
5. Run `npm run build`, `npm run check`, and `npm test` before deployment.

Research-pending artist credit pages are generated for navigation but carry `noindex, follow` and stay out of the sitemap. A profile becomes indexable only after it has original World Cup context, an update date, and at least two valid sources.

## Deploy

The site is static and can be deployed from the repository root, or from a generated deployment directory if your host prefers one.
