import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const CreateNoteSchema = z.object({
  module_name: z.string().min(1, "Module name is required"),
  title: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  note_type: z.enum(['reminder', 'idea', 'todo', 'warning', 'info']).default('reminder'),
  color: z.string().default('#FEF3C7'),
  icon: z.string().default('📝'),
  priority: z.number().min(1).max(5).default(1),
  is_pinned: z.boolean().default(true),
  is_visible: z.boolean().default(true)
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const url = new URL(req.url);
    const module = url.searchParams.get('module');

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from('static_notes')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_visible', true)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    // Filter by module if specified
    if (module) {
      query = query.eq('module_name', module);
    }

    const { data: notes, error: notesError } = await query;

    if (notesError) {
      console.error("Error fetching static notes:", notesError);
      return NextResponse.json({ error: notesError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notes: notes || []
    });

  } catch (error: any) {
    console.error("Unexpected error in static notes GET:", error);
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

    // Validate request body
    const body = await req.json();
    const validatedData = CreateNoteSchema.parse(body);

    // Get user's personal project (or create if needed)
    let projectId = null;
    try {
      const { data: personalProject } = await supabase
        .rpc('ensure_personal_project_exists', { user_id: session.user.id });
      projectId = personalProject;
    } catch (error) {
      console.warn("Could not ensure personal project, proceeding without project_id");
    }

    // Create the note
    const { data: note, error: noteError } = await supabase
      .from('static_notes')
      .insert({
        user_id: session.user.id,
        project_id: projectId,
        module_name: validatedData.module_name,
        title: validatedData.title,
        content: validatedData.content,
        note_type: validatedData.note_type,
        color: validatedData.color,
        icon: validatedData.icon,
        priority: validatedData.priority,
        is_pinned: validatedData.is_pinned,
        is_visible: validatedData.is_visible
      })
      .select()
      .single();

    if (noteError) {
      console.error("Error creating static note:", noteError);
      return NextResponse.json({ error: noteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      note,
      message: "Note created successfully"
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error in static notes POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
