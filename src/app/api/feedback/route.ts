import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const CreateFeedbackSchema = z.object({
  feedback_type: z.enum(['suggestion', 'bug', 'feature_request', 'improvement', 'other']),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  category: z.string().optional()
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const sort = url.searchParams.get('sort') || 'newest';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Get current user (optional for viewing feedback)
    const { data: { session } } = await supabase.auth.getSession();

    let query = supabase
      .from('user_feedback')
      .select(`
        *,
        feedback_votes (vote_type),
        feedback_comments (id)
      `);

    // Filter by type if specified
    if (type && type !== 'all') {
      query = query.eq('feedback_type', type);
    }

    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'most_voted':
        // This would need a more complex query in production
        query = query.order('created_at', { ascending: false });
        break;
      case 'status':
        query = query.order('status').order('created_at', { ascending: false });
        break;
      default: // newest
        query = query.order('created_at', { ascending: false });
    }

    query = query.limit(limit);

    const { data: feedback, error: feedbackError } = await query;

    if (feedbackError) {
      console.error("Error fetching feedback:", feedbackError);
      return NextResponse.json({ error: feedbackError.message }, { status: 500 });
    }

    // Process the feedback to add vote counts and user votes
    const processedFeedback = feedback?.map(item => {
      const votes = item.feedback_votes || [];
      const upvotes = votes.filter((v: any) => v.vote_type === 'upvote').length;
      const downvotes = votes.filter((v: any) => v.vote_type === 'downvote').length;
      const userVote = session?.user ? 
        votes.find((v: any) => v.user_id === session.user.id)?.vote_type || null : null;

      return {
        ...item,
        votes_count: upvotes - downvotes,
        comments_count: item.feedback_comments?.length || 0,
        user_vote: userVote,
        feedback_votes: undefined, // Remove raw votes data
        feedback_comments: undefined // Remove raw comments data
      };
    }) || [];

    return NextResponse.json({
      success: true,
      feedback: processedFeedback
    });

  } catch (error: any) {
    console.error("Unexpected error in feedback GET:", error);
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

    // Validate request body
    const body = await req.json();
    const validatedData = CreateFeedbackSchema.parse(body);

    // Get user agent and IP from headers
    const userAgent = req.headers.get('user-agent') || undefined;
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || undefined;

    // Create the feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('user_feedback')
      .insert({
        user_id: session.user.id,
        user_email: session.user.email,
        feedback_type: validatedData.feedback_type,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        user_agent: userAgent,
        ip_address: ip
      })
      .select()
      .single();

    if (feedbackError) {
      console.error("Error creating feedback:", feedbackError);
      return NextResponse.json({ error: feedbackError.message }, { status: 500 });
    }

    // Log the activity in system_activity if that table exists
    try {
      await supabase
        .from('system_activity')
        .insert({
          user_id: session.user.id,
          action: 'feedback_submitted',
          resource_type: 'feedback',
          resource_id: feedback.id,
          details: {
            feedback_type: validatedData.feedback_type,
            title: validatedData.title,
            tracking_id: feedback.tracking_id
          }
        });
    } catch (activityError) {
      // Don't fail the request if activity logging fails
      console.warn("Failed to log activity:", activityError);
    }

    return NextResponse.json({
      success: true,
      feedback: {
        ...feedback,
        votes_count: 0,
        comments_count: 0,
        user_vote: null
      },
      message: "Feedback submitted successfully"
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error in feedback POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
