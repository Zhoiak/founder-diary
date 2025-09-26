import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Deleting goal:", params.id, "for user:", session.user.id);
    
    const supabase = await createServerSupabase();

    // First, verify the user has access to this goal
    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .select(`
        *,
        project_id
      `)
      .eq("id", params.id)
      .single();

    if (goalError || !goal) {
      console.log("Goal not found:", goalError);
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", goal.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    // Delete the goal (key_results will be deleted automatically due to cascade)
    const { error: deleteError } = await supabase
      .from("goals")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      console.error("Goal deletion error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    console.log("Goal deleted successfully");
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error in DELETE /api/goals/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
