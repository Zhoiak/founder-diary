import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const UpdateLogSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content_md: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mood: z.number().int().min(1).max(5).optional(),
  time_spent_minutes: z.number().int().min(0).max(24 * 60).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parse = UpdateLogSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // Update the log (RLS will ensure user can only update their own logs in projects they have access to)
  const { data: log, error } = await supabase
    .from("daily_logs")
    .update(parse.data)
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!log) return NextResponse.json({ error: "log not found" }, { status: 404 });

  return NextResponse.json({ log });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("daily_logs")
    .delete()
    .eq("id", params.id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
