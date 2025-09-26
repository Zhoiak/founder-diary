import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const GenerateFlashcardsSchema = z.object({
  item_id: z.string().uuid(),
  deck_name: z.string().default("Generated"),
  highlight_ids: z.array(z.string().uuid()).optional(), // If not provided, use all highlights
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Generating flashcards from highlights for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Generate flashcards request body:", body);
    
    const parse = GenerateFlashcardsSchema.safeParse(body);
    if (!parse.success) {
      console.log("Generate flashcards validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    // Verify user has access to this item
    const { data: item, error: itemError } = await supabase
      .from("learning_items")
      .select("*, project_id")
      .eq("id", parse.data.item_id)
      .single();

    if (itemError || !item) {
      console.log("Item not found:", itemError);
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", item.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    // Get highlights to convert
    let highlightsQuery = supabase
      .from("highlights")
      .select("*")
      .eq("item_id", parse.data.item_id)
      .eq("user_id", session.user.id);

    if (parse.data.highlight_ids && parse.data.highlight_ids.length > 0) {
      highlightsQuery = highlightsQuery.in("id", parse.data.highlight_ids);
    }

    const { data: highlights, error: highlightsError } = await highlightsQuery;

    if (highlightsError) {
      console.error("Highlights fetch error:", highlightsError);
      return NextResponse.json({ error: highlightsError.message }, { status: 400 });
    }

    if (!highlights || highlights.length === 0) {
      return NextResponse.json({ error: "No highlights found to convert" }, { status: 400 });
    }

    console.log("Converting", highlights.length, "highlights to flashcards");

    // Generate flashcards from highlights
    const flashcardsToCreate = highlights.map(highlight => {
      // Create question-answer pairs from highlights
      let front: string;
      let back: string;

      if (highlight.note) {
        // If there's a note, use it as the question and highlight as answer
        front = highlight.note;
        back = highlight.text;
      } else {
        // Create a fill-in-the-blank or question from the highlight
        const text = highlight.text;
        const words = text.split(' ');
        
        if (words.length > 10) {
          // For longer highlights, create a fill-in-the-blank
          const keyWordIndex = Math.floor(words.length / 2);
          const keyWord = words[keyWordIndex];
          const questionText = words.map((word, index) => 
            index === keyWordIndex ? '______' : word
          ).join(' ');
          
          front = `Fill in the blank: ${questionText}`;
          back = keyWord;
        } else {
          // For shorter highlights, ask for the complete text
          front = `What is the key insight about: ${item.title}?`;
          back = text;
        }
      }

      return {
        project_id: item.project_id,
        user_id: session.user.id,
        front,
        back,
        source_highlight_id: highlight.id,
        deck_name: parse.data.deck_name,
        next_review: new Date().toISOString(), // Available immediately
      };
    });

    // Insert flashcards
    const { data: createdFlashcards, error: createError } = await supabase
      .from("flashcards")
      .insert(flashcardsToCreate)
      .select();

    if (createError) {
      console.error("Flashcards creation error:", createError);
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    console.log("Created", createdFlashcards?.length || 0, "flashcards from highlights");
    return NextResponse.json({ 
      flashcards: createdFlashcards || [],
      count: createdFlashcards?.length || 0,
      source_item: {
        id: item.id,
        title: item.title,
        author: item.author
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/flashcards/from-highlights:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
