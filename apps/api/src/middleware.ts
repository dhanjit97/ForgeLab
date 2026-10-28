// @forgelab/api/middleware — authentication and CSRF middleware.
//
// Session cookie: HttpOnly, Secure, SameSite=Lax. SameSite=Lax is chosen for
// usability (cross-site links still work) while CSRF protection (below) covers
// state-changing requests (PRODUCT_REQUIREMENTS.md FR-08).
//
// CSRF: double-submit pattern. A csrf_token cookie (readable by JS) is issued
// at sign-in; state-changing requests (POST/PUT/PATCH/DELETE) must echo it in
// the X-CSRF-Token header. The server compares the two values.

import { FastifyRequest, FastifyReply } from 'fastify';
import { getSession } from './auth';

export interface AuthRequest extends FastifyRequest {
  user?: { id: string; email: string; status: string };
}

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Secure cookie options. `secure` is true in production; over HTTP in dev the
// browser will not send the cookie, which is expected and signals a dev-only
// setup. SameSite=Lax balances usability with CSRF resistance.
export function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
  } as const;
}

export function isSecure(request: FastifyRequest): boolean {
  return (
    request.protocol === 'https' ||
    request.headers['x-forwarded-proto'] === 'https' ||
    process.env['NODE_ENV'] === 'production'
  );
}

/** Require a valid session; sets request.user on success. */
export async function requireAuth(request: AuthRequest, reply: FastifyReply): Promise<void> {
  const token = request.cookies['session_token'];
  if (!token) {
    await reply.status(401).send({
      code: 'UNAUTHENTICATED',
      message: 'No session cookie',
      requestId: request.id,
    });
    return;
  }

  const session = await getSession(token);
  if (!session) {
    await reply.status(401).send({
      code: 'UNAUTHENTICATED',
      message: 'Invalid or expired session',
      requestId: request.id,
    });
    return;
  }

  request.user = {
    id: session.user_id,
    email: session.email,
    status: session.status,
  };
}

/** Require a matching CSRF token for state-changing requests.
 *
 * Returns an error response object when the check fails, otherwise undefined.
 */
export function requireCsrf(request: AuthRequest) {
  if (!STATE_CHANGING_METHODS.has(request.method)) {
    return undefined;
  }

  const cookieCsrf = request.cookies['csrf_token'];
  const headerCsrf = request.headers['x-csrf-token'];

  if (!cookieCsrf || !headerCsrf || cookieCsrf !== headerCsrf) {
    return {
      code: 'FORBIDDEN',
      message: 'CSRF token mismatch',
      requestId: request.id,
    };
  }

  return undefined;
}
