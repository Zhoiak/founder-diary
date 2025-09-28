import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from('time_capsules')
      .select('*')
      .eq('user_id', session.user.id)
      .order('scheduled_delivery_date', { ascending: true });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: capsules, error } = await query;

    if (error) {
      console.error("Error fetching time capsules:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      capsules: capsules || []
    });

  } catch (error: any) {
    console.error("Unexpected error in time capsules GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
