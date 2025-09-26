import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const UpdateWeeklyReviewSchema = z.object({
  content_md: z.string(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Updating weekly review:", params.id, "for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Update request body:", body);
    
    const parse = UpdateWeeklyReviewSchema.safeParse(body);
    if (!parse.success) {
      console.log("Validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }
    
    const supabase = await createServerSupabase();

    // First, verify the user has access to this review
    const { data: review, error: reviewError } = await supabase
      .from("weekly_reviews")
      .select(`
        *,
        project_id
      `)
      .eq("id", params.id)
      .single();

    if (reviewError || !review) {
      console.log("Review not found:", reviewError);
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", review.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    // Update the review
    const { data: updatedReview, error: updateError } = await supabase
      .from("weekly_reviews")
      .update({
        content_md: parse.data.content_md,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      console.error("Review update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    console.log("Review updated successfully");
    return NextResponse.json({ review: updatedReview });
    
  } catch (error) {
    console.error("Error in PATCH /api/weekly/[id]:", error);
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

    console.log("Deleting weekly review:", params.id, "for user:", session.user.id);
    
    const supabase = await createServerSupabase();

    // First, verify the user has access to this review
    const { data: review, error: reviewError } = await supabase
      .from("weekly_reviews")
      .select(`
        *,
        project_id
      `)
      .eq("id", params.id)
      .single();

    if (reviewError || !review) {
      console.log("Review not found:", reviewError);
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", review.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    // Delete the review
    const { error: deleteError } = await supabase
      .from("weekly_reviews")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      console.error("Review deletion error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    console.log("Review deleted successfully");
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error in DELETE /api/weekly/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
