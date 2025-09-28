import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (best-effort; per runtime instance)
// For production, replace with Redis / Upstash.

type Counter = { count: number; resetAt: number };
const windowMs = 60 * 1000; // 1 minute
const maxRequests = 120; // per IP per minute (adjust per needs)
const apiMaxRequests = 60; // stricter for /api/*

const store: Map<string, Counter> = new Map();

function getKey(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const path = new URL(req.url).pathname;
  const isApi = path.startsWith("/api/");
  return `${ip}:${isApi ? "api" : "app"}`;
}

function checkLimit(key: string, limit: number) {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetIn: existing.resetAt - now };
  }
  existing.count += 1;
  store.set(key, existing);
  return { allowed: true, remaining: limit - existing.count, resetIn: existing.resetAt - now };
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Only rate-limit API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const key = getKey(req);
  const { allowed, remaining, resetIn } = checkLimit(key, apiMaxRequests);

  const res = allowed
    ? NextResponse.next()
    : NextResponse.json({ error: "Too many requests" }, { status: 429 });

  res.headers.set("X-RateLimit-Limit", String(apiMaxRequests));
  res.headers.set("X-RateLimit-Remaining", String(remaining));
  res.headers.set("X-RateLimit-Reset", String(Math.ceil(resetIn / 1000)));
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
