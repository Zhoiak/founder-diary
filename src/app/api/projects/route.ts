import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

const CreateProjectSchema = z.object({ name: z.string().min(2).max(100) });

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, slug, created_at")
    .in(
      "id",
      (
        await supabase
          .from("project_members")
          .select("project_id")
          .eq("user_id", session.user.id)
      ).data?.map((r) => r.project_id) || []
    )
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ projects: data || [] });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parse = CreateProjectSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const supabase = await createServerSupabase();

  const slug = slugify(parse.data.name);
  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name: parse.data.name, owner: session.user.id, slug })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // add membership as owner
  const { error: memErr } = await supabase
    .from("project_members")
    .insert({ project_id: project.id, user_id: session.user.id, role: "owner" });
  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 400 });

  return NextResponse.json({ project }, { status: 201 });
}
