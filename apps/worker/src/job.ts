// @forgelab/worker/job — compile/run orchestrator for one execution job.
//
// Orchestrates two bounded phases (compile, run) inside a disposable
// container. User content is written to a file — never concatenated into
// shell commands (EXECUTION_SECURITY.md §6). The container is always removed
// in a finally block (EXECUTION_SECURITY.md §3).

import { ExecutionResult, workerFailureResult } from './result';
import { JobSpec, ContainerRuntime } from './runtime';
import { getProfile } from './profiles';

export async function runJob(spec: JobSpec, runtime: ContainerRuntime): Promise<ExecutionResult> {
  const startMs = Date.now();
  const profile = getProfile(spec.runtimeProfile);

  let container;
  try {
    container = await runtime.create(spec);
  } catch (err) {
    return workerFailureResult(
      `Failed to create sandbox: ${err instanceof Error ? err.message : String(err)}`,
      startMs
    );
  }

  try {
    // Write each source file into the container workspace. Content travels
    // as an environment variable, never as a shell argument.
    for (const file of spec.files) {
      await container.copyToContainer(`${profile.workdir}/${file.name}`, file.content);
    }

    // Phase 1: compile (no stdin).
    const compile = await container.exec(profile.compile.cmd, undefined, {
      wallClockMs: spec.limits.wallClockMs,
      outputBytes: spec.limits.outputBytes,
    });

    if (compile.timedOut) {
      return {
        status: 'timed_out',
        phase: 'compile',
        stdout: '',
        stderr: `Compilation exceeded ${spec.limits.wallClockMs}ms`,
        diagnostics: [{ phase: 'compile', message: 'Compilation timed out' }],
        exitCode: null,
        durationMs: Date.now() - startMs,
        truncated: false,
      };
    }
    if (compile.exitCode !== 0) {
      return {
        status: 'compile_error',
        phase: 'compile',
        stdout: compile.stdout,
        stderr: compile.stderr,
        diagnostics: [
          {
            phase: 'compile',
            message: compile.stderr || 'Compilation failed',
          },
        ],
        exitCode: compile.exitCode,
        durationMs: Date.now() - startMs,
        truncated: false,
      };
    }

    // Make the compiled binary executable (gcc -o may not set +x on all
    // filesystems; enforce it here before running).
    const binaryPath = `${profile.workdir}/${profile.binaryName}`;
    const chmod = await container.exec(['chmod', '+x', binaryPath], undefined, {
      wallClockMs: spec.limits.wallClockMs,
      outputBytes: spec.limits.outputBytes,
    });
    if (chmod.exitCode !== 0) {
      return {
        status: 'compile_error',
        phase: 'compile',
        stdout: chmod.stdout,
        stderr: chmod.stderr,
        diagnostics: [{ phase: 'compile', message: 'Failed to make binary executable' }],
        exitCode: chmod.exitCode,
        durationMs: Date.now() - startMs,
        truncated: false,
      };
    }

    // Phase 2: run (stdin passed through if supported).
    const run = await container.exec(
      profile.run.cmd,
      profile.stdinSupported ? spec.stdin : undefined,
      {
        wallClockMs: spec.limits.wallClockMs,
        outputBytes: spec.limits.outputBytes,
      }
    );

    if (run.timedOut) {
      return {
        status: 'timed_out',
        phase: 'run',
        stdout: run.stdout,
        stderr: `Execution exceeded ${spec.limits.wallClockMs}ms`,
        diagnostics: [{ phase: 'run', message: 'Execution timed out' }],
        exitCode: null,
        durationMs: Date.now() - startMs,
        truncated: false,
      };
    }

    return {
      status: run.exitCode === 0 ? 'succeeded' : 'runtime_error',
      phase: 'run',
      stdout: run.stdout,
      stderr: run.stderr,
      diagnostics:
        run.exitCode !== 0 ? [{ phase: 'run', message: run.stderr || 'Runtime error' }] : [],
      exitCode: run.exitCode,
      durationMs: Date.now() - startMs,
      truncated: false,
    };
  } finally {
    await container.remove().catch(() => {
      // Best-effort cleanup; log in production.
    });
  }
}
