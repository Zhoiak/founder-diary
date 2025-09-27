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
    
    // Get all time capsules that are due for delivery today and haven't been sent
    const currentDate = new Date().toISOString().split('T')[0];
    
    const { data: timeCapsules, error: capsulesError } = await supabase
      .from('time_capsules')
      .select(`
        id,
        user_id,
        project_id,
        title,
        deliver_on,
        target_email,
        subject,
        content_md,
        attachments,
        created_at,
        auth.users!inner (
          email,
          user_metadata
        )
      `)
      .lte('deliver_on', currentDate)
      .eq('sent', false);

    if (capsulesError) {
      console.error('Error fetching time capsules:', capsulesError);
      return NextResponse.json({ error: capsulesError.message }, { status: 500 });
    }

    const results = [];

    for (const capsule of timeCapsules || []) {
      try {
        // Send the time capsule
        const deliverySent = await deliverTimeCapsule(capsule);

        if (deliverySent) {
          // Mark as sent in database
          const { error: updateError } = await supabase
            .from('time_capsules')
            .update({ 
              sent: true, 
              sent_at: new Date().toISOString() 
            })
            .eq('id', capsule.id);

          if (updateError) {
            console.error(`Error updating time capsule ${capsule.id}:`, updateError);
          }
        }

        results.push({
          capsuleId: capsule.id,
          userId: capsule.user_id,
          targetEmail: capsule.target_email,
          title: capsule.title,
          deliverySent,
          status: deliverySent ? 'delivered' : 'failed'
        });

      } catch (error) {
        console.error(`Error processing time capsule ${capsule.id}:`, error);
        results.push({
          capsuleId: capsule.id,
          userId: capsule.user_id,
          status: 'error',
          error: error.message
        });
      }
    }

    // Log cron execution
    await logCronExecution('time_capsules', results.length, results.filter(r => r.status === 'delivered').length);

    return NextResponse.json({
      success: true,
      processed: results.length,
      delivered: results.filter(r => r.status === 'delivered').length,
      results
    });

  } catch (error: any) {
    console.error('Time capsules cron error:', error);
    await logCronExecution('time_capsules', 0, 0, error.message);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deliverTimeCapsule(capsule: any) {
  try {
    const deliveryDate = new Date(capsule.deliver_on);
    const createdDate = new Date(capsule.created_at);
    const daysSince = Math.floor((deliveryDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    // Prepare email content
    const emailSubject = capsule.subject || `📮 Time Capsule: ${capsule.title}`;
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">📮 Time Capsule Delivery</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">A message from your past self</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">${capsule.title}</h2>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              Written ${daysSince} days ago • Delivered as requested on ${deliveryDate.toLocaleDateString()}
            </p>
            
            <div style="border-left: 4px solid #667eea; padding-left: 20px; margin: 20px 0;">
              ${formatMarkdownToHtml(capsule.content_md)}
            </div>
            
            ${capsule.attachments && capsule.attachments.length > 0 ? `
              <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
                <h4 style="color: #333; margin-bottom: 10px;">📎 Attachments:</h4>
                <ul style="list-style: none; padding: 0;">
                  ${capsule.attachments.map((att: any) => `
                    <li style="margin: 5px 0;">
                      <a href="${att.url}" style="color: #667eea; text-decoration: none;">
                        📄 ${att.name}
                      </a>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This time capsule was created using Founder Diary</p>
          </div>
        </div>
      </div>
    `;

    // In a real implementation, you'd use a service like Resend, SendGrid, or Nodemailer
    console.log(`📮 Time capsule delivered to ${capsule.target_email}:`, {
      subject: emailSubject,
      capsuleId: capsule.id,
      title: capsule.title,
      daysSince,
      hasAttachments: capsule.attachments?.length > 0
    });

    // Mock email sending
    // await sendEmail({
    //   to: capsule.target_email,
    //   subject: emailSubject,
    //   html: emailContent
    // });

    return true;
  } catch (error) {
    console.error('Error delivering time capsule:', error);
    return false;
  }
}

function formatMarkdownToHtml(markdown: string): string {
  // Simple markdown to HTML conversion
  // In a real implementation, you'd use a proper markdown parser
  return markdown
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
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
