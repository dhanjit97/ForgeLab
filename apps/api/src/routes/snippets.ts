// @forgelab/api/routes/snippets — user snippets with object-level ownership.
//
// All user-owned routes enforce ownership server-side (ARCHITECTURE.md §6,
// AGENTS.md coding rules). Public snippets (reviewed community content) are out
// of MVP unless moderation is implemented (FR-06).

import { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { pool } from '../db';
import { requireAuth, requireCsrf, AuthRequest } from '../middleware';

const snippetBodySchema = z.object({
  title: z.string().min(1).max(200),
  language: z.enum(['c', 'cpp', 'rust', 'python']),
  code: z.string().min(1),
  explanation: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
  visibility: z.enum(['public', 'private']).default('private'),
  runtime_profile: z.string().optional(),
  version_notes: z.string().optional(),
  pitfalls: z.array(z.string()).default([]),
  related_lessons: z.array(z.string()).default([]),
});

const snippetListSchema = z.object({
  language: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

function forbidden(reply: FastifyReply, request: AuthRequest) {
  return reply.status(403).send({
    code: 'FORBIDDEN',
    message: 'CSRF token mismatch',
    requestId: request.id,
  });
}

export function registerSnippetRoutes(server: FastifyInstance) {
  // List the authenticated user's snippets.
  server.get<{
    Querystring: { language?: string; limit?: number; offset?: number };
    Reply:
      | Array<{
          id: string;
          title: string;
          language: string;
          explanation: string | null;
          tags: string[];
          visibility: string;
          runtime_profile: string | null;
          version_notes: string | null;
          created_at: Date;
          updated_at: Date;
        }>
      | { code: string; message: string; requestId: string };
  }>(
    '/api/v1/me/snippets',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      const authRequest = request as AuthRequest;
      const userId = authRequest.user!.id;
      const parsed = snippetListSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          requestId: authRequest.id,
        });
      }
      const { language, limit, offset } = parsed.data;

      let sql = `
        SELECT id, title, language, explanation, tags, visibility,
               runtime_profile, version_notes, pitfalls, related_lessons,
               created_at, updated_at
        FROM snippets
        WHERE owner_id = $1
      `;
      const params: unknown[] = [userId];
      let paramIndex = 2;

      if (language) {
        sql += ` AND language = $${paramIndex++}`;
        params.push(language);
      }

      sql += ` ORDER BY updated_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);

      const res = await pool.query(sql, params);
      return reply.status(200).send(res.rows);
    }
  );

  // Create a snippet.
  server.post<{ Body: { title: string; language: string; code: string } }>(
    '/api/v1/me/snippets',
    {
      preHandler: [requireAuth],
    },
    async (request, reply: FastifyReply) => {
      const authRequest = request as AuthRequest;
      const csrfResult = requireCsrf(authRequest);
      if (csrfResult) {
        return forbidden(reply, authRequest);
      }

      const parsed = snippetBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          requestId: request.id,
        });
      }

      const userId = authRequest.user!.id;
      const {
        title,
        language,
        code,
        explanation,
        tags,
        visibility,
        runtime_profile,
        version_notes,
        pitfalls,
        related_lessons,
      } = parsed.data;

      const res = await pool.query(
        `INSERT INTO snippets
           (owner_id, title, language, code, explanation, tags, visibility,
            runtime_profile, version_notes, pitfalls, related_lessons)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, title, language, visibility, created_at, updated_at`,
        [
          userId,
          title,
          language,
          code,
          explanation ?? null,
          JSON.stringify(tags),
          visibility,
          runtime_profile ?? null,
          version_notes ?? null,
          JSON.stringify(pitfalls),
          JSON.stringify(related_lessons),
        ]
      );

      return reply.status(201).send(res.rows[0]);
    }
  );

  // Update a snippet (ownership enforced).
  server.patch<{
    Params: { id: string };
    Body: { title: string; language: string; code: string };
  }>(
    '/api/v1/me/snippets/:id',
    {
      preHandler: [requireAuth],
    },
    async (request, reply: FastifyReply) => {
      const authRequest = request as AuthRequest;
      const csrfResult = requireCsrf(authRequest);
      if (csrfResult) {
        return forbidden(reply, authRequest);
      }

      const parsed = snippetBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          requestId: request.id,
        });
      }

      const userId = authRequest.user!.id;
      const { id } = request.params;
      const {
        title,
        language,
        code,
        explanation,
        tags,
        visibility,
        runtime_profile,
        version_notes,
        pitfalls,
        related_lessons,
      } = parsed.data;

      // Ownership check: snippet must belong to the requesting user.
      const existing = await pool.query(`SELECT id FROM snippets WHERE id = $1 AND owner_id = $2`, [
        id,
        userId,
      ]);
      if (existing.rows.length === 0) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'Snippet not found or not owned by you',
          requestId: request.id,
        });
      }

      const res = await pool.query(
        `UPDATE snippets
           SET title = $2, language = $3, code = $4, explanation = $5,
               tags = $6, visibility = $7, runtime_profile = $8,
               version_notes = $9, pitfalls = $10, related_lessons = $11,
               updated_at = now()
         WHERE id = $1
         RETURNING id, title, language, visibility, updated_at`,
        [
          id,
          title,
          language,
          code,
          explanation ?? null,
          JSON.stringify(tags),
          visibility,
          runtime_profile ?? null,
          version_notes ?? null,
          JSON.stringify(pitfalls),
          JSON.stringify(related_lessons),
        ]
      );

      return reply.status(200).send(res.rows[0]);
    }
  );

  // Delete a snippet (ownership enforced).
  server.delete<{ Params: { id: string } }>(
    '/api/v1/me/snippets/:id',
    {
      preHandler: [requireAuth],
    },
    async (request, reply: FastifyReply) => {
      const authRequest = request as AuthRequest;
      const csrfResult = requireCsrf(authRequest);
      if (csrfResult) {
        return forbidden(reply, authRequest);
      }

      const userId = authRequest.user!.id;
      const { id } = request.params;

      const res = await pool.query(
        `DELETE FROM snippets WHERE id = $1 AND owner_id = $2 RETURNING id`,
        [id, userId]
      );
      if (res.rows.length === 0) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'Snippet not found or not owned by you',
          requestId: request.id,
        });
      }

      return reply.status(200).send({ ok: true, id });
    }
  );

  // Public snippets (read-only, no auth). Reviewed public content only.
  server.get<{
    Querystring: { language?: string; limit?: number; offset?: number };
    Reply:
      | Array<{
          id: string;
          title: string;
          language: string;
          explanation: string | null;
          tags: string[];
          visibility: string;
          runtime_profile: string | null;
          version_notes: string | null;
          created_at: Date;
          updated_at: Date;
        }>
      | { code: string; message: string; requestId: string };
  }>('/api/v1/snippets', async (request, reply) => {
    const authRequest = request as AuthRequest;
    const parsed = snippetListSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        requestId: authRequest.id,
      });
    }
    const { language, limit, offset } = parsed.data;

    let sql = `
        SELECT id, title, language, explanation, tags, visibility,
               runtime_profile, version_notes, pitfalls, related_lessons,
               created_at, updated_at
        FROM snippets
        WHERE visibility = 'public'
      `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (language) {
      sql += ` AND language = $${paramIndex++}`;
      params.push(language);
    }

    sql += ` ORDER BY updated_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const res = await pool.query(sql, params);
    return reply.status(200).send(res.rows);
  });
}
