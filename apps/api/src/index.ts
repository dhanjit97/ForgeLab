import fastify from 'fastify';
import cookie from '@fastify/cookie';
import { ExecutionRequestSchema, ExecutionResultSchema } from '@forgelab/shared';
import { registerAuthRoutes } from './routes/auth';
import { registerProgressRoutes } from './routes/progress';
import { registerSnippetRoutes } from './routes/snippets';
import { closePool } from './db';

const server = fastify({
  logger: false,
  requestTimeout: 30_000,
  bodyLimit: 1024 * 1024, // 1 MiB request size limit (EXECUTION_SECURITY.md §5)
});

await server.register(cookie, {
  secret: process.env['COOKIE_SECRET'],
});

// ---- In-memory job store (MVP; replaced by PostgreSQL in later phases) ----
type JobRecord = {
  id: string;
  status:
    | 'queued'
    | 'starting'
    | 'compiling'
    | 'running'
    | 'succeeded'
    | 'compile_error'
    | 'runtime_error'
    | 'timed_out'
    | 'resource_limited'
    | 'cancelled'
    | 'failed'
    | 'expired';
  phase: 'compile' | 'run' | null;
  stdout: string;
  stderr: string;
  diagnostics: Array<{ phase: string; message: string; line?: number; column?: number }>;
  exitCode: number | null;
  durationMs: number;
  truncated: boolean;
  createdAt: number;
};

const jobs = new Map<string, JobRecord>();

const WORKER_URL = process.env['WORKER_URL'] ?? 'http://127.0.0.1:3002';

// ---- Public content ----
server.get('/health', async () => {
  return { status: 'ok', service: 'forgelab-api', version: '0.1.0' };
});

server.get('/api/v1/paths', async () => {
  return [];
});

server.get<{ Params: { slug: string } }>('/api/v1/lessons/:slug', async (request) => {
  const { slug } = request.params;
  return { slug, title: 'Placeholder lesson', content: '' };
});

// ---- Execution (wired to worker; Phase 4 spike) ----
server.post('/api/v1/executions', async (request, reply) => {
  const parsed = ExecutionRequestSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      requestId: request.id,
      details: parsed.error.flatten(),
    });
  }

  const { language, runtimeProfile, files, stdin } = parsed.data;

  const allowedProfiles = ['c-stable', 'cpp-stable', 'rust-stable', 'python-stable'];
  if (!allowedProfiles.includes(runtimeProfile)) {
    return reply.status(400).send({
      code: 'VALIDATION_ERROR',
      message: `Unsupported runtime profile: ${runtimeProfile}`,
      requestId: request.id,
    });
  }

  const jobId = crypto.randomUUID();

  // Create the job record as queued.
  const job: JobRecord = {
    id: jobId,
    status: 'queued',
    phase: null,
    stdout: '',
    stderr: '',
    diagnostics: [],
    exitCode: null,
    durationMs: 0,
    truncated: false,
    createdAt: Date.now(),
  };
  jobs.set(jobId, job);

  // Dispatch to the worker synchronously. The worker runs the job in a
  // disposable sandbox and returns a bounded, structured result.
  try {
    const workerRes = await fetch(`${WORKER_URL}/api/v1/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        language,
        runtimeProfile,
        files,
        stdin,
        limits: {
          wallClockMs: 10_000,
          memoryBytes: 256 * 1024 * 1024,
          cpuCpus: 1.0,
          pidsLimit: 32,
          outputBytes: 1 * 1024 * 1024,
          workspaceBytes: 64 * 1024 * 1024,
        },
      }),
    });

    if (!workerRes.ok) {
      const errorText = await workerRes.text();
      throw new Error(`Worker returned ${workerRes.status}: ${errorText}`);
    }

    const result = ExecutionResultSchema.parse(await workerRes.json());

    // Update the job record with the worker's result.
    const updated: JobRecord = {
      ...job,
      status: result.status,
      phase: result.phase,
      stdout: result.stdout,
      stderr: result.stderr,
      diagnostics: result.diagnostics.map((d) => ({
        phase: d.phase,
        message: d.message,
        line: d.line,
        column: d.column,
      })),
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      truncated: result.truncated,
    };
    jobs.set(jobId, updated);

    return reply.status(200).send({
      id: jobId,
      status: updated.status,
      pollAfterMs: 0,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Worker dispatch failed for job ${jobId}:`, errMsg);
    // Mark the job as failed if the worker is unreachable or errors.
    const failed: JobRecord = {
      ...job,
      status: 'failed',
      phase: null,
      stdout: '',
      stderr: errMsg,
      diagnostics: [{ phase: 'compile', message: errMsg }],
      exitCode: null,
      durationMs: Date.now() - job.createdAt,
      truncated: false,
    };
    jobs.set(jobId, failed);

    return reply.status(503).send({
      code: 'EXECUTION_CAPACITY_UNAVAILABLE',
      message: 'Execution worker unavailable',
      requestId: request.id,
    });
  }
});

// Get the status/result of a specific job.
server.get<{ Params: { id: string } }>('/api/v1/executions/:id', async (request, reply) => {
  const { id } = request.params;
  const job = jobs.get(id);

  if (!job) {
    return reply.status(404).send({
      code: 'NOT_FOUND',
      message: 'Job not found',
      requestId: request.id,
    });
  }

  return reply.status(200).send({
    id: job.id,
    status: job.status,
    phase: job.phase,
    stdout: job.stdout,
    stderr: job.stderr,
    diagnostics: job.diagnostics,
    exitCode: job.exitCode,
    durationMs: job.durationMs,
    truncated: job.truncated,
  });
});

// ---- Auth, progress, snippets (Phase 3) ----
registerAuthRoutes(server);
registerProgressRoutes(server);
registerSnippetRoutes(server);

// ---- Startup / shutdown ----
const start = async () => {
  const port = Number(process.env['PORT'] ?? '3001');
  const host = process.env['HOST'] ?? '127.0.0.1';

  try {
    await server.listen({ port, host });
    console.log(`ForgeLab API listening on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  await server.close();
  await closePool();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await server.close();
  await closePool();
  process.exit(0);
});

start();

export { server };
