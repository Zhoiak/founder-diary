import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const CreateGoalSchema = z.object({
  projectId: z.string().uuid(),
  objective: z.string().min(2),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  key_results: z
    .array(
      z.object({
        name: z.string().min(1),
        target: z.number().optional(),
        unit: z.string().optional(),
      })
    )
    .default([]),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

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

  const { data: goals, error } = await supabase
    .from("goals")
    .select(`
      *,
      key_results (*)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ goals: goals || [] });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parse = CreateGoalSchema.safeParse(body);
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

  // Create the goal
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .insert({
      project_id: parse.data.projectId,
      user_id: session.user.id,
      objective: parse.data.objective,
      due_date: parse.data.due_date,
    })
    .select()
    .single();

  if (goalError) return NextResponse.json({ error: goalError.message }, { status: 400 });

  // Create key results if provided
  if (parse.data.key_results.length > 0) {
    const keyResultsData = parse.data.key_results.map((kr) => ({
      goal_id: goal.id,
      name: kr.name,
      target: kr.target,
      unit: kr.unit,
    }));

    const { data: keyResults, error: krError } = await supabase
      .from("key_results")
      .insert(keyResultsData)
      .select();

    if (krError) return NextResponse.json({ error: krError.message }, { status: 400 });

    return NextResponse.json({ goal: { ...goal, key_results: keyResults } }, { status: 201 });
  }

  return NextResponse.json({ goal: { ...goal, key_results: [] } }, { status: 201 });
}
