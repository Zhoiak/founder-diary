import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const CreateLearningItemSchema = z.object({
  projectId: z.string().uuid(),
  kind: z.enum(['book', 'article', 'podcast', 'course', 'video', 'paper']),
  title: z.string().min(1).max(500),
  author: z.string().optional(),
  source_url: z.string().url().optional(),
  isbn: z.string().optional(),
  status: z.enum(['want_to_read', 'reading', 'completed', 'paused']).default('want_to_read'),
  rating: z.number().int().min(1).max(5).optional(),
  started_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  finished_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes_md: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const kind = searchParams.get("kind");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    console.log("Fetching learning items for project:", projectId);
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
      .from("learning_items")
      .select(`
        *,
        highlights!left(id, text, note, created_at)
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (kind) query = query.eq("kind", kind);

    const { data: items, error } = await query;

    if (error) {
      console.error("Learning items fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Add stats to each item
    const itemsWithStats = items?.map(item => ({
      ...item,
      highlights_count: item.highlights?.length || 0,
      reading_progress: item.status === 'completed' ? 100 : 
                       item.status === 'reading' ? 50 : 
                       item.status === 'paused' ? 25 : 0
    })) || [];

    console.log("Fetched learning items:", itemsWithStats.length);
    return NextResponse.json({ items: itemsWithStats });

  } catch (error) {
    console.error("Error in GET /api/learning/items:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Creating learning item for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Learning item request body:", body);
    
    const parse = CreateLearningItemSchema.safeParse(body);
    if (!parse.success) {
      console.log("Learning item validation error:", parse.error.flatten());
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

    console.log("Creating learning item in database");

    const { data: item, error: itemError } = await supabase
      .from("learning_items")
      .insert({
        project_id: parse.data.projectId,
        user_id: session.user.id,
        kind: parse.data.kind,
        title: parse.data.title,
        author: parse.data.author,
        source_url: parse.data.source_url,
        isbn: parse.data.isbn,
        status: parse.data.status,
        rating: parse.data.rating,
        started_at: parse.data.started_at,
        finished_at: parse.data.finished_at,
        notes_md: parse.data.notes_md,
      })
      .select()
      .single();

    if (itemError) {
      console.error("Learning item creation error:", itemError);
      return NextResponse.json({ error: itemError.message }, { status: 400 });
    }

    console.log("Learning item created:", item);
    return NextResponse.json({ item }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/learning/items:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
