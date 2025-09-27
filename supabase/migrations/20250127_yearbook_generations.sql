-- YEARBOOK GENERATIONS TABLE
-- Track yearbook generation history and downloads
-- Date: 2025-01-27

CREATE TABLE IF NOT EXISTS yearbook_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  format text CHECK (format IN ('pdf', 'epub')) NOT NULL,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  entry_count int DEFAULT 0,
  file_size bigint,
  download_url text,
  download_count int DEFAULT 0,
  last_downloaded_at timestamptz,
  options jsonb DEFAULT '{}',
  status text CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Indexes for yearbook_generations
CREATE INDEX IF NOT EXISTS yearbook_generations_project_id ON yearbook_generations(project_id);
CREATE INDEX IF NOT EXISTS yearbook_generations_user_id ON yearbook_generations(user_id);
CREATE INDEX IF NOT EXISTS yearbook_generations_status ON yearbook_generations(status);
CREATE INDEX IF NOT EXISTS yearbook_generations_created_at ON yearbook_generations(created_at DESC);

-- RLS for yearbook_generations
ALTER TABLE yearbook_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "yearbook_generations_select" ON yearbook_generations FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = yearbook_generations.project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "yearbook_generations_insert" ON yearbook_generations FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = yearbook_generations.project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "yearbook_generations_update" ON yearbook_generations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "yearbook_generations_delete" ON yearbook_generations FOR DELETE USING (user_id = auth.uid());

-- Function to clean up old yearbook files (keep last 10 per user)
CREATE OR REPLACE FUNCTION cleanup_old_yearbooks()
RETURNS void AS $$
BEGIN
  -- Delete old yearbook records (keep last 10 per user)
  DELETE FROM yearbook_generations 
  WHERE id IN (
    SELECT id FROM (
      SELECT id, 
             ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM yearbook_generations
    ) ranked
    WHERE rn > 10
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_yearbooks() TO authenticated;
