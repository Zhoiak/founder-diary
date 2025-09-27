import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user (admin check would go here in production)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobType = searchParams.get("jobType");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from('cron_logs')
      .select('*')
      .order('executed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (jobType) {
      query = query.eq('job_type', jobType);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error("Error fetching cron logs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get summary stats
    const { data: stats } = await supabase
      .from('cron_logs')
      .select('job_type, status, executed_at')
      .gte('executed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const summary = {
      total_executions: stats?.length || 0,
      successful_executions: stats?.filter(s => s.status === 'completed').length || 0,
      failed_executions: stats?.filter(s => s.status === 'failed').length || 0,
      job_types: [...new Set(stats?.map(s => s.job_type) || [])],
      last_7_days: stats || []
    };

    return NextResponse.json({
      success: true,
      logs: logs || [],
      summary,
      pagination: {
        limit,
        offset,
        hasMore: (logs?.length || 0) === limit
      }
    });

  } catch (error: any) {
    console.error("Unexpected error in cron logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Manual trigger for testing cron jobs
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user (admin check would go here in production)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobType } = body;

    if (!jobType || !['morning-routine', 'evening-nudge', 'time-capsules'].includes(jobType)) {
      return NextResponse.json({ error: "Invalid job type" }, { status: 400 });
    }

    // Trigger the cron job manually (for testing)
    const cronUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/cron/${jobType}`;
    
    const response = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      jobType,
      result,
      message: `${jobType} job triggered manually`
    });

  } catch (error: any) {
    console.error("Error triggering cron job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
