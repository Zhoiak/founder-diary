import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const COOKIE_NAME = 'auth-token';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (result.length === 0) return null;
  
  const user = result[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
    role: user.role || 'user',
    isActive: user.isActive || false,
    createdAt: user.createdAt || new Date(),
  };
}

// Get user by ID
export async function getUserById(id: string): Promise<AuthUser | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  
  if (result.length === 0) return null;
  
  const user = result[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
    role: user.role || 'user',
    isActive: user.isActive || false,
    createdAt: user.createdAt || new Date(),
  };
}

// Create user
export async function createUser(email: string, password: string, name?: string): Promise<AuthUser> {
  const hashedPassword = await hashPassword(password);
  
  const result = await db.insert(users).values({
    email,
    passwordHash: hashedPassword,
    name,
    role: 'user',
    isActive: true,
  }).returning();
  
  const user = result[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
    role: user.role || 'user',
    isActive: user.isActive || false,
    createdAt: user.createdAt || new Date(),
  };
}

// Sign in user
export async function signIn(email: string, password: string): Promise<AuthSession | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  
  // Get full user record with password hash
  const userRecord = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (userRecord.length === 0 || !userRecord[0].passwordHash) return null;
  
  const isValidPassword = await verifyPassword(password, userRecord[0].passwordHash);
  if (!isValidPassword) return null;
  
  if (!user.isActive) return null;
  
  const token = generateToken(user.id);
  
  return {
    user,
    token,
  };
}

// Set auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

// Get auth cookie
export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

// Remove auth cookie
export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Get current session
export async function getCurrentSession(): Promise<AuthSession | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  const user = await getUserById(decoded.userId);
  if (!user || !user.isActive) return null;
  
  return {
    user,
    token,
  };
}

// Middleware helper to require authentication
export async function requireAuth(): Promise<AuthUser> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session.user;
}
