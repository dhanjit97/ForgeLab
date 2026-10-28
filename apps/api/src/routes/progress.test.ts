import { describe, it, expect, vi, beforeEach } from 'vitest';
import fastify from 'fastify';
import cookie from '@fastify/cookie';
import { registerProgressRoutes } from './progress';
import { pool } from '../db';
import { getSession } from '../auth';

vi.mock('../db', () => ({ pool: { query: vi.fn() } }));
vi.mock('../auth', () => ({ getSession: vi.fn() }));

const query = vi.mocked(pool.query);
const mockGetSession = vi.mocked(getSession);

async function buildServer() {
  const server = fastify();
  await server.register(cookie);
  registerProgressRoutes(server);
  return server;
}

describe('progress routes (HTTP)', () => {
  beforeEach(() => {
    query.mockReset();
    mockGetSession.mockReset();
  });

  it('GET /api/v1/me/progress requires authentication', async () => {
    const server = await buildServer();
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/me/progress',
    });
    expect(res.statusCode).toBe(401);
  });

  it("GET /api/v1/me/progress returns the authenticated user's progress", async () => {
    mockGetSession.mockResolvedValueOnce({
      user_id: 'u1',
      email: 'a@b.com',
      status: 'active',
    });
    query.mockResolvedValueOnce({
      rows: [
        { lesson_id: 'l1', content_version: 1, status: 'completed', completed_at: new Date() },
      ],
    } as any);

    const server = await buildServer();
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/me/progress',
      headers: { cookie: 'session_token=valid-token' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()[0].lesson_id).toBe('l1');
  });

  it('PUT /api/v1/me/progress/:lessonId verifies the lesson exists before upserting', async () => {
    mockGetSession.mockResolvedValueOnce({
      user_id: 'u1',
      email: 'a@b.com',
      status: 'active',
    });
    query.mockResolvedValueOnce({ rows: [{ id: 'l1' }] } as any);
    query.mockResolvedValueOnce({
      rows: [
        { lesson_id: 'l1', content_version: 1, status: 'completed', completed_at: new Date() },
      ],
    } as any);

    const server = await buildServer();
    const res = await server.inject({
      method: 'PUT',
      url: '/api/v1/me/progress/l1',
      headers: { cookie: 'session_token=valid-token' },
      payload: { status: 'completed', content_version: 1 },
    });

    expect(res.statusCode).toBe(200);
    const upsertCall = query.mock.calls.find((c) =>
      String(c[0]).includes('INSERT INTO lesson_progress')
    );
    expect(upsertCall).toBeDefined();
    expect(upsertCall![1][0]).toBe('u1');
  });

  it('PUT progress returns 404 when the lesson/content_version is unknown', async () => {
    mockGetSession.mockResolvedValueOnce({
      user_id: 'u1',
      email: 'a@b.com',
      status: 'active',
    });
    query.mockResolvedValueOnce({ rows: [] } as any);

    const server = await buildServer();
    const res = await server.inject({
      method: 'PUT',
      url: '/api/v1/me/progress/unknown',
      headers: { cookie: 'session_token=valid-token' },
      payload: { status: 'completed', content_version: 1 },
    });

    expect(res.statusCode).toBe(404);
  });

  it('PUT progress validates the request body', async () => {
    mockGetSession.mockResolvedValueOnce({
      user_id: 'u1',
      email: 'a@b.com',
      status: 'active',
    });

    const server = await buildServer();
    const res = await server.inject({
      method: 'PUT',
      url: '/api/v1/me/progress/l1',
      headers: { cookie: 'session_token=valid-token' },
      payload: { status: 'bogus', content_version: 1 },
    });

    expect(res.statusCode).toBe(400);
  });
});
