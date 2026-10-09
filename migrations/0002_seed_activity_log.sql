-- Migration number: 0002 	 2025-09-18T00:00:00.000Z
--
-- Production seed data. The Preview database gets its own rows from
-- `preview-migrations/`.
INSERT INTO activity_log (text)
VALUES
    ('Deployed the production Worker'),
    ('Provisioned the D1 database'),
    ('Wired up Workers Builds')
;
