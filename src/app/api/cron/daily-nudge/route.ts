import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { captureMessage } from "@/lib/sentry";

export async function GET(req: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isDryRun = process.env.DRY_RUN === 'true';
    captureMessage(`Daily nudge cron started (dry run: ${isDryRun})`, 'info');

    const supabase = await createServerSupabase();
    const today = new Date().toISOString().split('T')[0];
    
    // Find users who haven't logged today
    const { data: usersWithoutLogs, error } = await supabase
      .from('project_members')
      .select(`
        user_id,
        projects!inner(name, id),
        auth.users!inner(email)
      `)
      .not('user_id', 'in', 
        supabase
          .from('daily_logs')
          .select('user_id')
          .eq('date', today)
      );

    if (error) {
      captureMessage(`Error fetching users without logs: ${error.message}`, 'error');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const nudgesSent = [];

    for (const user of usersWithoutLogs || []) {
      if (isDryRun) {
        console.log(`[DRY RUN] Would send nudge to ${user.auth.users.email} for project ${user.projects.name}`);
        nudgesSent.push({ email: user.auth.users.email, project: user.projects.name, sent: false });
      } else {
        // In production, integrate with your email service (Resend, SendGrid, etc.)
        // For now, just log
        console.log(`Sending nudge to ${user.auth.users.email} for project ${user.projects.name}`);
        nudgesSent.push({ email: user.auth.users.email, project: user.projects.name, sent: true });
      }
    }

    captureMessage(`Daily nudge completed: ${nudgesSent.length} nudges processed`, 'info');

    return NextResponse.json({
      success: true,
      nudgesSent: nudgesSent.length,
      dryRun: isDryRun,
      details: nudgesSent
    });

  } catch (error) {
    captureMessage(`Daily nudge cron failed: ${error}`, 'error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
