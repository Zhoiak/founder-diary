import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userFeatureFlags, featureFlags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const setUserFlagSchema = z.object({
  flagName: z.string().min(1, 'Flag name is required'),
  isEnabled: z.boolean(),
});

// GET /api/user/feature-flags - Get user's feature flag overrides
export async function GET() {
  try {
    const user = await requireAuth();
    
    // Get user's feature flag overrides
    const userOverrides = await db
      .select({
        flagName: userFeatureFlags.flagName,
        isEnabled: userFeatureFlags.isEnabled,
        createdAt: userFeatureFlags.createdAt,
      })
      .from(userFeatureFlags)
      .where(eq(userFeatureFlags.userId, user.id));
    
    return NextResponse.json({
      success: true,
      overrides: userOverrides,
      userId: user.id,
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Get user feature flags error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// POST /api/user/feature-flags - Set user feature flag override
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    
    // Validate input
    const validation = setUserFlagSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      }, { status: 400 });
    }
    
    const { flagName, isEnabled } = validation.data;
    
    // Check if the global feature flag exists
    const globalFlag = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.flagName, flagName))
      .limit(1);
    
    if (globalFlag.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Feature flag does not exist',
      }, { status: 404 });
    }
    
    // Upsert user feature flag override
    const result = await db
      .insert(userFeatureFlags)
      .values({
        userId: user.id,
        flagName,
        isEnabled,
      })
      .onConflictDoUpdate({
        target: [userFeatureFlags.userId, userFeatureFlags.flagName],
        set: {
          isEnabled,
          createdAt: new Date(), // Update timestamp
        },
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'User feature flag override set successfully',
      override: result[0],
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Set user feature flag error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// DELETE /api/user/feature-flags - Remove user feature flag override
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const flagName = searchParams.get('flagName');
    
    if (!flagName) {
      return NextResponse.json({
        success: false,
        error: 'Flag name is required',
      }, { status: 400 });
    }
    
    // Remove user override
    const result = await db
      .delete(userFeatureFlags)
      .where(
        and(
          eq(userFeatureFlags.userId, user.id),
          eq(userFeatureFlags.flagName, flagName)
        )
      )
      .returning();
    
    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User feature flag override not found',
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User feature flag override removed successfully',
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Remove user feature flag error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
