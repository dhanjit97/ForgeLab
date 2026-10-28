import { describe, it, expect, vi, beforeEach } from 'vitest';
import fastify from 'fastify';
import cookie from '@fastify/cookie';
import { registerSnippetRoutes } from './snippets';
import { pool } from '../db';
import { getSession } from '../auth';

vi.mock('../db', () => ({ pool: { query: vi.fn() } }));
vi.mock('../auth', () => ({ getSession: vi.fn() }));

const query = vi.mocked(pool.query);
const mockGetSession = vi.mocked(getSession);

async function buildServer() {
  const server = fastify();
  await server.register(cookie);
  registerSnippetRoutes(server);
  return server;
}

describe('snippets routes (HTTP)', () => {
  beforeEach(() => {
    query.mockReset();
    mockGetSession.mockReset();
  });

  it('POST /api/v1/me/snippets requires authentication', async () => {
    const server = await buildServer();
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/me/snippets',
      payload: { title: 'T', language: 'python', code: 'print(1)' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/me/snippets requires a CSRF token on state-changing requests', async () => {
    mockGetSession.mockResolvedValueOnce({
      user_id: 'u1',
      email: 'a@b.com',
      status: 'active',
    });

    const server = await buildServer();
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/me/snippets',
      headers: { cookie: 'session_token=valid-token' },
      payload: { title: 'T', language: 'python', code: 'print(1)' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('POST /api/v1/me/snippets creates a snippet owned by the session user', async () => {
    mockGetSession.mockResolvedValueOnce({
      user_id: 'u1',
      email: 'a@b.com',
      status: 'active',
    });
    query.mockResolvedValueOnce({
      rows: [{ id: 's1', title: 'T', language: 'python', visibility: 'private' }],
    } as any);

    const server = await buildServer();
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/me/snippets',
      headers: {
        cookie: 'session_token=valid-token; csrf_token=csrf-1',
        'x-csrf-token': 'csrf-1',
      },
      payload: {
        title: 'T',
        language: 'python',
        code: 'print(1)',
        visibility: 'private',
      },
    });

    expect(res.statusCode).toBe(201);
    const insertCall = query.mock.calls.find((c) => String(c[0]).includes('INSERT INTO snippets'));
    expect(insertCall).toBeDefined();
    expect(insertCall![1][0]).toBe('u1');
  });

  it("PATCH /api/v1/me/snippets/:id enforces ownership — other user's snippet is 404", async () => {
    mockGetSession.mockResolvedValueOnce({
      user_id: 'u1',
      email: 'a@b.com',
      status: 'active',
    });
    query.mockResolvedValueOnce({ rows: [] } as any);

    const server = await buildServer();
    const res = await server.inject({
      method: 'PATCH',
      url: '/api/v1/me/snippets/snippet-owned-by-u2',
      headers: {
        cookie: 'session_token=valid-token; csrf_token=csrf-1',
        'x-csrf-token': 'csrf-1',
      },
      payload: { title: 'T', language: 'python', code: 'print(1)' },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('NOT_FOUND');
  });

  it('PATCH /api/v1/me/snippets/:id updates a snippet owned by the session user', async () => {
    mockGetSession.mockResolvedValueOnce({
      user_id: 'u1',
      email: 'a@b.com',
      status: 'active',
    });
    query.mockResolvedValueOnce({ rows: [{ id: 's1' }] } as any);
    query.mockResolvedValueOnce({
      rows: [{ id: 's1', title: 'T2', language: 'python', visibility: 'private' }],
    } as any);

    const server = await buildServer();
    const res = await server.inject({
      method: 'PATCH',
      url: '/api/v1/me/snippets/s1',
      headers: {
        cookie: 'session_token=valid-token; csrf_token=csrf-1',
        'x-csrf-token': 'csrf-1',
      },
      payload: { title: 'T2', language: 'python', code: 'print(2)' },
    });

    expect(res.statusCode).toBe(200);
    // The ownership check (SELECT ... WHERE id = $1 AND owner_id = $2)
    // binds both the snippet id and the session user_id.
    const selectCall = query.mock.calls.find((c) =>
      String(c[0]).includes('FROM snippets WHERE id = $1 AND owner_id = $2')
    );
    expect(selectCall).toBeDefined();
    expect(selectCall![1][0]).toBe('s1');
    expect(selectCall![1][1]).toBe('u1');
  });

  it('DELETE /api/v1/me/snippets/:id enforces ownership — cross-user delete is 404', async () => {
    mockGetSession.mockResolvedValueOnce({
      user_id: 'u1',
      email: 'a@b.com',
      status: 'active',
    });
    query.mockResolvedValueOnce({ rows: [] } as any);

    const server = await buildServer();
    const res = await server.inject({
      method: 'DELETE',
      url: '/api/v1/me/snippets/other-users-snippet',
      headers: {
        cookie: 'session_token=valid-token; csrf_token=csrf-1',
        'x-csrf-token': 'csrf-1',
      },
    });

    expect(res.statusCode).toBe(404);
  });

  it('GET /api/v1/snippets returns only public snippets (no auth required)', async () => {
    query.mockResolvedValueOnce({ rows: [] } as any);

    const server = await buildServer();
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/snippets',
    });

    expect(res.statusCode).toBe(200);
    const selectCall = query.mock.calls.find((c) => String(c[0]).includes('FROM snippets'));
    expect(selectCall).toBeDefined();
    expect(String(selectCall![0])).toContain("visibility = 'public'");
  });
});
