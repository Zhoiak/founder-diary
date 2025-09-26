import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const ReviewFlashcardSchema = z.object({
  rating: z.number().int().min(0).max(5), // 0=again, 1=hard, 2=good, 3=easy, 4=very easy, 5=perfect
});

// SM-2 Spaced Repetition Algorithm
function calculateNextReview(rating: number, repetitions: number, easeFactor: number, intervalDays: number) {
  let newEaseFactor = easeFactor;
  let newRepetitions = repetitions;
  let newInterval = intervalDays;

  if (rating >= 3) {
    // Correct response
    newRepetitions += 1;
    
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(intervalDays * easeFactor);
    }
    
    // Adjust ease factor
    newEaseFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  } else {
    // Incorrect response - reset repetitions but keep ease factor
    newRepetitions = 0;
    newInterval = 1;
  }

  // Ensure ease factor doesn't go below 1.3
  newEaseFactor = Math.max(1.3, newEaseFactor);

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    repetitions: newRepetitions,
    interval_days: newInterval,
    ease_factor: newEaseFactor,
    next_review: nextReview.toISOString(),
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    console.log("Reviewing flashcard:", id, "by user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Review request body:", body);
    
    const parse = ReviewFlashcardSchema.safeParse(body);
    if (!parse.success) {
      console.log("Review validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    // Get current flashcard
    const { data: flashcard, error: flashcardError } = await supabase
      .from("flashcards")
      .select("*, project_id")
      .eq("id", id)
      .single();

    if (flashcardError || !flashcard) {
      console.log("Flashcard not found:", flashcardError);
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", flashcard.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    // Calculate next review using SM-2 algorithm
    const nextReviewData = calculateNextReview(
      parse.data.rating,
      flashcard.repetitions || 0,
      flashcard.ease_factor || 2.5,
      flashcard.interval_days || 1
    );

    console.log("SM-2 calculation:", {
      rating: parse.data.rating,
      current: {
        repetitions: flashcard.repetitions,
        interval: flashcard.interval_days,
        ease: flashcard.ease_factor
      },
      next: nextReviewData
    });

    // Update flashcard
    const { data: updatedFlashcard, error: updateError } = await supabase
      .from("flashcards")
      .update({
        last_reviewed: new Date().toISOString(),
        ...nextReviewData,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Flashcard update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    console.log("Flashcard reviewed and updated:", updatedFlashcard);
    return NextResponse.json({ 
      flashcard: updatedFlashcard,
      review_result: {
        rating: parse.data.rating,
        next_review_in_days: nextReviewData.interval_days,
        ease_factor: nextReviewData.ease_factor,
        repetitions: nextReviewData.repetitions,
      }
    });
    
  } catch (error) {
    console.error("Error in POST /api/flashcards/[id]/review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
