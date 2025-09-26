-- DIARY+ MODULE - Personal Life OS Extension
-- Run this after schema-addons.sql to add personal journaling capabilities

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
CREATE UNIQUE INDEX IF NOT EXISTS life_areas_project_key ON life_areas(project_id, key);

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
  sentiment numeric CHECK (sentiment BETWEEN -1 AND 1), -- cached sentiment analysis
  latitude numeric,
  longitude numeric,
  location_name text,
  photos jsonb DEFAULT '[]',  -- [{path, caption, thumbnail}]
  is_private boolean DEFAULT false,
  encrypted_content text, -- for private vault
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS personal_entries_project_date ON personal_entries(project_id, date DESC);
CREATE INDEX IF NOT EXISTS personal_entries_user_date ON personal_entries(user_id, date DESC);

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
  schedule text, -- cron-like or BYDAY string
  target_per_week int DEFAULT 7,
  area_id uuid REFERENCES life_areas(id),
  color text DEFAULT '#10B981',
  icon text DEFAULT '✅',
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS routine_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE,
  order_index int NOT NULL,
  prompt text NOT NULL,
  placeholder text,
  requires_answer boolean DEFAULT true,
  step_type text CHECK (step_type IN ('text','number','rating','boolean')) DEFAULT 'text'
);

CREATE TABLE IF NOT EXISTS routine_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  answers jsonb DEFAULT '{}', -- {step_id: value}
  completed_at timestamptz DEFAULT now(),
  UNIQUE(routine_id, user_id, date)
);

-- 4) RELATIONSHIPS (Personal CRM)
CREATE TABLE IF NOT EXISTS people_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  aka text, -- nickname/alias
  tags text[] DEFAULT '{}',
  birthday date,
  timezone text DEFAULT 'UTC',
  email text,
  phone text,
  notes_md text,
  relationship_type text, -- family, friend, colleague, etc.
  importance int CHECK (importance BETWEEN 1 AND 5) DEFAULT 3,
  last_contact date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES learning_items(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  note text,
  page_number int,
  location text, -- chapter, timestamp, etc.
  created_at timestamptz DEFAULT now()
);

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
CREATE INDEX IF NOT EXISTS memories_location ON memories(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS memories_taken_at ON memories(taken_at DESC);

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

CREATE TABLE IF NOT EXISTS affirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  text_md text NOT NULL,
  area_id uuid REFERENCES life_areas(id),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

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

-- 10) WELLBEING METRICS (for insights)
CREATE TABLE IF NOT EXISTS wellbeing_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  metric_type text NOT NULL, -- sleep, steps, weight, etc.
  value numeric NOT NULL,
  unit text,
  source text DEFAULT 'manual', -- manual, fitbit, apple_health, etc.
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id, date, metric_type)
);

-- Enable RLS on all new tables
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

-- RLS Policies (same pattern as existing tables)
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

-- Apply similar RLS pattern to all other tables...
-- (For brevity, I'll create a function to generate these)

-- Function to create standard RLS policies
CREATE OR REPLACE FUNCTION create_diary_plus_rls_policies(table_name text) RETURNS void AS $$
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
SELECT create_diary_plus_rls_policies('habits');
SELECT create_diary_plus_rls_policies('routines');
SELECT create_diary_plus_rls_policies('people_contacts');
SELECT create_diary_plus_rls_policies('learning_items');
SELECT create_diary_plus_rls_policies('flashcards');
SELECT create_diary_plus_rls_policies('memories');
SELECT create_diary_plus_rls_policies('time_capsules');
SELECT create_diary_plus_rls_policies('journal_prompts');
SELECT create_diary_plus_rls_policies('affirmations');
SELECT create_diary_plus_rls_policies('challenges');
SELECT create_diary_plus_rls_policies('wellbeing_metrics');

-- Special policies for junction/log tables
CREATE POLICY "habit_logs_select" ON habit_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "habit_logs_insert" ON habit_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "habit_logs_update" ON habit_logs FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "habit_logs_delete" ON habit_logs FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "routine_runs_select" ON routine_runs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "routine_runs_insert" ON routine_runs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "routine_runs_update" ON routine_runs FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "routine_runs_delete" ON routine_runs FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "people_interactions_select" ON people_interactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "people_interactions_insert" ON people_interactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "people_interactions_update" ON people_interactions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "people_interactions_delete" ON people_interactions FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "highlights_select" ON highlights FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "highlights_insert" ON highlights FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "highlights_update" ON highlights FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "highlights_delete" ON highlights FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "challenge_progress_select" ON challenge_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "challenge_progress_insert" ON challenge_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "challenge_progress_update" ON challenge_progress FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "challenge_progress_delete" ON challenge_progress FOR DELETE USING (user_id = auth.uid());

-- Updated at triggers
CREATE TRIGGER t_personal_entries_updated BEFORE UPDATE ON personal_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_people_contacts_updated BEFORE UPDATE ON people_contacts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_learning_items_updated BEFORE UPDATE ON learning_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Default Life Areas for new Personal projects
INSERT INTO life_areas (project_id, user_id, key, label, color, icon) 
SELECT 
  p.id as project_id,
  p.owner as user_id,
  area.key,
  area.label,
  area.color,
  area.icon
FROM projects p
CROSS JOIN (VALUES
  ('health', 'Health & Fitness', '#EF4444', '💪'),
  ('relationships', 'Relationships', '#F59E0B', '❤️'),
  ('career', 'Career & Growth', '#3B82F6', '🚀'),
  ('learning', 'Learning & Skills', '#8B5CF6', '📚'),
  ('creativity', 'Creativity & Hobbies', '#EC4899', '🎨'),
  ('spirituality', 'Spirituality & Mindfulness', '#10B981', '🧘'),
  ('finance', 'Finance & Money', '#059669', '💰'),
  ('travel', 'Travel & Adventure', '#0EA5E9', '✈️')
) AS area(key, label, color, icon)
WHERE p.name = 'Personal' 
AND NOT EXISTS (
  SELECT 1 FROM life_areas la 
  WHERE la.project_id = p.id AND la.key = area.key
);

-- Clean up function
DROP FUNCTION IF EXISTS create_diary_plus_rls_policies(text);
