-- FOUNDER DIARY - SCHEMA PART 1: CORE TABLES
-- PostgreSQL 16+ compatible
-- Date: 2025-10-01

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Users table (replacing Supabase auth.users)
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  encrypted_password text,
  email_confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb DEFAULT '{}',
  raw_user_meta_data jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users(email);

-- Helper function for current user
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
BEGIN
  RETURN current_setting('app.current_user_id', TRUE)::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE,
  private_vault boolean DEFAULT false,
  feature_flags jsonb DEFAULT '{"diary_personal": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project Members
CREATE TABLE IF NOT EXISTS project_members (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('owner','admin','editor','viewer')) DEFAULT 'owner',
  PRIMARY KEY (project_id, user_id)
);

-- Daily Logs
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  title text,
  content_md text,
  tags text[] DEFAULT '{}',
  mood int CHECK (mood BETWEEN 1 AND 5),
  time_spent_minutes int DEFAULT 0,
  ai_summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS daily_logs_project_date ON daily_logs(project_id, date DESC);

CREATE TRIGGER t_daily_logs_updated BEFORE UPDATE ON daily_logs 
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
