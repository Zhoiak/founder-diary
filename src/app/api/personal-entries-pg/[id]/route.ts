import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { personalEntries, lifeAreas } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updatePersonalEntrySchema = z.object({
  lifeAreaId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  mood: z.number().int().min(1).max(5).optional(),
  energyLevel: z.number().int().min(1).max(5).optional(),
  gratitudeNotes: z.array(z.string()).optional(),
  goalsProgress: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional(),
  entryType: z.enum(['daily', 'weekly', 'monthly', 'reflection']).optional(),
});

// GET /api/personal-entries-pg/[id] - Get specific personal entry
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;
    
    // Get entry with life area info
    const entry = await db
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
        lifeArea: {
          id: lifeAreas.id,
          name: lifeAreas.name,
          color: lifeAreas.color,
          icon: lifeAreas.icon,
        }
      })
      .from(personalEntries)
      .leftJoin(lifeAreas, eq(personalEntries.lifeAreaId, lifeAreas.id))
      .where(and(
        eq(personalEntries.id, id),
        eq(personalEntries.userId, user.id)
      ))
      .limit(1);
    
    if (entry.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Personal entry not found',
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      entry: entry[0],
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Get personal entry error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// PATCH /api/personal-entries-pg/[id] - Update personal entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;
    const body = await req.json();
    
    // Validate input
    const validation = updatePersonalEntrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      }, { status: 400 });
    }
    
    const updates = validation.data;
    
    // Verify entry exists and belongs to user
    const existingEntry = await db
      .select()
      .from(personalEntries)
      .where(and(
        eq(personalEntries.id, id),
        eq(personalEntries.userId, user.id)
      ))
      .limit(1);
    
    if (existingEntry.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Personal entry not found',
      }, { status: 404 });
    }
    
    // Verify life area belongs to user if specified
    if (updates.lifeAreaId) {
      const lifeArea = await db
        .select()
        .from(lifeAreas)
        .where(and(
          eq(lifeAreas.id, updates.lifeAreaId),
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
    
    // Update entry
    const updatedEntry = await db
      .update(personalEntries)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(personalEntries.id, id),
        eq(personalEntries.userId, user.id)
      ))
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'Personal entry updated successfully',
      entry: updatedEntry[0],
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Update personal entry error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// DELETE /api/personal-entries-pg/[id] - Delete personal entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;
    
    // Verify entry exists and belongs to user
    const existingEntry = await db
      .select()
      .from(personalEntries)
      .where(and(
        eq(personalEntries.id, id),
        eq(personalEntries.userId, user.id)
      ))
      .limit(1);
    
    if (existingEntry.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Personal entry not found',
      }, { status: 404 });
    }
    
    // Delete entry
    await db
      .delete(personalEntries)
      .where(and(
        eq(personalEntries.id, id),
        eq(personalEntries.userId, user.id)
      ));
    
    return NextResponse.json({
      success: true,
      message: 'Personal entry deleted successfully',
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.error('Delete personal entry error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
