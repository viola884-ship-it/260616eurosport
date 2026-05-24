/**
 * Authentication Middleware
 * Handles password validation and session cookie management
 */

import type { Env } from '../types';

const SESSION_COOKIE = 'dashboard_session';

interface SessionData {
  authenticated: boolean;
  timestamp: number;
}

export async function authMiddleware(
  request: Request,
  env: Env
): Promise<{ authorized: boolean; response?: Response }> {
  if (request.url.includes('/dashboard-api/login')) {
    return { authorized: true };
  }

  const sessionCookie = request.headers.get('Cookie');
  if (!sessionCookie) {
    return { authorized: false };
  }

  const cookies = parseCookies(sessionCookie);
  const sessionValue = cookies[SESSION_COOKIE];

  if (!sessionValue) {
    return { authorized: false };
  }

  try {
    const sessionData = JSON.parse(base64Decode(sessionValue)) as SessionData;
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    if (now - sessionData.timestamp > thirtyMinutes) {
      return { authorized: false };
    }

    return { authorized: true };
  } catch {
    return { authorized: false };
  }
}

export function createSessionCookie(sessionData: SessionData): string {
  const encoded = base64Encode(JSON.stringify(sessionData));
  return `${SESSION_COOKIE}=${encoded}; HttpOnly; Path=/; Max-Age=${30 * 60}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0`;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      cookies[name] = valueParts.join('=');
    }
  });
  return cookies;
}

function base64Encode(str: string): string {
  return btoa(str);
}

function base64Decode(str: string): string {
  return atob(str);
}

export async function validateCredentials(
  env: Env,
  password: string
): Promise<boolean> {
  const storedPassword = env.DASHBOARD_PASSWORD || 'changeme';
  return password === storedPassword;
}