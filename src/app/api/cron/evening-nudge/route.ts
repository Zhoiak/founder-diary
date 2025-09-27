import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabase();
    
    // Get all users with Personal projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        owner,
        name,
        auth.users!inner (
          email,
          user_metadata
        )
      `)
      .eq('name', 'Personal');

    if (projectsError) {
      console.error('Error fetching Personal projects:', projectsError);
      return NextResponse.json({ error: projectsError.message }, { status: 500 });
    }

    const results = [];
    const currentDate = new Date().toISOString().split('T')[0];

    for (const project of projects || []) {
      try {
        // Check if user already has a journal entry today
        const { data: todayEntry } = await supabase
          .from('personal_entries')
          .select('id')
          .eq('project_id', project.id)
          .eq('user_id', project.owner)
          .eq('date', currentDate)
          .single();

        if (todayEntry) {
          // User already journaled today
          continue;
        }

        // Check if user has evening routine
        const { data: eveningRoutine } = await supabase
          .from('routines')
          .select('id, title')
          .eq('project_id', project.id)
          .eq('user_id', project.owner)
          .eq('kind', 'evening')
          .eq('active', true)
          .single();

        // Send evening nudge
        const nudgeSent = await sendEveningNudge({
          email: project.auth.users.email,
          userId: project.owner,
          projectId: project.id,
          hasEveningRoutine: !!eveningRoutine,
          routineTitle: eveningRoutine?.title
        });

        results.push({
          userId: project.owner,
          email: project.auth.users.email,
          projectId: project.id,
          nudgeSent,
          hasEveningRoutine: !!eveningRoutine,
          status: nudgeSent ? 'sent' : 'failed'
        });

      } catch (error) {
        console.error(`Error processing project ${project.id}:`, error);
        results.push({
          userId: project.owner,
          projectId: project.id,
          status: 'error',
          error: error.message
        });
      }
    }

    // Log cron execution
    await logCronExecution('evening_nudge', results.length, results.filter(r => r.status === 'sent').length);

    return NextResponse.json({
      success: true,
      processed: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      results
    });

  } catch (error: any) {
    console.error('Evening nudge cron error:', error);
    await logCronExecution('evening_nudge', 0, 0, error.message);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendEveningNudge({ email, userId, projectId, hasEveningRoutine, routineTitle }: {
  email: string;
  userId: string;
  projectId: string;
  hasEveningRoutine: boolean;
  routineTitle?: string;
}) {
  try {
    const message = hasEveningRoutine 
      ? `🌙 Time to wind down with your ${routineTitle} and reflect on your day`
      : `🌙 How was your day? Take a moment to capture your thoughts in your journal`;

    // In a real implementation, you'd use a service like Resend, SendGrid, or Nodemailer
    console.log(`📧 Evening nudge sent to ${email}:`, {
      subject: `🌙 Evening reflection time`,
      message,
      userId,
      projectId,
      hasEveningRoutine
    });

    // You could also send different types of notifications
    // await sendPushNotification(userId, message);
    // await sendSlackMessage(userId, message);

    return true;
  } catch (error) {
    console.error('Error sending evening nudge:', error);
    return false;
  }
}

async function logCronExecution(jobType: string, processed: number, successful: number, error?: string) {
  try {
    const supabase = await createServerSupabase();
    
    await supabase.from('cron_logs').insert({
      job_type: jobType,
      executed_at: new Date().toISOString(),
      processed_count: processed,
      successful_count: successful,
      error_message: error,
      status: error ? 'failed' : 'completed'
    });
  } catch (logError) {
    console.error('Error logging cron execution:', logError);
  }
}
