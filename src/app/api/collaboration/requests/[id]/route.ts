import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function PATCH(
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

    const body = await req.json();
    const { action } = body; // 'accept', 'reject', 'cancel'

    if (!['accept', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get the request first to validate permissions
    const { data: request, error: requestError } = await supabase
      .from('collaboration_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Validate permissions
    if (action === 'cancel' && request.requester_id !== session.user.id) {
      return NextResponse.json({ error: "Only requester can cancel" }, { status: 403 });
    }

    if ((action === 'accept' || action === 'reject') && request.target_id !== session.user.id) {
      return NextResponse.json({ error: "Only target user can accept/reject" }, { status: 403 });
    }

    // Update request status
    const newStatus = action === 'accept' ? 'accepted' : 
                     action === 'reject' ? 'rejected' : 'cancelled';

    const { data: updatedRequest, error: updateError } = await supabase
      .from('collaboration_requests')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        requester:user_numbers!collaboration_requests_requester_id_fkey(user_number, display_name),
        target:user_numbers!collaboration_requests_target_id_fkey(user_number, display_name),
        project:projects(name)
      `)
      .single();

    if (updateError) {
      console.error("Error updating request:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If accepted, create collaboration
    if (action === 'accept') {
      const { error: collaborationError } = await supabase
        .from('collaborations')
        .insert({
          owner_id: request.target_id,
          collaborator_id: request.requester_id,
          project_id: request.project_id,
          permissions: request.permissions,
          status: 'active'
        });

      if (collaborationError) {
        console.error("Error creating collaboration:", collaborationError);
        // Don't fail the request update, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: `Request ${action}ed successfully`
    });

  } catch (error: any) {
    console.error("Unexpected error in request PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete request (only requester can delete)
    const { error: deleteError } = await supabase
      .from('collaboration_requests')
      .delete()
      .eq('id', id)
      .eq('requester_id', session.user.id);

    if (deleteError) {
      console.error("Error deleting request:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Request deleted successfully"
    });

  } catch (error: any) {
    console.error("Unexpected error in request DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
