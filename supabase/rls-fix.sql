-- Fix for infinite recursion in RLS policies
-- Run this to fix the circular dependency issue

-- First, disable RLS temporarily to fix the policies
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;

-- Drop the problematic policies
DROP POLICY IF EXISTS "project_members_select" ON project_members;
DROP POLICY IF EXISTS "project_members_insert" ON project_members;
DROP POLICY IF EXISTS "project_members_update" ON project_members;
DROP POLICY IF EXISTS "project_members_delete" ON project_members;

-- Create simpler, non-recursive policies for project_members
-- Users can see their own memberships
CREATE POLICY "project_members_select_own" ON project_members
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert themselves as members (when creating projects)
-- Or project owners can add members
CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- Self-insert when creating project
      user_id = auth.uid() OR
      -- Project owner can add members (check via projects table directly)
      EXISTS (SELECT 1 FROM projects p WHERE p.id = project_members.project_id AND p.owner = auth.uid())
    )
  );

-- Only project owners can update memberships
CREATE POLICY "project_members_update" ON project_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_members.project_id AND p.owner = auth.uid())
  );

-- Users can remove themselves, or project owners can remove members
CREATE POLICY "project_members_delete" ON project_members
  FOR DELETE USING (
    user_id = auth.uid() OR -- Can remove self
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_members.project_id AND p.owner = auth.uid())
  );

-- Re-enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Now fix the other policies that depend on project_members
-- We need to use a different approach for membership checks

-- Drop and recreate projects policies with direct owner checks where possible
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;

CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (
    -- Owner can always see
    owner = auth.uid() OR
    -- Or user is a member (this should work now that project_members policies are fixed)
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = id AND pm.user_id = auth.uid())
  );

CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (
    -- Only owner can update for now (simplify to avoid recursion)
    owner = auth.uid()
  ) WITH CHECK (
    owner = auth.uid()
  );

-- For other tables, we can use the membership check since project_members is now fixed
-- But let's also add direct owner checks as fallback

-- Update daily_logs policies
DROP POLICY IF EXISTS "daily_logs_select" ON daily_logs;
DROP POLICY IF EXISTS "daily_logs_insert" ON daily_logs;
DROP POLICY IF EXISTS "daily_logs_update" ON daily_logs;
DROP POLICY IF EXISTS "daily_logs_delete" ON daily_logs;

CREATE POLICY "daily_logs_select" ON daily_logs
  FOR SELECT USING (
    -- User's own logs
    user_id = auth.uid() OR
    -- Or user is project owner
    EXISTS (SELECT 1 FROM projects p WHERE p.id = daily_logs.project_id AND p.owner = auth.uid()) OR
    -- Or user is project member
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = daily_logs.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "daily_logs_insert" ON daily_logs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid() AND (
      -- User is project owner
      EXISTS (SELECT 1 FROM projects p WHERE p.id = daily_logs.project_id AND p.owner = auth.uid()) OR
      -- Or user is project member
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = daily_logs.project_id AND pm.user_id = auth.uid())
    )
  );

CREATE POLICY "daily_logs_update" ON daily_logs
  FOR UPDATE USING (
    user_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.id = daily_logs.project_id AND p.owner = auth.uid()) OR
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = daily_logs.project_id AND pm.user_id = auth.uid())
    )
  );

CREATE POLICY "daily_logs_delete" ON daily_logs
  FOR DELETE USING (
    user_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.id = daily_logs.project_id AND p.owner = auth.uid()) OR
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = daily_logs.project_id AND pm.user_id = auth.uid())
    )
  );

-- Apply similar pattern to other tables
-- Goals
DROP POLICY IF EXISTS "goals_select" ON goals;
DROP POLICY IF EXISTS "goals_insert" ON goals;
DROP POLICY IF EXISTS "goals_update" ON goals;
DROP POLICY IF EXISTS "goals_delete" ON goals;

CREATE POLICY "goals_select" ON goals
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM projects p WHERE p.id = goals.project_id AND p.owner = auth.uid()) OR
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = goals.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "goals_insert" ON goals
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.id = goals.project_id AND p.owner = auth.uid()) OR
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = goals.project_id AND pm.user_id = auth.uid())
    )
  );

CREATE POLICY "goals_update" ON goals
  FOR UPDATE USING (
    user_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.id = goals.project_id AND p.owner = auth.uid()) OR
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = goals.project_id AND pm.user_id = auth.uid())
    )
  );

CREATE POLICY "goals_delete" ON goals
  FOR DELETE USING (
    user_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.id = goals.project_id AND p.owner = auth.uid()) OR
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = goals.project_id AND pm.user_id = auth.uid())
    )
  );

-- Weekly reviews
DROP POLICY IF EXISTS "weekly_reviews_select" ON weekly_reviews;
DROP POLICY IF EXISTS "weekly_reviews_insert" ON weekly_reviews;
DROP POLICY IF EXISTS "weekly_reviews_update" ON weekly_reviews;
DROP POLICY IF EXISTS "weekly_reviews_delete" ON weekly_reviews;

CREATE POLICY "weekly_reviews_select" ON weekly_reviews
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM projects p WHERE p.id = weekly_reviews.project_id AND p.owner = auth.uid()) OR
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = weekly_reviews.project_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "weekly_reviews_insert" ON weekly_reviews
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.id = weekly_reviews.project_id AND p.owner = auth.uid()) OR
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = weekly_reviews.project_id AND pm.user_id = auth.uid())
    )
  );

CREATE POLICY "weekly_reviews_update" ON weekly_reviews
  FOR UPDATE USING (
    user_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.id = weekly_reviews.project_id AND p.owner = auth.uid()) OR
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = weekly_reviews.project_id AND pm.user_id = auth.uid())
    )
  );

CREATE POLICY "weekly_reviews_delete" ON weekly_reviews
  FOR DELETE USING (
    user_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.id = weekly_reviews.project_id AND p.owner = auth.uid()) OR
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = weekly_reviews.project_id AND pm.user_id = auth.uid())
    )
  );
