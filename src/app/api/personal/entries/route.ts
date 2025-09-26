import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const CreatePersonalEntrySchema = z.object({
  projectId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().optional(),
  content_md: z.string().optional(),
  tags: z.array(z.string()).default([]),
  mood: z.number().int().min(1).max(5).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  location_name: z.string().optional(),
  photos: z.array(z.object({
    path: z.string(),
    caption: z.string().optional(),
    thumbnail: z.string().optional()
  })).default([]),
  is_private: z.boolean().default(false),
  area_ids: z.array(z.string().uuid()).default([])
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const area = searchParams.get("area");
    const tag = searchParams.get("tag");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    console.log("Fetching personal entries for project:", projectId);
    const supabase = await createServerSupabase();

    // Verify user has access to this project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    let query = supabase
      .from("personal_entries")
      .select(`
        *,
        personal_entry_areas!inner(
          area_id,
          life_areas!inner(key, label, color, icon)
        )
      `)
      .eq("project_id", projectId)
      .order("date", { ascending: false });

    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);
    if (tag) query = query.contains("tags", [tag]);

    const { data: entries, error } = await query;

    if (error) {
      console.error("Personal entries fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Filter by area if specified
    let filteredEntries = entries || [];
    if (area) {
      filteredEntries = entries?.filter(entry => 
        entry.personal_entry_areas?.some((ea: any) => ea.life_areas.key === area)
      ) || [];
    }

    console.log("Fetched personal entries:", filteredEntries.length);
    return NextResponse.json({ entries: filteredEntries });

  } catch (error) {
    console.error("Error in GET /api/personal/entries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Creating personal entry for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Personal entry request body:", body);
    
    const parse = CreatePersonalEntrySchema.safeParse(body);
    if (!parse.success) {
      console.log("Personal entry validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }
    
    console.log("Personal entry validation passed:", parse.data);

    const supabase = await createServerSupabase();

    // Verify user has access to this project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", parse.data.projectId)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    console.log("Creating personal entry in database");

    // Create the entry
    const { data: entry, error: entryError } = await supabase
      .from("personal_entries")
      .insert({
        project_id: parse.data.projectId,
        user_id: session.user.id,
        date: parse.data.date,
        title: parse.data.title,
        content_md: parse.data.content_md,
        tags: parse.data.tags,
        mood: parse.data.mood,
        energy: parse.data.energy,
        sleep_hours: parse.data.sleep_hours,
        latitude: parse.data.latitude,
        longitude: parse.data.longitude,
        location_name: parse.data.location_name,
        photos: parse.data.photos,
        is_private: parse.data.is_private,
      })
      .select()
      .single();

    if (entryError) {
      console.error("Personal entry creation error:", entryError);
      return NextResponse.json({ error: entryError.message }, { status: 400 });
    }

    // Link to life areas if specified
    if (parse.data.area_ids.length > 0) {
      const areaLinks = parse.data.area_ids.map(areaId => ({
        entry_id: entry.id,
        area_id: areaId
      }));

      const { error: linkError } = await supabase
        .from("personal_entry_areas")
        .insert(areaLinks);

      if (linkError) {
        console.error("Area linking error:", linkError);
        // Don't fail the whole request for this
      }
    }

    console.log("Personal entry created:", entry);
    return NextResponse.json({ entry }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/personal/entries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
