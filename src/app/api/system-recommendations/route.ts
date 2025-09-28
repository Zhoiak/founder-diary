import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const type = searchParams.get("type");

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from('system_recommendations')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_dismissed', false)
      .order('confidence_score', { ascending: false })
      .order('priority', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: recommendations, error } = await query;

    if (error) {
      console.error("Error fetching recommendations:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group recommendations by type
    const recommendationsByType = {
      monetization: recommendations?.filter(rec => rec.type === 'monetization') || [],
      next_feature: recommendations?.filter(rec => rec.type === 'next_feature') || [],
      improvement: recommendations?.filter(rec => rec.type === 'improvement') || [],
      optimization: recommendations?.filter(rec => rec.type === 'optimization') || []
    };

    // Get top recommendation
    const topRecommendation = recommendations?.[0] || null;

    return NextResponse.json({
      success: true,
      recommendations: recommendations || [],
      recommendationsByType,
      topRecommendation,
      total: recommendations?.length || 0
    });

  } catch (error: any) {
    console.error("Unexpected error in recommendations GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action } = body; // action: 'dismiss', 'accept'

    if (!id || !action) {
      return NextResponse.json({ error: "ID and action are required" }, { status: 400 });
    }

    const updateData: any = {};
    if (action === 'dismiss') {
      updateData.is_dismissed = true;
    } else if (action === 'accept') {
      updateData.is_accepted = true;
    }

    // Update recommendation
    const { data: recommendation, error: updateError } = await supabase
      .from('system_recommendations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating recommendation:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      recommendation,
      message: `Recommendation ${action}ed successfully`
    });

  } catch (error: any) {
    console.error("Unexpected error in recommendations PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
