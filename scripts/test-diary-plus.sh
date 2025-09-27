#!/bin/bash

# DIARY+ TESTING SCRIPT
# Test the complete Diary+ implementation
# Usage: ./scripts/test-diary-plus.sh

set -e

echo "🧪 Testing Diary+ Implementation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check if migrations are applied
echo -e "${BLUE}📊 Test 1: Checking database schema...${NC}"
if supabase db diff --schema public > /tmp/schema_diff.txt 2>&1; then
    if [ -s /tmp/schema_diff.txt ]; then
        echo -e "${YELLOW}⚠️  Schema differences found. Run migrations first:${NC}"
        echo "   ./scripts/apply-diary-plus-migration.sh"
        exit 1
    else
        echo -e "${GREEN}✅ Database schema is up to date${NC}"
    fi
else
    echo -e "${RED}❌ Cannot check database schema${NC}"
    exit 1
fi

# Test 2: Check if all tables exist
echo -e "${BLUE}📋 Test 2: Verifying Diary+ tables...${NC}"
EXPECTED_TABLES=(
    "life_areas"
    "personal_entries" 
    "personal_entry_areas"
    "habits"
    "habit_logs"
    "routines"
    "routine_steps"
    "routine_runs"
    "people_contacts"
    "people_interactions"
    "learning_items"
    "highlights"
    "flashcards"
    "memories"
    "time_capsules"
    "journal_prompts"
    "affirmations"
    "challenges"
    "challenge_progress"
    "wellbeing_metrics"
)

MISSING_TABLES=()
for table in "${EXPECTED_TABLES[@]}"; do
    if ! psql $(supabase status | grep "DB URL" | awk '{print $3}') -c "\d $table" > /dev/null 2>&1; then
        MISSING_TABLES+=($table)
    fi
done

if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All Diary+ tables exist (${#EXPECTED_TABLES[@]} tables)${NC}"
else
    echo -e "${RED}❌ Missing tables: ${MISSING_TABLES[*]}${NC}"
    exit 1
fi

# Test 3: Check RLS policies
echo -e "${BLUE}🔒 Test 3: Verifying RLS policies...${NC}"
RLS_COUNT=$(psql $(supabase status | grep "DB URL" | awk '{print $3}') -t -c "
    SELECT COUNT(*) FROM pg_policies 
    WHERE tablename IN ('life_areas', 'personal_entries', 'habits', 'people_contacts', 'learning_items');
" | tr -d ' ')

if [ "$RLS_COUNT" -gt 15 ]; then
    echo -e "${GREEN}✅ RLS policies are configured ($RLS_COUNT policies found)${NC}"
else
    echo -e "${RED}❌ Insufficient RLS policies ($RLS_COUNT found, expected >15)${NC}"
    exit 1
fi

# Test 4: Check feature flags column
echo -e "${BLUE}🏁 Test 4: Verifying feature flags...${NC}"
if psql $(supabase status | grep "DB URL" | awk '{print $3}') -c "\d projects" | grep -q "feature_flags"; then
    echo -e "${GREEN}✅ Feature flags column exists in projects table${NC}"
else
    echo -e "${RED}❌ Feature flags column missing from projects table${NC}"
    exit 1
fi

# Test 5: Check seeding functions
echo -e "${BLUE}🌱 Test 5: Verifying seeding functions...${NC}"
FUNCTIONS=(
    "create_personal_project_for_user"
    "ensure_personal_project_exists"
)

MISSING_FUNCTIONS=()
for func in "${FUNCTIONS[@]}"; do
    if ! psql $(supabase status | grep "DB URL" | awk '{print $3}') -c "\df $func" | grep -q "$func"; then
        MISSING_FUNCTIONS+=($func)
    fi
done

if [ ${#MISSING_FUNCTIONS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All seeding functions exist${NC}"
else
    echo -e "${RED}❌ Missing functions: ${MISSING_FUNCTIONS[*]}${NC}"
    exit 1
fi

# Test 6: Check API endpoints
echo -e "${BLUE}🌐 Test 6: Checking API endpoints...${NC}"
if [ -f "src/app/api/user/ensure-personal/route.ts" ] && 
   [ -f "src/app/api/personal-entries/route.ts" ] &&
   [ -f "src/app/api/projects/[id]/feature-flags/route.ts" ]; then
    echo -e "${GREEN}✅ Core API endpoints exist${NC}"
else
    echo -e "${RED}❌ Missing API endpoints${NC}"
    exit 1
fi

# Test 7: Check React components
echo -e "${BLUE}⚛️  Test 7: Checking React components...${NC}"
COMPONENTS=(
    "src/components/mode-selector.tsx"
    "src/components/onboarding-wizard.tsx"
    "src/components/adaptive-navigation.tsx"
    "src/hooks/use-feature-flags.ts"
    "src/types/project.ts"
)

MISSING_COMPONENTS=()
for component in "${COMPONENTS[@]}"; do
    if [ ! -f "$component" ]; then
        MISSING_COMPONENTS+=($component)
    fi
done

if [ ${#MISSING_COMPONENTS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All React components exist${NC}"
else
    echo -e "${RED}❌ Missing components: ${MISSING_COMPONENTS[*]}${NC}"
    exit 1
fi

# Test 8: Build check
echo -e "${BLUE}🔨 Test 8: TypeScript compilation check...${NC}"
if npm run build > /tmp/build_output.txt 2>&1; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed:${NC}"
    tail -20 /tmp/build_output.txt
    exit 1
fi

# Test 9: Check if dev server starts
echo -e "${BLUE}🚀 Test 9: Development server startup test...${NC}"
timeout 30s npm run dev > /tmp/dev_output.txt 2>&1 &
DEV_PID=$!
sleep 10

if kill -0 $DEV_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Development server starts successfully${NC}"
    kill $DEV_PID 2>/dev/null || true
else
    echo -e "${RED}❌ Development server failed to start:${NC}"
    tail -10 /tmp/dev_output.txt
    exit 1
fi

# Summary
echo ""
echo -e "${GREEN}🎉 All Diary+ tests passed!${NC}"
echo ""
echo -e "${YELLOW}📋 Implementation Summary:${NC}"
echo "   ✅ Database: 20 tables with RLS policies"
echo "   ✅ APIs: Personal project seeding & feature flags"
echo "   ✅ Frontend: Mode selector, onboarding wizard, adaptive navigation"
echo "   ✅ Types: Shared TypeScript interfaces"
echo "   ✅ Build: No compilation errors"
echo ""
echo -e "${YELLOW}🔄 Next Steps:${NC}"
echo "   1. Start the dev server: npm run dev"
echo "   2. Sign up as a new user"
echo "   3. Test Personal project auto-creation"
echo "   4. Complete the onboarding wizard"
echo "   5. Test feature flag toggles in Settings"
echo ""
echo -e "${GREEN}✨ Ready for Paso 5: Cron jobs & reminders!${NC}"
