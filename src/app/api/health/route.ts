import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Test database connection with a simple query
    await db.execute('SELECT 1');
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      services: {
        database: {
          status: 'up',
          responseTime: `${responseTime}ms`
        },
        api: {
          status: 'up',
          version: process.env.npm_package_version || '0.1.0'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'unhealthy',
      services: {
        database: {
          status: 'down',
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: `${responseTime}ms`
        },
        api: {
          status: 'up',
          version: process.env.npm_package_version || '0.1.0'
        }
      },
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
