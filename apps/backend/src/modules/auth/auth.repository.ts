import { randomUUID } from 'node:crypto';

import { getSqliteClient } from '../../db/sqlite.js';
import type { IUserRecord } from './auth.types.js';

interface IUserRow {
  id: string;
  email: string;
  password_hash: string;
  business_type: string | null;
  created_at: string;
}

function mapUserRow(row: IUserRow): IUserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    businessType: row.business_type,
    createdAt: row.created_at,
  };
}

export function findUserByEmail(email: string): IUserRecord | null {
  const row = getSqliteClient()
    .prepare(
      `
        SELECT id, email, password_hash, business_type, created_at
        FROM users
        WHERE email = ?
      `,
    )
    .get(email) as IUserRow | undefined;

  return row ? mapUserRow(row) : null;
}

export function findUserById(userId: string): IUserRecord | null {
  const row = getSqliteClient()
    .prepare(
      `
        SELECT id, email, password_hash, business_type, created_at
        FROM users
        WHERE id = ?
      `,
    )
    .get(userId) as IUserRow | undefined;

  return row ? mapUserRow(row) : null;
}

export function createUser(input: {
  email: string;
  passwordHash: string;
  businessType?: string | null;
}): IUserRecord {
  const userId = randomUUID();

  getSqliteClient()
    .prepare(
      `
        INSERT INTO users (id, email, password_hash, business_type)
        VALUES (?, ?, ?, ?)
      `,
    )
    .run(userId, input.email, input.passwordHash, input.businessType ?? null);

  const createdUser = findUserById(userId);

  if (!createdUser) {
    throw new Error('Created user was not found');
  }

  return createdUser;
}
