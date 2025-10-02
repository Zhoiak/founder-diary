import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { featureFlags, userFeatureFlags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateFlagSchema = z.object({
  isEnabled: z.boolean().optional(),
  description: z.string().optional(),
  targetAudience: z.enum(['all', 'beta', 'admin']).optional(),
});

// GET /api/feature-flags/[flagName] - Get specific feature flag
export async function GET(
  req: NextRequest,
  { params }: { params: { flagName: string } }
) {
  try {
    const user = await requireAuth();
    const { flagName } = params;
    
    // Get global flag
    const globalFlag = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.flagName, flagName))
      .limit(1);
    
    if (globalFlag.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Feature flag not found',
      }, { status: 404 });
    }
    
    // Get user override if exists
    const userOverride = await db
      .select()
      .from(userFeatureFlags)
      .where(
        and(
          eq(userFeatureFlags.userId, user.id),
          eq(userFeatureFlags.flagName, flagName)
        )
      )
      .limit(1);
    
    const flag = globalFlag[0];
    const override = userOverride[0];
    
    return NextResponse.json({
      success: true,
      flag: {
        flagName: flag.flagName,
        isEnabled: override ? override.isEnabled : flag.isEnabled,
        description: flag.description,
        targetAudience: flag.targetAudience,
        hasUserOverride: !!override,
        globalEnabled: flag.isEnabled,
        createdAt: flag.createdAt,
        updatedAt: flag.updatedAt,
      },
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Get feature flag error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// PATCH /api/feature-flags/[flagName] - Update feature flag (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { flagName: string } }
) {
  try {
    const user = await requireAuth();
    const { flagName } = params;
    
    // Only admins can update global feature flags
    if (user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }
    
    const body = await req.json();
    
    // Validate input
    const validation = updateFlagSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      }, { status: 400 });
    }
    
    const updates = validation.data;
    
    // Check if flag exists
    const existingFlag = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.flagName, flagName))
      .limit(1);
    
    if (existingFlag.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Feature flag not found',
      }, { status: 404 });
    }
    
    // Update feature flag
    const updatedFlag = await db
      .update(featureFlags)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(featureFlags.flagName, flagName))
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'Feature flag updated successfully',
      flag: updatedFlag[0],
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Update feature flag error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// DELETE /api/feature-flags/[flagName] - Delete feature flag (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { flagName: string } }
) {
  try {
    const user = await requireAuth();
    const { flagName } = params;
    
    // Only admins can delete feature flags
    if (user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }
    
    // Check if flag exists
    const existingFlag = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.flagName, flagName))
      .limit(1);
    
    if (existingFlag.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Feature flag not found',
      }, { status: 404 });
    }
    
    // Delete user overrides first
    await db
      .delete(userFeatureFlags)
      .where(eq(userFeatureFlags.flagName, flagName));
    
    // Delete feature flag
    await db
      .delete(featureFlags)
      .where(eq(featureFlags.flagName, flagName));
    
    return NextResponse.json({
      success: true,
      message: 'Feature flag deleted successfully',
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Delete feature flag error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
