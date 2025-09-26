import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const CreateDecisionSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  context_md: z.string().optional(),
  options_md: z.string().optional(),
  decision_md: z.string().optional(),
  consequences_md: z.string().optional(),
  relates_to: z.array(z.string()).optional(),
});

const UpdateDecisionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  context_md: z.string().optional(),
  options_md: z.string().optional(),
  decision_md: z.string().optional(),
  consequences_md: z.string().optional(),
  status: z.enum(['proposed', 'accepted', 'superseded']).optional(),
  relates_to: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    console.log("Fetching decisions for project:", projectId);
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
      .from("decisions")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: decisions, error } = await query;

    if (error) {
      console.error("Decisions fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Fetched decisions:", decisions?.length || 0);
    return NextResponse.json({ decisions: decisions || [] });

  } catch (error) {
    console.error("Error in GET /api/decisions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Creating decision for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Decision request body:", body);
    
    const parse = CreateDecisionSchema.safeParse(body);
    if (!parse.success) {
      console.log("Decision validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }
    
    console.log("Decision validation passed:", parse.data);

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

    console.log("Creating decision in database");

    // Create the decision
    const { data: decision, error: decisionError } = await supabase
      .from("decisions")
      .insert({
        project_id: parse.data.projectId,
        user_id: session.user.id,
        title: parse.data.title,
        context_md: parse.data.context_md,
        options_md: parse.data.options_md,
        decision_md: parse.data.decision_md,
        consequences_md: parse.data.consequences_md,
        relates_to: parse.data.relates_to || [],
      })
      .select()
      .single();

    if (decisionError) {
      console.error("Decision creation error:", decisionError);
      return NextResponse.json({ error: decisionError.message }, { status: 400 });
    }

    console.log("Decision created:", decision);
    return NextResponse.json({ decision }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/decisions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
