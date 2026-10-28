# ForgeLab — Session Progress Status

**Last updated:** Wed Oct 28 2026
**Repository:** https://github.com/dhanjit97/ForgeLab
**Branch:** `main`
**Latest commit:** `ac855c0` — "Phase 4: Add C, Rust, Python worker profiles (execution spike)"
**Previous commit:** `aaf6762` — "Initial commit: ForgeLab Phase 0 foundation + early implementation"

---

## Current State Summary

The repo is committed and pushed to GitHub. CI is green on GitHub Actions (5 checks: format, lint, typecheck, unit tests, content validation — 76 tests passing). No production deployment yet.

The project is in **Phase 4 — Execution spike (security-first)**, Slice 1 complete. Only C++ previously executed; now all four languages (C, C++, Rust, Python) have worker profiles. Remaining Phase 4 work: digest-pinned images, async job queue, PostgreSQL job store, rate limiting, kill switch, adversarial tests, security review.

---

## What Was Done (this session)

### Files changed (5 files, +248/−76)

| File | Change |
|------|--------|
| `apps/worker/src/profiles.ts` | Rewrote to support all 4 languages: `c-stable` (gcc:13), `cpp-stable` (gcc:13), `rust-stable` (rust:1), `python-stable` (python:3.11-slim). Each profile has fixed server-side compile/run commands, pinned images (tag-based SPIKE), language-specific limits. Rust gets heavier limits (30s, 512 MiB, 2 CPU). Python has empty compile.cmd (interpreted). Exports `C_STABLE`, `CPP_STABLE`, `RUST_STABLE`, `PYTHON_STABLE`. |
| `apps/worker/src/runtime.ts` | Updated `imageFor()` to map all 4 profile IDs to their Docker images. Unknown profiles still throw. |
| `apps/worker/src/job.ts` | `runJob()` now skips compile + chmod phases when `profile.compile.cmd` is empty (Python). Container creation, source file writing via env var, run phase, cleanup in `finally` unchanged. |
| `apps/worker/src/profiles.test.ts` | 7 tests covering all 4 language profiles (image, sourceName, binaryName, compile.cmd, run.cmd, limits), unknown profile rejection, `isProfileAllowed`, constant/profile equality. |
| `apps/worker/src/job.test.ts` | Added test: Python interpreted path — only 1 exec call (run phase), no compile/chmod, container still removed, correct stdout. |

### Verification (all passed locally and on GitHub CI)

- `npm run format:check` — Prettier: all files compliant
- `npm run lint` — ESLint: no errors
- `npm run typecheck` — TypeScript strict: all 4 workspaces (api, web, worker, shared) pass
- `npm test` — Vitest: 11 test files, 76 tests passed (was 72 before this session)
- `npm run validate:content` — Content validation: 4 lessons, 2 snippets, 1 exercise passed

---

## What's Left — Phase 4 (Execution Spike)

These must be done before any public code execution release. Ordered by dependency:

### 1. Pin images by immutable digest (not tag)
**File:** `apps/worker/src/profiles.ts` and `apps/worker/src/runtime.ts`
**Why:** Code currently flags `gcc:13`, `rust:1`, `python:3.11-slim` as SPIKE with comment "Production pins by immutable digest (ADR-001)". Tags are mutable — a digest (`gcc:13@sha256:...`) guarantees reproducibility and prevents supply-chain tampering.
**Steps:**
- Replace `image: 'gcc:13'` etc. with digest references (need to resolve actual digests for the images you want)
- Update `imageFor()` in `runtime.ts` similarly
- Update `profiles.test.ts` assertions if image strings change
- Update ADR-001 if it documents tag pinning

### 2. Replace synchronous worker dispatch with async job queue
**Files:** `apps/api/src/index.ts`, possibly new `apps/api/src/queue.ts` or similar
**Current:** `POST /api/v1/executions` does `await fetch()` to the worker and blocks until done. Job lives in an in-memory `Map`.
**Needed:**
- API accepts job, stores as `queued` in PostgreSQL (`execution_jobs` table already exists in `001_init.sql`), returns 202 with `pollAfterMs`
- Worker polls or consumes from a queue (or API pushes to queue), updates job status as it progresses (`starting` → `compiling` → `running` → terminal)
- Client polls `GET /api/v1/executions/:id` until terminal state
- Job lifecycle: queued → starting → compiling/running → succeeded/compile_error/runtime_error/timed_out/failed/expired

### 3. Replace in-memory job store with PostgreSQL
**File:** `apps/api/src/index.ts` (the `jobs = new Map<>()` block)
**Current:** Jobs stored in process memory — lost on restart, no cross-instance sharing.
**Needed:** Use `pool.query()` to read/write `execution_jobs` table. Migration `001_init.sql` already creates the table with columns: `id`, `owner_id`, `language`, `runtime_profile`, `status`, `created_at`, `started_at`, `finished_at`, `expires_at`, `result_summary JSONB`, `resource_summary JSONB`.

### 4. Rate limiting / usage budgets
**Table:** `usage_counters` (already in `001_init.sql`)
**Needed:** Middleware in API that increments counters per user/IP per time window, rejects when limits exceeded. Tied to execution endpoint.

### 5. Kill switch
**Needed:** A way to stop accepting new executions and/or terminate running jobs globally (e.g., via environment flag or database kill-switch table). Checked at API entry point and worker.

### 6. Adversarial test suite
**Files:** `apps/worker/src/*.test.ts` (new test file or additions to `job.test.ts`)
**Why:** Phase 4 acceptance requires hostile test programs to be terminated/contained.
**Examples:**
- Fork bomb / process exhaustion (should hit `pidsLimit: 32`)
- Memory exhaustion (should hit `memoryBytes` limit / OOM)
- CPU burn (should hit `wallClockMs` timeout)
- Network egress attempt (Docker `NetworkMode: none` should block)
- File system escape attempt (tmpfs bounded, no host mounts)
- Shell injection via source content (content written via env var, never argv — already covered by existing test but should add more)

### 7. Security review by sandbox-experienced engineer
**Required** before any public execution release. Per `IMPLEMENTATION_PLAN.md` Phase 4 acceptance: "Threat model reviewed by an engineer experienced in sandboxing."

---

## What's Left — Beyond Phase 4

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 5 | Four-language Code Lab UI (C, Rust, Python now executable via worker; UI already has language selector) | UI exists; backend execution now supports all 4 |
| Phase 6 | Exercises with hidden tests, starter files, hints, attempts, lesson completion | Schema exists (`exercises`, `exercise_attempts`); no API routes yet |
| Phase 7 | Optional AI (opt-in explanation/hint, data minimization, labels) | Not started |
| Phase 8 | Production readiness: load tests, a11y audit, security review, backups, monitoring, IR runbook, privacy/terms/AUP, rollback drills | Not started |

---

## Recommended Next Slice

**Option A (security-first):** Digest-pin images → async queue → PostgreSQL job store → adversarial tests → security review. This gets Phase 4 to "done."

**Option B (user-facing):** Connect the API to PostgreSQL so auth/snippets/progress actually persist (Phase 3 completion), then wire the async queue.

I'd recommend **Option A** since Phase 4 is the execution-security gate and nothing should go public until it passes.

---

## Key Commands for Resuming

```bash
# From repo root
cd D:\Projects\Ai\rust_learn\forgelab_product_docs

# Verify everything is clean
git status

# Run all CI checks
npm run format:check
npm run lint
npm run typecheck
npm test
npm run validate:content

# Worker-only checks
npm run typecheck --workspace=@forgelab/worker
npm test --workspace=@forgelab/worker

# Push after committing
git push origin main
```

---

## Notable Code Details

- **Worker port:** 3002 (`apps/worker/src/server.ts`)
- **API port:** 3001 (`apps/api/src/index.ts`)
- **Worker endpoint:** `POST /api/v1/execute`
- **API execution endpoint:** `POST /api/v1/executions` → `GET /api/v1/executions/:id`
- **Allowed profiles:** `c-stable`, `cpp-stable`, `rust-stable`, `python-stable`
- **Sandbox:** Docker (`dockerode`), non-root `1000:1000`, all capabilities dropped, `NetworkMode: none`, bounded `tmpfs` workspace, memory/CPU/pids limits, container removed in `finally`
- **Source content:** Written to container via environment variable (`SRC_MAIN_C` etc.), never as shell argument — prevents injection
- **Auth:** bcrypt (cost 12), opaque session tokens stored as SHA-256 hashes, HttpOnly/Secure/SameSite=Lax cookies, CSRF double-submit
- **Database:** PostgreSQL via `pg` pool, parameterized queries only; migration `001_init.sql` committed

---

## Open Questions / Decisions Pending

- Sandbox technology final selection (Docker is the SPIKE; ADR-001 covers this)
- Auth provider: self-rolled email/password vs managed (Clerk/Auth0) — `DECISIONS_AND_OPEN_QUESTIONS.md #3`
- License / content licensing — TBD
- Deployment target / hosting budget — TBD
- Image digests for production pinning — need to resolve actual digests
