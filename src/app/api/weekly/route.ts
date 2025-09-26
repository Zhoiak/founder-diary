import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";
import { summarizeLogs } from "@/lib/ai";

const CreateWeeklyReviewSchema = z.object({
  projectId: z.string().uuid(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  week_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    console.log("Fetching weekly reviews for project:", projectId);
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

    const { data: reviews, error } = await supabase
      .from("weekly_reviews")
      .select("*")
      .eq("project_id", projectId)
      .order("week_start", { ascending: false });

    if (error) {
      console.error("Weekly reviews fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Fetched weekly reviews:", reviews?.length || 0);
    return NextResponse.json({ reviews: reviews || [] });

  } catch (error) {
    console.error("Error in GET /api/weekly:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Creating weekly review for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Weekly review request body:", body);
    
    const parse = CreateWeeklyReviewSchema.safeParse(body);
    if (!parse.success) {
      console.log("Weekly review validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }
    
    console.log("Weekly review validation passed:", parse.data);

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

    // Fetch daily logs for the week
    const { data: logs, error: logsError } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("project_id", parse.data.projectId)
      .gte("date", parse.data.week_start)
      .lte("date", parse.data.week_end)
      .order("date", { ascending: true });

    if (logsError) {
      console.error("Error fetching logs for weekly review:", logsError);
      return NextResponse.json({ error: logsError.message }, { status: 400 });
    }

    console.log("Found logs for weekly review:", logs?.length || 0);

    // Generate AI summary if logs exist
    let ai_summary = null;
    let content_md = "";

    if (logs && logs.length > 0) {
      try {
        ai_summary = await summarizeLogs(logs);
        console.log("Generated AI summary");
      } catch (error) {
        console.log("AI summary failed, continuing without it:", error);
      }

      // Generate basic markdown content
      content_md = `# Weekly Review: ${parse.data.week_start} to ${parse.data.week_end}

## Summary
${ai_summary || "This week you logged " + logs.length + " entries."}

## Daily Logs
${logs.map(log => `
### ${log.date} - ${log.title || "Daily Log"}
${log.content_md || "No content"}

**Tags:** ${log.tags?.join(", ") || "None"}  
**Mood:** ${log.mood ? "😊".repeat(log.mood) : "Not set"}  
**Time:** ${log.time_spent_minutes || 0} minutes
`).join("\n")}

## Key Insights
- Total logs: ${logs.length}
- Total time logged: ${logs.reduce((sum, log) => sum + (log.time_spent_minutes || 0), 0)} minutes
- Average mood: ${logs.filter(l => l.mood).length > 0 ? (logs.reduce((sum, log) => sum + (log.mood || 0), 0) / logs.filter(l => l.mood).length).toFixed(1) : "Not tracked"}

## Next Week Goals
_Add your goals for next week here..._
`;
    } else {
      content_md = `# Weekly Review: ${parse.data.week_start} to ${parse.data.week_end}

No daily logs found for this week. Consider adding some logs to track your progress!

## Next Week Goals
_Add your goals for next week here..._
`;
    }

    console.log("Creating weekly review in database");

    // Create the weekly review
    const { data: review, error: reviewError } = await supabase
      .from("weekly_reviews")
      .insert({
        project_id: parse.data.projectId,
        user_id: session.user.id,
        week_start: parse.data.week_start,
        week_end: parse.data.week_end,
        content_md,
        ai_summary,
      })
      .select()
      .single();

    if (reviewError) {
      console.error("Weekly review creation error:", reviewError);
      return NextResponse.json({ error: reviewError.message }, { status: 400 });
    }

    console.log("Weekly review created:", review);
    return NextResponse.json({ review }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/weekly:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
