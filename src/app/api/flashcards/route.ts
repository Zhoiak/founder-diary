import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const CreateFlashcardSchema = z.object({
  projectId: z.string().uuid(),
  front: z.string().min(1).max(1000),
  back: z.string().min(1).max(2000),
  source_highlight_id: z.string().uuid().optional(),
  deck_name: z.string().default("General"),
});

const ReviewFlashcardSchema = z.object({
  rating: z.number().int().min(0).max(5), // SM-2 algorithm: 0=again, 1=hard, 2=good, 3=easy
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const deck = searchParams.get("deck");
    const due = searchParams.get("due"); // "true" to get only due cards

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    console.log("Fetching flashcards for project:", projectId);
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
      .from("flashcards")
      .select(`
        *,
        highlights(text, learning_items(title))
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (deck) query = query.eq("deck_name", deck);
    
    if (due === "true") {
      const now = new Date().toISOString();
      query = query.or(`next_review.is.null,next_review.lte.${now}`);
    }

    const { data: flashcards, error } = await query;

    if (error) {
      console.error("Flashcards fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Calculate stats
    const now = new Date();
    const stats = {
      total: flashcards?.length || 0,
      due: flashcards?.filter(card => 
        !card.next_review || new Date(card.next_review) <= now
      ).length || 0,
      new: flashcards?.filter(card => card.repetitions === 0).length || 0,
      learning: flashcards?.filter(card => 
        card.repetitions > 0 && card.interval_days < 21
      ).length || 0,
      mature: flashcards?.filter(card => card.interval_days >= 21).length || 0,
    };

    console.log("Fetched flashcards:", flashcards?.length || 0, "Stats:", stats);
    return NextResponse.json({ flashcards: flashcards || [], stats });

  } catch (error) {
    console.error("Error in GET /api/flashcards:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Creating flashcard for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Flashcard request body:", body);
    
    const parse = CreateFlashcardSchema.safeParse(body);
    if (!parse.success) {
      console.log("Flashcard validation error:", parse.error.flatten());
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
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    console.log("Creating flashcard in database");

    const { data: flashcard, error: flashcardError } = await supabase
      .from("flashcards")
      .insert({
        project_id: parse.data.projectId,
        user_id: session.user.id,
        front: parse.data.front,
        back: parse.data.back,
        source_highlight_id: parse.data.source_highlight_id,
        deck_name: parse.data.deck_name,
        next_review: new Date().toISOString(), // Available immediately
      })
      .select()
      .single();

    if (flashcardError) {
      console.error("Flashcard creation error:", flashcardError);
      return NextResponse.json({ error: flashcardError.message }, { status: 400 });
    }

    console.log("Flashcard created:", flashcard);
    return NextResponse.json({ flashcard }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/flashcards:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
