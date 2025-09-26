import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const CreateHighlightSchema = z.object({
  item_id: z.string().uuid(),
  text: z.string().min(1).max(2000),
  note: z.string().optional(),
  page_number: z.number().int().min(1).optional(),
  location: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    console.log("Fetching highlights for item:", itemId);
    const supabase = await createServerSupabase();

    // Verify user has access to this item
    const { data: item, error: itemError } = await supabase
      .from("learning_items")
      .select("*, project_id")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
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
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    const { data: highlights, error } = await supabase
      .from("highlights")
      .select("*")
      .eq("item_id", itemId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Highlights fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Fetched highlights:", highlights?.length || 0);
    return NextResponse.json({ highlights: highlights || [] });

  } catch (error) {
    console.error("Error in GET /api/learning/highlights:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Creating highlight for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Highlight request body:", body);
    
    const parse = CreateHighlightSchema.safeParse(body);
    if (!parse.success) {
      console.log("Highlight validation error:", parse.error.flatten());
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

    console.log("Creating highlight in database");

    const { data: highlight, error: highlightError } = await supabase
      .from("highlights")
      .insert({
        item_id: parse.data.item_id,
        user_id: session.user.id,
        text: parse.data.text,
        note: parse.data.note,
        page_number: parse.data.page_number,
        location: parse.data.location,
      })
      .select()
      .single();

    if (highlightError) {
      console.error("Highlight creation error:", highlightError);
      return NextResponse.json({ error: highlightError.message }, { status: 400 });
    }

    console.log("Highlight created:", highlight);
    return NextResponse.json({ highlight }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/learning/highlights:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
