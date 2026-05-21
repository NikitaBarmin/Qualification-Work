import { AppError } from '../../lib/app-error.js';
import { createAuthToken, verifyAuthToken } from './auth.jwt.js';
import { hashPassword, verifyPassword } from './auth.password.js';
import { createUser, findUserByEmail, findUserById } from './auth.repository.js';
import type { LoginDto, RegisterDto } from './auth.schemas.js';
import type { IUserRecord, IUserSession } from './auth.types.js';

function toUserSession(user: IUserRecord): IUserSession {
  return {
    id: user.id,
    email: user.email,
    businessType: user.businessType,
  };
}

export async function registerUser(input: RegisterDto) {
  const existingUser = findUserByEmail(input.email);

  if (existingUser) {
    throw new AppError('Пользователь с таким email уже существует', 409);
  }

  const passwordHash = await hashPassword(input.password);
  const user = createUser({
    email: input.email,
    passwordHash,
    businessType: input.businessType ?? null,
  });

  return {
    token: createAuthToken(user.id),
    user: toUserSession(user),
  };
}

export async function loginUser(input: LoginDto) {
  const user = findUserByEmail(input.email);

  if (!user) {
    throw new AppError('Неверный email или пароль', 401);
  }

  const passwordIsValid = await verifyPassword(input.password, user.passwordHash);

  if (!passwordIsValid) {
    throw new AppError('Неверный email или пароль', 401);
  }

  return {
    token: createAuthToken(user.id),
    user: toUserSession(user),
  };
}

export function getSessionFromToken(token: string | undefined): IUserSession | null {
  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    return null;
  }

  const user = findUserById(payload.userId);

  return user ? toUserSession(user) : null;
}
