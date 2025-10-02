import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { personalEntries, lifeAreas } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { z } from 'zod';

const createPersonalEntrySchema = z.object({
  lifeAreaId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required'),
  mood: z.number().int().min(1).max(5).optional(),
  energyLevel: z.number().int().min(1).max(5).optional(),
  gratitudeNotes: z.array(z.string()).default([]),
  goalsProgress: z.record(z.any()).optional(),
  tags: z.array(z.string()).default([]),
  isPrivate: z.boolean().default(true),
  entryType: z.enum(['daily', 'weekly', 'monthly', 'reflection']).default('daily'),
});

const updatePersonalEntrySchema = createPersonalEntrySchema.partial();

// GET /api/personal-entries-pg - Get personal entries for current user
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    
    const lifeAreaId = searchParams.get('lifeAreaId');
    const entryType = searchParams.get('entryType');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query
    let query = db
      .select({
        id: personalEntries.id,
        lifeAreaId: personalEntries.lifeAreaId,
        title: personalEntries.title,
        content: personalEntries.content,
        mood: personalEntries.mood,
        energyLevel: personalEntries.energyLevel,
        gratitudeNotes: personalEntries.gratitudeNotes,
        goalsProgress: personalEntries.goalsProgress,
        tags: personalEntries.tags,
        isPrivate: personalEntries.isPrivate,
        entryType: personalEntries.entryType,
        createdAt: personalEntries.createdAt,
        updatedAt: personalEntries.updatedAt,
        // Include life area info if exists
        lifeArea: {
          id: lifeAreas.id,
          name: lifeAreas.name,
          color: lifeAreas.color,
          icon: lifeAreas.icon,
        }
      })
      .from(personalEntries)
      .leftJoin(lifeAreas, eq(personalEntries.lifeAreaId, lifeAreas.id))
      .where(eq(personalEntries.userId, user.id));
    
    // Apply filters
    if (lifeAreaId) {
      query = query.where(and(
        eq(personalEntries.userId, user.id),
        eq(personalEntries.lifeAreaId, lifeAreaId)
      ));
    }
    
    if (entryType) {
      query = query.where(and(
        eq(personalEntries.userId, user.id),
        eq(personalEntries.entryType, entryType as any)
      ));
    }
    
    if (from) {
      query = query.where(and(
        eq(personalEntries.userId, user.id),
        gte(personalEntries.createdAt, new Date(from))
      ));
    }
    
    if (to) {
      query = query.where(and(
        eq(personalEntries.userId, user.id),
        lte(personalEntries.createdAt, new Date(to))
      ));
    }
    
    // Order by creation date (newest first) and apply pagination
    const entries = await query
      .orderBy(desc(personalEntries.createdAt))
      .limit(limit)
      .offset(offset);
    
    return NextResponse.json({
      success: true,
      entries,
      pagination: {
        limit,
        offset,
        total: entries.length,
      },
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Get personal entries error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// POST /api/personal-entries-pg - Create new personal entry
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    
    // Validate input
    const validation = createPersonalEntrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      }, { status: 400 });
    }
    
    const data = validation.data;
    
    // Verify life area belongs to user if specified
    if (data.lifeAreaId) {
      const lifeArea = await db
        .select()
        .from(lifeAreas)
        .where(and(
          eq(lifeAreas.id, data.lifeAreaId),
          eq(lifeAreas.userId, user.id)
        ))
        .limit(1);
      
      if (lifeArea.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Life area not found or access denied',
        }, { status: 404 });
      }
    }
    
    // Create personal entry
    const newEntry = await db
      .insert(personalEntries)
      .values({
        userId: user.id,
        lifeAreaId: data.lifeAreaId,
        title: data.title,
        content: data.content,
        mood: data.mood,
        energyLevel: data.energyLevel,
        gratitudeNotes: data.gratitudeNotes,
        goalsProgress: data.goalsProgress,
        tags: data.tags,
        isPrivate: data.isPrivate,
        entryType: data.entryType,
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'Personal entry created successfully',
      entry: newEntry[0],
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Create personal entry error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
