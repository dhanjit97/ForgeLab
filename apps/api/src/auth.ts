// @forgelab/api/auth — authentication and session helpers.
//
// Passwords are hashed with bcrypt (cost 12). Session tokens are opaque
// random values; only a SHA-256 hash is stored in the database so a DB leak
// does not expose usable session tokens (EXECUTION_SECURITY.md §9,
// PRODUCT_REQUIREMENTS.md FR-08).

import { createHash, randomBytes } from 'crypto';
import bcryptjs from 'bcryptjs';
const { compare, hash } = bcryptjs;
import { pool } from './db';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Create a new session for a user and return the opaque session token. */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return token;
}

/** Validate a session token and return the session row, or null. */
export async function getSession(token: string) {
  const tokenHash = hashToken(token);
  const res = await pool.query(
    `SELECT s.id, s.user_id, s.expires_at, u.email, u.status
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.expires_at > NOW()
       AND u.status = 'active'`,
    [tokenHash]
  );
  return res.rows[0] ?? null;
}

/** Destroy a single session by token. */
export async function destroySession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await pool.query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
}

/** Destroy all sessions for a user (e.g. password change / signout everywhere). */
export async function destroyAllUserSessions(userId: string): Promise<void> {
  await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
}
