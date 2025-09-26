import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";

const CreateHabitSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  schedule: z.string().optional(),
  target_per_week: z.number().int().min(1).max(7).default(7),
  area_id: z.string().uuid().optional(),
  color: z.string().default("#10B981"),
  icon: z.string().default("✅"),
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

    console.log("Fetching habits for project:", projectId);
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

    const { data: habits, error } = await supabase
      .from("habits")
      .select(`
        *,
        life_areas(key, label, color, icon),
        habit_logs!inner(date, done)
      `)
      .eq("project_id", projectId)
      .eq("archived", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Habits fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Calculate streaks and completion rates
    const habitsWithStats = habits?.map(habit => {
      const logs = habit.habit_logs || [];
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Current week completion
      const thisWeekLogs = logs.filter((log: any) => {
        const logDate = new Date(log.date);
        return logDate >= weekAgo && logDate <= today && log.done;
      });

      // Current streak
      let currentStreak = 0;
      const sortedLogs = logs
        .filter((log: any) => log.done)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (sortedLogs.length > 0) {
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);
        
        for (const log of sortedLogs) {
          const logDate = new Date(log.date);
          logDate.setHours(0, 0, 0, 0);
          
          if (logDate.getTime() === checkDate.getTime()) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (logDate.getTime() < checkDate.getTime()) {
            break;
          }
        }
      }

      return {
        ...habit,
        current_streak: currentStreak,
        this_week_count: thisWeekLogs.length,
        completion_rate: habit.target_per_week > 0 ? 
          Math.round((thisWeekLogs.length / habit.target_per_week) * 100) : 0
      };
    }) || [];

    console.log("Fetched habits with stats:", habitsWithStats.length);
    return NextResponse.json({ habits: habitsWithStats });

  } catch (error) {
    console.error("Error in GET /api/habits:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    console.log("Creating habit for user:", session.user.id);
    
    const body = await req.json().catch(() => ({}));
    console.log("Habit request body:", body);
    
    const parse = CreateHabitSchema.safeParse(body);
    if (!parse.success) {
      console.log("Habit validation error:", parse.error.flatten());
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

    console.log("Creating habit in database");

    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .insert({
        project_id: parse.data.projectId,
        user_id: session.user.id,
        title: parse.data.title,
        description: parse.data.description,
        schedule: parse.data.schedule,
        target_per_week: parse.data.target_per_week,
        area_id: parse.data.area_id,
        color: parse.data.color,
        icon: parse.data.icon,
      })
      .select()
      .single();

    if (habitError) {
      console.error("Habit creation error:", habitError);
      return NextResponse.json({ error: habitError.message }, { status: 400 });
    }

    console.log("Habit created:", habit);
    return NextResponse.json({ habit }, { status: 201 });
    
  } catch (error) {
    console.error("Error in POST /api/habits:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
