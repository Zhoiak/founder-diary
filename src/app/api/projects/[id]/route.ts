import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this project
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', id)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Get project details - with fallback for missing Diary+ columns
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        slug,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (projectError) {
      console.error("Error fetching project:", projectError);
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    // Check if Diary+ columns exist by trying to fetch them
    let diaryPlusData = null;
    try {
      const { data: diaryData } = await supabase
        .from('projects')
        .select('feature_flags, private_vault')
        .eq('id', id)
        .single();
      diaryPlusData = diaryData;
    } catch (error) {
      // Diary+ columns don't exist yet, use defaults
      console.log("Diary+ columns not found, using defaults");
      diaryPlusData = {
        feature_flags: {},
        private_vault: false
      };
    }

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        ...diaryPlusData
      }
    });

  } catch (error: any) {
    console.error("Unexpected error in project GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
