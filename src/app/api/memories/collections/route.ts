import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from('memory_collections')
      .select(`
        *,
        memory_collection_items!left (
          id
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: collections, error } = await query;

    if (error) {
      console.error("Error fetching collections:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add memory count to each collection
    const collectionsWithCount = collections?.map(collection => ({
      ...collection,
      memory_count: collection.memory_collection_items?.length || 0
    })) || [];

    return NextResponse.json({
      success: true,
      collections: collectionsWithCount
    });

  } catch (error: any) {
    console.error("Unexpected error in collections GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
