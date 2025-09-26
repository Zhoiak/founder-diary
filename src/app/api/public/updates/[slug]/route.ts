import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    console.log("Fetching public investor update:", params.slug);
    const supabase = await createServerSupabase();

    // Fetch the public update with project info
    const { data: update, error } = await supabase
      .from("investor_updates")
      .select(`
        *,
        projects!inner(name, slug)
      `)
      .eq("public_slug", params.slug)
      .eq("is_public", true)
      .single();

    if (error || !update) {
      console.log("Public update not found:", error);
      return NextResponse.json({ error: "Update not found or not public" }, { status: 404 });
    }

    // Don't expose sensitive fields
    const publicUpdate = {
      id: update.id,
      month: update.month,
      year: update.year,
      content_md: update.content_md,
      ai_summary: update.ai_summary,
      created_at: update.created_at,
      project: {
        name: update.projects.name,
        slug: update.projects.slug
      }
    };

    console.log("Public update found:", publicUpdate.id);
    return NextResponse.json({ update: publicUpdate });
    
  } catch (error) {
    console.error("Error in GET /api/public/updates/[slug]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
