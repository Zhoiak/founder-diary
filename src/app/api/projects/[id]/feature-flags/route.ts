import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateFeatureFlagsSchema = z.object({
  feature_flags: z.object({
    diary_personal: z.boolean().optional(),
    habits: z.boolean().optional(),
    routines: z.boolean().optional(),
    people: z.boolean().optional(),
    learning: z.boolean().optional(),
    memories: z.boolean().optional(),
    insights: z.boolean().optional(),
    yearbook: z.boolean().optional(),
  }),
});

export async function PATCH(
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

    // Validate request body
    const body = await req.json();
    const { feature_flags } = UpdateFeatureFlagsSchema.parse(body);

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

    // Only owners can update feature flags
    if (membership.role !== 'owner') {
      return NextResponse.json({ error: "Only project owners can update feature flags" }, { status: 403 });
    }

    // Get current project to merge flags
    const { data: currentProject, error: projectError } = await supabase
      .from('projects')
      .select('feature_flags')
      .eq('id', id)
      .single();

    if (projectError) {
      return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
    }

    // Merge current flags with new flags
    const currentFlags = currentProject.feature_flags || {};
    const updatedFlags = { ...currentFlags, ...feature_flags };

    // Update project feature flags
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({ 
        feature_flags: updatedFlags,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, slug, feature_flags, private_vault, updated_at')
      .single();

    if (updateError) {
      console.error("Error updating feature flags:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: "Feature flags updated successfully"
    });

  } catch (error: any) {
    console.error("Unexpected error in feature-flags PATCH:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Get project with feature flags
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, slug, feature_flags, private_vault')
      .eq('id', id)
      .single();

    if (projectError) {
      return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      project,
      feature_flags: project.feature_flags || {}
    });

  } catch (error: any) {
    console.error("Unexpected error in feature-flags GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
