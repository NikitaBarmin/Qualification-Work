import type { Request, RequestHandler } from 'express';

import { AppError } from '../lib/app-error.js';
import { AUTH_COOKIE_NAME } from '../modules/auth/auth.cookies.js';
import { getSessionFromToken } from '../modules/auth/auth.service.js';
import type { IUserSession } from '../modules/auth/auth.types.js';

export interface IAuthenticatedRequest extends Request {
  user: IUserSession;
}

export const requireSession: RequestHandler = (request, _response, next) => {
  const token = request.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
  const session = getSessionFromToken(token);

  if (!session) {
    next(new AppError('Требуется авторизация', 401));
    return;
  }

  (request as IAuthenticatedRequest).user = session;
  next();
};

export function getAuthenticatedUser(request: Request): IUserSession {
  return (request as IAuthenticatedRequest).user;
}
