import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get current user and verify admin access
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (has user number)
    const { data: userProfile } = await supabase
      .from('user_numbers')
      .select('user_number')
      .eq('user_id', session.user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 });
    }

    // Sync metrics first
    await supabase.rpc('sync_system_metrics');

    // Get dashboard data
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('admin_dashboard')
      .select('*')
      .single();

    if (dashboardError) {
      console.error("Error fetching dashboard data:", dashboardError);
      return NextResponse.json({ error: dashboardError.message }, { status: 500 });
    }

    // Get recent metrics trends
    const { data: userTrends, error: trendsError } = await supabase
      .from('system_metrics')
      .select('*')
      .eq('metric_name', 'total_users')
      .order('created_at', { ascending: false })
      .limit(30);

    // Get data collection stats
    const { data: dataStats, error: dataError } = await supabase
      .from('data_collection_stats')
      .select('*')
      .order('updated_at', { ascending: false });

    // Get monetization metrics
    const { data: monetizationData, error: monetizationError } = await supabase
      .from('monetization_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(12); // Last 12 periods

    // Calculate additional metrics
    const totalDataSizeGB = Number(dashboardData.total_data_size || 0) / (1024 * 1024 * 1024);
    const avgEntriesPerUser = Number(dashboardData.total_users) > 0 
      ? Number(dashboardData.total_entries) / Number(dashboardData.total_users) 
      : 0;

    // Estimate bandwidth usage (rough calculation)
    const estimatedMonthlyBandwidth = totalDataSizeGB * 10; // Assume 10x data transfer
    const estimatedMonthlyCost = estimatedMonthlyBandwidth * 0.12; // $0.12/GB typical cost

    return NextResponse.json({
      success: true,
      dashboard: {
        // Core metrics
        total_users: Number(dashboardData.total_users || 0),
        active_users: Number(dashboardData.active_users || 0),
        total_entries: Number(dashboardData.total_entries || 0),
        user_growth_rate: Number(dashboardData.user_growth_rate || 0),
        
        // Data metrics
        total_data_size_bytes: Number(dashboardData.total_data_size || 0),
        total_data_size_gb: totalDataSizeGB,
        avg_entries_per_user: avgEntriesPerUser,
        
        // Cost estimates
        estimated_monthly_bandwidth_gb: estimatedMonthlyBandwidth,
        estimated_monthly_cost_usd: estimatedMonthlyCost,
        
        // Timestamps
        last_updated: dashboardData.last_updated
      },
      trends: {
        user_growth: userTrends || [],
        data_collection: dataStats || [],
        monetization: monetizationData || []
      },
      hosting_analysis: {
        current_stack: "Supabase + Local Dev",
        recommended_for_scale: "Hetzner + Supabase",
        cost_breakdown: {
          vercel_pro: { cost: 20, bandwidth_limit: "100GB", overage: "$0.40/GB" },
          hetzner_vps: { cost: 15, bandwidth_limit: "20TB", overage: "€0.01/GB" },
          aws_lightsail: { cost: 40, bandwidth_limit: "3TB", overage: "$0.09/GB" },
          digitalocean: { cost: 24, bandwidth_limit: "4TB", overage: "$0.01/GB" }
        }
      }
    });

  } catch (error: any) {
    console.error("Unexpected error in admin metrics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user and verify admin access
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_numbers')
      .select('user_number')
      .eq('user_id', session.user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { action, data } = body;

    if (action === 'force_sync') {
      // Force sync all metrics
      await supabase.rpc('sync_system_metrics');
      
      return NextResponse.json({
        success: true,
        message: "Metrics synced successfully"
      });
      
    } else if (action === 'add_monetization_data') {
      // Add monetization metrics
      const { revenue_stream, mrr, conversion_rate, churn_rate } = data;
      
      const { error: insertError } = await supabase
        .from('monetization_metrics')
        .insert({
          revenue_stream,
          current_mrr: mrr,
          conversion_rate,
          churn_rate,
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 days
        });

      if (insertError) {
        console.error("Error adding monetization data:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Monetization data added successfully"
      });
      
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Unexpected error in admin metrics POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
