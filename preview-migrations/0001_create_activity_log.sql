-- Preview database only. Applied with:
--   npx cf d1 migrations apply <preview-db-id> --dir preview-migrations
-- Production applies `migrations/` and never reads this folder.
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
