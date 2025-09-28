import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const InvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).default('member'),
  message: z.string().optional()
});

export async function GET(
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

    // Check if user has admin access to this project
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', id)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get all invitations for this project
    const { data: invitations, error: invitationsError } = await supabase
      .from('project_invitations')
      .select(`
        id,
        invited_email,
        role,
        status,
        expires_at,
        created_at,
        invited_by,
        projects!inner(name)
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error("Error fetching invitations:", invitationsError);
      return NextResponse.json({ error: invitationsError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invitations: invitations || []
    });

  } catch (error: any) {
    console.error("Unexpected error in invitations GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Check if user has admin access to this project
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', id)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Validate request body
    const body = await req.json();
    const validatedData = InvitationSchema.parse(body);

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', id)
      .eq('user_id', session.user.id)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 400 });
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('project_invitations')
      .select('id, status')
      .eq('project_id', id)
      .eq('invited_email', validatedData.email)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json({ error: "Invitation already sent to this email" }, { status: 400 });
    }

    // Create the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('project_invitations')
      .insert({
        project_id: id,
        invited_by: session.user.id,
        invited_email: validatedData.email,
        role: validatedData.role,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Error creating invitation:", invitationError);
      return NextResponse.json({ error: invitationError.message }, { status: 500 });
    }

    // TODO: Send invitation email
    // await sendInvitationEmail(validatedData.email, invitation.invitation_token, projectName);

    // Log the activity
    await supabase
      .from('system_activity')
      .insert({
        user_id: session.user.id,
        action: 'invitation_sent',
        resource_type: 'project',
        resource_id: id,
        details: {
          invited_email: validatedData.email,
          role: validatedData.role,
          invitation_id: invitation.id
        }
      });

    return NextResponse.json({
      success: true,
      invitation,
      message: "Invitation sent successfully"
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error in invitations POST:", error);
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
    const url = new URL(req.url);
    const invitationId = url.searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID required" }, { status: 400 });
    }

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin access to this project
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', id)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from('project_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('project_id', id);

    if (deleteError) {
      console.error("Error deleting invitation:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Invitation cancelled successfully"
    });

  } catch (error: any) {
    console.error("Unexpected error in invitations DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
