# Code Execution Security Specification

## 1. Security posture

All submitted code, stdin, filenames, source archives, exercise
submissions, and package metadata are hostile. A successful compile is
not evidence of safe execution. The execution plane must be treated as a
separate security boundary.

**Release gate:** do not expose public arbitrary-code execution until
the isolation model has been reviewed and the abuse/incident controls
below have been tested.

## 2. Threat model

Protect: - Host kernel and worker node. - Other learners' source,
outputs, and files. - API/database/queue credentials. - Cloud metadata
endpoints and internal services. - Worker capacity and platform
budget. - Content integrity and exercise hidden tests. - User privacy
and availability.

Threats include infinite loops, memory exhaustion, process spawning,
output floods, filesystem traversal, symlink attacks, compiler
exploitation, malicious build scripts, network scanning, DNS tunneling,
crypto-mining, sandbox escape, queue flooding, and attempts to access
secrets.

## 3. Required isolation properties

-   Each job gets a fresh disposable sandbox; do not reuse a writable
    workspace between users.
-   Run as non-root with a unique unprivileged identity where possible.
-   Use a read-only base image/root filesystem and a bounded writable
    temporary directory.
-   Drop all unnecessary Linux capabilities; enable no-new-privileges.
-   Apply seccomp and mandatory access controls such as AppArmor/SELinux
    where available.
-   Apply cgroup limits for CPU, memory, process count, and I/O; use an
    external wall-clock watchdog.
-   Restrict file size, total workspace size, open files, and output
    bytes.
-   Disable network egress and ingress by default, including access to
    loopback/internal networks from the job namespace.
-   Block cloud metadata services and internal control-plane addresses
    at multiple layers; network denial must not rely solely on
    application checks.
-   Do not mount the Docker/container runtime socket, host filesystem,
    credentials, or application source tree.
-   Do not pass secrets through environment variables, command-line
    arguments, mounted files, or compiler flags.
-   Pin runtime images by immutable digest and scan/rebuild them through
    a controlled pipeline.
-   Run compiler and program phases with bounded resources. Build steps
    can also execute attacker-controlled build scripts; treat them as
    untrusted.
-   Destroy the sandbox and temporary workspace after each job.
-   Keep worker nodes in a private subnet/account/project separated from
    API and database systems.
-   Treat container isolation as one layer, not automatically a
    sufficient boundary for high-risk multi-tenant workloads. Evaluate
    microVMs or a specialized sandbox runtime based on threat model,
    operating budget, and operational competence.

## 4. Language profiles

Expose a fixed set of approved profiles, for example: - `c-stable` -
`cpp-stable` - `rust-stable` - `python-stable`

Each profile maps server-side to: - Immutable image digest. -
Compiler/interpreter version. - Fixed compile/run entrypoint. - Allowed
source filename patterns. - Fixed compiler flags and build mode. -
Resource profile and timeout. - Supported project layout.

The browser submits a profile ID, never an image name, shell command,
compiler path, or arbitrary execution arguments. Document
language-specific limitations. Do not allow users to change compiler
flags freely in MVP.

## 5. Example initial limits (tune through testing)

These are starting values, not universal safe defaults: - Source
request: 256 KiB total for a simple single-file job. - Input: 64 KiB. -
Output: 1 MiB combined stdout/stderr. - Wall-clock: 5--10 seconds for
simple exercises. - Memory: 128--256 MiB for basic profiles, adjusted
per language. - CPU: approximately one vCPU quota per job. - Process
count: 32 or lower where compatible. - Concurrent jobs: 1 per anonymous
client and a small configurable limit per account. - Rate limits: per
IP, account, device/risk signals, and global budget. Enforce limits in
the worker/runtime and at the API boundary. UI-side limits are not
security controls.

## 6. Execution protocol

-   Use structured job data, not concatenated shell strings.
-   Invoke fixed executables with an argument array and fixed working
    directory.
-   Validate filenames and reject absolute paths, traversal, duplicate
    names, unexpected file types, symlinks, and oversized archives.
-   Use a private per-job directory created safely.
-   Apply timeout to compilation and execution independently.
-   Capture stdout/stderr through bounded streams; terminate when output
    cap is reached.
-   Record exit code, phase, duration, resource summary, and bounded
    diagnostics.
-   Distinguish compile error, runtime error, timeout, resource limit,
    cancellation, and worker failure.
-   Kill the full process tree/cgroup on timeout or cancellation.
-   Make job status transitions explicit and idempotent.
-   Authenticate dispatcher-to-worker traffic and use short-lived job
    credentials.

## 7. Network policy

Default deny all egress from execution workloads. If a later feature
needs package downloads: - Never enable unrestricted internet by
default. - Use an allowlisted dependency proxy/mirror and pinned
dependencies. - Review package lifecycle scripts and build scripts as
hostile. - Apply size, time, and cache limits. - Keep
dependency-fetching separate from execution where feasible. - Do not
allow user code to contact internal IP ranges, loopback services, DNS
resolvers beyond approved infrastructure, or cloud metadata endpoints.

## 8. Abuse and quota controls

-   Anonymous execution should be disabled initially or very tightly
    limited.
-   Require authentication for higher quotas.
-   Enforce global concurrency, queue depth, per-account rate, per-IP
    rate, and spending ceilings.
-   Add a kill switch to stop accepting jobs and a drain operation for
    workers.
-   Use anomaly detection for repeated timeouts, large output, CPU
    abuse, and account cycling.
-   Avoid collecting unnecessary device fingerprints; document any risk
    signals used.
-   Apply fair-use quotas and clear user messaging.
-   Keep hidden tests and reference solutions on the control plane,
    never in the sandbox's response to the browser.

## 9. Data handling

-   Do not retain raw source/stdin/output by default longer than
    required to return results.
-   Define explicit retention periods and deletion jobs.
-   Redact secrets from logs and avoid logging full source code.
-   Ensure job IDs are unguessable and ownership is checked for every
    status/result request.
-   Do not send user code to optional AI services without clear
    disclosure and an explicit product policy.
-   Never send hidden tests, auth tokens, secrets, or other users' code
    to AI.

## 10. Testing and release gates

Test at minimum: - Infinite loop and timeout. - Memory exhaustion. -
Excessive stdout/stderr. - Process-spawn attempts. - File traversal and
symlink attacks. - Internal network and metadata endpoint access. -
Attempted access to environment variables/files. - Cancellation during
compile and runtime. - Worker crash and lease expiry. - Queue flood and
rate-limit bypass. - Cross-user job/result access. - Stale image/profile
IDs. - Malformed and oversized payloads. - Sandbox cleanup after
success, failure, and timeout. - Hidden-test leakage. Use a security
test environment with no production credentials. Commission an
experienced security review before treating public execution as
production-grade.

## 11. Incident response

Document how to: 1. Stop new jobs. 2. Drain or isolate workers. 3.
Revoke worker identity/credentials. 4. Preserve minimal forensic logs.
5. Rebuild workers from known-good images. 6. Notify affected parties if
required. 7. Resume only after a root-cause review.
