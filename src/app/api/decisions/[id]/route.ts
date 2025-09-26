import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const UpdateDecisionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  context_md: z.string().optional(),
  options_md: z.string().optional(),
  decision_md: z.string().optional(),
  consequences_md: z.string().optional(),
  status: z.enum(['proposed', 'accepted', 'superseded']).optional(),
  relates_to: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Fetching decision:", params.id);
    const supabase = await createServerSupabase();

    const { data: decision, error } = await supabase
      .from("decisions")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !decision) {
      console.log("Decision not found:", error);
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", decision.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    return NextResponse.json({ decision });
    
  } catch (error) {
    console.error("Error in GET /api/decisions/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Updating decision:", params.id, "for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Update request body:", body);
    
    const parse = UpdateDecisionSchema.safeParse(body);
    if (!parse.success) {
      console.log("Validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }
    
    const supabase = await createServerSupabase();

    // First, verify the user has access to this decision
    const { data: decision, error: decisionError } = await supabase
      .from("decisions")
      .select("*, project_id")
      .eq("id", params.id)
      .single();

    if (decisionError || !decision) {
      console.log("Decision not found:", decisionError);
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", decision.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    // Update the decision
    const { data: updatedDecision, error: updateError } = await supabase
      .from("decisions")
      .update(parse.data)
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      console.error("Decision update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    console.log("Decision updated successfully");
    return NextResponse.json({ decision: updatedDecision });
    
  } catch (error) {
    console.error("Error in PATCH /api/decisions/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Deleting decision:", params.id, "for user:", session.user.id);
    
    const supabase = await createServerSupabase();

    // First, verify the user has access to this decision
    const { data: decision, error: decisionError } = await supabase
      .from("decisions")
      .select("*, project_id")
      .eq("id", params.id)
      .single();

    if (decisionError || !decision) {
      console.log("Decision not found:", decisionError);
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", decision.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    // Delete the decision
    const { error: deleteError } = await supabase
      .from("decisions")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      console.error("Decision deletion error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    console.log("Decision deleted successfully");
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error in DELETE /api/decisions/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
