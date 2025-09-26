import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

const CreateProjectSchema = z.object({ name: z.string().min(2).max(100) });

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    
    console.log("Fetching projects for user:", session.user.id);
    const supabase = await createServerSupabase();

    // First get user's project memberships
    const { data: memberships, error: membershipError } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", session.user.id);
      
    if (membershipError) {
      console.error("Membership fetch error:", membershipError);
      return NextResponse.json({ error: membershipError.message }, { status: 400 });
    }
    
    console.log("User memberships:", memberships);
    
    const projectIds = memberships?.map((r) => r.project_id) || [];
    
    if (projectIds.length === 0) {
      console.log("No projects found for user");
      return NextResponse.json({ projects: [] });
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, slug, created_at")
      .in("id", projectIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Projects fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    console.log("Fetched projects:", data);
    return NextResponse.json({ projects: data || [] });
    
  } catch (error) {
    console.error("Unexpected error in GET /api/projects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    
    console.log("Creating project for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Request body:", body);
    
    const parse = CreateProjectSchema.safeParse(body);
    if (!parse.success) {
      console.log("Validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }
    
    const supabase = await createServerSupabase();
    const slug = slugify(parse.data.name);
    
    console.log("Inserting project:", { name: parse.data.name, owner: session.user.id, slug });
    
    const { data: project, error } = await supabase
      .from("projects")
      .insert({ name: parse.data.name, owner: session.user.id, slug })
      .select()
      .single();
      
    if (error) {
      console.error("Project insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    console.log("Project created:", project);

    // add membership as owner
    const { error: memErr } = await supabase
      .from("project_members")
      .insert({ project_id: project.id, user_id: session.user.id, role: "owner" });
      
    if (memErr) {
      console.error("Membership insert error:", memErr);
      return NextResponse.json({ error: memErr.message }, { status: 400 });
    }
    
    console.log("Project membership created");
    return NextResponse.json({ project }, { status: 201 });
    
  } catch (error) {
    console.error("Unexpected error in POST /api/projects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
