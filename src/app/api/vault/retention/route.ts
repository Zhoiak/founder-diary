import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const RetentionPolicySchema = z.object({
  projectId: z.string().uuid(),
  enabled: z.boolean(),
  deleteAfterMonths: z.number().min(1).max(120).optional(),
  archiveAfterMonths: z.number().min(1).max(120).optional(),
  notifyBeforeDays: z.number().min(1).max(90).default(30),
}).refine(data => {
  if (data.enabled && data.deleteAfterMonths && data.archiveAfterMonths) {
    return data.deleteAfterMonths > data.archiveAfterMonths;
  }
  return true;
}, {
  message: "Delete period must be longer than archive period",
  path: ["deleteAfterMonths"]
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get retention policy
    const { data: vaultConfig, error } = await supabase
      .from('vault_configurations')
      .select('retention_policy')
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching retention policy:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get retention logs
    const { data: logs, error: logsError } = await supabase
      .from('data_retention_logs')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)
      .order('executed_at', { ascending: false })
      .limit(20);

    if (logsError) {
      console.error("Error fetching retention logs:", logsError);
    }

    return NextResponse.json({
      success: true,
      retentionPolicy: vaultConfig?.retention_policy || {
        enabled: false,
        delete_after_months: 18,
        archive_after_months: 12,
        notify_before_days: 30
      },
      logs: logs || []
    });

  } catch (error: any) {
    console.error("Unexpected error in retention GET:", error);
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

    // Validate request body
    const body = await req.json();
    const validatedData = RetentionPolicySchema.parse(body);

    console.log("Updating retention policy for user:", session.user.id);

    // Check if user has access to this project
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', validatedData.projectId)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Only owners can update retention policy
    if (membership.role !== 'owner') {
      return NextResponse.json({ error: "Only project owners can update retention policy" }, { status: 403 });
    }

    // Update retention policy
    const retentionPolicy = {
      enabled: validatedData.enabled,
      delete_after_months: validatedData.deleteAfterMonths || 18,
      archive_after_months: validatedData.archiveAfterMonths || 12,
      notify_before_days: validatedData.notifyBeforeDays
    };

    const { data: updatedConfig, error: updateError } = await supabase
      .from('vault_configurations')
      .update({ 
        retention_policy: retentionPolicy,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', validatedData.projectId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating retention policy:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log("Retention policy updated for project:", validatedData.projectId);

    return NextResponse.json({
      success: true,
      retentionPolicy,
      message: "Retention policy updated successfully"
    });

  } catch (error: any) {
    console.error("Unexpected error in retention POST:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply retention policy (dry run or actual)
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const dryRun = searchParams.get("dryRun") === 'true';

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Applying retention policy (dry run: ${dryRun}) for project:`, projectId);

    // Apply retention policy using database function
    const { data: result, error } = await supabase.rpc('apply_data_retention_policy', {
      p_project_id: projectId,
      p_user_id: session.user.id,
      p_dry_run: dryRun
    });

    if (error) {
      console.error("Error applying retention policy:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      result,
      dryRun,
      message: dryRun 
        ? "Retention policy simulation completed" 
        : "Retention policy applied successfully"
    });

  } catch (error: any) {
    console.error("Unexpected error in retention PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
