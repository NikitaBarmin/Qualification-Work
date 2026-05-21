import jwt from 'jsonwebtoken';

import { env } from '../../env.js';

interface IAuthTokenPayload {
  userId: string;
}

export function createAuthToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: '7d',
  });
}

export function verifyAuthToken(token: string): IAuthTokenPayload | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (typeof payload === 'object' && typeof payload.userId === 'string') {
      return {
        userId: payload.userId,
      };
    }

    return null;
  } catch {
    return null;
  }
}
