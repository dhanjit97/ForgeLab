import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, requireCsrf } from './middleware';
import { getSession } from './auth';

vi.mock('./auth', () => ({ getSession: vi.fn() }));

const makeReply = () => {
  const statuses: number[] = [];
  const bodies: any[] = [];
  return {
    status: vi.fn(function (this: any, code: number) {
      statuses.push(code);
      return this;
    }),
    send: vi.fn(function (this: any, obj: any) {
      bodies.push(obj);
      return this;
    }),
    clearCookie: vi.fn(),
    setCookie: vi.fn(),
    last: () => ({ status: statuses[statuses.length - 1], body: bodies[bodies.length - 1] }),
  };
};

describe('middleware', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('requireAuth sets request.user on a valid session', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user_id: 'u1',
      email: 'a@b.com',
      status: 'active',
    });
    const req: any = {
      cookies: { session_token: 'tok' },
      id: 'req-1',
      method: 'GET',
      protocol: 'http',
      headers: {},
    };
    const reply = makeReply() as any;
    await requireAuth(req, reply);
    expect(req.user).toEqual({ id: 'u1', email: 'a@b.com', status: 'active' });
    expect(reply.last().status).toBeUndefined();
  });

  it('requireAuth returns 401 when there is no session cookie', async () => {
    const req: any = {
      cookies: {},
      id: 'req-2',
      method: 'GET',
      protocol: 'http',
      headers: {},
    };
    const reply = makeReply() as any;
    await requireAuth(req, reply);
    expect(reply.last().status).toBe(401);
    expect(reply.last().body.code).toBe('UNAUTHENTICATED');
  });

  it('requireAuth returns 401 when the session is invalid or expired', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const req: any = {
      cookies: { session_token: 'stale' },
      id: 'req-3',
      method: 'GET',
      protocol: 'http',
      headers: {},
    };
    const reply = makeReply() as any;
    await requireAuth(req, reply);
    expect(reply.last().status).toBe(401);
  });

  it('requireCsrf passes when cookies and header tokens match', () => {
    const req: any = {
      cookies: { csrf_token: 'abc123' },
      headers: { 'x-csrf-token': 'abc123' },
      method: 'POST',
    };
    expect(requireCsrf(req)).toBeUndefined();
  });

  it('requireCsrf fails when tokens mismatch', () => {
    const req: any = {
      cookies: { csrf_token: 'abc123' },
      headers: { 'x-csrf-token': 'xyz' },
      method: 'POST',
    };
    const result = requireCsrf(req);
    expect(result).toMatchObject({ code: 'FORBIDDEN', message: 'CSRF token mismatch' });
  });

  it('requireCsrf fails when the header token is missing', () => {
    const req: any = {
      cookies: { csrf_token: 'abc123' },
      headers: {},
      method: 'DELETE',
    };
    expect(requireCsrf(req)).toMatchObject({ code: 'FORBIDDEN' });
  });

  it('requireCsrf skips read-only methods', () => {
    const req: any = { cookies: {}, headers: {}, method: 'GET' };
    expect(requireCsrf(req)).toBeUndefined();
    const req2: any = { cookies: {}, headers: {}, method: 'HEAD' };
    expect(requireCsrf(req2)).toBeUndefined();
  });
});
