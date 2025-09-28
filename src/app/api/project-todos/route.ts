import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "pending";

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from('project_todos')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', status)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: todos, error } = await query;

    if (error) {
      console.error("Error fetching project todos:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group todos by category for better organization
    const todosByCategory = {
      monetization: todos?.filter(todo => todo.category === 'monetization') || [],
      system_improvements: todos?.filter(todo => todo.category === 'system_improvements') || [],
      additional_features: todos?.filter(todo => todo.category === 'additional_features') || []
    };

    // Calculate summary stats
    const summary = {
      total: todos?.length || 0,
      high_priority: todos?.filter(todo => todo.priority >= 4).length || 0,
      estimated_hours: todos?.reduce((sum, todo) => sum + (todo.estimated_hours || 0), 0) || 0,
      categories: Object.keys(todosByCategory).length
    };

    return NextResponse.json({
      success: true,
      todos: todos || [],
      todosByCategory,
      summary
    });

  } catch (error: any) {
    console.error("Unexpected error in project todos GET:", error);
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
    const { projectId, category, title, description, priority, estimatedHours, tags } = body;

    if (!title || !category) {
      return NextResponse.json({ error: "Title and category are required" }, { status: 400 });
    }

    // Create new todo
    const { data: todo, error: todoError } = await supabase
      .from('project_todos')
      .insert({
        user_id: session.user.id,
        project_id: projectId,
        category,
        title,
        description,
        priority: priority || 3,
        estimated_hours: estimatedHours,
        tags: tags || []
      })
      .select()
      .single();

    if (todoError) {
      console.error("Error creating todo:", todoError);
      return NextResponse.json({ error: todoError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      todo
    }, { status: 201 });

  } catch (error: any) {
    console.error("Unexpected error in project todos POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
