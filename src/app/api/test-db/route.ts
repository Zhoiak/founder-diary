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
    
    return NextResponse.json({ 
      success: true, 
      message: 'PostgreSQL connection successful ✅',
      data: {
        userCount,
        flagCount,
        database: dbInfo.rows[0]?.database_name,
        user: dbInfo.rows[0]?.user_name,
        version: dbInfo.rows[0]?.postgres_version?.split(' ')[0] + ' ' + dbInfo.rows[0]?.postgres_version?.split(' ')[1]
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
