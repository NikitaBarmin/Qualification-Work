import type { Response } from 'express';

import { env } from '../../env.js';

export const AUTH_COOKIE_NAME = 'bp_access_token';
const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(response: Response, token: string) {
  response.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: '/',
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
  });
}

export function clearAuthCookie(response: Response) {
  response.clearCookie(AUTH_COOKIE_NAME, {
    path: '/',
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
  });
}
