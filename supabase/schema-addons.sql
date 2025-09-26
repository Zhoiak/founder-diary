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
