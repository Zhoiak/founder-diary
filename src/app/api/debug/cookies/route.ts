import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    return NextResponse.json({
      success: true,
      cookies: allCookies,
      headers: Object.fromEntries(req.headers.entries()),
      authCookie: cookieStore.get('auth-token')?.value || null,
    });
    
  } catch (error) {
    console.error('Debug cookies error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
