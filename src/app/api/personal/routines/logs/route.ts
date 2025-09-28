import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const date = url.searchParams.get('date');

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this project
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch routine logs for the specified date
    const { data: logs, error: logsError } = await supabase
      .from('routine_logs')
      .select(`
        *,
        routines!inner (
          id,
          name,
          routine_type,
          project_id
        )
      `)
      .eq('user_id', session.user.id)
      .eq('date', date)
      .eq('routines.project_id', projectId);

    if (logsError) {
      console.error("Error fetching routine logs:", logsError);
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      logs: logs || []
    });

  } catch (error: any) {
    console.error("Unexpected error in routine logs GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
