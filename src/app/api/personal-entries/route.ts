import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const CreatePersonalEntrySchema = z.object({
  projectId: z.string().uuid(),
  date: z.string(),
  title: z.string().optional(),
  content_md: z.string(),
  tags: z.array(z.string()).optional(),
  mood: z.number().min(1).max(5).optional(),
  energy: z.number().min(1).max(5).optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  location_name: z.string().optional(),
  photos: z.array(z.object({
    path: z.string(),
    caption: z.string().optional(),
    thumbnail: z.string().optional()
  })).optional(),
  is_private: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Server getSession - user id:", session.user.id);
    console.log("Server getSession - user email:", session.user.email);
    console.log("Fetching personal entries for project:", projectId);

    // Fetch personal entries with life areas
    const { data: entries, error } = await supabase
      .from('personal_entries')
      .select(`
        *,
        personal_entry_areas (
          area_id,
          life_areas (
            id,
            key,
            label,
            color,
            icon
          )
        )
      `)
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    if (error) {
      console.error("Error fetching personal entries:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Fetched personal entries:", entries?.length || 0);

    return NextResponse.json({
      success: true,
      entries: entries || []
    });

  } catch (error: any) {
    console.error("Unexpected error in personal-entries GET:", error);
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
    const validatedData = CreatePersonalEntrySchema.parse(body);

    console.log("Server getSession - user id:", session.user.id);
    console.log("Creating personal entry for project:", validatedData.projectId);

    // Check if user has access to this project
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', validatedData.projectId)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Create the personal entry
    const { data: entry, error: entryError } = await supabase
      .from('personal_entries')
      .insert({
        project_id: validatedData.projectId,
        user_id: session.user.id,
        date: validatedData.date,
        title: validatedData.title,
        content_md: validatedData.content_md,
        tags: validatedData.tags || [],
        mood: validatedData.mood,
        energy: validatedData.energy,
        sleep_hours: validatedData.sleep_hours,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        location_name: validatedData.location_name,
        photos: validatedData.photos || [],
        is_private: validatedData.is_private || false,
      })
      .select()
      .single();

    if (entryError) {
      console.error("Error creating personal entry:", entryError);
      return NextResponse.json({ error: entryError.message }, { status: 500 });
    }

    console.log("Created personal entry:", entry.id);

    return NextResponse.json({
      success: true,
      entry,
      message: "Personal entry created successfully"
    });

  } catch (error: any) {
    console.error("Unexpected error in personal-entries POST:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
