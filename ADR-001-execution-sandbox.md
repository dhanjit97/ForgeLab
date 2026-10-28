# ADR-001: Execution sandbox — hardened OCI containers (Phase 4 spike)

## Status
Provisional — approved for local development spike only. Not approval to expose
public arbitrary-code execution in production.

## Decision
Use hardened OCI containers (Docker) for the Phase 4 execution-security spike,
starting with a single C++ `cpp-stable` profile. Verified end-to-end with
Docker on WSL2 (gcc:13 image): compile + run produces correct output.

## Rationale
- Language compatibility: gcc/g++ run natively in a Linux container.
- Low operational complexity: develop and test locally with Docker.
- Fast iteration for the adversarial test suite.

## Threat model assumptions (per EXECUTION_SECURITY.md §2)
Protect: host kernel and worker node; other learners' files; API/database
credentials; cloud metadata endpoints; worker capacity; content integrity;
user privacy/availability.
Threats: infinite loops, memory exhaustion, process spawning, output floods,
filesystem traversal, symlink attacks, compiler exploitation, network scanning,
DNS tunneling, crypto-mining, sandbox escape.

## Controls implemented in the spike (per EXECUTION_SECURITY.md §3–5)
- Fresh disposable container per job; destroyed after completion/failure/timeout
  (finally block in job orchestrator).
- Non-root user (`User: 1000:1000`); all Linux capabilities dropped
  (`CapDrop: ALL`).
- Read/write tmpfs workspace bounded by size (`rw,nosuid,exec,uid=1000,gid=1000,size=64m`).
- CPU quota (`CpuPeriod`/`CpuQuota`), memory limit (`Memory`/`MemorySwap`),
  process count (`PidsLimit`), wall-clock timeout enforced per phase.
- Network disabled by default (`NetworkMode: none`).
- No Docker socket, host directories, credentials, or secrets mounted into job
  containers.
- Wall-clock watchdog kills the container (entire process tree) on timeout.
- Source code enters via environment variable (`SRC_<FILE>`) + `printf '%s'`,
  never concatenated into shell commands.
- Fixed server-side compiler arguments only (`g++ -O2 -Wall -o /workspace/main /workspace/main.cpp`).
- Structured result: status, phase, bounded stdout/stderr, diagnostics, exit
  code, duration, truncation flag.
- Binary made executable (`chmod +x`) before running.

## Known limitations (documented per user conditions)
- Container isolation shares the host kernel; it is ONE layer, not a sufficient
  boundary by itself for hostile multi-tenant code (EXECUTION_SECURITY.md §3).
- A kernel exploit could escape to the host. Before production deployment:
  - Compare with gVisor (stronger syscall boundary) or Firecracker microVMs
    (separate kernel per job).
  - Commission an experienced security review (EXECUTION_SECURITY.md §10).
  - Do not enable public execution until sandbox release gates pass.
- Rootfs is writable (not read-only) because Docker's putArchive/docker cp is
  blocked when rootfs is read-only, even for tmpfs mounts. Isolation relies on
  non-root user + dropped capabilities + no network + bounded tmpfs instead.
- Compile and run phases use separate `docker exec` calls in the same container.
- Image referenced by tag (`gcc:13`) in the spike; production pins by immutable
  digest and scans through a controlled pipeline.
- `OomKillDisable` is not supported on this kernel (WSL2); OOM kills may occur.

## Review required before
- Adding C, Rust, or Python profiles.
- Enabling public execution.
- Treating the sandbox as production-grade.
