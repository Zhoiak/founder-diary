-- TEST MIGRATION SCRIPT
-- Verify that all Diary+ tables and policies work correctly
-- Run this after applying the migrations

-- Test 1: Check all tables exist
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN (
  'life_areas', 'personal_entries', 'personal_entry_areas',
  'habits', 'habit_logs', 'routines', 'routine_steps', 'routine_runs',
  'people_contacts', 'people_interactions', 'learning_items', 'highlights',
  'flashcards', 'memories', 'time_capsules', 'journal_prompts',
  'affirmations', 'challenges', 'challenge_progress', 'wellbeing_metrics'
)
ORDER BY tablename;

-- Test 2: Check indexes exist
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN (
  'life_areas', 'personal_entries', 'habits', 'habit_logs',
  'people_contacts', 'learning_items', 'flashcards', 'memories'
)
ORDER BY tablename, indexname;

-- Test 3: Check RLS policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN (
  'life_areas', 'personal_entries', 'habits', 'people_contacts',
  'learning_items', 'flashcards', 'memories'
)
ORDER BY tablename, policyname;

-- Test 4: Check functions exist
SELECT 
  proname as function_name,
  pronargs as num_args,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN (
  'create_personal_project_for_user',
  'ensure_personal_project_exists'
);

-- Test 5: Check feature_flags column exists in projects
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('private_vault', 'feature_flags');

-- Test 6: Verify constraints and checks
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('personal_entries', 'habits', 'people_interactions')
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- Test 7: Check foreign key relationships
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('personal_entries', 'habits', 'flashcards')
ORDER BY tc.table_name, kcu.column_name;

-- Test 8: Sample data insertion test (will be rolled back)
BEGIN;

-- This should work if RLS and functions are properly set up
-- Note: This assumes a test user exists
DO $$
DECLARE
  test_user_id uuid := '00000000-0000-0000-0000-000000000001';
  project_id uuid;
BEGIN
  -- Test creating personal project (if test user exists)
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
    SELECT create_personal_project_for_user(test_user_id) INTO project_id;
    RAISE NOTICE 'Created personal project: %', project_id;
    
    -- Test that life areas were created
    IF (SELECT COUNT(*) FROM life_areas WHERE project_id = project_id) >= 6 THEN
      RAISE NOTICE 'Life areas created successfully';
    ELSE
      RAISE WARNING 'Life areas not created properly';
    END IF;
    
    -- Test that routines were created
    IF (SELECT COUNT(*) FROM routines WHERE project_id = project_id) = 2 THEN
      RAISE NOTICE 'Routines created successfully';
    ELSE
      RAISE WARNING 'Routines not created properly';
    END IF;
  ELSE
    RAISE NOTICE 'Test user not found, skipping data insertion test';
  END IF;
END $$;

ROLLBACK;

-- Summary
SELECT 'Migration test completed. Check output above for any issues.' as status;
