import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const LogHabitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  done: z.boolean().default(true),
  note: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    console.log("Logging habit:", id, "for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Habit log request body:", body);
    
    const parse = LogHabitSchema.safeParse(body);
    if (!parse.success) {
      console.log("Habit log validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    // Verify habit exists and user has access
    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .select("*, project_id")
      .eq("id", id)
      .single();

    if (habitError || !habit) {
      console.log("Habit not found:", habitError);
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", habit.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    console.log("Creating/updating habit log");

    // Upsert the habit log (update if exists, insert if not)
    const { data: log, error: logError } = await supabase
      .from("habit_logs")
      .upsert({
        habit_id: id,
        user_id: session.user.id,
        date: parse.data.date,
        done: parse.data.done,
        note: parse.data.note,
      }, {
        onConflict: 'habit_id,date'
      })
      .select()
      .single();

    if (logError) {
      console.error("Habit log creation error:", logError);
      return NextResponse.json({ error: logError.message }, { status: 400 });
    }

    console.log("Habit log created/updated:", log);
    return NextResponse.json({ log }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/habits/[id]/log:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    console.log("Fetching habit logs for habit:", id);
    const supabase = await createServerSupabase();

    // Verify habit exists and user has access
    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .select("*, project_id")
      .eq("id", id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", habit.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    let query = supabase
      .from("habit_logs")
      .select("*")
      .eq("habit_id", id)
      .eq("user_id", session.user.id)
      .order("date", { ascending: false });

    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);

    const { data: logs, error } = await query;

    if (error) {
      console.error("Habit logs fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Fetched habit logs:", logs?.length || 0);
    return NextResponse.json({ logs: logs || [] });

  } catch (error) {
    console.error("Error in GET /api/habits/[id]/log:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
