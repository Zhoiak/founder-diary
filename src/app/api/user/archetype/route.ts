import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's archetype with full details
    const { data: userArchetype, error: archetypeError } = await supabase
      .from('user_animal_archetypes')
      .select(`
        *,
        archetype:animal_archetypes (*)
      `)
      .eq('user_id', session.user.id)
      .single();

    if (archetypeError && archetypeError.code !== 'PGRST116') {
      console.error("Error fetching user archetype:", archetypeError);
      return NextResponse.json({ error: archetypeError.message }, { status: 500 });
    }

    // If no archetype assigned, get all available archetypes
    if (!userArchetype) {
      const { data: allArchetypes, error: allError } = await supabase
        .from('animal_archetypes')
        .select('*')
        .order('name');

      if (allError) {
        console.error("Error fetching archetypes:", allError);
        return NextResponse.json({ error: allError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        userArchetype: null,
        availableArchetypes: allArchetypes || [],
        needsAssignment: true
      });
    }

    // Get user's adaptations
    const { data: adaptations, error: adaptError } = await supabase
      .from('archetype_adaptations')
      .select('*')
      .eq('user_id', session.user.id);

    if (adaptError) {
      console.error("Error fetching adaptations:", adaptError);
    }

    return NextResponse.json({
      success: true,
      userArchetype,
      adaptations: adaptations || [],
      needsAssignment: false
    });

  } catch (error: any) {
    console.error("Unexpected error in archetype GET:", error);
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

    const body = await req.json();
    const { action, archetype_id, custom_traits, adaptation_level } = body;

    if (action === 'assign_archetype') {
      if (!archetype_id) {
        return NextResponse.json({ error: "Archetype ID is required" }, { status: 400 });
      }

      // Assign or update user archetype
      const { data: assignment, error: assignError } = await supabase
        .from('user_animal_archetypes')
        .upsert({
          user_id: session.user.id,
          archetype_id,
          custom_traits: custom_traits || [],
          adaptation_level: adaptation_level || 1,
          confidence_score: 0.9, // High confidence for manual assignment
          last_updated: new Date().toISOString()
        })
        .select(`
          *,
          archetype:animal_archetypes (*)
        `)
        .single();

      if (assignError) {
        console.error("Error assigning archetype:", assignError);
        return NextResponse.json({ error: assignError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        assignment,
        message: "Archetype assigned successfully"
      });

    } else if (action === 'auto_assign') {
      // Call the database function to auto-assign based on behavior
      const { data: result, error: autoError } = await supabase
        .rpc('assign_animal_archetype', { p_user_id: session.user.id });

      if (autoError) {
        console.error("Error auto-assigning archetype:", autoError);
        return NextResponse.json({ error: autoError.message }, { status: 500 });
      }

      // Get the assigned archetype details
      const { data: assignment, error: fetchError } = await supabase
        .from('user_animal_archetypes')
        .select(`
          *,
          archetype:animal_archetypes (*)
        `)
        .eq('user_id', session.user.id)
        .single();

      if (fetchError) {
        console.error("Error fetching assigned archetype:", fetchError);
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        assignment,
        message: "Archetype auto-assigned based on your behavior patterns"
      });

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Unexpected error in archetype POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
