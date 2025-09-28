import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'sent' or 'received'

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from('collaboration_requests')
      .select(`
        *,
        requester:user_numbers!collaboration_requests_requester_id_fkey(user_number, display_name, avatar_url),
        target:user_numbers!collaboration_requests_target_id_fkey(user_number, display_name, avatar_url),
        project:projects(name, description)
      `)
      .order('created_at', { ascending: false });

    if (type === 'sent') {
      query = query.eq('requester_id', session.user.id);
    } else if (type === 'received') {
      query = query.eq('target_id', session.user.id);
    } else {
      // Get both sent and received
      query = query.or(`requester_id.eq.${session.user.id},target_id.eq.${session.user.id}`);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("Error fetching collaboration requests:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      requests: requests || []
    });

  } catch (error: any) {
    console.error("Unexpected error in collaboration requests GET:", error);
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
    const { target_user_number, project_id, message, permissions } = body;

    if (!target_user_number) {
      return NextResponse.json({ error: "Target user number is required" }, { status: 400 });
    }

    // Find target user by number
    const { data: targetUser, error: targetError } = await supabase
      .from('user_numbers')
      .select('user_id')
      .eq('user_number', parseInt(target_user_number.toString().replace('#', '')))
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from('collaboration_requests')
      .select('id')
      .eq('requester_id', session.user.id)
      .eq('target_id', targetUser.user_id)
      .eq('project_id', project_id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json({ error: "Collaboration request already exists" }, { status: 409 });
    }

    // Create collaboration request
    const { data: request, error: requestError } = await supabase
      .from('collaboration_requests')
      .insert({
        requester_id: session.user.id,
        target_id: targetUser.user_id,
        project_id,
        message,
        permissions: permissions || ['read']
      })
      .select(`
        *,
        requester:user_numbers!collaboration_requests_requester_id_fkey(user_number, display_name),
        target:user_numbers!collaboration_requests_target_id_fkey(user_number, display_name),
        project:projects(name)
      `)
      .single();

    if (requestError) {
      console.error("Error creating collaboration request:", requestError);
      return NextResponse.json({ error: requestError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      request
    }, { status: 201 });

  } catch (error: any) {
    console.error("Unexpected error in collaboration requests POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
