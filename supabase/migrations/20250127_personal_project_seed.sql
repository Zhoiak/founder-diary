-- PERSONAL PROJECT SEEDING
-- Auto-create Personal project with default life areas and routines
-- Date: 2025-01-27

-- Function to create Personal project with defaults for new users
CREATE OR REPLACE FUNCTION create_personal_project_for_user(user_id uuid)
RETURNS uuid AS $$
DECLARE
  project_id uuid;
  routine_morning_id uuid;
  routine_evening_id uuid;
BEGIN
  -- Create Personal project
  INSERT INTO projects (name, slug, owner, private_vault, feature_flags)
  VALUES (
    'Personal',
    'personal',
    user_id,
    true, -- Private vault ON by default
    '{
      "diary_personal": true,
      "habits": true,
      "routines": true,
      "people": true,
      "learning": true,
      "memories": false,
      "insights": false,
      "yearbook": false
    }'::jsonb
  )
  RETURNING id INTO project_id;

  -- Add user as project member
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (project_id, user_id, 'owner');

  -- Create default life areas
  INSERT INTO life_areas (project_id, user_id, key, label, color, icon) VALUES
    (project_id, user_id, 'health', 'Health & Fitness', '#EF4444', '💪'),
    (project_id, user_id, 'work', 'Work & Career', '#3B82F6', '💼'),
    (project_id, user_id, 'relationships', 'Relationships', '#F59E0B', '❤️'),
    (project_id, user_id, 'learning', 'Learning & Growth', '#8B5CF6', '📚'),
    (project_id, user_id, 'finance', 'Finance & Money', '#059669', '💰'),
    (project_id, user_id, 'spirituality', 'Spirituality & Mindfulness', '#10B981', '🧘');

  -- Create Morning Routine
  INSERT INTO routines (project_id, user_id, kind, title, description, active)
  VALUES (
    project_id, 
    user_id, 
    'morning', 
    'Morning Reflection', 
    'Start your day with intention and clarity',
    true
  )
  RETURNING id INTO routine_morning_id;

  -- Morning routine steps
  INSERT INTO routine_steps (routine_id, order_index, prompt, placeholder, step_type) VALUES
    (routine_morning_id, 1, 'How are you feeling this morning?', 'Energized, tired, anxious...', 'text'),
    (routine_morning_id, 2, 'What are you most grateful for today?', 'Three things you appreciate...', 'text'),
    (routine_morning_id, 3, 'What is your main intention for today?', 'Your primary focus or goal...', 'text'),
    (routine_morning_id, 4, 'Rate your energy level (1-5)', '1 = Very low, 5 = Very high', 'rating');

  -- Create Evening Routine
  INSERT INTO routines (project_id, user_id, kind, title, description, active)
  VALUES (
    project_id, 
    user_id, 
    'evening', 
    'Evening Reflection', 
    'Reflect on your day and prepare for tomorrow',
    true
  )
  RETURNING id INTO routine_evening_id;

  -- Evening routine steps
  INSERT INTO routine_steps (routine_id, order_index, prompt, placeholder, step_type) VALUES
    (routine_evening_id, 1, 'What was the highlight of your day?', 'Best moment, achievement, or experience...', 'text'),
    (routine_evening_id, 2, 'What did you learn today?', 'New insights, skills, or realizations...', 'text'),
    (routine_evening_id, 3, 'What could you improve tomorrow?', 'Areas for growth or adjustment...', 'text'),
    (routine_evening_id, 4, 'Rate your overall day (1-5)', '1 = Very poor, 5 = Excellent', 'rating'),
    (routine_evening_id, 5, 'How many hours did you sleep last night?', '7.5', 'number');

  RETURN project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user needs Personal project (called on login)
CREATE OR REPLACE FUNCTION ensure_personal_project_exists(user_id uuid)
RETURNS uuid AS $$
DECLARE
  project_id uuid;
BEGIN
  -- Check if user already has a Personal project
  SELECT p.id INTO project_id
  FROM projects p
  JOIN project_members pm ON pm.project_id = p.id
  WHERE p.name = 'Personal' 
    AND pm.user_id = user_id 
    AND pm.role = 'owner';

  -- If no Personal project exists, create one
  IF project_id IS NULL THEN
    SELECT create_personal_project_for_user(user_id) INTO project_id;
  END IF;

  RETURN project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create Personal project on first user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create Personal project for new user after a short delay
  -- (This will be called by the application, not directly in trigger)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We'll call ensure_personal_project_exists() from the application
-- on user login/signup rather than using a trigger to avoid timing issues

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_personal_project_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_personal_project_exists(uuid) TO authenticated;
