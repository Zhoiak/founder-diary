import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const CreateLogSchema = z.object({
  projectId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1).max(200),
  content_md: z.string().default(""),
  tags: z.array(z.string()).default([]),
  mood: z.number().int().min(1).max(5).optional(),
  time_spent_minutes: z.number().int().min(0).max(24 * 60).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // Verify user has access to this project
  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", session.user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "access denied" }, { status: 403 });
  }

  let query = supabase
    .from("daily_logs")
    .select("*")
    .eq("project_id", projectId)
    .order("date", { ascending: false });

  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ logs: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Creating log for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Log request body:", body);
    
    const parse = CreateLogSchema.safeParse(body);
    if (!parse.success) {
      console.log("Log validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }
    
    console.log("Log validation passed:", parse.data);

    const supabase = await createServerSupabase();

    // Verify user has access to this project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", parse.data.projectId)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    console.log("Creating log in database");

    const { data: log, error } = await supabase
      .from("daily_logs")
      .insert({
        project_id: parse.data.projectId,
        user_id: session.user.id,
        date: parse.data.date,
        title: parse.data.title,
        content_md: parse.data.content_md,
        tags: parse.data.tags,
        mood: parse.data.mood,
        time_spent_minutes: parse.data.time_spent_minutes,
      })
      .select()
      .single();

    if (error) {
      console.error("Log creation error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Log created:", log);
    return NextResponse.json({ log }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
