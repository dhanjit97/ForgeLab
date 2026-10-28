// @forgelab/worker/index — CLI entry point for running a single job.
//
// Reads a JobSpec JSON from a file argument (or stdin) and runs it through
// the sandboxed execution pipeline. Intended for manual smoke testing of the
// Phase 4 spike; not a production API entry point.

import { runJob } from './job';
import { DockerRuntime } from './runtime';
import { JobSpec } from './runtime';

function parseSpec(input: string): JobSpec {
  const parsed = JSON.parse(input);
  // Minimal client-side shape validation; the server validates with Zod.
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid job spec: expected an object');
  }
  return parsed as JobSpec;
}

async function main() {
  const args = process.argv.slice(2);
  const inputFile = args[0];

  let input: string;
  if (inputFile && inputFile !== '-') {
    const fs = await import('fs');
    input = fs.readFileSync(inputFile, 'utf8');
  } else {
    // Read stdin (blocking).
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(Buffer.from(chunk));
    }
    input = Buffer.concat(chunks).toString('utf8');
  }

  const spec = parseSpec(input);
  const runtime = new DockerRuntime();

  let result;
  try {
    result = await runJob(spec, runtime);
  } finally {
    // DockerRuntime has no persistent resources to close beyond per-job
    // containers (handled in runJob's finally).
  }

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'succeeded' ? 0 : 1);
}

main().catch((err) => {
  console.error(JSON.stringify({ status: 'failed', phase: null, stderr: String(err) }, null, 2));
  process.exit(1);
});
