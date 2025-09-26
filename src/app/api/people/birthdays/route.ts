import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const days = parseInt(searchParams.get("days") || "30"); // Default to next 30 days

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    console.log("Fetching upcoming birthdays for project:", projectId, "within", days, "days");
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

    // Get all people with birthdays
    const { data: people, error } = await supabase
      .from("people_contacts")
      .select("*")
      .eq("project_id", projectId)
      .not("birthday", "is", null)
      .order("name", { ascending: true });

    if (error) {
      console.error("People fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Calculate upcoming birthdays
    const today = new Date();
    const upcomingBirthdays = people?.map(person => {
      const birthday = new Date(person.birthday!);
      const thisYear = today.getFullYear();
      
      // Calculate this year's birthday
      let birthdayThisYear = new Date(thisYear, birthday.getMonth(), birthday.getDate());
      
      // If birthday already passed this year, use next year
      if (birthdayThisYear < today) {
        birthdayThisYear = new Date(thisYear + 1, birthday.getMonth(), birthday.getDate());
      }
      
      const daysUntil = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate age
      let age = thisYear - birthday.getFullYear();
      if (birthdayThisYear.getFullYear() > thisYear) {
        age += 1; // Will be this age on their birthday
      }

      return {
        ...person,
        days_until_birthday: daysUntil,
        upcoming_birthday: birthdayThisYear.toISOString().split('T')[0],
        turning_age: age
      };
    }).filter(person => person.days_until_birthday <= days)
      .sort((a, b) => a.days_until_birthday - b.days_until_birthday) || [];

    console.log("Found upcoming birthdays:", upcomingBirthdays.length);
    return NextResponse.json({ birthdays: upcomingBirthdays });

  } catch (error) {
    console.error("Error in GET /api/people/birthdays:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
