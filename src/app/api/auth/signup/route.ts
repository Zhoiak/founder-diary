import { NextRequest, NextResponse } from 'next/server';
import { createUser, setAuthCookie, generateToken, getUserByEmail } from '@/lib/auth';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validation = signUpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      }, { status: 400 });
    }
    
    const { email, password, name } = validation.data;
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User already exists with this email',
      }, { status: 409 });
    }
    
    // Create user
    const user = await createUser(email, password, name);
    
    // Generate token and set cookie
    const token = generateToken(user.id);
    await setAuthCookie(token);
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('Sign up error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
