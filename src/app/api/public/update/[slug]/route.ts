import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = await createServerSupabase();

  const { data: update, error } = await supabase
    .from("investor_updates")
    .select(`
      id,
      month,
      year,
      content_md,
      ai_summary,
      created_at,
      projects (
        name,
        slug
      )
    `)
    .eq("public_slug", params.slug)
    .eq("is_public", true)
    .single();

  if (error || !update) {
    return NextResponse.json({ error: "Update not found or not public" }, { status: 404 });
  }

  return NextResponse.json({ update });
}
