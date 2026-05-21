import type { RequestHandler } from 'express';

import { AppError } from '../../lib/app-error.js';
import { AUTH_COOKIE_NAME, clearAuthCookie, setAuthCookie } from './auth.cookies.js';
import { getSessionFromToken, loginUser, registerUser } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

function getValidationDetails(error: unknown): string[] | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'issues' in error &&
    Array.isArray(error.issues)
  ) {
    return error.issues.map((issue) => String(issue.message));
  }

  return undefined;
}

export const registerController: RequestHandler = async (request, response, next) => {
  try {
    const payload = registerSchema.parse(request.body);
    const result = await registerUser(payload);

    setAuthCookie(response, result.token);
    response.status(201).json({ data: result.user });
  } catch (error) {
    const details = getValidationDetails(error);
    next(details ? new AppError('Некорректные данные регистрации', 400, details) : error);
  }
};

export const loginController: RequestHandler = async (request, response, next) => {
  try {
    const payload = loginSchema.parse(request.body);
    const result = await loginUser(payload);

    setAuthCookie(response, result.token);
    response.status(200).json({ data: result.user });
  } catch (error) {
    const details = getValidationDetails(error);
    next(details ? new AppError('Некорректные данные входа', 400, details) : error);
  }
};

export const logoutController: RequestHandler = (_request, response) => {
  clearAuthCookie(response);
  response.status(204).send();
};

export const getCurrentSessionController: RequestHandler = (request, response) => {
  const token = request.cookies?.[AUTH_COOKIE_NAME] as string | undefined;

  response.status(200).json({
    data: getSessionFromToken(token),
  });
};
