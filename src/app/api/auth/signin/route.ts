import { NextRequest, NextResponse } from 'next/server';
import { signIn, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validation = signInSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      }, { status: 400 });
    }
    
    const { email, password } = validation.data;
    
    // Attempt sign in
    const session = await signIn(email, password);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
      }, { status: 401 });
    }
    
    // Set auth cookie
    await setAuthCookie(session.token);
    
    return NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
    });
    
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
