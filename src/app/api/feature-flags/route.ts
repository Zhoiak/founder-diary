import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { featureFlags, userFeatureFlags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const createFlagSchema = z.object({
  flagName: z.string().min(1, 'Flag name is required'),
  isEnabled: z.boolean().default(false),
  description: z.string().optional(),
  targetAudience: z.enum(['all', 'beta', 'admin']).default('all'),
});

// GET /api/feature-flags - Get all feature flags for current user
export async function GET() {
  try {
    const user = await requireAuth();
    
    // Get all global feature flags
    const globalFlags = await db.select().from(featureFlags);
    
    // Get user-specific overrides
    const userOverrides = await db
      .select()
      .from(userFeatureFlags)
      .where(eq(userFeatureFlags.userId, user.id));
    
    // Create a map of user overrides for quick lookup
    const overrideMap = new Map(
      userOverrides.map(override => [override.flagName, override.isEnabled])
    );
    
    // Combine global flags with user overrides
    const effectiveFlags = globalFlags.map(flag => ({
      flagName: flag.flagName,
      isEnabled: overrideMap.has(flag.flagName) 
        ? overrideMap.get(flag.flagName)
        : flag.isEnabled,
      description: flag.description,
      targetAudience: flag.targetAudience,
      hasUserOverride: overrideMap.has(flag.flagName),
      globalEnabled: flag.isEnabled,
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
    }));
    
    return NextResponse.json({
      success: true,
      flags: effectiveFlags,
      userRole: user.role,
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Get feature flags error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// POST /api/feature-flags - Create new feature flag (admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Only admins can create feature flags
    if (user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }
    
    const body = await req.json();
    
    // Validate input
    const validation = createFlagSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      }, { status: 400 });
    }
    
    const { flagName, isEnabled, description, targetAudience } = validation.data;
    
    // Check if flag already exists
    const existingFlag = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.flagName, flagName))
      .limit(1);
    
    if (existingFlag.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Feature flag already exists',
      }, { status: 409 });
    }
    
    // Create new feature flag
    const newFlag = await db
      .insert(featureFlags)
      .values({
        flagName,
        isEnabled,
        description,
        targetAudience,
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'Feature flag created successfully',
      flag: newFlag[0],
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Create feature flag error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
