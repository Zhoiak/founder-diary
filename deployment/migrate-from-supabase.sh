#!/bin/bash
# Migration Script from Supabase to Self-hosted PostgreSQL

set -e

# CONFIGURATION
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-role-key"
NEW_DB_URL="postgresql://founder_user:password@localhost:5432/founder_diary"

echo "🚀 Starting migration from Supabase to self-hosted PostgreSQL..."

# STEP 1: EXPORT SCHEMA FROM SUPABASE
echo "📊 Exporting schema from Supabase..."
pg_dump "$SUPABASE_DB_URL" --schema-only --no-owner --no-privileges > schema.sql

# STEP 2: EXPORT DATA FROM SUPABASE
echo "📦 Exporting data from Supabase..."
pg_dump "$SUPABASE_DB_URL" --data-only --no-owner --no-privileges > data.sql

# STEP 3: CLEAN SCHEMA FOR SELF-HOSTED
echo "🧹 Cleaning schema for self-hosted setup..."
cat > clean_schema.sql << 'EOF'
-- Remove Supabase-specific extensions and functions
DROP SCHEMA IF EXISTS auth CASCADE;
DROP SCHEMA IF EXISTS storage CASCADE;
DROP SCHEMA IF EXISTS realtime CASCADE;
DROP SCHEMA IF EXISTS supabase_functions CASCADE;

-- Create auth schema for NextAuth.js
CREATE SCHEMA IF NOT EXISTS auth;

-- Create NextAuth.js tables
CREATE TABLE IF NOT EXISTS auth.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE,
  email_verified TIMESTAMP WITH TIME ZONE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON auth.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON auth.sessions(session_token);
EOF

# STEP 4: APPLY TO NEW DATABASE
echo "🔧 Setting up new database..."
psql "$NEW_DB_URL" -f clean_schema.sql
psql "$NEW_DB_URL" -f schema.sql
psql "$NEW_DB_URL" -f data.sql

# STEP 5: UPDATE USER REFERENCES
echo "🔄 Updating user references..."
psql "$NEW_DB_URL" << 'EOF'
-- Migrate user data from Supabase auth.users to new auth.users
INSERT INTO auth.users (id, email, created_at)
SELECT id, email, created_at 
FROM public.user_numbers un
WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = un.user_id);

-- Update any remaining references
UPDATE public.user_numbers 
SET user_id = (SELECT id FROM auth.users WHERE email = 'your-email@domain.com')
WHERE user_id IS NULL;
EOF

echo "✅ Migration completed successfully!"
echo "🔗 New database URL: $NEW_DB_URL"
echo "📝 Next steps:"
echo "   1. Update environment variables"
echo "   2. Test application connectivity"
echo "   3. Deploy application to Coolify"
