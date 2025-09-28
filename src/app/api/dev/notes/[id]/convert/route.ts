import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the dev note
    const { data: note, error: noteError } = await supabase
      .from('dev_notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: "Dev note not found" }, { status: 404 });
    }

    if (note.status === 'converted_to_todo') {
      return NextResponse.json({ error: "Note already converted to TODO" }, { status: 409 });
    }

    // Get Personal project
    const { data: personalProject } = await supabase
      .from('projects')
      .select('id')
      .eq('name', 'Personal')
      .single();

    if (!personalProject) {
      return NextResponse.json({ error: "Personal project not found" }, { status: 404 });
    }

    // Create TODO from note
    const todoTitle = `Dev Note: ${note.note_content.substring(0, 50)}${note.note_content.length > 50 ? '...' : ''}`;
    const todoDescription = `${note.note_content}\n\n📍 Context: ${note.section_context}\n🔗 Page: ${note.page_url}\n📅 Created: ${new Date(note.created_at).toLocaleDateString()}`;
    
    const category = note.note_type === 'bug' ? 'system_improvements' :
                    note.note_type === 'feature' ? 'additional_features' : 'system_improvements';
    
    const estimatedHours = note.note_type === 'bug' ? 8 :
                          note.note_type === 'feature' ? 20 : 10;

    const { data: todo, error: todoError } = await supabase
      .from('project_todos')
      .insert({
        user_id: session.user.id,
        project_id: personalProject.id,
        category,
        title: todoTitle,
        description: todoDescription,
        priority: note.priority,
        estimated_hours: estimatedHours,
        tags: ['dev-note', note.note_type, 'auto-generated']
      })
      .select()
      .single();

    if (todoError) {
      console.error("Error creating TODO:", todoError);
      return NextResponse.json({ error: todoError.message }, { status: 500 });
    }

    // Update the dev note
    const { error: updateError } = await supabase
      .from('dev_notes')
      .update({
        status: 'converted_to_todo',
        converted_to_todo_id: todo.id,
        auto_generated_todo: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error("Error updating dev note:", updateError);
      // Don't fail the conversion, just log the error
    }

    return NextResponse.json({
      success: true,
      todo,
      message: "Dev note converted to TODO successfully"
    });

  } catch (error: any) {
    console.error("Unexpected error in dev note convert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
