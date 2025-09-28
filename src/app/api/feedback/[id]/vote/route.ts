import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const VoteSchema = z.object({
  vote_type: z.enum(['upvote', 'downvote'])
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await req.json();
    const validatedData = VoteSchema.parse(body);

    // Check if feedback exists
    const { data: feedback, error: feedbackError } = await supabase
      .from('user_feedback')
      .select('id, title')
      .eq('id', id)
      .single();

    if (feedbackError || !feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    // Check if user already voted
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('feedback_votes')
      .select('id, vote_type')
      .eq('feedback_id', id)
      .eq('user_id', session.user.id)
      .single();

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      console.error("Error checking existing vote:", voteCheckError);
      return NextResponse.json({ error: voteCheckError.message }, { status: 500 });
    }

    if (existingVote) {
      if (existingVote.vote_type === validatedData.vote_type) {
        // Same vote type - remove the vote (toggle off)
        const { error: deleteError } = await supabase
          .from('feedback_votes')
          .delete()
          .eq('id', existingVote.id);

        if (deleteError) {
          console.error("Error removing vote:", deleteError);
          return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          action: 'removed',
          message: "Vote removed"
        });
      } else {
        // Different vote type - update the vote
        const { error: updateError } = await supabase
          .from('feedback_votes')
          .update({ vote_type: validatedData.vote_type })
          .eq('id', existingVote.id);

        if (updateError) {
          console.error("Error updating vote:", updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          action: 'updated',
          vote_type: validatedData.vote_type,
          message: "Vote updated"
        });
      }
    } else {
      // No existing vote - create new vote
      const { error: createError } = await supabase
        .from('feedback_votes')
        .insert({
          feedback_id: id,
          user_id: session.user.id,
          vote_type: validatedData.vote_type
        });

      if (createError) {
        console.error("Error creating vote:", createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'created',
        vote_type: validatedData.vote_type,
        message: "Vote recorded"
      });
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error in feedback vote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
