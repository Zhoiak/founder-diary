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
      .from('project_snapshots')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: snapshots, error } = await query;

    if (error) {
      console.error("Error fetching snapshots:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const latestSnapshot = snapshots?.[0] || null;

    return NextResponse.json({
      success: true,
      snapshots: snapshots || [],
      latestSnapshot,
      total: snapshots?.length || 0
    });

  } catch (error: any) {
    console.error("Unexpected error in snapshots GET:", error);
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

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Calculate current metrics
    const userId = session.user.id;

    // Get counts from various tables
    const [memoriesRes, flashcardsRes, habitsRes, booksRes, peopleRes] = await Promise.all([
      supabase.from('memories').select('id').eq('user_id', userId),
      supabase.from('flashcards').select('id').eq('user_id', userId),
      supabase.from('habits').select('id').eq('user_id', userId),
      supabase.from('books').select('id').eq('user_id', userId),
      supabase.from('people').select('id').eq('user_id', userId)
    ]);

    const totalMemories = memoriesRes.data?.length || 0;
    const totalFlashcards = flashcardsRes.data?.length || 0;
    const totalHabits = habitsRes.data?.length || 0;
    const totalBooks = booksRes.data?.length || 0;
    const totalPeople = peopleRes.data?.length || 0;

    // Calculate health score
    const healthScore = Math.min(100, 
      30 + // Base score
      (totalMemories * 10) + 
      (totalFlashcards * 5) + 
      (totalHabits * 8) +
      (totalBooks * 3) +
      (totalPeople * 2)
    );

    // Count features used (non-zero counts)
    const featuresUsed = [
      totalMemories > 0,
      totalFlashcards > 0,
      totalHabits > 0,
      totalBooks > 0,
      totalPeople > 0
    ].filter(Boolean).length;

    // Create new snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('project_snapshots')
      .insert({
        project_id: projectId,
        user_id: userId,
        total_memories: totalMemories,
        total_flashcards: totalFlashcards,
        total_habits: totalHabits,
        total_books: totalBooks,
        total_people: totalPeople,
        health_score: healthScore,
        completion_percentage: 100.0, // All 9 core features completed
        features_used_count: featuresUsed
      })
      .select()
      .single();

    if (snapshotError) {
      console.error("Error creating snapshot:", snapshotError);
      return NextResponse.json({ error: snapshotError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      snapshot,
      metrics: {
        healthScore,
        totalMemories,
        totalFlashcards,
        totalHabits,
        totalBooks,
        totalPeople,
        featuresUsed,
        completionPercentage: 100.0
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Unexpected error in snapshots POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
