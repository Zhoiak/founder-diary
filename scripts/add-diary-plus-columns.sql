-- DIARY+ ESSENTIAL COLUMNS
-- Add missing columns to existing projects table for Diary+ functionality

-- Add feature_flags and private_vault columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS private_vault BOOLEAN DEFAULT false;

-- Update existing projects with default Diary+ feature flags
UPDATE projects 
SET feature_flags = '{
  "diary_personal": true,
  "habits": true,
  "routines": true,
  "people": true,
  "learning": true,
  "memories": true,
  "yearbook": false,
  "time_capsules": false,
  "cron_reminders": false
}'::jsonb
WHERE feature_flags = '{}'::jsonb OR feature_flags IS NULL;

-- Create Personal project for existing users if it doesn't exist
-- This will be handled by the API endpoint instead

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_feature_flags ON projects USING GIN (feature_flags);
CREATE INDEX IF NOT EXISTS idx_projects_private_vault ON projects (private_vault);

-- Verify the changes
SELECT 
  id, 
  name, 
  feature_flags, 
  private_vault 
FROM projects 
LIMIT 5;
