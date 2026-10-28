// @forgelab/worker/limits — resource limits and Docker flag construction.
//
// All limits are server-defined and enforced at the execution boundary. The
// client never supplies limits (EXECUTION_SECURITY.md §5).

export interface ResourceLimits {
  // Wall-clock timeout for a single phase (compile or run), in milliseconds.
  wallClockMs: number;
  // Memory limit in bytes.
  memoryBytes: number;
  // CPU quota as a fraction of one CPU (1.0 = one full CPU).
  cpuCpus: number;
  // Maximum number of processes/threads.
  pidsLimit: number;
  // Maximum combined stdout+stderr output bytes.
  outputBytes: number;
  // Writable workspace tmpfs size in bytes.
  workspaceBytes: number;
}

// Default limits for the C++ spike (starting values, tuned through testing per
// EXECUTION_SECURITY.md §5).
export const CPP_DEFAULT_LIMITS: ResourceLimits = {
  wallClockMs: 10_000, // 10 seconds per phase
  memoryBytes: 256 * 1024 * 1024, // 256 MiB
  cpuCpus: 1.0,
  pidsLimit: 32,
  outputBytes: 1 * 1024 * 1024, // 1 MiB combined stdout/stderr
  workspaceBytes: 64 * 1024 * 1024, // 64 MiB workspace
} as const;

// Build `docker create` host config from resource limits.
export function dockerHostConfig(limits: ResourceLimits): Record<string, unknown> {
  const cpuPeriod = 100_000;
  const cpuQuota = Math.floor(limits.cpuCpus * cpuPeriod);
  const workspaceSizeM = Math.floor(limits.workspaceBytes / (1024 * 1024));
  const memoryBytes = limits.memoryBytes;

  return {
    Memory: memoryBytes,
    MemorySwap: memoryBytes, // disable swap to enforce the memory limit strictly
    CpuPeriod: cpuPeriod,
    CpuQuota: cpuQuota > 0 ? cpuQuota : 1,
    PidsLimit: limits.pidsLimit,
    OomKillDisable: false,
    // Bounded, nosuid, exec tmpfs workspace (the only writable location).
    Tmpfs: {
      '/workspace': `rw,nosuid,exec,uid=1000,gid=1000,size=${workspaceSizeM}m`,
    },
    // Network disabled by default.
    NetworkMode: 'none',
    // Drop all capabilities; none added back for the spike.
    CapDrop: ['ALL'],
    CapAdd: [],
  };
}

export function dockerCreateConfig(
  image: string,
  command: string[],
  workdir: string
): Record<string, unknown> {
  return {
    Image: image,
    User: '1000:1000', // non-root, unprivileged identity
    WorkingDir: workdir,
    Tty: false,
    AttachStdout: true,
    AttachStderr: true,
    AttachStdin: true,
    OpenStdin: true,
    StdinOnce: true,
    Cmd: command,
  };
}
