import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const CreateMemorySchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  memory_date: z.string(),
  location_name: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  mood: z.number().min(1).max(5).optional(),
  is_favorite: z.boolean().default(false),
  is_private: z.boolean().default(false),
  tags: z.array(z.string()).default([])
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from('memories')
      .select(`
        *,
        memory_photos!left (
          id
        )
      `)
      .eq('user_id', session.user.id)
      .order('memory_date', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: memories, error } = await query;

    if (error) {
      console.error("Error fetching memories:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add photo count to each memory
    const memoriesWithPhotos = memories?.map(memory => ({
      ...memory,
      photo_count: memory.memory_photos?.length || 0
    })) || [];

    return NextResponse.json({
      success: true,
      memories: memoriesWithPhotos
    });

  } catch (error: any) {
    console.error("Unexpected error in memories GET:", error);
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
    const validatedData = CreateMemorySchema.parse(body);

    // Create memory
    const { data: memory, error: memoryError } = await supabase
      .from('memories')
      .insert({
        user_id: session.user.id,
        project_id: validatedData.projectId,
        title: validatedData.title,
        description: validatedData.description,
        memory_date: validatedData.memory_date,
        location_name: validatedData.location_name,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        mood: validatedData.mood,
        is_favorite: validatedData.is_favorite,
        is_private: validatedData.is_private,
        tags: validatedData.tags
      })
      .select()
      .single();

    if (memoryError) {
      console.error("Error creating memory:", memoryError);
      return NextResponse.json({ error: memoryError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      memory: {
        ...memory,
        photo_count: 0
      }
    }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error in memories POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
