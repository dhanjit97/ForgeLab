import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, createSession, getSession, destroySession } from './auth';
import { pool } from './db';

vi.mock('./db', () => ({ pool: { query: vi.fn() } }));

describe('auth helpers', () => {
  const query = vi.mocked(pool.query);

  beforeEach(() => {
    query.mockReset();
  });

  it('hashes and verifies passwords', async () => {
    const hash = await hashPassword('secret123');
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe('secret123');
    expect(await verifyPassword('secret123', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('createSession stores a hashed token (not the raw token)', async () => {
    query.mockResolvedValueOnce({ rows: [] } as any);
    const token = await createSession('user-1');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain('INSERT INTO sessions');
    expect(params[0]).toBe('user-1');
    // token_hash is a 64-char hex SHA-256, never the raw token
    expect(params[1]).toHaveLength(64);
    expect(params[1]).not.toBe(token);
    expect(params[2]).toBeInstanceOf(Date);
  });

  it('getSession returns null for an unknown token', async () => {
    query.mockResolvedValueOnce({ rows: [] } as any);
    const session = await getSession('bad-token');
    expect(session).toBeNull();
    expect(query).toHaveBeenCalledWith(expect.stringContaining('FROM sessions s'), [
      expect.any(String),
    ]);
  });

  it('getSession returns the session row for a valid token', async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 's1', user_id: 'u1', email: 'a@b.com', status: 'active' }],
    } as any);
    const session = await getSession('tok');
    expect(session).toMatchObject({ user_id: 'u1', email: 'a@b.com' });
  });

  it('destroySession deletes by token hash', async () => {
    query.mockResolvedValueOnce({ rowCount: 1 } as any);
    await destroySession('token');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM sessions'), [
      expect.any(String),
    ]);
  });
});
