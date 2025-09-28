import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from('learning_decks')
      .select(`
        *,
        flashcards (
          id,
          front_content,
          back_content,
          hint,
          card_order,
          is_active
        ),
        card_learning_progress (
          learning_stage,
          next_review_date,
          total_reviews,
          total_correct
        )
      `)
      .eq('user_id', session.user.id);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    query = query.order('created_at', { ascending: false });

    const { data: decks, error: decksError } = await query;

    if (decksError) {
      console.error("Error fetching learning decks:", decksError);
      return NextResponse.json({ error: decksError.message }, { status: 500 });
    }

    // Calculate flashcard stats
    let totalCards = 0;
    let dueCards = 0;
    let newCards = 0;
    let learningCards = 0;
    let matureCards = 0;

    const today = new Date().toISOString().split('T')[0];

    decks?.forEach(deck => {
      deck.flashcards?.forEach((card: any) => {
        if (!card.is_active) return;
        
        totalCards++;
        
        const progress = deck.card_learning_progress?.find((p: any) => p.card_id === card.id);
        
        if (!progress || progress.learning_stage === 'new') {
          newCards++;
          if (!progress || progress.next_review_date <= today) {
            dueCards++;
          }
        } else if (progress.learning_stage === 'learning') {
          learningCards++;
          if (progress.next_review_date <= today) {
            dueCards++;
          }
        } else if (progress.learning_stage === 'mastered') {
          matureCards++;
          if (progress.next_review_date <= today) {
            dueCards++;
          }
        }
      });
    });

    const stats = {
      total: totalCards,
      due: dueCards,
      new: newCards,
      learning: learningCards,
      mature: matureCards
    };

    return NextResponse.json({
      success: true,
      decks: decks || [],
      stats
    });

  } catch (error: any) {
    console.error("Unexpected error in learning decks GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
