import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateSalt, validateKeyStrength } from "@/lib/encryption";
import { z } from "zod";

const SetupVaultSchema = z.object({
  projectId: z.string().uuid(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

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
    const { projectId, password } = SetupVaultSchema.parse(body);

    console.log("Setting up Private Vault for user:", session.user.id);

    // Check if user has access to this project
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Only owners can set up vault
    if (membership.role !== 'owner') {
      return NextResponse.json({ error: "Only project owners can set up Private Vault" }, { status: 403 });
    }

    // Validate password strength
    const passwordValidation = validateKeyStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ 
        error: "Password is too weak", 
        feedback: passwordValidation.feedback 
      }, { status: 400 });
    }

    // Generate salt for this user's vault
    const salt = generateSalt();

    // Store vault configuration (never store the actual password)
    const { data: vaultConfig, error: vaultError } = await supabase
      .from('vault_configurations')
      .upsert({
        project_id: projectId,
        user_id: session.user.id,
        salt,
        is_enabled: true,
        setup_at: new Date().toISOString(),
        password_strength_score: passwordValidation.score
      })
      .select()
      .single();

    if (vaultError) {
      console.error("Error setting up vault:", vaultError);
      return NextResponse.json({ error: vaultError.message }, { status: 500 });
    }

    // Enable private_vault flag on project
    const { error: projectError } = await supabase
      .from('projects')
      .update({ private_vault: true })
      .eq('id', projectId);

    if (projectError) {
      console.error("Error updating project vault flag:", projectError);
    }

    console.log("Private Vault setup completed for project:", projectId);

    return NextResponse.json({
      success: true,
      vault: {
        id: vaultConfig.id,
        isEnabled: true,
        setupAt: vaultConfig.setup_at,
        passwordStrengthScore: passwordValidation.score
      },
      message: "Private Vault setup completed successfully"
    });

  } catch (error: any) {
    console.error("Unexpected error in vault setup:", error);
    
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

    // Get vault configuration
    const { data: vaultConfig, error } = await supabase
      .from('vault_configurations')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error("Error fetching vault config:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      vault: vaultConfig ? {
        id: vaultConfig.id,
        isEnabled: vaultConfig.is_enabled,
        setupAt: vaultConfig.setup_at,
        passwordStrengthScore: vaultConfig.password_strength_score,
        lastAccessedAt: vaultConfig.last_accessed_at
      } : null
    });

  } catch (error: any) {
    console.error("Unexpected error in vault GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
