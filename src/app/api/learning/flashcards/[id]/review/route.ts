import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const ReviewSchema = z.object({
  rating: z.number().min(0).max(3) // 0=again, 1=hard, 2=good, 3=easy
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
    const validatedData = ReviewSchema.parse(body);

    // Get current progress for this card
    const { data: currentProgress, error: progressError } = await supabase
      .from('card_learning_progress')
      .select('*')
      .eq('card_id', id)
      .eq('user_id', session.user.id)
      .single();

    if (progressError && progressError.code !== 'PGRST116') {
      console.error("Error fetching progress:", progressError);
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }

    // Calculate new values based on spaced repetition algorithm
    const currentEase = currentProgress?.ease_factor || 2.5;
    const currentInterval = currentProgress?.interval_days || 1;
    const currentReps = currentProgress?.repetitions || 0;
    const totalReviews = (currentProgress?.total_reviews || 0) + 1;
    const totalCorrect = currentProgress?.total_correct || 0;

    let newEase = currentEase;
    let newInterval = currentInterval;
    let newStage = currentProgress?.learning_stage || 'new';
    let newCorrect = totalCorrect;

    // Spaced Repetition Algorithm (simplified SM-2)
    if (validatedData.rating >= 2) {
      // Correct answer
      newCorrect = totalCorrect + 1;
      
      if (currentReps === 0) {
        newInterval = 1;
      } else if (currentReps === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(currentInterval * newEase);
      }
      
      // Adjust ease factor
      newEase = Math.max(1.3, currentEase + (0.1 - (3 - validatedData.rating) * (0.08 + (3 - validatedData.rating) * 0.02)));
      
      // Determine new stage
      if (newInterval >= 21) {
        newStage = 'mastered';
      } else if (newInterval >= 6) {
        newStage = 'review';
      } else {
        newStage = 'learning';
      }
    } else {
      // Incorrect answer - reset
      newInterval = 1;
      newStage = 'learning';
      newEase = Math.max(1.3, currentEase - 0.2);
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    // Update or insert progress
    const progressData = {
      card_id: id,
      user_id: session.user.id,
      learning_stage: newStage,
      ease_factor: newEase,
      interval_days: newInterval,
      repetitions: currentReps + 1,
      next_review_date: nextReviewDate.toISOString().split('T')[0],
      total_reviews: totalReviews,
      total_correct: newCorrect
    };

    let progressResult;
    if (currentProgress) {
      // Update existing progress
      progressResult = await supabase
        .from('card_learning_progress')
        .update(progressData)
        .eq('id', currentProgress.id)
        .select()
        .single();
    } else {
      // Insert new progress
      progressResult = await supabase
        .from('card_learning_progress')
        .insert(progressData)
        .select()
        .single();
    }

    if (progressResult.error) {
      console.error("Error updating progress:", progressResult.error);
      return NextResponse.json({ error: progressResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      progress: progressResult.data,
      message: `Card reviewed! Next review in ${newInterval} day${newInterval === 1 ? '' : 's'}`
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error in flashcard review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
