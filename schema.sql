CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  page_key TEXT NOT NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_page_created
ON comments (page_key, created_at DESC);

CREATE TABLE IF NOT EXISTS conversion_daily_counts (
  event_date TEXT NOT NULL,
  event_name TEXT NOT NULL,
  source_path TEXT NOT NULL,
  destination_type TEXT NOT NULL DEFAULT '',
  target_key TEXT NOT NULL DEFAULT '',
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  utm_content TEXT NOT NULL DEFAULT '',
  event_count INTEGER NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (
    event_date,
    event_name,
    source_path,
    destination_type,
    target_key,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content
  )
);
