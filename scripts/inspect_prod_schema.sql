-- List columns of user-like tables
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name ILIKE 'user'
ORDER BY table_name, ordinal_position;

-- List columns of activity_log-like tables
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name ILIKE 'activity_log' OR table_name ILIKE 'activitylog'
ORDER BY table_name, ordinal_position;

-- Foreign key constraints referencing activity_log or userId
SELECT conname, conrelid::regclass AS table, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'f' AND (conrelid::regclass::text ILIKE '%activity_log%' OR pg_get_constraintdef(oid) ILIKE '%userId%');

-- Recent prisma migrations
SELECT id, migration_name, finished_at
FROM prisma_migrations
ORDER BY finished_at DESC
LIMIT 10;
