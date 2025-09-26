import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const CreatePersonSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  aka: z.string().optional(),
  tags: z.array(z.string()).default([]),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  timezone: z.string().default("UTC"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  notes_md: z.string().optional(),
  relationship_type: z.string().optional(),
  importance: z.number().int().min(1).max(5).default(3),
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

    console.log("Fetching people for project:", projectId);
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

    const { data: people, error } = await supabase
      .from("people_contacts")
      .select(`
        *,
        people_interactions!left(
          id,
          date,
          type,
          sentiment
        )
      `)
      .eq("project_id", projectId)
      .order("name", { ascending: true });

    if (error) {
      console.error("People fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Calculate interaction stats for each person
    const peopleWithStats = people?.map(person => {
      const interactions = person.people_interactions || [];
      const lastInteraction = interactions.length > 0 ? 
        interactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;
      
      const daysSinceLastContact = lastInteraction ? 
        Math.floor((Date.now() - new Date(lastInteraction.date).getTime()) / (1000 * 60 * 60 * 24)) : null;

      // Calculate upcoming birthday
      let daysUntilBirthday = null;
      if (person.birthday) {
        const today = new Date();
        const thisYear = today.getFullYear();
        const birthday = new Date(person.birthday);
        const birthdayThisYear = new Date(thisYear, birthday.getMonth(), birthday.getDate());
        
        if (birthdayThisYear < today) {
          birthdayThisYear.setFullYear(thisYear + 1);
        }
        
        daysUntilBirthday = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        ...person,
        interaction_count: interactions.length,
        last_interaction_date: lastInteraction?.date || null,
        days_since_last_contact: daysSinceLastContact,
        days_until_birthday: daysUntilBirthday,
        avg_sentiment: interactions.length > 0 ? 
          interactions.reduce((sum: number, int: any) => sum + (int.sentiment || 3), 0) / interactions.length : null
      };
    }) || [];

    console.log("Fetched people with stats:", peopleWithStats.length);
    return NextResponse.json({ people: peopleWithStats });

  } catch (error) {
    console.error("Error in GET /api/people:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Creating person for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Person request body:", body);
    
    const parse = CreatePersonSchema.safeParse(body);
    if (!parse.success) {
      console.log("Person validation error:", parse.error.flatten());
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

    console.log("Creating person in database");

    const { data: person, error: personError } = await supabase
      .from("people_contacts")
      .insert({
        project_id: parse.data.projectId,
        user_id: session.user.id,
        name: parse.data.name,
        aka: parse.data.aka,
        tags: parse.data.tags,
        birthday: parse.data.birthday,
        timezone: parse.data.timezone,
        email: parse.data.email,
        phone: parse.data.phone,
        notes_md: parse.data.notes_md,
        relationship_type: parse.data.relationship_type,
        importance: parse.data.importance,
      })
      .select()
      .single();

    if (personError) {
      console.error("Person creation error:", personError);
      return NextResponse.json({ error: personError.message }, { status: 400 });
    }

    console.log("Person created:", person);
    return NextResponse.json({ person }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/people:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
