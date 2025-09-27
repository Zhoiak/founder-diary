import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Call the database function to ensure Personal project exists
    const { data, error } = await supabase.rpc('ensure_personal_project_exists', {
      user_id: userId
    });

    if (error) {
      console.error("Error ensuring Personal project:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch the created/existing project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        slug,
        private_vault,
        feature_flags,
        created_at
      `)
      .eq('id', data)
      .single();

    if (projectError) {
      console.error("Error fetching Personal project:", projectError);
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      project,
      message: project.created_at === new Date().toISOString().split('T')[0] 
        ? "Personal project created successfully" 
        : "Personal project already exists"
    });

  } catch (error: any) {
    console.error("Unexpected error in ensure-personal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
