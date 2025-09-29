-- Initialization script for PostgreSQL
-- This will run when the database is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic tables (we'll migrate from Supabase later)
-- For now, just ensure the database is ready

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE founder_diary TO founder_user;
GRANT ALL ON SCHEMA public TO founder_user;

-- Log initialization
INSERT INTO pg_stat_statements_info (dealloc) VALUES (0) ON CONFLICT DO NOTHING;
