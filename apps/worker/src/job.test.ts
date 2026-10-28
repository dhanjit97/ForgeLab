import { describe, it, expect } from 'vitest';
import { runJob } from './job';
import { MockRuntime } from './mockRuntime';
import { JobSpec } from './runtime';

function baseSpec(overrides: Partial<JobSpec> = {}): JobSpec {
  return {
    jobId: 'job-1',
    language: 'cpp',
    runtimeProfile: 'cpp-stable',
    files: [
      { name: 'main.cpp', content: '#include <iostream>\nint main(){ std::cout << "hi\\n"; }\n' },
    ],
    stdin: '',
    limits: {
      wallClockMs: 5000,
      memoryBytes: 256 * 1024 * 1024,
      cpuCpus: 1.0,
      pidsLimit: 32,
      outputBytes: 1 * 1024 * 1024,
      workspaceBytes: 64 * 1024 * 1024,
    },
    ...overrides,
  };
}

describe('runJob', () => {
  it('succeeds when compile and run both succeed', async () => {
    const runtime = new MockRuntime();
    // compile succeeds, chmod succeeds, run succeeds with output
    runtime.queueOutcome({ exitCode: 0, stdout: '', stderr: '', timedOut: false });
    runtime.queueOutcome({ exitCode: 0, stdout: '', stderr: '', timedOut: false });
    runtime.queueOutcome({ exitCode: 0, stdout: 'hi\n', stderr: '', timedOut: false });

    const result = await runJob(baseSpec(), runtime);

    expect(result.status).toBe('succeeded');
    expect(result.phase).toBe('run');
    expect(result.stdout).toBe('hi\n');
    expect(result.exitCode).toBe(0);
    expect(result.truncated).toBe(false);
    // Container removed after completion.
    expect(runtime.removedIds.length).toBe(1);
  });

  it('returns compile_error when compilation fails', async () => {
    const runtime = new MockRuntime();
    runtime.defaultOutcome({
      exitCode: 1,
      stdout: '',
      stderr: "main.cpp:5:10: error: expected ';'",
      timedOut: false,
    });

    const result = await runJob(baseSpec(), runtime);

    expect(result.status).toBe('compile_error');
    expect(result.phase).toBe('compile');
    expect(result.diagnostics[0].message).toContain("expected ';'");
    expect(result.exitCode).toBe(1);
    expect(runtime.removedIds.length).toBeGreaterThan(0);
  });

  it('returns runtime_error when the program exits non-zero', async () => {
    const runtime = new MockRuntime();
    // compile succeeds, chmod succeeds, run fails (sequential outcomes)
    runtime.queueOutcome({ exitCode: 0, stdout: '', stderr: '', timedOut: false });
    runtime.queueOutcome({ exitCode: 0, stdout: '', stderr: '', timedOut: false });
    runtime.queueOutcome({ exitCode: 1, stdout: '', stderr: 'boom', timedOut: false });

    const result = await runJob(baseSpec(), runtime);

    expect(result.status).toBe('runtime_error');
    expect(result.phase).toBe('run');
    expect(result.exitCode).toBe(1);
    expect(result.diagnostics[0].message).toBe('boom');
    expect(runtime.removedIds.length).toBeGreaterThan(0);
  });

  it('returns timed_out when execution exceeds wall clock', async () => {
    const runtime = new MockRuntime();
    // compile succeeds, chmod succeeds, run times out (sequential outcomes)
    runtime.queueOutcome({ exitCode: 0, stdout: '', stderr: '', timedOut: false });
    runtime.queueOutcome({ exitCode: 0, stdout: '', stderr: '', timedOut: false });
    runtime.queueOutcome({
      exitCode: null,
      stdout: '',
      stderr: '',
      timedOut: true,
      durationMs: 5000,
    });

    const result = await runJob(baseSpec(), runtime);

    expect(result.status).toBe('timed_out');
    expect(result.phase).toBe('run');
    expect(runtime.removedIds.length).toBeGreaterThan(0);
  });

  it('passes stdin to the run phase', async () => {
    const runtime = new MockRuntime();
    const spec = baseSpec({ stdin: 'input data\n' });
    runtime.defaultOutcome({
      exitCode: 0,
      stdout: 'echoed\n',
      stderr: '',
      timedOut: false,
    });

    await runJob(spec, runtime);

    const runCall = runtime.execCalls[runtime.execCalls.length - 1];
    expect(runCall.stdin).toBe('input data\n');
  });

  it('writes source files to container workspace before compiling', async () => {
    const runtime = new MockRuntime();
    runtime.defaultOutcome({
      exitCode: 0,
      stdout: '',
      stderr: '',
      timedOut: false,
    });

    await runJob(baseSpec(), runtime);

    const mainCpp = runtime.copiedFiles.find((f) => f.path.endsWith('main.cpp'));
    expect(mainCpp).toBeDefined();
    expect(mainCpp!.content).toContain('#include <iostream>');
  });

  it('removes the container after success (cleanup)', async () => {
    const runtime = new MockRuntime();
    runtime.defaultOutcome({
      exitCode: 0,
      stdout: '',
      stderr: '',
      timedOut: false,
    });

    await runJob(baseSpec(), runtime);

    expect(runtime.removedIds.length).toBe(1);
    expect(runtime.stoppedIds.length).toBe(0);
  });

  it('removes the container after compile failure (cleanup)', async () => {
    const runtime = new MockRuntime();
    runtime.defaultOutcome({
      exitCode: 1,
      stdout: '',
      stderr: 'error',
      timedOut: false,
    });

    await runJob(baseSpec(), runtime);

    expect(runtime.removedIds.length).toBe(1);
  });

  it('removes the container after timeout (cleanup)', async () => {
    const runtime = new MockRuntime();
    runtime.defaultOutcome({
      exitCode: null,
      stdout: '',
      stderr: '',
      timedOut: true,
      durationMs: 5000,
    });

    await runJob(baseSpec(), runtime);

    expect(runtime.removedIds.length).toBe(1);
  });

  it('throws for unknown runtime profile', async () => {
    const runtime = new MockRuntime();
    await expect(
      runJob({ ...baseSpec(), runtimeProfile: 'bad-profile' } as JobSpec, runtime)
    ).rejects.toThrow('Unknown runtime profile: bad-profile');
  });

  it('passes resource limits to exec calls', async () => {
    const runtime = new MockRuntime();
    const spec = baseSpec({
      limits: {
        wallClockMs: 3000,
        memoryBytes: 128 * 1024 * 1024,
        cpuCpus: 0.5,
        pidsLimit: 16,
        outputBytes: 512 * 1024,
        workspaceBytes: 32 * 1024 * 1024,
      },
    });
    runtime.defaultOutcome({
      exitCode: 0,
      stdout: '',
      stderr: '',
      timedOut: false,
    });

    await runJob(spec, runtime);

    const compileCall = runtime.execCalls[0];
    expect(compileCall.opts.wallClockMs).toBe(3000);
    expect(compileCall.opts.outputBytes).toBe(512 * 1024);
  });

  it('constructs fixed compile and run commands (no user content in argv)', async () => {
    const runtime = new MockRuntime();
    const spec = baseSpec({
      files: [
        {
          name: 'main.cpp',
          content: 'int main(){ return 0; }',
        },
      ],
    });
    runtime.defaultOutcome({
      exitCode: 0,
      stdout: '',
      stderr: '',
      timedOut: false,
    });

    await runJob(spec, runtime);

    const compileCall = runtime.execCalls[0];
    expect(compileCall.cmd).toEqual([
      'g++',
      '-O2',
      '-Wall',
      '-o',
      '/workspace/main',
      '/workspace/main.cpp',
    ]);
    // The malicious-looking content is NOT in the command argv.
    expect(compileCall.cmd.join(' ')).not.toContain('rm');
    expect(compileCall.cmd.join(' ')).not.toContain('/etc/passwd');
  });

  it('skips compile and chmod for interpreted languages (python)', async () => {
    const runtime = new MockRuntime();
    const spec = {
      jobId: 'job-python',
      language: 'python',
      runtimeProfile: 'python-stable',
      files: [{ name: 'main.py', content: 'print("hi\n")' }],
      stdin: '',
      limits: {
        wallClockMs: 5000,
        memoryBytes: 256 * 1024 * 1024,
        cpuCpus: 1.0,
        pidsLimit: 32,
        outputBytes: 1 * 1024 * 1024,
        workspaceBytes: 64 * 1024 * 1024,
      },
    };
    runtime.queueOutcome({ exitCode: 0, stdout: 'hi\n', stderr: '', timedOut: false });

    const result = await runJob(spec, runtime);

    expect(result.status).toBe('succeeded');
    expect(result.phase).toBe('run');
    expect(result.stdout).toBe('hi\n');
    expect(result.exitCode).toBe(0);

    // Only one exec call: the run phase. No compile, no chmod.
    expect(runtime.execCalls.length).toBe(1);
    expect(runtime.execCalls[0].cmd).toEqual(['python', '/workspace/main.py']);

    // Container still removed after completion.
    expect(runtime.removedIds.length).toBe(1);
  });
});
