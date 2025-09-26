import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
}

// In-memory store (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<{ success: boolean; remaining: number; resetTime: number }> => {
    const key = config.keyGenerator ? config.keyGenerator(req) : getClientIP(req);
    const now = Date.now();
    
    // Clean up expired entries
    for (const [k, v] of requestCounts.entries()) {
      if (now > v.resetTime) {
        requestCounts.delete(k);
      }
    }
    
    const current = requestCounts.get(key);
    
    if (!current || now > current.resetTime) {
      // First request or window expired
      const resetTime = now + config.windowMs;
      requestCounts.set(key, { count: 1, resetTime });
      return { success: true, remaining: config.maxRequests - 1, resetTime };
    }
    
    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      return { success: false, remaining: 0, resetTime: current.resetTime };
    }
    
    // Increment count
    current.count++;
    requestCounts.set(key, current);
    
    return { success: true, remaining: config.maxRequests - current.count, resetTime: current.resetTime };
  };
}

function getClientIP(req: NextRequest): string {
  // Try to get real IP from headers (Vercel, Cloudflare, etc.)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfIP = req.headers.get('cf-connecting-ip');
  
  if (cfIP) return cfIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  // Fallback to connection IP
  return req.ip || 'unknown';
}

// Predefined rate limiters
export const publicFeedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 feedback submissions per 15 minutes per IP
});

export const emailInLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 emails per hour per sender
  keyGenerator: (req) => {
    // Use email sender as key instead of IP
    const body = req.body as any;
    return body?.from || getClientIP(req);
  },
});

export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute per IP
});

// Helper to add rate limit headers to response
export function addRateLimitHeaders(
  headers: Headers,
  result: { remaining: number; resetTime: number }
) {
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
}
