import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const CreateInteractionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['call', 'text', 'email', 'meet', 'gift', 'other']).default('other'),
  notes_md: z.string().optional(),
  sentiment: z.number().int().min(1).max(5).optional(),
  duration_minutes: z.number().int().min(0).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    console.log("Fetching interactions for person:", id);
    const supabase = await createServerSupabase();

    // Verify person exists and user has access
    const { data: person, error: personError } = await supabase
      .from("people_contacts")
      .select("*, project_id")
      .eq("id", id)
      .single();

    if (personError || !person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", person.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    const { data: interactions, error } = await supabase
      .from("people_interactions")
      .select("*")
      .eq("person_id", id)
      .order("date", { ascending: false });

    if (error) {
      console.error("Interactions fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Fetched interactions:", interactions?.length || 0);
    return NextResponse.json({ interactions: interactions || [] });

  } catch (error) {
    console.error("Error in GET /api/people/[id]/interactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    console.log("Creating interaction for person:", id, "by user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Interaction request body:", body);
    
    const parse = CreateInteractionSchema.safeParse(body);
    if (!parse.success) {
      console.log("Interaction validation error:", parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    // Verify person exists and user has access
    const { data: person, error: personError } = await supabase
      .from("people_contacts")
      .select("*, project_id")
      .eq("id", id)
      .single();

    if (personError || !person) {
      console.log("Person not found:", personError);
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", person.project_id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      console.log("Access denied - no membership found");
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    console.log("Creating interaction in database");

    const { data: interaction, error: interactionError } = await supabase
      .from("people_interactions")
      .insert({
        person_id: id,
        user_id: session.user.id,
        date: parse.data.date,
        type: parse.data.type,
        notes_md: parse.data.notes_md,
        sentiment: parse.data.sentiment,
        duration_minutes: parse.data.duration_minutes,
      })
      .select()
      .single();

    if (interactionError) {
      console.error("Interaction creation error:", interactionError);
      return NextResponse.json({ error: interactionError.message }, { status: 400 });
    }

    // Update last_contact date on the person
    await supabase
      .from("people_contacts")
      .update({ last_contact: parse.data.date })
      .eq("id", id);

    console.log("Interaction created:", interaction);
    return NextResponse.json({ interaction }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/people/[id]/interactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
