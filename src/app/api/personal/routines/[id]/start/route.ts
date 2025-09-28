import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const StartRoutineSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
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
    const validatedData = StartRoutineSchema.parse(body);

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

    // Check if routine is already started for this date
    const { data: existingLog, error: existingLogError } = await supabase
      .from('routine_logs')
      .select('id, started_at, completed_at')
      .eq('routine_id', id)
      .eq('user_id', session.user.id)
      .eq('date', validatedData.date)
      .single();

    if (existingLogError && existingLogError.code !== 'PGRST116') {
      console.error("Error checking existing log:", existingLogError);
      return NextResponse.json({ error: existingLogError.message }, { status: 500 });
    }

    if (existingLog) {
      if (existingLog.completed_at) {
        return NextResponse.json({ error: "Routine already completed for this date" }, { status: 400 });
      }
      if (existingLog.started_at) {
        return NextResponse.json({ error: "Routine already started for this date" }, { status: 400 });
      }
    }

    // Create or update the routine log
    const logData = {
      routine_id: id,
      user_id: session.user.id,
      date: validatedData.date,
      started_at: new Date().toISOString(),
      completion_rate: 0
    };

    const { data: log, error: logError } = existingLog
      ? await supabase
          .from('routine_logs')
          .update({ started_at: logData.started_at })
          .eq('id', existingLog.id)
          .select()
          .single()
      : await supabase
          .from('routine_logs')
          .insert(logData)
          .select()
          .single();

    if (logError) {
      console.error("Error creating/updating routine log:", logError);
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    // Get routine steps to create step logs
    const { data: steps, error: stepsError } = await supabase
      .from('routine_steps')
      .select('id')
      .eq('routine_id', id)
      .order('order_index');

    if (stepsError) {
      console.error("Error fetching routine steps:", stepsError);
      return NextResponse.json({ error: stepsError.message }, { status: 500 });
    }

    // Create step logs if they don't exist
    if (steps && steps.length > 0) {
      const stepLogsToInsert = steps.map(step => ({
        routine_log_id: log.id,
        step_id: step.id,
        completed: false
      }));

      const { error: stepLogsError } = await supabase
        .from('routine_step_logs')
        .upsert(stepLogsToInsert, { 
          onConflict: 'routine_log_id,step_id',
          ignoreDuplicates: true 
        });

      if (stepLogsError) {
        console.error("Error creating step logs:", stepLogsError);
        // Don't fail the request if step logs creation fails
      }
    }

    return NextResponse.json({
      success: true,
      log,
      message: "Routine started successfully"
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error in routine start:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
