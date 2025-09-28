import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user and verify admin access
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin access (owner of admin project)
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

    // Fetch system statistics
    const stats = {
      totalUsers: 0,
      totalProjects: 0,
      totalEntries: 0,
      activeUsers24h: 0,
      implementedFeatures: 0,
      pendingFeatures: 0,
      databaseTables: 0,
      apiEndpoints: 15
    };

    // Get total users count
    const { count: usersCount } = await supabase
      .from('project_members')
      .select('user_id', { count: 'exact', head: true });
    stats.totalUsers = usersCount || 0;

    // Get total projects count
    const { count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    stats.totalProjects = projectsCount || 0;

    // Get total logs count (as proxy for entries)
    const { count: logsCount } = await supabase
      .from('logs')
      .select('*', { count: 'exact', head: true });
    stats.totalEntries = logsCount || 0;

    // Count Diary+ tables
    const diaryTables = [
      'personal_entries', 'life_areas', 'routines', 'habits', 'habit_logs',
      'people', 'interactions', 'learning_items', 'flashcards', 'memories',
      'time_capsules', 'cron_logs', 'yearbook_generations', 'vault_configurations',
      'data_retention_logs', 'project_invitations', 'system_activity', 'system_metrics'
    ];
    stats.databaseTables = diaryTables.length;

    // Mock feature counts (would be calculated from actual feature status)
    stats.implementedFeatures = 8;
    stats.pendingFeatures = 12;

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
