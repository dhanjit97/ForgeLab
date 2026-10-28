// @forgelab/api/routes/auth — signup, signin, signout, current user.
//
// Email/password authentication. The auth provider decision
// (DECISIONS_AND_OPEN_QUESTIONS.md #3) is pending; this self-contained
// implementation is the MVP default and can be swapped for a managed provider
// behind the same session/middleware interface.

import { FastifyInstance, FastifyReply } from 'fastify';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { pool } from '../db';
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  destroyAllUserSessions,
} from '../auth';
import { requireAuth, cookieOptions, isSecure, AuthRequest } from '../middleware';

const signupSchema = z.object({
  email: z.string().email().min(1).max(254),
  password: z.string().min(8).max(128),
});

const signinSchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(1),
});

function setAuthCookies(reply: FastifyReply, token: string, secure: boolean) {
  reply.setCookie('session_token', token, {
    ...cookieOptions(secure),
    maxAge: 30 * 24 * 60 * 60,
  });
  reply.setCookie('csrf_token', randomBytes(16).toString('base64url'), {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
}

export function registerAuthRoutes(server: FastifyInstance) {
  // --- Signup ---
  server.post<{ Body: { email: string; password: string } }>(
    '/api/v1/auth/signup',
    async (request, reply) => {
      const parsed = signupSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          requestId: request.id,
        });
      }
      const { email, password } = parsed.data;

      const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
      if (existing.rows.length > 0) {
        return reply.status(409).send({
          code: 'CONFLICT',
          message: 'Email already registered',
          requestId: request.id,
        });
      }

      const passwordHash = await hashPassword(password);
      const userRes = await pool.query(
        `INSERT INTO users (email, password_hash, status)
         VALUES ($1, $2, 'active')
         RETURNING id, email, status`,
        [email, passwordHash]
      );
      const user = userRes.rows[0];

      const token = await createSession(user.id);
      setAuthCookies(reply, token, isSecure(request));

      return reply.status(201).send({
        user: { id: user.id, email: user.email, status: user.status },
      });
    }
  );

  // --- Signin ---
  server.post<{ Body: { email: string; password: string } }>(
    '/api/v1/auth/signin',
    async (request, reply) => {
      const parsed = signinSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          requestId: request.id,
        });
      }
      const { email, password } = parsed.data;

      const userRes = await pool.query(
        `SELECT id, email, password_hash, status FROM users WHERE email = $1`,
        [email]
      );
      const user = userRes.rows[0];
      if (!user) {
        // Generic failure message to avoid user enumeration.
        return reply.status(401).send({
          code: 'UNAUTHENTICATED',
          message: 'Invalid email or password',
          requestId: request.id,
        });
      }

      const passwordOk = await verifyPassword(password, user.password_hash);
      if (!passwordOk || user.status !== 'active') {
        return reply.status(401).send({
          code: 'UNAUTHENTICATED',
          message: 'Invalid email or password',
          requestId: request.id,
        });
      }

      // Invalidate any existing sessions for this user (session rotation).
      await destroyAllUserSessions(user.id);

      const token = await createSession(user.id);
      setAuthCookies(reply, token, isSecure(request));

      return reply.status(200).send({
        user: { id: user.id, email: user.email, status: user.status },
      });
    }
  );

  // --- Signout ---
  server.post('/api/v1/auth/signout', async (request, reply) => {
    const token = request.cookies['session_token'];
    if (token) {
      await destroySession(token);
    }
    reply.clearCookie('session_token', { path: '/' });
    reply.clearCookie('csrf_token', { path: '/' });
    return reply.status(200).send({ ok: true });
  });

  // --- Current user ---
  server.get<{
    Reply: { user: { id: string; email: string; status: string } };
  }>('/api/v1/auth/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const authRequest = request as AuthRequest;
    return reply.status(200).send({
      user: {
        id: authRequest.user!.id,
        email: authRequest.user!.email,
        status: authRequest.user!.status,
      },
    });
  });
}
