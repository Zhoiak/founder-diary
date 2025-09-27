import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching yearbooks for project:", projectId);

    // Fetch yearbook generations
    const { data: yearbooks, error } = await supabase
      .from('yearbook_generations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching yearbooks:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Fetched yearbooks:", yearbooks?.length || 0);

    return NextResponse.json({
      success: true,
      yearbooks: yearbooks || []
    });

  } catch (error: any) {
    console.error("Unexpected error in yearbooks GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(req.url);
    const yearbookId = searchParams.get("id");

    if (!yearbookId) {
      return NextResponse.json({ error: "Yearbook ID is required" }, { status: 400 });
    }

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the yearbook generation
    const { error } = await supabase
      .from('yearbook_generations')
      .delete()
      .eq('id', yearbookId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error("Error deleting yearbook:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Yearbook deleted successfully"
    });

  } catch (error: any) {
    console.error("Unexpected error in yearbook DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
