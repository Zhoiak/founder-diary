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
    
    // Get all users with Personal projects and active morning routines
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select(`
        id,
        user_id,
        project_id,
        title,
        projects!inner (
          name,
          private_vault
        ),
        auth.users!inner (
          email,
          user_metadata
        )
      `)
      .eq('kind', 'morning')
      .eq('active', true)
      .eq('projects.name', 'Personal');

    if (routinesError) {
      console.error('Error fetching morning routines:', routinesError);
      return NextResponse.json({ error: routinesError.message }, { status: 500 });
    }

    const results = [];
    const currentDate = new Date().toISOString().split('T')[0];

    for (const routine of routines || []) {
      try {
        // Check if user already completed morning routine today
        const { data: existingRun } = await supabase
          .from('routine_runs')
          .select('id')
          .eq('routine_id', routine.id)
          .eq('user_id', routine.user_id)
          .eq('date', currentDate)
          .single();

        if (existingRun) {
          // User already completed routine today
          continue;
        }

        // Send morning routine reminder
        const reminderSent = await sendMorningReminder({
          email: routine.auth.users.email,
          routineTitle: routine.title,
          userId: routine.user_id,
          routineId: routine.id
        });

        results.push({
          userId: routine.user_id,
          email: routine.auth.users.email,
          routineId: routine.id,
          reminderSent,
          status: reminderSent ? 'sent' : 'failed'
        });

      } catch (error) {
        console.error(`Error processing routine ${routine.id}:`, error);
        results.push({
          userId: routine.user_id,
          routineId: routine.id,
          status: 'error',
          error: error.message
        });
      }
    }

    // Log cron execution
    await logCronExecution('morning_routine', results.length, results.filter(r => r.status === 'sent').length);

    return NextResponse.json({
      success: true,
      processed: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      results
    });

  } catch (error: any) {
    console.error('Morning routine cron error:', error);
    await logCronExecution('morning_routine', 0, 0, error.message);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendMorningReminder({ email, routineTitle, userId, routineId }: {
  email: string;
  routineTitle: string;
  userId: string;
  routineId: string;
}) {
  try {
    // In a real implementation, you'd use a service like Resend, SendGrid, or Nodemailer
    // For now, we'll just log the reminder
    console.log(`📧 Morning reminder sent to ${email}:`, {
      subject: `🌅 Good morning! Time for your ${routineTitle}`,
      routineId,
      userId
    });

    // You could also send push notifications, Slack messages, etc.
    // await sendPushNotification(userId, `Time for your ${routineTitle}!`);
    // await sendSlackMessage(userId, `Good morning! Don't forget your ${routineTitle}`);

    return true;
  } catch (error) {
    console.error('Error sending morning reminder:', error);
    return false;
  }
}

async function logCronExecution(jobType: string, processed: number, successful: number, error?: string) {
  try {
    const supabase = await createServerSupabase();
    
    // Log to a cron_logs table (you'd need to create this)
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
