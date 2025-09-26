import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";
import { summarizeLogs } from "@/lib/ai";

const WeeklyReviewSchema = z.object({
  projectId: z.string().uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parse = WeeklyReviewSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // Verify user has access to this project
  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", parse.data.projectId)
    .eq("user_id", session.user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "access denied" }, { status: 403 });
  }

  // Get logs for the date range
  const { data: logs, error: logsError } = await supabase
    .from("daily_logs")
    .select("date, title, content_md, tags, mood, time_spent_minutes")
    .eq("project_id", parse.data.projectId)
    .gte("date", parse.data.from)
    .lte("date", parse.data.to)
    .order("date", { ascending: true });

  if (logsError) return NextResponse.json({ error: logsError.message }, { status: 400 });

  // Generate AI summary
  const aiSummary = await summarizeLogs(logs || []);

  // Create the weekly review
  const { data: review, error: reviewError } = await supabase
    .from("weekly_reviews")
    .insert({
      project_id: parse.data.projectId,
      user_id: session.user.id,
      week_start: parse.data.from,
      week_end: parse.data.to,
      content_md: aiSummary,
      ai_summary: aiSummary,
    })
    .select()
    .single();

  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 400 });

  return NextResponse.json({ review }, { status: 201 });
}
