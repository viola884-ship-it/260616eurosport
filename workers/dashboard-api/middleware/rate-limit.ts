/**
 * Rate Limiting Middleware
 * Simple in-memory rate limiter for dashboard API
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function getClientIdentifier(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

export function rateLimitHeaders(result: ReturnType<typeof rateLimit>): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  };
}