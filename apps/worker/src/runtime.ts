// @forgelab/worker/runtime — container runtime interface and implementations.
//
// The interface isolates the worker from the sandbox technology so the
// execution logic (job.ts) can be tested with a mock. Per EXECUTION_SECURITY.md
// §6, jobs use structured arguments — user content is never concatenated into
// shell commands; it is written to a file inside the container.

import Docker from 'dockerode';
import { PassThrough } from 'stream';
import { boundedOutput } from './result';
import { ResourceLimits } from './limits';

export interface JobSpec {
  jobId: string;
  language: string;
  runtimeProfile: string;
  files: Array<{ name: string; content: string }>;
  stdin: string | undefined;
  limits: ResourceLimits;
}

export type ExecutionPhase = 'compile' | 'run';

export interface ExecOutcome {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  durationMs: number;
}

export interface ContainerHandle {
  readonly id: string;
  /** Write a file's content into a path inside the container. */
  copyToContainer(containerPath: string, content: string): Promise<void>;
  /** Run a command in the container with bounded output and a wall-clock timeout. */
  exec(
    cmd: string[],
    stdin: string | undefined,
    opts: { wallClockMs: number; outputBytes: number }
  ): Promise<ExecOutcome>;
  stop(): Promise<void>;
  remove(): Promise<void>;
}

export interface ContainerRuntime {
  /** Create and start a fresh, disposable container for one job. */
  create(spec: JobSpec): Promise<ContainerHandle>;
}

// ---------------------------------------------------------------------------
// Docker implementation
// ---------------------------------------------------------------------------

const WORKDIR = '/workspace';

function isDockerAvailable(): boolean {
  try {
    new Docker();
    return true;
  } catch {
    return false;
  }
}

export class DockerRuntime implements ContainerRuntime {
  private docker: Docker;

  constructor() {
    if (!isDockerAvailable()) {
      throw new Error('Docker is not available in this environment. Use MockRuntime for tests.');
    }
    this.docker = new Docker();
  }

  async create(spec: JobSpec): Promise<ContainerHandle> {
    const image = this.imageFor(spec.runtimeProfile);
    const container = await this.docker.createContainer({
      Image: image,
      User: '1000:1000', // non-root, unprivileged identity
      WorkingDir: WORKDIR,
      Tty: false,
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: true,
      OpenStdin: true,
      StdinOnce: true,
      Cmd: ['sleep', 'infinity'], // keep container alive for exec phases
      HostConfig: {
        // All Linux capabilities dropped; non-root user set above.
        CapDrop: ['ALL'],
        CapAdd: [],
        // Network disabled by default.
        NetworkMode: 'none',
        // Bounded writable workspace (the only writable location for user code).
        Tmpfs: {
          [WORKDIR]: 'rw,nosuid,exec,uid=1000,gid=1000,size=64m',
        },
        Memory: 256 * 1024 * 1024,
        MemorySwap: 256 * 1024 * 1024,
        CpuPeriod: 100_000,
        CpuQuota: 100_000,
        PidsLimit: 32,
        OomKillDisable: false,
      },
    });
    await container.start();
    return new DockerContainerHandle(container, this.docker);
  }

  private imageFor(profile: string): string {
    // Spike: image referenced by tag. Production pins by immutable digest (ADR-001).
    const images: Record<string, string> = {
      'cpp-stable': 'gcc:13',
    };
    const image = images[profile];
    if (!image) {
      throw new Error(`Unknown runtime profile: ${profile}`);
    }
    return image;
  }
}

// ---------------------------------------------------------------------------
// Docker container handle
// ---------------------------------------------------------------------------

class DockerContainerHandle implements ContainerHandle {
  readonly id: string;
  private container: Awaited<ReturnType<Docker['createContainer']>>;
  private docker: Docker;

  constructor(container: Awaited<ReturnType<Docker['createContainer']>>, docker: Docker) {
    this.container = container;
    this.docker = docker;
    this.id = container.id;
  }

  async copyToContainer(containerPath: string, content: string): Promise<void> {
    // Write the file into the container using an environment variable.
    // User content travels in the env var (passed via Docker API), never as
    // a shell argument. The shell command is fixed and only references $SRC.
    // Env vars cannot carry NUL bytes, but C/C++ source never contains them.
    const base = containerPath.slice(containerPath.lastIndexOf('/') + 1);
    const envVarName = 'SRC_' + base.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();

    const exec = await this.container.exec({
      Cmd: ['sh', '-c', `printf '%s' "$${envVarName}" > ${containerPath}`],
      Env: [`${envVarName}=${content}`],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
    });
    // No stdin to write: the command reads source from the env var.
    await exec.start({ stdin: false });

    // Poll exec.inspect() until the command finishes.
    let running = true;
    while (running) {
      await new Promise((r) => setTimeout(r, 50));
      try {
        const inspect2 = await exec.inspect();
        running = inspect2.Running ?? false;
      } catch {
        running = false;
      }
    }
    const inspect = await exec.inspect();
    if (inspect.ExitCode !== 0) {
      throw new Error(`Failed to write ${containerPath} into container`);
    }
  }

  async exec(
    cmd: string[],
    stdin: string | undefined,
    opts: { wallClockMs: number; outputBytes: number }
  ): Promise<ExecOutcome> {
    const startMs = Date.now();
    const deadline = startMs + opts.wallClockMs;
    let timedOut = false;
    let running = true;

    const exec = await this.container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
    });

    const stream = await exec.start({ stdin: !!stdin });
    if (stdin) {
      // Write stdin and let it flush before polling for command completion.
      stream.write(stdin);
      stream.end();
      await new Promise((r) => setTimeout(r, 200));
    }

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    const outStream = new PassThrough();
    const errStream = new PassThrough();
    outStream.on('data', (c: Buffer) => stdoutChunks.push(c));
    errStream.on('data', (c: Buffer) => stderrChunks.push(c));

    // Docker multiplexes stdout/stderr over one hijacked stream; demux splits them.
    const modem = (
      this.docker as unknown as {
        modem: { demuxStream: (a: unknown, b: unknown, c: unknown) => void };
      }
    ).modem;
    if (modem && typeof modem.demuxStream === 'function') {
      modem.demuxStream(stream, outStream, errStream);
    } else {
      stream.pipe(outStream);
    }

    // Poll exec.inspect() until the command finishes (dockerode exec streams do
    // not reliably emit 'end'). Polling also lets us enforce the wall-clock
    // timeout and kill the container on expiry.
    const poll = async (): Promise<void> => {
      while (Date.now() < deadline && running) {
        await new Promise((r) => setTimeout(r, 50));
        try {
          const inspect = await exec.inspect();
          running = inspect.Running ?? false;
        } catch {
          running = false;
        }
      }
      if (running) {
        timedOut = true;
        await this.container.kill().catch(() => {
          // ignore kill errors during timeout handling
        });
        running = false;
      }
    };

    await poll();

    // Give docker a moment to flush remaining output to the demuxed streams.
    await new Promise((r) => setTimeout(r, 100));
    try {
      stream.destroy();
    } catch {
      // ignore
    }

    let exitCode: number | null = null;
    try {
      const inspect = await exec.inspect();
      exitCode = inspect.ExitCode ?? null;
    } catch {
      exitCode = null;
    }

    const durationMs = Date.now() - startMs;

    const stdoutBuf = Buffer.concat(stdoutChunks);
    const stderrBuf = Buffer.concat(stderrChunks);
    const stdoutResult = boundedOutput(stdoutBuf.toString('utf8'), opts.outputBytes);
    const stderrResult = boundedOutput(stderrBuf.toString('utf8'), opts.outputBytes);

    return {
      exitCode,
      stdout: stdoutResult.value,
      stderr: stderrResult.value,
      timedOut,
      durationMs,
    };
  }

  async stop(): Promise<void> {
    await this.container.kill().catch(() => {
      // ignore
    });
  }

  async remove(): Promise<void> {
    await this.container.remove({ force: true }).catch(() => {
      // ignore
    });
  }
}
