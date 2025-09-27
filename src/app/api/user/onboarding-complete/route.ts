import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const OnboardingCompleteSchema = z.object({
  projectId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await req.json();
    const { projectId } = OnboardingCompleteSchema.parse(body);

    // Check if user has access to this project
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Mark onboarding as completed by updating user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { 
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_project_id: projectId
      }
    });

    if (updateError) {
      console.error("Error updating user metadata:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully"
    });

  } catch (error: any) {
    console.error("Unexpected error in onboarding-complete:", error);
    
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
