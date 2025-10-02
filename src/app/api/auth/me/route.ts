import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      }, { status: 401 });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        isActive: session.user.isActive,
        createdAt: session.user.createdAt,
      },
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
