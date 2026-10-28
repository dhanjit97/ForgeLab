// @forgelab/worker/server — HTTP server for the execution worker.
//
// Exposes a single endpoint that the API service calls to execute a job.
// The worker runs each job in a disposable sandbox and returns a bounded,
// structured result. No secrets, no database access, no network egress.

import fastify from 'fastify';
import { runJob } from './job';
import { DockerRuntime } from './runtime';
import { JobSpec } from './runtime';

const server = fastify({
  logger: false,
  requestTimeout: 30_000,
  bodyLimit: 1024 * 1024, // 1 MiB request size limit
});

server.get('/health', async () => {
  return { status: 'ok', service: 'forgelab-worker', version: '0.1.0' };
});

server.post('/api/v1/execute', async (request, reply) => {
  console.log('Worker received request body:', JSON.stringify(request.body));

  const body = request.body as {
    jobId: string;
    language: string;
    runtimeProfile: string;
    files: Array<{ name: string; content: string }>;
    stdin?: string;
    limits: {
      wallClockMs: number;
      memoryBytes: number;
      cpuCpus: number;
      pidsLimit: number;
      outputBytes: number;
      workspaceBytes: number;
    };
  };

  const { jobId, language, runtimeProfile, files } = body;
  const stdin = body.stdin || '';
  const limits = body.limits;

  const spec: JobSpec = {
    jobId,
    language,
    runtimeProfile,
    files,
    stdin,
    limits,
  };

  const runtime = new DockerRuntime();
  let result;
  try {
    result = await runJob(spec, runtime);
  } finally {
    // DockerRuntime has no persistent resources beyond per-job containers
    // (handled in runJob's finally block).
  }

  return reply.status(200).send({ id: jobId, ...result });
});

const start = async () => {
  const port = Number(process.env['PORT'] ?? '3002');
  const host = process.env['HOST'] ?? '127.0.0.1';

  try {
    await server.listen({ port, host });
    console.log(`ForgeLab worker listening on http://${host}:${port}`);
  } catch (err) {
    console.error('Worker failed to start:', err);
    process.exit(1);
  }
};

// Graceful shutdown.
process.on('SIGTERM', async () => {
  await server.close();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

start();

export { server };
