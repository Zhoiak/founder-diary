import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const due = url.searchParams.get('due') === 'true';

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get flashcards with their learning progress
    let query = supabase
      .from('flashcards')
      .select(`
        id,
        deck_id,
        front_content,
        back_content,
        hint,
        card_order,
        is_active,
        card_learning_progress (
          learning_stage,
          ease_factor,
          interval_days,
          repetitions,
          next_review_date,
          total_reviews,
          total_correct
        )
      `)
      .eq('user_id', session.user.id)
      .eq('is_active', true);

    // Note: We'll filter by project after getting the data since we removed the join

    const { data: flashcards, error: flashcardsError } = await query;

    if (flashcardsError) {
      console.error("Error fetching flashcards:", flashcardsError);
      return NextResponse.json({ error: flashcardsError.message }, { status: 500 });
    }

    // Process flashcards and filter if needed
    const today = new Date().toISOString().split('T')[0];
    
    const processedCards = flashcards?.map(card => {
      const progress = card.card_learning_progress?.[0];
      
      return {
        id: card.id,
        front: card.front_content,
        back: card.back_content,
        hint: card.hint,
        deck_name: 'General', // We'll get the deck name separately if needed
        repetitions: progress?.repetitions || 0,
        interval_days: progress?.interval_days || 1,
        ease_factor: progress?.ease_factor || 2.5,
        next_review: progress?.next_review_date || today,
        learning_stage: progress?.learning_stage || 'new',
        total_reviews: progress?.total_reviews || 0,
        total_correct: progress?.total_correct || 0
      };
    }) || [];

    // Filter due cards if requested
    const filteredCards = due 
      ? processedCards.filter(card => card.next_review <= today)
      : processedCards;

    // Calculate stats
    const stats = {
      total: processedCards.length,
      due: processedCards.filter(card => card.next_review <= today).length,
      new: processedCards.filter(card => card.learning_stage === 'new').length,
      learning: processedCards.filter(card => card.learning_stage === 'learning').length,
      mature: processedCards.filter(card => card.learning_stage === 'mastered').length
    };

    return NextResponse.json({
      success: true,
      flashcards: filteredCards,
      stats
    });

  } catch (error: any) {
    console.error("Unexpected error in flashcards GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
