// @forgelab/api/routes/progress — lesson progress tracking (FR-08).
//
// Object-level authorization: every request verifies the session user owns the
// progress record being read or written (ARCHITECTURE.md §6).

import { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware';

const progressBodySchema = z.object({
  status: z.enum(['started', 'completed']),
  content_version: z.number().int().positive(),
});

export function registerProgressRoutes(server: FastifyInstance) {
  // List the authenticated user's lesson progress.
  server.get<{
    Reply: Array<{
      lesson_id: string;
      content_version: number;
      status: string;
      completed_at: Date | null;
    }>;
  }>('/api/v1/me/progress', { preHandler: [requireAuth] }, async (request: AuthRequest, reply) => {
    const userId = request.user!.id;
    const res = await pool.query(
      `SELECT lesson_id, content_version, status, completed_at
         FROM lesson_progress
         WHERE user_id = $1
         ORDER BY updated_at DESC`,
      [userId]
    );
    return reply.status(200).send(res.rows);
  });

  // Upsert progress for a lesson. content_version prevents silent
  // invalidation when lesson content changes (FR-05).
  server.put<{
    Params: { lessonId: string };
    Body: { status: string; content_version: number };
    Reply:
      | { lesson_id: string; content_version: number; status: string; completed_at: Date | null }
      | { code: string; message: string; requestId: string };
  }>(
    '/api/v1/me/progress/:lessonId',
    {
      preHandler: [requireAuth],
    },
    async (request, reply: FastifyReply) => {
      const authRequest = request as AuthRequest;
      const userId = authRequest.user!.id;
      const { lessonId } = request.params;
      const parsed = progressBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          requestId: request.id,
        });
      }
      const { status, content_version } = parsed.data;

      // Verify the lesson exists and the content_version matches a known
      // lesson before writing progress.
      const lessonRes = await pool.query(
        `SELECT id FROM lessons WHERE id = $1 AND content_version = $2`,
        [lessonId, content_version]
      );
      if (lessonRes.rows.length === 0) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'Lesson not found for the given content version',
          requestId: request.id,
        });
      }

      const completedAt = status === 'completed' ? new Date() : null;

      const res = await pool.query(
        `INSERT INTO lesson_progress (user_id, lesson_id, content_version, status, completed_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, now())
         ON CONFLICT (user_id, lesson_id, content_version)
         DO UPDATE SET status = $4, completed_at = $5, updated_at = now()
         RETURNING lesson_id, content_version, status, completed_at`,
        [userId, lessonId, content_version, status, completedAt]
      );

      return reply.status(200).send(res.rows[0]);
    }
  );
}
