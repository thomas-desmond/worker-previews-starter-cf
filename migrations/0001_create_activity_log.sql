-- Migration number: 0001 	 2024-12-27T22:04:18.794Z
--
-- Production schema. The Preview database gets its schema from
-- `preview-migrations/` instead.
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
