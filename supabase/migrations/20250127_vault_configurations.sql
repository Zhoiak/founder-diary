-- VAULT CONFIGURATIONS TABLE
-- Store Private Vault settings and metadata (never store passwords)
-- Date: 2025-01-27

CREATE TABLE IF NOT EXISTS vault_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  salt text NOT NULL, -- For key derivation
  is_enabled boolean DEFAULT true,
  password_strength_score int DEFAULT 0,
  setup_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz,
  access_count int DEFAULT 0,
  failed_attempts int DEFAULT 0,
  locked_until timestamptz,
  retention_policy jsonb DEFAULT '{
    "enabled": false,
    "delete_after_months": 18,
    "archive_after_months": 12,
    "notify_before_days": 30
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Indexes for vault_configurations
CREATE INDEX IF NOT EXISTS vault_configurations_project_id ON vault_configurations(project_id);
CREATE INDEX IF NOT EXISTS vault_configurations_user_id ON vault_configurations(user_id);
CREATE INDEX IF NOT EXISTS vault_configurations_enabled ON vault_configurations(is_enabled) WHERE is_enabled;

-- RLS for vault_configurations
ALTER TABLE vault_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_configurations_select" ON vault_configurations FOR SELECT USING (
  user_id = auth.uid() AND
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = vault_configurations.project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "vault_configurations_insert" ON vault_configurations FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = vault_configurations.project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "vault_configurations_update" ON vault_configurations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "vault_configurations_delete" ON vault_configurations FOR DELETE USING (user_id = auth.uid());

-- DATA RETENTION POLICIES TABLE
CREATE TABLE IF NOT EXISTS data_retention_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text CHECK (action_type IN ('archive', 'delete', 'notify', 'restore')) NOT NULL,
  table_name text NOT NULL,
  record_count int DEFAULT 0,
  criteria jsonb DEFAULT '{}',
  executed_at timestamptz DEFAULT now(),
  executed_by uuid REFERENCES auth.users(id),
  dry_run boolean DEFAULT false,
  error_message text,
  status text CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'completed'
);

-- Indexes for data_retention_logs
CREATE INDEX IF NOT EXISTS data_retention_logs_project_id ON data_retention_logs(project_id);
CREATE INDEX IF NOT EXISTS data_retention_logs_executed_at ON data_retention_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS data_retention_logs_action_type ON data_retention_logs(action_type);

-- RLS for data_retention_logs
ALTER TABLE data_retention_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "data_retention_logs_select" ON data_retention_logs FOR SELECT USING (
  user_id = auth.uid() OR executed_by = auth.uid()
);
CREATE POLICY "data_retention_logs_insert" ON data_retention_logs FOR INSERT WITH CHECK (
  executed_by = auth.uid()
);

-- Function to apply data retention policies
CREATE OR REPLACE FUNCTION apply_data_retention_policy(
  p_project_id uuid,
  p_user_id uuid,
  p_dry_run boolean DEFAULT true
)
RETURNS jsonb AS $$
DECLARE
  v_config record;
  v_retention_policy jsonb;
  v_cutoff_date date;
  v_archive_date date;
  v_results jsonb := '{"actions": [], "summary": {}}'::jsonb;
  v_action_id uuid;
BEGIN
  -- Get vault configuration and retention policy
  SELECT * INTO v_config
  FROM vault_configurations
  WHERE project_id = p_project_id AND user_id = p_user_id AND is_enabled = true;

  IF NOT FOUND THEN
    RETURN '{"error": "No vault configuration found"}'::jsonb;
  END IF;

  v_retention_policy := v_config.retention_policy;

  -- Check if retention is enabled
  IF NOT (v_retention_policy->>'enabled')::boolean THEN
    RETURN '{"message": "Data retention policy is disabled"}'::jsonb;
  END IF;

  -- Calculate cutoff dates
  v_cutoff_date := CURRENT_DATE - INTERVAL '1 month' * (v_retention_policy->>'delete_after_months')::int;
  v_archive_date := CURRENT_DATE - INTERVAL '1 month' * (v_retention_policy->>'archive_after_months')::int;

  -- Archive old personal entries
  IF NOT p_dry_run THEN
    UPDATE personal_entries 
    SET is_private = true, 
        encrypted_content = COALESCE(encrypted_content, content_md),
        content_md = '[ARCHIVED]'
    WHERE project_id = p_project_id 
      AND user_id = p_user_id 
      AND date < v_archive_date 
      AND NOT is_private;
  END IF;

  -- Log archive action
  INSERT INTO data_retention_logs (
    project_id, user_id, action_type, table_name, 
    record_count, criteria, executed_by, dry_run
  ) VALUES (
    p_project_id, p_user_id, 'archive', 'personal_entries',
    (SELECT COUNT(*) FROM personal_entries 
     WHERE project_id = p_project_id AND user_id = p_user_id AND date < v_archive_date AND NOT is_private),
    jsonb_build_object('archive_before', v_archive_date),
    p_user_id, p_dry_run
  ) RETURNING id INTO v_action_id;

  v_results := jsonb_set(v_results, '{actions}', 
    (v_results->'actions') || jsonb_build_object('archive_entries', v_action_id));

  -- Delete very old entries (if configured)
  IF (v_retention_policy->>'delete_after_months')::int > 0 THEN
    IF NOT p_dry_run THEN
      DELETE FROM personal_entries 
      WHERE project_id = p_project_id 
        AND user_id = p_user_id 
        AND date < v_cutoff_date;
    END IF;

    -- Log delete action
    INSERT INTO data_retention_logs (
      project_id, user_id, action_type, table_name, 
      record_count, criteria, executed_by, dry_run
    ) VALUES (
      p_project_id, p_user_id, 'delete', 'personal_entries',
      (SELECT COUNT(*) FROM personal_entries 
       WHERE project_id = p_project_id AND user_id = p_user_id AND date < v_cutoff_date),
      jsonb_build_object('delete_before', v_cutoff_date),
      p_user_id, p_dry_run
    ) RETURNING id INTO v_action_id;

    v_results := jsonb_set(v_results, '{actions}', 
      (v_results->'actions') || jsonb_build_object('delete_entries', v_action_id));
  END IF;

  -- Add summary
  v_results := jsonb_set(v_results, '{summary}', jsonb_build_object(
    'archive_cutoff', v_archive_date,
    'delete_cutoff', v_cutoff_date,
    'dry_run', p_dry_run,
    'executed_at', now()
  ));

  RETURN v_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify users about upcoming data retention
CREATE OR REPLACE FUNCTION notify_retention_policy()
RETURNS void AS $$
DECLARE
  v_config record;
  v_notify_date date;
BEGIN
  FOR v_config IN 
    SELECT vc.*, u.email
    FROM vault_configurations vc
    JOIN auth.users u ON u.id = vc.user_id
    WHERE vc.is_enabled = true 
      AND (vc.retention_policy->>'enabled')::boolean = true
  LOOP
    v_notify_date := CURRENT_DATE + INTERVAL '1 day' * (v_config.retention_policy->>'notify_before_days')::int;
    
    -- Check if any entries will be affected soon
    IF EXISTS (
      SELECT 1 FROM personal_entries 
      WHERE project_id = v_config.project_id 
        AND user_id = v_config.user_id 
        AND date < v_notify_date
    ) THEN
      -- Log notification (in real implementation, send email)
      INSERT INTO data_retention_logs (
        project_id, user_id, action_type, table_name, 
        record_count, criteria, executed_by, dry_run
      ) VALUES (
        v_config.project_id, v_config.user_id, 'notify', 'personal_entries',
        (SELECT COUNT(*) FROM personal_entries 
         WHERE project_id = v_config.project_id AND user_id = v_config.user_id AND date < v_notify_date),
        jsonb_build_object('notify_date', v_notify_date, 'email', v_config.email),
        v_config.user_id, false
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated at trigger
CREATE TRIGGER t_vault_configurations_updated 
  BEFORE UPDATE ON vault_configurations 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Grant permissions
GRANT EXECUTE ON FUNCTION apply_data_retention_policy(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_retention_policy() TO authenticated;
