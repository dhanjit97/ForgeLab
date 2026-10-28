# Architecture

## 1. Architectural decision

Use a web application with a strict control-plane / execution-plane
split.

-   **Control plane:** web frontend, API, authentication, content
    delivery, progress, snippets, quotas, job orchestration, metadata.
-   **Execution plane:** isolated workers that compile and run untrusted
    source code. Workers are disposable, privately networked, and hold
    no application secrets.
-   **Content plane:** versioned educational content and reviewed
    runtime definitions.

Never execute learner code inside the API process, frontend server, or a
general-purpose shared application container.

## 2. Suggested stack

Choose one technology per layer and document the choice before
implementation. - Frontend: React + TypeScript + Vite. - Routing: a
mature router with route-level code splitting. - UI: accessible
primitives plus a custom token-based design system. - Editor: Monaco
Editor loaded only on Code Lab routes. - API: TypeScript + Fastify, with
schema validation at every boundary. - Database: PostgreSQL. - Query
layer: a mature typed ORM or query builder; use migrations committed to
version control. - Queue: start with a durable database-backed queue if
throughput is low; move to Redis-backed jobs when operationally
justified. Avoid introducing two queues. - Execution: isolated worker
service, launched by a job scheduler, using a sandbox technology whose
isolation assumptions are explicitly reviewed. OCI containers alone are
not automatically a sufficient security boundary for hostile
multi-tenant code. - Content: Markdown files plus validated YAML/JSON
front matter, versioned in Git. - Observability: structured logs,
metrics, traces where practical, alerting. - Deployment: frontend/API
and workers deployed separately.

## 3. Logical components

### Web client

Responsibilities: - Render lessons, guides, snippets, project
milestones, and progress. - Provide editor, stdin, output, and
diagnostics UI. - Send execution requests and poll/subscribe to job
status. - Never receive worker credentials or direct worker network
access.

### API service

Responsibilities: - Authenticate and authorize users. - Validate request
schemas and size limits. - Enforce quotas and concurrency limits. -
Create execution job records. - Place jobs on a queue. - Serve job
status and bounded results. - Manage progress, private snippets, and
content metadata. - Never compile or run submitted code itself.

### Job scheduler / dispatcher

Responsibilities: - Claim queued jobs safely. - Apply per-account and
global concurrency limits. - Select only approved language/runtime
profiles. - Dispatch work to the execution plane using short-lived,
scoped job data. - Handle retries only where safe; do not automatically
retry a potentially hostile job indefinitely. - Expire abandoned jobs
and reconcile worker failures.

### Execution worker

Responsibilities: - Accept only authenticated, validated jobs from the
dispatcher. - Start a fresh isolated sandbox per job. - Mount only a
per-job workspace. - Use a pinned language image and fixed entrypoint. -
Enforce resource and output limits. - Return structured results. -
Destroy the sandbox and temporary files. - Have no production database
credentials and no general internet access.

### Content pipeline

Responsibilities: - Validate lesson front matter and references. - Check
internal links and required fields. - Validate snippets and exercise
definitions. - Run safe example tests only in CI's isolated test
environment. - Require human review for curriculum changes.

## 4. Request lifecycle

1.  Browser submits language, runtime profile ID, source files, stdin,
    and optional exercise ID.
2.  API authenticates user or applies anonymous quota; validates request
    size, filenames, language, and allowed profile.
3.  API creates a job with opaque ID, owner, status `queued`, and
    expiry.
4.  Dispatcher enforces quotas and schedules the job.
5.  Worker starts a fresh sandbox from a pinned image and copies source
    into a quota-limited workspace.
6.  Compiler runs with fixed arguments and bounded resources.
7.  If compilation succeeds, the program runs under a separate bounded
    phase with network disabled.
8.  Worker captures bounded stdout/stderr, exit code, diagnostics,
    elapsed time, and resource summary.
9.  Worker destroys the sandbox and returns the result.
10. API persists only necessary metadata/results according to retention
    policy and returns the result to the authorized client.
11. Expired source and output are deleted according to policy.

## 5. Data model (initial)

-   `users`: id, email/provider subject, created_at, status.
-   `learning_paths`: id, slug, title, description, language,
    difficulty, published_version.
-   `lessons`: id, path_id, slug, title, content_version, prerequisites,
    estimated_minutes, published_at.
-   `lesson_progress`: user_id, lesson_id, content_version, status,
    completed_at, unique(user_id, lesson_id, content_version).
-   `exercises`: id, lesson_id, version, definition, published_at.
-   `exercise_attempts`: id, user_id, exercise_id, exercise_version,
    status, summary, created_at.
-   `snippets`: id, owner_id nullable for reviewed public content,
    title, language, code, explanation, tags, visibility, created_at,
    updated_at.
-   `execution_jobs`: id, owner_id nullable for anonymous jobs,
    language, runtime_profile, status, created_at, started_at,
    finished_at, expires_at, result_summary, resource_summary.
-   `usage_counters`: subject, window_start, run_count, cpu_budget,
    output_bytes, updated_at.
-   `audit_events`: id, actor type/id, action, target type/id,
    timestamp, redacted metadata. Use indexes for ownership and query
    paths. Apply foreign keys and retention jobs. Never store raw
    code/output indefinitely by default.

## 6. API boundaries

-   Public content API may be cached.
-   Authenticated user API enforces object-level ownership on every
    request.
-   Execution API accepts only allowlisted language/profile IDs; never
    accepts arbitrary image names, shell commands, compiler binaries, or
    unrestricted flags.
-   Worker control API is private and uses service identity plus
    short-lived credentials.
-   Admin endpoints require explicit role checks and audit events.
-   All endpoints use request IDs, payload limits, and schema
    validation.

## 7. Deployment topology

Public Internet -\> CDN / web frontend -\> API gateway / rate limiter
-\> API service -\> PostgreSQL (private) -\> queue / scheduler -\>
metrics/logging Scheduler -\> private worker broker -\> isolated
execution workers (separate account/cluster/network) Worker egress: deny
by default. Worker ingress: dispatcher only. Worker access to DB: none.
Secrets: secret manager; never environment-inject application secrets
into execution jobs.

## 8. Resilience

-   Queue status is explicit and time-bounded.
-   Workers use heartbeats and leases.
-   A dead worker marks the job failed or retryable according to phase.
-   Apply circuit breakers when worker capacity is exhausted.
-   Return a clear busy/queued response rather than spawning unlimited
    workers.
-   Separate execution-worker scaling from API scaling.
-   Have a kill/drain procedure for abusive or compromised workers.

## 9. Architectural decisions to record

Create ADRs before changing: - sandbox technology and threat model; -
anonymous execution policy; - language/compiler versions; -
authentication/session provider; - job queue; - source-code retention; -
AI provider/data handling; - public user-submitted content/moderation.
