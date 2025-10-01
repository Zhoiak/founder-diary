-- DIARY+ COMPLETE MIGRATION
-- Single migration with all Diary+ tables, RLS policies, and optimized indexes
-- Date: 2025-01-27

-- Add private_vault column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS private_vault boolean DEFAULT false;

-- 1) LIFE AREAS TAXONOMY
CREATE TABLE IF NOT EXISTS life_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT '🌟',
  created_at timestamptz DEFAULT now()
);

-- Optimized indexes for life_areas
CREATE UNIQUE INDEX IF NOT EXISTS life_areas_project_key ON life_areas(project_id, key);
CREATE INDEX IF NOT EXISTS life_areas_user_id ON life_areas(user_id);

-- 2) PERSONAL JOURNAL ENTRIES
CREATE TABLE IF NOT EXISTS personal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  title text,
  content_md text,
  tags text[] DEFAULT '{}',
  mood int CHECK (mood BETWEEN 1 AND 5),
  energy int CHECK (energy BETWEEN 1 AND 5),
  sleep_hours numeric CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  sentiment numeric CHECK (sentiment BETWEEN -1 AND 1),
  latitude numeric,
  longitude numeric,
  location_name text,
  photos jsonb DEFAULT '[]',
  is_private boolean DEFAULT false,
  encrypted_content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optimized indexes for personal_entries
CREATE INDEX IF NOT EXISTS personal_entries_project_date ON personal_entries(project_id, date DESC);
CREATE INDEX IF NOT EXISTS personal_entries_user_date ON personal_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS personal_entries_tags ON personal_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS personal_entries_location ON personal_entries(latitude, longitude) WHERE latitude IS NOT NULL;

-- Bridge table for entry-area relationships
CREATE TABLE IF NOT EXISTS personal_entry_areas (
  entry_id uuid REFERENCES personal_entries(id) ON DELETE CASCADE,
  area_id uuid REFERENCES life_areas(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, area_id)
);

-- 3) HABITS & ROUTINES
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  schedule text,
  target_per_week int DEFAULT 7,
  area_id uuid REFERENCES life_areas(id),
  color text DEFAULT '#10B981',
  icon text DEFAULT '✅',
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Optimized indexes for habits
CREATE INDEX IF NOT EXISTS habits_project_id ON habits(project_id) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS habits_user_id ON habits(user_id) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS habits_area_id ON habits(area_id);

CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  done boolean DEFAULT true,
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, date)
);

-- Optimized indexes for habit_logs
CREATE INDEX IF NOT EXISTS habit_logs_habit_date ON habit_logs(habit_id, date DESC);
CREATE INDEX IF NOT EXISTS habit_logs_user_date ON habit_logs(user_id, date DESC);

-- Morning/Evening Routines
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text CHECK (kind IN ('morning','evening')) NOT NULL,
  title text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Optimized indexes for routines
CREATE INDEX IF NOT EXISTS routines_project_kind ON routines(project_id, kind) WHERE active;
CREATE INDEX IF NOT EXISTS routines_user_kind ON routines(user_id, kind) WHERE active;

CREATE TABLE IF NOT EXISTS routine_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE,
  order_index int NOT NULL,
  prompt text NOT NULL,
  placeholder text,
  requires_answer boolean DEFAULT true,
  step_type text CHECK (step_type IN ('text','number','rating','boolean')) DEFAULT 'text'
);

-- Optimized indexes for routine_steps
CREATE INDEX IF NOT EXISTS routine_steps_routine_order ON routine_steps(routine_id, order_index);

CREATE TABLE IF NOT EXISTS routine_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  answers jsonb DEFAULT '{}',
  completed_at timestamptz DEFAULT now(),
  UNIQUE(routine_id, user_id, date)
);

-- Optimized indexes for routine_runs
CREATE INDEX IF NOT EXISTS routine_runs_user_date ON routine_runs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS routine_runs_routine_date ON routine_runs(routine_id, date DESC);

-- 4) RELATIONSHIPS (Personal CRM)
CREATE TABLE IF NOT EXISTS people_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  aka text,
  tags text[] DEFAULT '{}',
  birthday date,
  timezone text DEFAULT 'UTC',
  email text,
  phone text,
  notes_md text,
  relationship_type text,
  importance int CHECK (importance BETWEEN 1 AND 5) DEFAULT 3,
  last_contact date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optimized indexes for people_contacts
CREATE INDEX IF NOT EXISTS people_contacts_project_id ON people_contacts(project_id);
CREATE INDEX IF NOT EXISTS people_contacts_user_id ON people_contacts(user_id);
CREATE INDEX IF NOT EXISTS people_contacts_birthday ON people_contacts(birthday) WHERE birthday IS NOT NULL;
CREATE INDEX IF NOT EXISTS people_contacts_last_contact ON people_contacts(last_contact) WHERE last_contact IS NOT NULL;
CREATE INDEX IF NOT EXISTS people_contacts_tags ON people_contacts USING GIN(tags);

CREATE TABLE IF NOT EXISTS people_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES people_contacts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text CHECK (type IN ('call','text','email','meet','gift','other')) DEFAULT 'other',
  notes_md text,
  sentiment int CHECK (sentiment BETWEEN 1 AND 5),
  duration_minutes int,
  created_at timestamptz DEFAULT now()
);

-- Optimized indexes for people_interactions
CREATE INDEX IF NOT EXISTS people_interactions_person_date ON people_interactions(person_id, date DESC);
CREATE INDEX IF NOT EXISTS people_interactions_user_date ON people_interactions(user_id, date DESC);

-- 5) LEARNING LOG & FLASHCARDS
CREATE TABLE IF NOT EXISTS learning_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text CHECK (kind IN ('book','article','podcast','course','video','paper')) NOT NULL,
  title text NOT NULL,
  author text,
  source_url text,
  isbn text,
  status text CHECK (status IN ('want_to_read','reading','completed','paused')) DEFAULT 'want_to_read',
  rating int CHECK (rating BETWEEN 1 AND 5),
  started_at date,
  finished_at date,
  notes_md text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optimized indexes for learning_items
CREATE INDEX IF NOT EXISTS learning_items_project_id ON learning_items(project_id);
CREATE INDEX IF NOT EXISTS learning_items_user_status ON learning_items(user_id, status);
CREATE INDEX IF NOT EXISTS learning_items_kind ON learning_items(kind);

CREATE TABLE IF NOT EXISTS highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES learning_items(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  note text,
  page_number int,
  location text,
  created_at timestamptz DEFAULT now()
);

-- Optimized indexes for highlights
CREATE INDEX IF NOT EXISTS highlights_item_id ON highlights(item_id);
CREATE INDEX IF NOT EXISTS highlights_user_id ON highlights(user_id);

CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  source_highlight_id uuid REFERENCES highlights(id),
  deck_name text DEFAULT 'General',
  last_reviewed timestamptz,
  next_review timestamptz,
  interval_days int DEFAULT 1,
  ease_factor numeric DEFAULT 2.5,
  repetitions int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Optimized indexes for flashcards
CREATE INDEX IF NOT EXISTS flashcards_project_deck ON flashcards(project_id, deck_name);
CREATE INDEX IF NOT EXISTS flashcards_user_next_review ON flashcards(user_id, next_review) WHERE next_review IS NOT NULL;
CREATE INDEX IF NOT EXISTS flashcards_due ON flashcards(next_review) WHERE next_review <= now();

-- 6) MEMORIES & PHOTOS
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  taken_at timestamptz NOT NULL,
  caption text,
  storage_path text NOT NULL,
  thumbnail_path text,
  latitude numeric,
  longitude numeric,
  location_name text,
  exif_stripped boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  people_tagged text[] DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Optimized indexes for memories
CREATE INDEX IF NOT EXISTS memories_project_taken_at ON memories(project_id, taken_at DESC);
CREATE INDEX IF NOT EXISTS memories_user_taken_at ON memories(user_id, taken_at DESC);
CREATE INDEX IF NOT EXISTS memories_location ON memories(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS memories_tags ON memories USING GIN(tags);
CREATE INDEX IF NOT EXISTS memories_favorites ON memories(user_id, is_favorite) WHERE is_favorite;

-- 7) TIME CAPSULES
CREATE TABLE IF NOT EXISTS time_capsules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  deliver_on date NOT NULL,
  target_email text NOT NULL,
  subject text,
  content_md text NOT NULL,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  sent boolean DEFAULT false,
  sent_at timestamptz
);

-- Optimized indexes for time_capsules
CREATE INDEX IF NOT EXISTS time_capsules_deliver_on ON time_capsules(deliver_on) WHERE NOT sent;
CREATE INDEX IF NOT EXISTS time_capsules_user_id ON time_capsules(user_id);

-- 8) JOURNAL PROMPTS & AFFIRMATIONS
CREATE TABLE IF NOT EXISTS journal_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  text_md text NOT NULL,
  area_id uuid REFERENCES life_areas(id),
  frequency text CHECK (frequency IN ('daily','weekly','monthly')) DEFAULT 'daily',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Optimized indexes for journal_prompts
CREATE INDEX IF NOT EXISTS journal_prompts_project_active ON journal_prompts(project_id) WHERE active;
CREATE INDEX IF NOT EXISTS journal_prompts_frequency ON journal_prompts(frequency) WHERE active;

CREATE TABLE IF NOT EXISTS affirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  text_md text NOT NULL,
  area_id uuid REFERENCES life_areas(id),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Optimized indexes for affirmations
CREATE INDEX IF NOT EXISTS affirmations_project_active ON affirmations(project_id) WHERE active;

-- 9) CHALLENGES
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  days int DEFAULT 30,
  start_date date,
  area_id uuid REFERENCES life_areas(id),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Optimized indexes for challenges
CREATE INDEX IF NOT EXISTS challenges_project_active ON challenges(project_id) WHERE active;
CREATE INDEX IF NOT EXISTS challenges_user_active ON challenges(user_id) WHERE active;

CREATE TABLE IF NOT EXISTS challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  day int NOT NULL,
  date date NOT NULL,
  done boolean DEFAULT false,
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, day)
);

-- Optimized indexes for challenge_progress
CREATE INDEX IF NOT EXISTS challenge_progress_challenge_day ON challenge_progress(challenge_id, day);
CREATE INDEX IF NOT EXISTS challenge_progress_user_date ON challenge_progress(user_id, date DESC);

-- 10) WELLBEING METRICS (for insights)
CREATE TABLE IF NOT EXISTS wellbeing_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  metric_type text NOT NULL,
  value numeric NOT NULL,
  unit text,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id, date, metric_type)
);

-- Optimized indexes for wellbeing_metrics
CREATE INDEX IF NOT EXISTS wellbeing_metrics_user_type_date ON wellbeing_metrics(user_id, metric_type, date DESC);
CREATE INDEX IF NOT EXISTS wellbeing_metrics_project_type_date ON wellbeing_metrics(project_id, metric_type, date DESC);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE life_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_entry_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellbeing_metrics ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (using project membership pattern)

-- Life Areas
CREATE POLICY "life_areas_select" ON life_areas FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = life_areas.project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "life_areas_insert" ON life_areas FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = life_areas.project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "life_areas_update" ON life_areas FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "life_areas_delete" ON life_areas FOR DELETE USING (user_id = auth.uid());

-- Personal Entries
CREATE POLICY "personal_entries_select" ON personal_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = personal_entries.project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "personal_entries_insert" ON personal_entries FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = personal_entries.project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "personal_entries_update" ON personal_entries FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "personal_entries_delete" ON personal_entries FOR DELETE USING (user_id = auth.uid());

-- Personal Entry Areas (junction table)
CREATE POLICY "personal_entry_areas_select" ON personal_entry_areas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM personal_entries pe 
    WHERE pe.id = personal_entry_areas.entry_id 
    AND pe.user_id = auth.uid()
  )
);
CREATE POLICY "personal_entry_areas_insert" ON personal_entry_areas FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM personal_entries pe 
    WHERE pe.id = personal_entry_areas.entry_id 
    AND pe.user_id = auth.uid()
  )
);
CREATE POLICY "personal_entry_areas_delete" ON personal_entry_areas FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM personal_entries pe 
    WHERE pe.id = personal_entry_areas.entry_id 
    AND pe.user_id = auth.uid()
  )
);

-- Function to create standard RLS policies for tables with project_id
CREATE OR REPLACE FUNCTION create_project_rls_policies(table_name text) RETURNS void AS $$
BEGIN
  EXECUTE format('
    CREATE POLICY "%s_select" ON %s FOR SELECT USING (
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = %s.project_id AND pm.user_id = auth.uid())
    );
    CREATE POLICY "%s_insert" ON %s FOR INSERT WITH CHECK (
      user_id = auth.uid() AND
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = %s.project_id AND pm.user_id = auth.uid())
    );
    CREATE POLICY "%s_update" ON %s FOR UPDATE USING (user_id = auth.uid());
    CREATE POLICY "%s_delete" ON %s FOR DELETE USING (user_id = auth.uid());
  ', table_name, table_name, table_name, table_name, table_name, table_name, table_name, table_name, table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply RLS policies to all tables with project_id and user_id
SELECT create_project_rls_policies('habits');
SELECT create_project_rls_policies('routines');
SELECT create_project_rls_policies('people_contacts');
SELECT create_project_rls_policies('learning_items');
SELECT create_project_rls_policies('flashcards');
SELECT create_project_rls_policies('memories');
SELECT create_project_rls_policies('time_capsules');
SELECT create_project_rls_policies('journal_prompts');
SELECT create_project_rls_policies('affirmations');
SELECT create_project_rls_policies('challenges');
SELECT create_project_rls_policies('wellbeing_metrics');

-- Function to create user-only RLS policies for log/junction tables
CREATE OR REPLACE FUNCTION create_user_rls_policies(table_name text) RETURNS void AS $$
BEGIN
  EXECUTE format('
    CREATE POLICY "%s_select" ON %s FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "%s_insert" ON %s FOR INSERT WITH CHECK (user_id = auth.uid());
    CREATE POLICY "%s_update" ON %s FOR UPDATE USING (user_id = auth.uid());
    CREATE POLICY "%s_delete" ON %s FOR DELETE USING (user_id = auth.uid());
  ', table_name, table_name, table_name, table_name, table_name, table_name, table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply user-only RLS policies to log tables
SELECT create_user_rls_policies('habit_logs');
SELECT create_user_rls_policies('routine_runs');
SELECT create_user_rls_policies('people_interactions');
SELECT create_user_rls_policies('highlights');
SELECT create_user_rls_policies('challenge_progress');

-- Special policy for routine_steps (no user_id, linked via routine)
CREATE POLICY "routine_steps_select" ON routine_steps FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM routines r 
    WHERE r.id = routine_steps.routine_id 
    AND r.user_id = auth.uid()
  )
);
CREATE POLICY "routine_steps_insert" ON routine_steps FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM routines r 
    WHERE r.id = routine_steps.routine_id 
    AND r.user_id = auth.uid()
  )
);
CREATE POLICY "routine_steps_update" ON routine_steps FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM routines r 
    WHERE r.id = routine_steps.routine_id 
    AND r.user_id = auth.uid()
  )
);
CREATE POLICY "routine_steps_delete" ON routine_steps FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM routines r 
    WHERE r.id = routine_steps.routine_id 
    AND r.user_id = auth.uid()
  )
);

-- Updated at triggers (reuse existing function)
CREATE TRIGGER t_personal_entries_updated BEFORE UPDATE ON personal_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_people_contacts_updated BEFORE UPDATE ON people_contacts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_learning_items_updated BEFORE UPDATE ON learning_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Clean up helper functions
DROP FUNCTION IF EXISTS create_project_rls_policies(text);
DROP FUNCTION IF EXISTS create_user_rls_policies(text);

-- Add feature flags to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS feature_flags jsonb DEFAULT '{
  "diary_personal": true,
  "habits": true,
  "routines": true,
  "people": true,
  "learning": true,
  "memories": false,
  "insights": false,
  "yearbook": false
}'::jsonb;

-- Migration complete
-- Supabase schema for Founder Diary
-- Enable required extensions
create extension if not exists pgcrypto;

-- projects a user owns
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text unique,
  created_at timestamptz default now()
);

-- membership (future multi-user). For MVP, insert owner as admin.
create table if not exists project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner','admin','editor','viewer')) default 'owner',
  primary key (project_id, user_id)
);

-- daily logs
create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  title text,
  content_md text,
  tags text[] default '{}',
  mood int check (mood between 1 and 5),
  time_spent_minutes int default 0,
  ai_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- goals / OKRs
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  objective text not null,
  due_date date,
  created_at timestamptz default now()
);

create table if not exists key_results (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id) on delete cascade,
  name text not null,
  target numeric,
  current numeric default 0,
  unit text
);

-- weekly reviews
create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  content_md text,
  ai_summary text,
  created_at timestamptz default now()
);

-- monthly investor updates
create table if not exists investor_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  month int check (month between 1 and 12),
  year int,
  content_md text,
  ai_summary text,
  public_slug text unique,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- basic integration counters (optional MVP)
create table if not exists integration_counters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  period_start date,
  period_end date,
  github_prs int default 0,
  github_issues int default 0,
  vercel_deploys int default 0,
  calendar_events int default 0
);

-- Updated timestamps trigger for daily_logs
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_daily_logs_updated on daily_logs;
create trigger trg_daily_logs_updated
before update on daily_logs
for each row execute procedure set_updated_at();

-- Row Level Security
alter table projects enable row level security;
alter table project_members enable row level security;
alter table daily_logs enable row level security;
alter table goals enable row level security;
alter table key_results enable row level security;
alter table weekly_reviews enable row level security;
alter table investor_updates enable row level security;
alter table integration_counters enable row level security;
-- Helper policy: membership exists
create or replace view user_project_memberships as
  select pm.project_id, pm.user_id, pm.role from project_members pm;

-- Projects policies
create policy "projects_read_member"
  on projects for select
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid()
    )
  );

create policy "projects_insert_owner"
  on projects for insert
  with check (auth.uid() is not null);

create policy "projects_update_owner"
  on projects for update
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid() and pm.role = 'owner'
    )
  );

-- Project members policies
create policy "project_members_read_member"
  on project_members for select
  using (user_id = auth.uid() or project_id in (
    select project_id from project_members where user_id = auth.uid()
  ));

create policy "project_members_insert_owner"
  on project_members for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = project_members.project_id and pm.user_id = auth.uid() and pm.role = 'owner'
    ) or not exists (
      select 1 from project_members pm where pm.project_id = project_members.project_id
    )
  );

-- Daily logs policies
create policy "daily_logs_crud_member"
  on daily_logs for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = daily_logs.project_id and pm.user_id = auth.uid()
    )
  );

-- Goals policies
create policy "goals_crud_member"
  on goals for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = goals.project_id and pm.user_id = auth.uid()
    )
  );

-- Key results policies
create policy "key_results_crud_member"
  on key_results for all
  using (
    exists (
      select 1 from goals g
      join project_members pm on pm.project_id = g.project_id
      where g.id = key_results.goal_id and pm.user_id = auth.uid()
    )
  );

-- Weekly reviews policies
create policy "weekly_reviews_crud_member"
  on weekly_reviews for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = weekly_reviews.project_id and pm.user_id = auth.uid()
    )
  );

-- Investor updates policies
create policy "investor_updates_crud_member"
  on investor_updates for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = investor_updates.project_id and pm.user_id = auth.uid()
    )
  );

create policy "investor_updates_read_public"
  on investor_updates for select
  using (is_public = true);

-- Integration counters policies
create policy "integration_counters_crud_member"
  on integration_counters for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = integration_counters.project_id and pm.user_id = auth.uid()
    )
  );

create policy "key_results_update_goal_owner"
  on key_results for update
  using (
    exists (
      select 1 from goals g
      where g.id = key_results.goal_id and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from goals g
      where g.id = key_results.goal_id and g.user_id = auth.uid()
    )
  );

create policy "weekly_reviews_crud_self_member"
  on weekly_reviews
  for all
  using (
    user_id = auth.uid() and exists (
      select 1 from project_members pm
      where pm.project_id = weekly_reviews.project_id and pm.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid() and exists (
      select 1 from project_members pm
      where pm.project_id = weekly_reviews.project_id and pm.user_id = auth.uid()
    )
  );

create policy "investor_updates_crud_self_member"
  on investor_updates
  for all
  using (
    user_id = auth.uid() and exists (
      select 1 from project_members pm
      where pm.project_id = investor_updates.project_id and pm.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid() and exists (
      select 1 from project_members pm
      where pm.project_id = investor_updates.project_id and pm.user_id = auth.uid()
    )
  );

-- Public read policy for investor updates when is_public=true and slug matches
create policy "investor_updates_public_read"
  on investor_updates for select
  using (
    is_public = true
  );
-- Add-ons schema for Founder Diary
-- Run this after the main schema.sql

-- 1) ARCHITECTURAL DECISION RECORDS (ADR)
CREATE TABLE IF NOT EXISTS decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  context_md text,
  options_md text,
  decision_md text,
  consequences_md text,
  status text CHECK (status IN ('proposed','accepted','superseded')) DEFAULT 'proposed',
  relates_to text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) ASSUMPTIONS & VALIDATIONS
CREATE TABLE IF NOT EXISTS assumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  hypothesis text NOT NULL,
  test_plan_md text,
  result_md text,
  status text CHECK (status IN ('untested','testing','validated','invalidated')) DEFAULT 'untested',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) RISKS & MITIGATIONS
CREATE TABLE IF NOT EXISTS risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text,
  probability int CHECK (probability BETWEEN 1 AND 5),
  impact int CHECK (impact BETWEEN 1 AND 5),
  mitigation_md text,
  owner uuid REFERENCES auth.users(id),
  status text CHECK (status IN ('open','monitor','closed')) DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4) RICE FEATURE SCORING
CREATE TABLE IF NOT EXISTS features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description_md text,
  reach numeric DEFAULT 0,
  impact numeric DEFAULT 0,
  confidence numeric DEFAULT 0,
  effort numeric DEFAULT 1,
  status text CHECK (status IN ('idea','planned','building','done')) DEFAULT 'idea',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5) STREAK FREEZES (for burnout prevention)
CREATE TABLE IF NOT EXISTS streak_freezes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_freezes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as existing tables)
-- Decisions policies
CREATE POLICY "decisions_select" ON decisions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = decisions.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "decisions_insert" ON decisions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = decisions.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "decisions_update" ON decisions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "decisions_delete" ON decisions
  FOR DELETE USING (user_id = auth.uid());

-- Assumptions policies
CREATE POLICY "assumptions_select" ON assumptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = assumptions.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "assumptions_insert" ON assumptions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = assumptions.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "assumptions_update" ON assumptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "assumptions_delete" ON assumptions
  FOR DELETE USING (user_id = auth.uid());

-- Risks policies
CREATE POLICY "risks_select" ON risks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = risks.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "risks_insert" ON risks
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = risks.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "risks_update" ON risks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "risks_delete" ON risks
  FOR DELETE USING (user_id = auth.uid());

-- Features policies
CREATE POLICY "features_select" ON features
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = features.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "features_insert" ON features
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = features.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "features_update" ON features
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "features_delete" ON features
  FOR DELETE USING (user_id = auth.uid());

-- Streak freezes policies
CREATE POLICY "streak_freezes_select" ON streak_freezes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = streak_freezes.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "streak_freezes_insert" ON streak_freezes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = streak_freezes.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "streak_freezes_update" ON streak_freezes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "streak_freezes_delete" ON streak_freezes
  FOR DELETE USING (user_id = auth.uid());

-- Updated at triggers
CREATE TRIGGER t_decisions_updated BEFORE UPDATE ON decisions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_assumptions_updated BEFORE UPDATE ON assumptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_risks_updated BEFORE UPDATE ON risks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_features_updated BEFORE UPDATE ON features FOR EACH ROW EXECUTE FUNCTION set_updated_at();
