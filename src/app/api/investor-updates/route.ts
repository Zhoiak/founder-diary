import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";
import { generateInvestorUpdate } from "@/lib/ai";

const CreateInvestorUpdateSchema = z.object({
  projectId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2030),
  content_md: z.string().optional(),
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

    console.log("Fetching investor updates for project:", projectId);
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

    const { data: updates, error } = await supabase
      .from("investor_updates")
      .select("*")
      .eq("project_id", projectId)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (error) {
      console.error("Investor updates fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Fetched investor updates:", updates?.length || 0);
    return NextResponse.json({ updates: updates || [] });

  } catch (error) {
    console.error("Error in GET /api/investor-updates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Creating investor update for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Investor update request body:", body);
    
    const parse = CreateInvestorUpdateSchema.safeParse(body);
    if (!parse.success) {
      console.log("Investor update validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }
    
    console.log("Investor update validation passed:", parse.data);

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

    // Check if update already exists for this month/year
    const { data: existing } = await supabase
      .from("investor_updates")
      .select("id")
      .eq("project_id", parse.data.projectId)
      .eq("month", parse.data.month)
      .eq("year", parse.data.year)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Update already exists for this month" }, { status: 400 });
    }

    let content_md = parse.data.content_md;
    let ai_summary = null;

    // If no content provided, generate it automatically
    if (!content_md) {
      console.log("Generating investor update content");

      // Fetch recent logs
      const startDate = new Date(parse.data.year, parse.data.month - 1, 1);
      const endDate = new Date(parse.data.year, parse.data.month, 0);
      
      const { data: logs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("project_id", parse.data.projectId)
        .gte("date", startDate.toISOString().split('T')[0])
        .lte("date", endDate.toISOString().split('T')[0])
        .order("date", { ascending: true });

      // Fetch goals
      const { data: goals } = await supabase
        .from("goals")
        .select("*, key_results(*)")
        .eq("project_id", parse.data.projectId);

      try {
        content_md = await generateInvestorUpdate(logs || [], goals || [], {});
        ai_summary = "Auto-generated from daily logs and goals";
      } catch (error) {
        console.log("AI generation failed, using fallback");
        content_md = `# Monthly Update - ${new Date(parse.data.year, parse.data.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

## Executive Summary
This month we continued building and iterating on our product.

## Key Activities
${logs?.slice(0, 5).map(log => `- ${log.title}`).join('\n') || '- No logs found for this period'}

## Goals Progress
${goals?.map(goal => `- **${goal.objective}**: ${goal.key_results?.length || 0} key results`).join('\n') || '- No active goals'}

## Next Month
- Continue execution on current priorities
- Address any blockers
- Maintain development momentum

*This update was generated automatically from your daily logs and goals.*`;
      }
    }

    // Generate public slug
    const publicSlug = `${parse.data.year}-${parse.data.month.toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 8)}`;

    console.log("Creating investor update in database");

    const { data: update, error: updateError } = await supabase
      .from("investor_updates")
      .insert({
        project_id: parse.data.projectId,
        user_id: session.user.id,
        month: parse.data.month,
        year: parse.data.year,
        content_md,
        ai_summary,
        public_slug: publicSlug,
        is_public: false, // Default to private
      })
      .select()
      .single();

    if (updateError) {
      console.error("Investor update creation error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    console.log("Investor update created:", update);
    return NextResponse.json({ update }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/investor-updates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
