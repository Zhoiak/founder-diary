import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";
import { generateInvestorUpdate } from "@/lib/ai";
import { slugify } from "@/lib/slug";

const InvestorUpdateSchema = z.object({
  projectId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parse = InvestorUpdateSchema.safeParse(body);
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

  // Get data for the month
  const startDate = `${parse.data.year}-${String(parse.data.month).padStart(2, "0")}-01`;
  const endDate = new Date(parse.data.year, parse.data.month, 0).toISOString().split("T")[0];

  // Get logs for the month
  const { data: logs, error: logsError } = await supabase
    .from("daily_logs")
    .select("date, title, content_md, tags, mood, time_spent_minutes")
    .eq("project_id", parse.data.projectId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (logsError) return NextResponse.json({ error: logsError.message }, { status: 400 });

  // Get goals
  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select(`
      *,
      key_results (*)
    `)
    .eq("project_id", parse.data.projectId);

  if (goalsError) return NextResponse.json({ error: goalsError.message }, { status: 400 });

  // Generate metrics summary
  const metrics = {
    totalLogs: logs?.length || 0,
    totalGoals: goals?.length || 0,
    avgMood: logs?.filter(l => l.mood).reduce((sum, l) => sum + (l.mood || 0), 0) / (logs?.filter(l => l.mood).length || 1),
    totalTimeSpent: logs?.reduce((sum, l) => sum + (l.time_spent_minutes || 0), 0) || 0,
  };

  // Generate AI content
  const aiContent = await generateInvestorUpdate(logs || [], goals || [], metrics);

  // Create unique slug
  const publicSlug = `${slugify(`update-${parse.data.year}-${String(parse.data.month).padStart(2, "0")}-${Date.now()}`)}`;

  // Create the investor update
  const { data: update, error: updateError } = await supabase
    .from("investor_updates")
    .insert({
      project_id: parse.data.projectId,
      user_id: session.user.id,
      month: parse.data.month,
      year: parse.data.year,
      content_md: aiContent,
      ai_summary: aiContent.substring(0, 500) + "...",
      public_slug: publicSlug,
      is_public: false,
    })
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({ update }, { status: 201 });
}
