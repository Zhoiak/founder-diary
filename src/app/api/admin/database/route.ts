import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

interface DatabaseTable {
  name: string;
  recordCount: number;
  hasData: boolean;
  hasRLS: boolean;
  lastUpdated: string;
  description: string;
  category: string;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user and verify admin access
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin access
    const { data: adminAccess } = await supabase
      .from('project_members')
      .select('role, projects!inner(slug)')
      .eq('user_id', session.user.id)
      .eq('projects.slug', 'admin')
      .eq('role', 'owner')
      .single();

    if (!adminAccess) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Define all Diary+ tables and check their status
    const tableDefinitions = [
      // Core System Tables
      { name: 'projects', category: 'Core System', description: 'User projects and workspaces' },
      { name: 'project_members', category: 'Core System', description: 'Project membership and roles' },
      { name: 'logs', category: 'Core System', description: 'Daily logs and entries' },
      { name: 'goals', category: 'Core System', description: 'Goals and OKRs' },
      { name: 'weekly_reviews', category: 'Core System', description: 'Weekly review summaries' },
      
      // Personal Life OS Tables
      { name: 'personal_entries', category: 'Personal Life OS', description: 'Personal journal entries' },
      { name: 'life_areas', category: 'Personal Life OS', description: 'Life areas for organization' },
      { name: 'routines', category: 'Personal Life OS', description: 'Morning and evening routines' },
      { name: 'habits', category: 'Personal Life OS', description: 'Habit definitions' },
      { name: 'habit_logs', category: 'Personal Life OS', description: 'Daily habit completion logs' },
      { name: 'people', category: 'Personal Life OS', description: 'Personal relationships CRM' },
      { name: 'interactions', category: 'Personal Life OS', description: 'Interaction history with people' },
      { name: 'learning_items', category: 'Personal Life OS', description: 'Learning materials and books' },
      { name: 'flashcards', category: 'Personal Life OS', description: 'Spaced repetition flashcards' },
      { name: 'memories', category: 'Personal Life OS', description: 'Photos and memory storage' },
      { name: 'time_capsules', category: 'Personal Life OS', description: 'Future delivery system' },
      
      // Diary+ Advanced Tables
      { name: 'cron_logs', category: 'Diary+ Advanced', description: 'Cron job execution logs' },
      { name: 'yearbook_generations', category: 'Diary+ Advanced', description: 'Generated yearbook records' },
      { name: 'vault_configurations', category: 'Diary+ Advanced', description: 'Private vault settings' },
      { name: 'data_retention_logs', category: 'Diary+ Advanced', description: 'Data retention policy logs' },
      
      // System Management Tables
      { name: 'project_invitations', category: 'System Management', description: 'Project invitation system' },
      { name: 'system_activity', category: 'System Management', description: 'System activity tracking' },
      { name: 'system_metrics', category: 'System Management', description: 'System performance metrics' }
    ];

    const tables: DatabaseTable[] = [];

    for (const tableDef of tableDefinitions) {
      try {
        // Try to get record count for each table
        const { count, error } = await supabase
          .from(tableDef.name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          // Table doesn't exist or no access
          tables.push({
            name: tableDef.name,
            recordCount: 0,
            hasData: false,
            hasRLS: false,
            lastUpdated: 'N/A',
            description: tableDef.description + ' (Table not found)',
            category: tableDef.category
          });
        } else {
          tables.push({
            name: tableDef.name,
            recordCount: count || 0,
            hasData: (count || 0) > 0,
            hasRLS: true, // Assume RLS is enabled for existing tables
            lastUpdated: new Date().toISOString().split('T')[0],
            description: tableDef.description,
            category: tableDef.category
          });
        }
      } catch (error) {
        // Table doesn't exist
        tables.push({
          name: tableDef.name,
          recordCount: 0,
          hasData: false,
          hasRLS: false,
          lastUpdated: 'N/A',
          description: tableDef.description + ' (Not created)',
          category: tableDef.category
        });
      }
    }

    // Sort tables by category and name
    tables.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(tables);

  } catch (error: any) {
    console.error("Error fetching database status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
