import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const CreateBookSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  description: z.string().optional(),
  pages: z.number().optional(),
  genre: z.string().optional(),
  priority_level: z.number().min(1).max(10).default(5),
  reading_status: z.enum(['wishlist', 'to_read', 'reading', 'paused', 'completed', 'abandoned']).default('wishlist'),
  estimated_price: z.number().optional(),
  currency: z.string().default('EUR'),
  is_public: z.boolean().default(false),
  allow_crowdfunding: z.boolean().default(false),
  crowdfunding_goal: z.number().optional(),
  crowdfunding_message: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');
    const isPublic = url.searchParams.get('public') === 'true';

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from('books')
      .select(`
        *,
        reading_progress (
          current_page,
          progress_percentage,
          date
        )
      `);

    if (isPublic) {
      // Public books view - anyone can see
      query = query.eq('is_public', true);
    } else {
      // Private view - only user's books
      if (!projectId) {
        return NextResponse.json({ error: "Project ID is required for private view" }, { status: 400 });
      }

      // Check project access
      const { data: membership } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', session.user.id)
        .single();

      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      query = query.eq('project_id', projectId).eq('user_id', session.user.id);
    }

    // Filter by status if specified
    if (status && status !== 'all') {
      query = query.eq('reading_status', status);
    }

    // Order by priority and creation date
    query = query.order('priority_level', { ascending: false })
                 .order('created_at', { ascending: false });

    const { data: books, error: booksError } = await query;

    if (booksError) {
      console.error("Error fetching books:", booksError);
      return NextResponse.json({ error: booksError.message }, { status: 500 });
    }

    // Process books to add latest progress
    const processedBooks = books?.map(book => {
      const latestProgress = book.reading_progress?.[0];
      return {
        ...book,
        current_page: latestProgress?.current_page || 0,
        progress_percentage: latestProgress?.progress_percentage || 0,
        reading_progress: undefined // Remove raw progress data
      };
    }) || [];

    return NextResponse.json({
      success: true,
      books: processedBooks
    });

  } catch (error: any) {
    console.error("Unexpected error in books GET:", error);
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
    const validatedData = CreateBookSchema.parse(body);

    // Check project access
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', validatedData.projectId)
      .eq('user_id', session.user.id)
      .single();

    if (!membership || !['owner', 'admin', 'member'].includes(membership.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create the book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        user_id: session.user.id,
        project_id: validatedData.projectId,
        title: validatedData.title,
        author: validatedData.author,
        description: validatedData.description,
        pages: validatedData.pages,
        genre: validatedData.genre,
        priority_level: validatedData.priority_level,
        reading_status: validatedData.reading_status,
        estimated_price: validatedData.estimated_price,
        currency: validatedData.currency,
        is_public: validatedData.is_public,
        allow_crowdfunding: validatedData.allow_crowdfunding,
        crowdfunding_goal: validatedData.crowdfunding_goal,
        crowdfunding_message: validatedData.crowdfunding_message,
        tags: validatedData.tags
      })
      .select()
      .single();

    if (bookError) {
      console.error("Error creating book:", bookError);
      return NextResponse.json({ error: bookError.message }, { status: 500 });
    }

    // Add initial reading progress entry
    if (validatedData.reading_status === 'reading') {
      await supabase
        .from('reading_progress')
        .insert({
          book_id: book.id,
          user_id: session.user.id,
          current_page: 0,
          progress_percentage: 0
        });
    }

    return NextResponse.json({
      success: true,
      book: {
        ...book,
        current_page: 0,
        progress_percentage: 0
      },
      message: "Book added to library successfully"
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error in books POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
