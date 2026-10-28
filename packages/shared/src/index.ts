// @forgelab/shared — shared types, schemas, and constants used across the
// monorepo. Everything here is safe to import from the web client, API, and
// workers. No secrets, no runtime code execution.

import { z } from 'zod';

export const LANGUAGE = {
  c: 'c',
  cpp: 'cpp',
  rust: 'rust',
  python: 'python',
} as const;

export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE];

export const RUNTIME_PROFILE = {
  c: 'c-stable',
  cpp: 'cpp-stable',
  rust: 'rust-stable',
  python: 'python-stable',
} as const;

export type RuntimeProfile = (typeof RUNTIME_PROFILE)[keyof typeof RUNTIME_PROFILE];

export const EXECUTION_STATUS = {
  queued: 'queued',
  starting: 'starting',
  compiling: 'compiling',
  running: 'running',
  succeeded: 'succeeded',
  compile_error: 'compile_error',
  runtime_error: 'runtime_error',
  timed_out: 'timed_out',
  resource_limited: 'resource_limited',
  cancelled: 'cancelled',
  failed: 'failed',
  expired: 'expired',
} as const;

export type ExecutionStatus = (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];

// Resource limits applied per job (enforced by the execution worker, not the
// client). These are starting values tuned through testing per
// EXECUTION_SECURITY.md §5.
export const DEFAULT_LIMITS = {
  sourceBytes: 256 * 1024, // 256 KiB
  stdinBytes: 64 * 1024, // 64 KiB
  outputBytes: 1 * 1024 * 1024, // 1 MiB combined stdout/stderr
  wallClockMs: 10_000, // 10 seconds
  memoryMb: 256,
  processCount: 32,
} as const;

// ---- Request/response schemas ----

export const ExecutionRequestSchema = z.object({
  language: z.nativeEnum(LANGUAGE),
  runtimeProfile: z.string().min(1),
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        content: z.string().max(DEFAULT_LIMITS.sourceBytes),
      })
    )
    .min(1)
    .max(10),
  stdin: z.string().max(DEFAULT_LIMITS.stdinBytes).optional().default(''),
});

export type ExecutionRequest = z.infer<typeof ExecutionRequestSchema>;

export const ExecutionResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    'queued',
    'starting',
    'compiling',
    'running',
    'succeeded',
    'compile_error',
    'runtime_error',
    'timed_out',
    'resource_limited',
    'cancelled',
    'failed',
    'expired',
  ]),
  pollAfterMs: z.number().int().positive(),
});

export type ExecutionResponse = z.infer<typeof ExecutionResponseSchema>;

export const ExecutionResultSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    'queued',
    'starting',
    'compiling',
    'running',
    'succeeded',
    'compile_error',
    'runtime_error',
    'timed_out',
    'resource_limited',
    'cancelled',
    'failed',
    'expired',
  ]),
  phase: z.union([z.enum(['compile', 'run']), z.null()]),
  stdout: z.string().max(DEFAULT_LIMITS.outputBytes),
  stderr: z.string().max(DEFAULT_LIMITS.outputBytes),
  diagnostics: z.array(
    z.object({
      phase: z.enum(['compile', 'run']),
      message: z.string(),
      line: z.number().int().nonnegative().optional(),
      column: z.number().int().nonnegative().optional(),
    })
  ),
  exitCode: z.number().int().nullable(),
  durationMs: z.number().int().nonnegative(),
  truncated: z.boolean(),
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string().uuid(),
  details: z.any().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export function isExecutionStatus(value: unknown): value is ExecutionStatus {
  return typeof value === 'string' && value in EXECUTION_STATUS;
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && value in LANGUAGE;
}

export const version = '0.1.0';

export { z };
