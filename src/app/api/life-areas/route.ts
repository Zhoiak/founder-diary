import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { lifeAreas } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const createLifeAreaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const updateLifeAreaSchema = createLifeAreaSchema.partial();

// GET /api/life-areas - Get life areas for current user
export async function GET() {
  try {
    const user = await requireAuth();
    
    const areas = await db
      .select()
      .from(lifeAreas)
      .where(and(
        eq(lifeAreas.userId, user.id),
        eq(lifeAreas.isActive, true)
      ))
      .orderBy(lifeAreas.sortOrder, lifeAreas.name);
    
    return NextResponse.json({
      success: true,
      areas,
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Get life areas error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// POST /api/life-areas - Create new life area
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    
    // Validate input
    const validation = createLifeAreaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      }, { status: 400 });
    }
    
    const data = validation.data;
    
    // Create life area
    const newArea = await db
      .insert(lifeAreas)
      .values({
        userId: user.id,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'Life area created successfully',
      area: newArea[0],
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Create life area error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
