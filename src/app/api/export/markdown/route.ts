import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, getSession } from "@/lib/supabase/server";
import JSZip from "jszip";

const ExportSchema = z.object({
  projectId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parse = ExportSchema.safeParse(body);
  if (!parse.success) {
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
    return NextResponse.json({ error: "access denied" }, { status: 403 });
  }

  // Get project info
  const { data: project } = await supabase
    .from("projects")
    .select("name, slug")
    .eq("id", parse.data.projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }

  try {
    const zip = new JSZip();

    // Export daily logs
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("project_id", parse.data.projectId)
      .order("date", { ascending: true });

    if (logs && logs.length > 0) {
      const logsFolder = zip.folder("daily-logs");
      logs.forEach((log) => {
        const filename = `${log.date}-${log.title.replace(/[^a-zA-Z0-9]/g, "-")}.md`;
        const content = `# ${log.title}

**Date:** ${log.date}
**Tags:** ${log.tags.join(", ")}
**Mood:** ${log.mood || "N/A"}/5
**Time Spent:** ${log.time_spent_minutes || 0} minutes

${log.content_md}

---
*AI Summary: ${log.ai_summary || "No summary available"}*
`;
        logsFolder?.file(filename, content);
      });
    }

    // Export weekly reviews
    const { data: reviews } = await supabase
      .from("weekly_reviews")
      .select("*")
      .eq("project_id", parse.data.projectId)
      .order("week_start", { ascending: true });

    if (reviews && reviews.length > 0) {
      const reviewsFolder = zip.folder("weekly-reviews");
      reviews.forEach((review) => {
        const filename = `week-${review.week_start}-to-${review.week_end}.md`;
        const content = `# Weekly Review: ${review.week_start} to ${review.week_end}

${review.content_md}

---
*Generated on: ${new Date(review.created_at).toLocaleDateString()}*
`;
        reviewsFolder?.file(filename, content);
      });
    }

    // Export goals and OKRs
    const { data: goals } = await supabase
      .from("goals")
      .select(`
        *,
        key_results (*)
      `)
      .eq("project_id", parse.data.projectId)
      .order("created_at", { ascending: true });

    if (goals && goals.length > 0) {
      const goalsFolder = zip.folder("goals-okrs");
      goals.forEach((goal) => {
        const filename = `goal-${goal.objective.replace(/[^a-zA-Z0-9]/g, "-")}.md`;
        const keyResultsText = goal.key_results
          ?.map((kr: any) => `- **${kr.name}**: ${kr.current}/${kr.target} ${kr.unit || ""}`)
          .join("\n") || "No key results defined";
        
        const content = `# Goal: ${goal.objective}

**Due Date:** ${goal.due_date || "No due date set"}
**Created:** ${new Date(goal.created_at).toLocaleDateString()}

## Key Results
${keyResultsText}
`;
        goalsFolder?.file(filename, content);
      });
    }

    // Export investor updates
    const { data: updates } = await supabase
      .from("investor_updates")
      .select("*")
      .eq("project_id", parse.data.projectId)
      .order("year", { ascending: true })
      .order("month", { ascending: true });

    if (updates && updates.length > 0) {
      const updatesFolder = zip.folder("investor-updates");
      updates.forEach((update) => {
        const filename = `${update.year}-${String(update.month).padStart(2, "0")}-investor-update.md`;
        const content = `# Investor Update - ${new Date(update.year, update.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}

${update.content_md}

---
**Public:** ${update.is_public ? "Yes" : "No"}
${update.is_public ? `**Public URL:** ${process.env.NEXT_PUBLIC_APP_URL}/public/${update.public_slug}` : ""}
*Generated on: ${new Date(update.created_at).toLocaleDateString()}*
`;
        updatesFolder?.file(filename, content);
      });
    }

    // Add a README
    const readme = `# ${project.name} - Founder Diary Export

This export contains all your founder diary data for the project "${project.name}".

## Contents

- **daily-logs/**: All your daily log entries
- **weekly-reviews/**: Generated weekly summaries
- **goals-okrs/**: Your objectives and key results
- **investor-updates/**: Monthly investor updates

## Generated on
${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

---
*Exported from Founder Diary*
`;
    zip.file("README.md", readme);

    // Generate the zip file
    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${project.slug}-export.zip"`,
      },
    });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
