import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const UpdateKRSchema = z.object({
  current: z.number(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parse = UpdateKRSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // Update key result (RLS will ensure user can only update KRs for goals they own)
  const { data: keyResult, error } = await supabase
    .from("key_results")
    .update({ current: parse.data.current })
    .eq("id", params.id)
    .select(`
      *,
      goals!inner (
        user_id,
        project_id
      )
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!keyResult) return NextResponse.json({ error: "key result not found" }, { status: 404 });

  // Verify the goal belongs to the current user
  if (keyResult.goals.user_id !== session.user.id) {
    return NextResponse.json({ error: "access denied" }, { status: 403 });
  }

  return NextResponse.json({ keyResult });
}
