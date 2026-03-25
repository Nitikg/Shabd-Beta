import { NextRequest, NextResponse } from 'next/server';

// Simple in-process rate limiter for Vercel Edge
// NOTE: For multi-instance production traffic, replace with Upstash Redis:
// https://github.com/upstash/ratelimit

const RATE_LIMITED_PATHS = ['/api/chat', '/api/stt', '/api/register'];

// Window: 60s, max requests per IP per path
const WINDOW_MS = 60_000;
const LIMITS: Record<string, number> = {
  '/api/chat':     20, // 20 AI turns per minute per IP
  '/api/stt':      20, // matches chat
  '/api/register': 5,  // 5 registrations per minute per IP
};

const store = new Map<string, { count: number; resetAt: number }>();

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const limit = LIMITS[pathname];
  if (!limit) return NextResponse.next();

  const ip = getIp(req);
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  if (entry.count >= limit) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
      },
    });
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/chat', '/api/stt', '/api/register'],
};
