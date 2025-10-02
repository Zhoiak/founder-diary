import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, featureFlags } from '@/lib/db/schema';

export async function GET() {
  try {
    console.log('Testing PostgreSQL connection...');
    
    // Test basic connection
    const userCount = await db.select().from(users).then(result => result.length);
    
    // Test feature flags (should have default data)
    const flagCount = await db.select().from(featureFlags).then(result => result.length);
    
    // Get database info
    const dbInfo = await db.execute(`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as postgres_version
    `);
    
    console.log('DB Info result:', dbInfo);
    
    return NextResponse.json({ 
      success: true, 
      message: 'PostgreSQL connection successful ✅',
      data: {
        userCount,
        flagCount,
        database: dbInfo[0]?.database_name || 'unknown',
        user: dbInfo[0]?.user_name || 'unknown',
        version: dbInfo[0]?.postgres_version?.split(' ').slice(0, 2).join(' ') || 'unknown'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'PostgreSQL connection failed ❌',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
