import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const UpdateInvestorUpdateSchema = z.object({
  content_md: z.string().optional(),
  is_public: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Fetching investor update:", params.id);
    const supabase = await createServerSupabase();

    const { data: update, error } = await supabase
      .from("investor_updates")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !update) {
      console.log("Update not found:", error);
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", update.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    return NextResponse.json({ update });
    
  } catch (error) {
    console.error("Error in GET /api/investor-updates/[id]:", error);
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

    console.log("Updating investor update:", params.id, "for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Update request body:", body);
    
    const parse = UpdateInvestorUpdateSchema.safeParse(body);
    if (!parse.success) {
      console.log("Validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }
    
    const supabase = await createServerSupabase();

    // First, verify the user has access to this update
    const { data: update, error: updateError } = await supabase
      .from("investor_updates")
      .select("*, project_id")
      .eq("id", params.id)
      .single();

    if (updateError || !update) {
      console.log("Update not found:", updateError);
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", update.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    // Update the investor update
    const { data: updatedUpdate, error: updateUpdateError } = await supabase
      .from("investor_updates")
      .update(parse.data)
      .eq("id", params.id)
      .select()
      .single();

    if (updateUpdateError) {
      console.error("Update update error:", updateUpdateError);
      return NextResponse.json({ error: updateUpdateError.message }, { status: 400 });
    }

    console.log("Investor update updated successfully");
    return NextResponse.json({ update: updatedUpdate });
    
  } catch (error) {
    console.error("Error in PATCH /api/investor-updates/[id]:", error);
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

    console.log("Deleting investor update:", params.id, "for user:", session.user.id);
    
    const supabase = await createServerSupabase();

    // First, verify the user has access to this update
    const { data: update, error: updateError } = await supabase
      .from("investor_updates")
      .select("*, project_id")
      .eq("id", params.id)
      .single();

    if (updateError || !update) {
      console.log("Update not found:", updateError);
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", update.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    // Delete the update
    const { error: deleteError } = await supabase
      .from("investor_updates")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      console.error("Update deletion error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    console.log("Investor update deleted successfully");
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error in DELETE /api/investor-updates/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
