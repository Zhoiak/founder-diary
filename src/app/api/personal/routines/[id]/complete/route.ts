import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const CompleteRoutineSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  notes: z.string().optional(),
  duration_minutes: z.number().optional()
});

export async function POST(
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
    const validatedData = CompleteRoutineSchema.parse(body);

    // Check if routine exists and user has access
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select(`
        *,
        project_members!inner (user_id, role)
      `)
      .eq('id', id)
      .eq('project_members.user_id', session.user.id)
      .single();

    if (routineError || !routine) {
      return NextResponse.json({ error: "Routine not found or access denied" }, { status: 404 });
    }

    // Get or create the routine log
    let { data: log, error: logError } = await supabase
      .from('routine_logs')
      .select('id, started_at, completed_at')
      .eq('routine_id', id)
      .eq('user_id', session.user.id)
      .eq('date', validatedData.date)
      .single();

    if (logError && logError.code === 'PGRST116') {
      // Log doesn't exist, create it
      const { data: newLog, error: createLogError } = await supabase
        .from('routine_logs')
        .insert({
          routine_id: id,
          user_id: session.user.id,
          date: validatedData.date,
          started_at: new Date().toISOString(),
          completion_rate: 0
        })
        .select()
        .single();

      if (createLogError) {
        console.error("Error creating routine log:", createLogError);
        return NextResponse.json({ error: createLogError.message }, { status: 500 });
      }
      log = newLog;
    } else if (logError) {
      console.error("Error fetching routine log:", logError);
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    if (log?.completed_at) {
      return NextResponse.json({ error: "Routine already completed for this date" }, { status: 400 });
    }

    // Get all steps for this routine
    const { data: steps, error: stepsError } = await supabase
      .from('routine_steps')
      .select('id, is_required')
      .eq('routine_id', id);

    if (stepsError) {
      console.error("Error fetching routine steps:", stepsError);
      return NextResponse.json({ error: stepsError.message }, { status: 500 });
    }

    // Mark all required steps as completed (simple completion)
    if (steps && steps.length > 0) {
      const stepLogsToUpsert = steps.map(step => ({
        routine_log_id: log.id,
        step_id: step.id,
        completed: step.is_required, // Auto-complete required steps
        completed_at: step.is_required ? new Date().toISOString() : null
      }));

      const { error: stepLogsError } = await supabase
        .from('routine_step_logs')
        .upsert(stepLogsToUpsert, { 
          onConflict: 'routine_log_id,step_id' 
        });

      if (stepLogsError) {
        console.error("Error updating step logs:", stepLogsError);
        // Don't fail the request if step logs update fails
      }
    }

    // Calculate completion rate
    const requiredStepsCount = steps?.filter(step => step.is_required).length || 0;
    const completionRate = requiredStepsCount > 0 ? 100 : 0;

    // Update the routine log as completed
    const { data: updatedLog, error: updateError } = await supabase
      .from('routine_logs')
      .update({
        completed_at: new Date().toISOString(),
        completion_rate: completionRate,
        duration_minutes: validatedData.duration_minutes,
        notes: validatedData.notes
      })
      .eq('id', log.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating routine log:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      log: updatedLog,
      message: "Routine completed successfully"
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error in routine complete:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
