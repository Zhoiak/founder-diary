-- CRON LOGS TABLE
-- Table to track cron job executions and their results
-- Date: 2025-01-27

CREATE TABLE IF NOT EXISTS cron_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  executed_at timestamptz NOT NULL DEFAULT now(),
  processed_count int DEFAULT 0,
  successful_count int DEFAULT 0,
  error_message text,
  status text CHECK (status IN ('completed', 'failed', 'running')) DEFAULT 'completed',
  execution_time_ms int,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for cron_logs
CREATE INDEX IF NOT EXISTS cron_logs_job_type_executed_at ON cron_logs(job_type, executed_at DESC);
CREATE INDEX IF NOT EXISTS cron_logs_status ON cron_logs(status);
CREATE INDEX IF NOT EXISTS cron_logs_executed_at ON cron_logs(executed_at DESC);

-- RLS for cron_logs (admin only access)
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

-- Only allow system/admin access to cron logs
CREATE POLICY "cron_logs_admin_only" ON cron_logs FOR ALL USING (false);

-- Function to clean up old cron logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_cron_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM cron_logs 
  WHERE executed_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for cleanup function)
GRANT EXECUTE ON FUNCTION cleanup_old_cron_logs() TO authenticated;
