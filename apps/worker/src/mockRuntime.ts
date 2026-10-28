// @forgelab/worker/mockRuntime — in-memory ContainerRuntime for unit tests.
//
// Simulates the container lifecycle without Docker. Records every call so
// tests can assert argument construction, limit configuration, timeout
// handling, cancellation, and cleanup. Clearly labeled as a mock — it does
// not prove real sandbox isolation works (ADR-001).

import { ContainerHandle, ContainerRuntime, ExecOutcome, JobSpec } from './runtime';

export interface MockExecResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  durationMs?: number;
}

export class MockRuntime implements ContainerRuntime {
  createdSpecs: JobSpec[] = [];
  copiedFiles: Array<{ path: string; content: string }> = [];
  execCalls: Array<{
    cmd: string[];
    stdin: string | undefined;
    opts: { wallClockMs: number; outputBytes: number };
  }> = [];
  removedIds: string[] = [];
  stoppedIds: string[] = [];

  // Per-handle programmable outcomes. Keyed by handle id.
  outcomes: Map<string, MockExecResult> = new Map();
  // Queue of outcomes consumed in order by exec calls across all handles.
  outcomeQueue: MockExecResult[] = [];
  shouldFailCreate = false;
  createError: Error | null = null;

  private nextId = 0;

  async create(spec: JobSpec): Promise<ContainerHandle> {
    this.createdSpecs.push(spec);
    if (this.shouldFailCreate) {
      throw this.createError ?? new Error('Create failed');
    }
    const id = `mock-container-${++this.nextId}`;
    return new MockHandle(id, this);
  }

  setOutcome(handleId: string, result: MockExecResult): void {
    this.outcomes.set(handleId, result);
  }

  defaultOutcome(result: MockExecResult): void {
    this.outcomes.set('default', result);
  }

  queueOutcome(result: MockExecResult): void {
    this.outcomeQueue.push(result);
  }
}

class MockHandle implements ContainerHandle {
  readonly id: string;
  private runtime: MockRuntime;
  private files: Map<string, string> = new Map();
  removed = false;
  stopped = false;

  constructor(id: string, runtime: MockRuntime) {
    this.id = id;
    this.runtime = runtime;
  }

  async copyToContainer(path: string, content: string): Promise<void> {
    this.runtime.copiedFiles.push({ path, content });
    this.files.set(path, content);
  }

  async exec(
    cmd: string[],
    stdin: string | undefined,
    opts: { wallClockMs: number; outputBytes: number }
  ): Promise<ExecOutcome> {
    this.runtime.execCalls.push({ cmd, stdin, opts });
    const queued = this.runtime.outcomeQueue.shift();
    const result = queued ??
      this.runtime.outcomes.get(this.id) ??
      this.runtime.outcomes.get('default') ?? {
        exitCode: 0,
        stdout: '',
        stderr: '',
        timedOut: false,
      };
    return {
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      timedOut: result.timedOut,
      durationMs: result.durationMs ?? 0,
    };
  }

  async stop(): Promise<void> {
    this.stopped = true;
    this.runtime.stoppedIds.push(this.id);
  }

  async remove(): Promise<void> {
    this.removed = true;
    this.runtime.removedIds.push(this.id);
  }
}

export { MockHandle };
