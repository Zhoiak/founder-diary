import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, current_password, new_password, new_email } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    switch (action) {
      case 'change_password':
        if (!current_password || !new_password) {
          return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
        }

        if (new_password.length < 6) {
          return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
        }

        // Verify current password by attempting to sign in
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: session.user.email!,
          password: current_password
        });

        if (verifyError) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }

        // Update password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: new_password
        });

        if (passwordError) {
          console.error("Error updating password:", passwordError);
          return NextResponse.json({ error: passwordError.message }, { status: 500 });
        }

        // Log security event
        await logSecurityEvent(supabase, session.user.id, 'password_changed', req);

        return NextResponse.json({
          success: true,
          message: "Password updated successfully"
        });

      case 'change_email':
        if (!new_email) {
          return NextResponse.json({ error: "New email is required" }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(new_email)) {
          return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }

        // Update email (this will send a confirmation email)
        const { error: emailError } = await supabase.auth.updateUser({
          email: new_email
        });

        if (emailError) {
          console.error("Error updating email:", emailError);
          return NextResponse.json({ error: emailError.message }, { status: 500 });
        }

        // Log security event
        await logSecurityEvent(supabase, session.user.id, 'email_change_requested', req, { new_email });

        return NextResponse.json({
          success: true,
          message: "Email change confirmation sent to new email address"
        });

      case 'resend_confirmation':
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: session.user.email!
        });

        if (resendError) {
          console.error("Error resending confirmation:", resendError);
          return NextResponse.json({ error: resendError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: "Confirmation email sent"
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Unexpected error in security POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to log security events
async function logSecurityEvent(
  supabase: any, 
  userId: string, 
  event: string, 
  req: NextRequest,
  metadata?: any
) {
  try {
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: `security_event_${Date.now()}`,
        ip_address: ip,
        user_agent: userAgent,
        device_info: {
          event,
          timestamp: new Date().toISOString(),
          metadata: metadata || {}
        },
        is_active: false, // Security events are not active sessions
        last_activity: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}
