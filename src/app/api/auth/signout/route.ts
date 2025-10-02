import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    // Remove auth cookie
    await removeAuthCookie();
    
    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });
    
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
