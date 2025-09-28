import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "current";

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin/dev (has user number)
    const { data: userProfile } = await supabase
      .from('user_numbers')
      .select('user_number')
      .eq('user_id', session.user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 });
    }

    let query = supabase
      .from('dev_notes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    // Filter by current page if specified
    if (page !== "all") {
      const currentUrl = req.headers.get('referer') || '';
      const pathname = new URL(currentUrl).pathname;
      query = query.eq('page_url', pathname);
    }

    const { data: notes, error } = await query.limit(20);

    if (error) {
      console.error("Error fetching dev notes:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notes: notes || []
    });

  } catch (error: any) {
    console.error("Unexpected error in dev notes GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin/dev
    const { data: userProfile } = await supabase
      .from('user_numbers')
      .select('user_number')
      .eq('user_id', session.user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { 
      page_url, 
      page_title, 
      section_context, 
      note_content, 
      note_type, 
      priority,
      browser_info 
    } = body;

    if (!note_content?.trim()) {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 });
    }

    // Create dev note
    const { data: note, error: noteError } = await supabase
      .from('dev_notes')
      .insert({
        user_id: session.user.id,
        page_url: page_url || '/',
        page_title: page_title || 'Unknown Page',
        section_context: section_context || 'Unknown Section',
        note_content: note_content.trim(),
        note_type: note_type || 'improvement',
        priority: priority || 3,
        browser_info: browser_info || {},
        viewport_size: browser_info?.viewport || 'unknown',
        user_agent: browser_info?.userAgent || 'unknown'
      })
      .select()
      .single();

    if (noteError) {
      console.error("Error creating dev note:", noteError);
      return NextResponse.json({ error: noteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      note
    }, { status: 201 });

  } catch (error: any) {
    console.error("Unexpected error in dev notes POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
