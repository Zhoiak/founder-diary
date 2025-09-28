import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const userNumber = searchParams.get("userNumber");

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from('user_numbers')
      .select('*')
      .eq('is_discoverable', true)
      .neq('user_id', session.user.id); // Exclude current user

    // Search by user number
    if (userNumber) {
      const numericSearch = parseInt(userNumber.replace('#', ''));
      if (!isNaN(numericSearch)) {
        query = query.eq('user_number', numericSearch);
      }
    }

    // Search by display name or bio
    if (search && !userNumber) {
      query = query.or(`display_name.ilike.%${search}%,bio.ilike.%${search}%`);
    }

    const { data: users, error } = await query.limit(20);

    if (error) {
      console.error("Error searching users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      users: users || []
    });

  } catch (error: any) {
    console.error("Unexpected error in users search:", error);
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
    const { display_name, bio, is_discoverable } = body;

    // Update user profile
    const { data: userProfile, error: updateError } = await supabase
      .from('user_numbers')
      .update({
        display_name,
        bio,
        is_discoverable: is_discoverable !== undefined ? is_discoverable : true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: userProfile
    });

  } catch (error: any) {
    console.error("Unexpected error in user profile update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
