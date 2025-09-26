-- RLS Hardening - Re-enable with proper policies
-- Run this to secure the database for production

-- Re-enable RLS on core tables (currently disabled for development)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_updates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "projects_read_member" ON projects;
DROP POLICY IF EXISTS "projects_insert_owner" ON projects;
DROP POLICY IF EXISTS "projects_update_owner" ON projects;
DROP POLICY IF EXISTS "project_members_read_member" ON project_members;
DROP POLICY IF EXISTS "project_members_insert_owner" ON project_members;
DROP POLICY IF EXISTS "daily_logs_crud_member" ON daily_logs;
DROP POLICY IF EXISTS "goals_crud_member" ON goals;
DROP POLICY IF EXISTS "key_results_crud_member" ON key_results;
DROP POLICY IF EXISTS "weekly_reviews_crud_member" ON weekly_reviews;
DROP POLICY IF EXISTS "investor_updates_crud_member" ON investor_updates;
DROP POLICY IF EXISTS "investor_updates_read_public" ON investor_updates;

-- Projects policies
CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = id AND pm.user_id = auth.uid())
  );

CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND owner = auth.uid()
  );

CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin'))
  );

CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (owner = auth.uid());

-- Project members policies
CREATE POLICY "project_members_select" ON project_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- Self-insert as owner when creating project
      user_id = auth.uid() OR
      -- Owner/admin can add members
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin'))
    )
  );

CREATE POLICY "project_members_update" ON project_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin'))
  );

CREATE POLICY "project_members_delete" ON project_members
  FOR DELETE USING (
    user_id = auth.uid() OR -- Can remove self
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid() AND pm.role = 'owner')
  );

-- Daily logs policies
CREATE POLICY "daily_logs_select" ON daily_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = daily_logs.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "daily_logs_insert" ON daily_logs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = daily_logs.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "daily_logs_update" ON daily_logs
  FOR UPDATE USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = daily_logs.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "daily_logs_delete" ON daily_logs
  FOR DELETE USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = daily_logs.project_id AND pm.user_id = auth.uid())
  );

-- Goals policies
CREATE POLICY "goals_select" ON goals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = goals.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "goals_insert" ON goals
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = goals.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "goals_update" ON goals
  FOR UPDATE USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = goals.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "goals_delete" ON goals
  FOR DELETE USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = goals.project_id AND pm.user_id = auth.uid())
  );

-- Key results policies
CREATE POLICY "key_results_select" ON key_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM goals g 
      JOIN project_members pm ON pm.project_id = g.project_id 
      WHERE g.id = key_results.goal_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "key_results_insert" ON key_results
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM goals g 
      JOIN project_members pm ON pm.project_id = g.project_id 
      WHERE g.id = key_results.goal_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "key_results_update" ON key_results
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM goals g 
      JOIN project_members pm ON pm.project_id = g.project_id 
      WHERE g.id = key_results.goal_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "key_results_delete" ON key_results
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM goals g 
      JOIN project_members pm ON pm.project_id = g.project_id 
      WHERE g.id = key_results.goal_id AND pm.user_id = auth.uid()
    )
  );

-- Weekly reviews policies
CREATE POLICY "weekly_reviews_select" ON weekly_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = weekly_reviews.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "weekly_reviews_insert" ON weekly_reviews
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = weekly_reviews.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "weekly_reviews_update" ON weekly_reviews
  FOR UPDATE USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = weekly_reviews.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "weekly_reviews_delete" ON weekly_reviews
  FOR DELETE USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = weekly_reviews.project_id AND pm.user_id = auth.uid())
  );

-- Investor updates policies
CREATE POLICY "investor_updates_select" ON investor_updates
  FOR SELECT USING (
    -- Members can see all updates for their projects
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = investor_updates.project_id AND pm.user_id = auth.uid()) OR
    -- Public updates can be seen by anyone
    is_public = true
  );

CREATE POLICY "investor_updates_insert" ON investor_updates
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = investor_updates.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "investor_updates_update" ON investor_updates
  FOR UPDATE USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = investor_updates.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "investor_updates_delete" ON investor_updates
  FOR DELETE USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = investor_updates.project_id AND pm.user_id = auth.uid())
  );

-- Add audit logging for RLS denials
CREATE OR REPLACE FUNCTION log_rls_denial()
RETURNS event_trigger AS $$
BEGIN
  -- Log RLS policy violations
  INSERT INTO audit_logs (action, entity, meta, created_at)
  VALUES ('rls_denial', TG_TABLE_NAME, jsonb_build_object('user_id', auth.uid()), now());
EXCEPTION WHEN OTHERS THEN
  -- Fail silently to avoid breaking the original query
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Create event trigger for RLS denials (if supported)
-- Note: This is a simplified version - in production you'd want more sophisticated logging
