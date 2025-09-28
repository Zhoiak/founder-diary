import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const CreateRoutineSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(['morning', 'evening']),
  description: z.string().optional(),
  target_duration_minutes: z.number().min(5).max(120).default(30),
  steps: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    duration_minutes: z.number().min(1).max(60).default(5),
    is_required: z.boolean().default(true)
  })).min(1, "At least one step is required")
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
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

    // Fetch routines with their steps
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select(`
        *,
        routine_steps (
          id,
          title,
          description,
          duration_minutes,
          order_index,
          is_required
        )
      `)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (routinesError) {
      console.error("Error fetching routines:", routinesError);
      return NextResponse.json({ error: routinesError.message }, { status: 500 });
    }

    // Sort steps by order_index
    const routinesWithSortedSteps = routines?.map(routine => ({
      ...routine,
      type: routine.routine_type, // Map routine_type to type for frontend
      routine_steps: routine.routine_steps?.sort((a, b) => a.order_index - b.order_index) || []
    })) || [];

    return NextResponse.json({
      success: true,
      routines: routinesWithSortedSteps
    });

  } catch (error: any) {
    console.error("Unexpected error in routines GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const validatedData = CreateRoutineSchema.parse(body);

    // Check if user has access to this project
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', validatedData.projectId)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership || !['owner', 'admin', 'member'].includes(membership.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create the routine
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .insert({
        project_id: validatedData.projectId,
        name: validatedData.name,
        routine_type: validatedData.type,
        description: validatedData.description,
        target_duration_minutes: validatedData.target_duration_minutes,
        is_active: true
      })
      .select()
      .single();

    if (routineError) {
      console.error("Error creating routine:", routineError);
      return NextResponse.json({ error: routineError.message }, { status: 500 });
    }

    // Create the routine steps
    const stepsToInsert = validatedData.steps.map((step, index) => ({
      routine_id: routine.id,
      title: step.title,
      description: step.description,
      duration_minutes: step.duration_minutes,
      order_index: index + 1,
      is_required: step.is_required
    }));

    const { data: steps, error: stepsError } = await supabase
      .from('routine_steps')
      .insert(stepsToInsert)
      .select();

    if (stepsError) {
      console.error("Error creating routine steps:", stepsError);
      // Try to clean up the routine if steps creation failed
      await supabase.from('routines').delete().eq('id', routine.id);
      return NextResponse.json({ error: stepsError.message }, { status: 500 });
    }

    // Return the complete routine with steps
    const completeRoutine = {
      ...routine,
      type: routine.routine_type, // Map for frontend
      routine_steps: steps?.sort((a, b) => a.order_index - b.order_index) || []
    };

    return NextResponse.json({
      success: true,
      routine: completeRoutine,
      message: "Routine created successfully"
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error in routines POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
