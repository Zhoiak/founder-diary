import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const CreateLifeAreaSchema = z.object({
  projectId: z.string().uuid(),
  key: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default("#3B82F6"),
  icon: z.string().default("🌟"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    console.log("Fetching life areas for project:", projectId);
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

    const { data: areas, error } = await supabase
      .from("life_areas")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Life areas fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Fetched life areas:", areas?.length || 0);
    return NextResponse.json({ areas: areas || [] });

  } catch (error) {
    console.error("Error in GET /api/personal/areas:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Creating life area for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Life area request body:", body);
    
    const parse = CreateLifeAreaSchema.safeParse(body);
    if (!parse.success) {
      console.log("Life area validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

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

    // Check if area key already exists for this project
    const { data: existing } = await supabase
      .from("life_areas")
      .select("id")
      .eq("project_id", parse.data.projectId)
      .eq("key", parse.data.key)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Area key already exists" }, { status: 400 });
    }

    console.log("Creating life area in database");

    const { data: area, error: areaError } = await supabase
      .from("life_areas")
      .insert({
        project_id: parse.data.projectId,
        user_id: session.user.id,
        key: parse.data.key,
        label: parse.data.label,
        color: parse.data.color,
        icon: parse.data.icon,
      })
      .select()
      .single();

    if (areaError) {
      console.error("Life area creation error:", areaError);
      return NextResponse.json({ error: areaError.message }, { status: 400 });
    }

    console.log("Life area created:", area);
    return NextResponse.json({ area }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/personal/areas:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
