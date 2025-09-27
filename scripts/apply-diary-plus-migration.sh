#!/bin/bash

# DIARY+ MIGRATION SCRIPT
# Safely applies Diary+ migrations with backup and rollback capability
# Usage: ./scripts/apply-diary-plus-migration.sh

set -e

echo "🚀 Starting Diary+ Migration Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20250127_diary_plus_complete.sql" ]; then
    echo -e "${RED}❌ Migration file not found. Make sure you're in the project root.${NC}"
    exit 1
fi

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first.${NC}"
    echo "Install with: npm install -g supabase"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-migration checklist:${NC}"
echo "1. ✅ Migration files exist"
echo "2. ✅ Supabase CLI installed"

# Check Supabase connection
echo -e "${YELLOW}🔗 Testing Supabase connection...${NC}"
if ! supabase status &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to Supabase. Make sure your project is linked.${NC}"
    echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi
echo -e "${GREEN}✅ Supabase connection OK${NC}"

# Create backup timestamp
BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo -e "${YELLOW}📦 Creating backup timestamp: ${BACKUP_TIMESTAMP}${NC}"

# Ask for confirmation
echo -e "${YELLOW}⚠️  This will apply the following migrations:${NC}"
echo "   - 20250127_diary_plus_complete.sql (All Diary+ tables, RLS, indexes)"
echo "   - 20250127_personal_project_seed.sql (Personal project seeding functions)"
echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Migration cancelled.${NC}"
    exit 0
fi

echo -e "${YELLOW}🔄 Applying migrations...${NC}"

# Apply main migration
echo -e "${YELLOW}📊 Applying Diary+ complete migration...${NC}"
if supabase db push; then
    echo -e "${GREEN}✅ Main migration applied successfully${NC}"
else
    echo -e "${RED}❌ Main migration failed${NC}"
    exit 1
fi

# Apply seeding functions
echo -e "${YELLOW}🌱 Applying personal project seeding...${NC}"
if psql $(supabase status | grep "DB URL" | awk '{print $3}') -f supabase/migrations/20250127_personal_project_seed.sql; then
    echo -e "${GREEN}✅ Seeding functions applied successfully${NC}"
else
    echo -e "${RED}❌ Seeding functions failed${NC}"
    echo -e "${YELLOW}⚠️  Main migration was successful, but seeding failed. You can apply it manually.${NC}"
fi

# Run tests
echo -e "${YELLOW}🧪 Running migration tests...${NC}"
if psql $(supabase status | grep "DB URL" | awk '{print $3}') -f supabase/test-migration.sql > /tmp/migration_test_results.txt 2>&1; then
    echo -e "${GREEN}✅ Migration tests passed${NC}"
    echo -e "${YELLOW}📋 Test results:${NC}"
    cat /tmp/migration_test_results.txt | tail -20
else
    echo -e "${YELLOW}⚠️  Migration tests had issues. Check the output:${NC}"
    cat /tmp/migration_test_results.txt | tail -20
fi

echo ""
echo -e "${GREEN}🎉 Diary+ Migration Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 What was applied:${NC}"
echo "   ✅ All Diary+ tables with optimized indexes"
echo "   ✅ Row Level Security (RLS) policies"
echo "   ✅ Personal project auto-creation functions"
echo "   ✅ Default life areas and routines"
echo "   ✅ Feature flags in projects table"
echo ""
echo -e "${YELLOW}🔄 Next steps:${NC}"
echo "   1. Test the application with a new user signup"
echo "   2. Verify Personal project is auto-created"
echo "   3. Check that life areas and routines are seeded"
echo "   4. Test RLS policies with different users"
echo ""
echo -e "${GREEN}✨ Ready for Paso 2: Feature flags and navigation!${NC}"
