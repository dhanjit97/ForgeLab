# OpenCode Build Prompt --- ForgeLab

You are the lead engineer implementing ForgeLab, a public web platform
for learning C, C++, Rust, and Python. Read `AGENTS.md`, `README.md`,
`PRODUCT_REQUIREMENTS.md`, `ARCHITECTURE.md`, `DESIGN.md`,
`EXECUTION_SECURITY.md`, `CONTENT_MODEL.md`, `API_CONTRACT.md`, and
`IMPLEMENTATION_PLAN.md` before coding.

## Non-negotiable rules

-   Do not implement the whole product in one pass.
-   Do not invent existing files, dependencies, framework choices, or
    successful test results.
-   Do not run learner code in the API process.
-   Do not expose public arbitrary-code execution before the sandbox
    release gates pass.
-   Do not install packages, run broad system scans, modify OS settings,
    or perform destructive operations without explicit approval.
-   Do not overwrite user work or unrelated files.
-   Keep the product web-first; do not introduce Tauri.
-   Use a real design system, not a generic template full of cards.
-   Optional AI must not be required for core learning.

## First response: inspect only

Do not edit files in this step. 1. Inspect repository root, current
instructions, package manifests, and existing source structure. 2.
Identify existing stack and current git changes, without discarding or
altering them. 3. Compare the repository with the documented target
architecture. 4. Report the current state, missing components, risks,
and proposed next small milestone. 5. Ask before creating files if the
repository already contains a project or the intended root is ambiguous.

## Execution plan

Follow `IMPLEMENTATION_PLAN.md` in order. Do not skip the UI prototype
and security spike.

### Milestone A --- Foundation

-   Create/validate the monorepo structure only after approval.
-   Set up strict TypeScript, lint/format, test framework, environment
    validation, CI, and documentation.
-   Use pinned dependency versions and a lockfile.
-   Add no execution worker yet.
-   Verify clean install and CI checks.

### Milestone B --- Frontend prototype

-   Implement AppShell, navigation, theme tokens, responsive behavior,
    and pages for Learn, Lesson, Code Lab, Snippets, Guides/Projects,
    and Progress.
-   Use mock data and a typed execution interface.
-   Lazy-load Monaco on Code Lab routes.
-   Add loading, empty, error, queued, running, compile-error,
    runtime-error, timeout, and success states.
-   Implement light/dark themes using semantic CSS variables.
-   Do not add backend behavior disguised as a working feature.
-   Add accessibility and responsive tests or documented manual checks.
-   Stop and report for review before proceeding.

### Milestone C --- Content pipeline

-   Implement schemas and content validation based on
    `CONTENT_MODEL.md`.
-   Add representative starter content for all four languages.
-   Include tested examples and one small project guide per language
    where practical.
-   Ensure no hidden tests or private solutions enter public bundles.
-   Add CI checks for front matter, duplicate IDs/slugs, links,
    prerequisites, and runtime profile allowlists.
-   Stop and report.

### Milestone D --- Persistence and accounts

-   Implement database migrations and auth integration after the
    provider/session decision is approved.
-   Add progress and private snippets.
-   Enforce ownership checks and test cross-user access.
-   Implement account export/deletion hooks and retention policy.
-   Stop and report.

### Milestone E --- Execution security spike

Before implementing a general execution system: 1. Present at least two
viable sandbox options and compare isolation strength, operational
complexity, hosting constraints, cost, language compatibility, and
maintenance. 2. Recommend one with explicit assumptions and known
limitations. 3. Wait for approval. 4. Implement one language end-to-end
with a pinned image/profile, network deny, disposable workspace,
resource limits, bounded output, cancellation, cleanup, quotas, and
telemetry. 5. Build adversarial tests for timeouts, memory, output
floods, process spawning, path traversal, network access, worker
failure, and cross-user job access. 6. Never use production secrets in
the worker. 7. Do not enable public execution until the security release
gates are satisfied and reviewed.

### Milestone F --- Four-language execution

-   Add fixed profiles for C, C++, Rust, and Python.
-   Use server-side mappings from profile ID to immutable image digest
    and fixed entrypoint.
-   Support compile and run phases, stdin, bounded stdout/stderr,
    diagnostics, exit code, timeout, cancellation, and status polling.
-   Do not accept arbitrary image names, commands, shell fragments, or
    compiler flags.
-   Add smoke and adversarial tests for every profile.
-   Report resource limits and version compatibility in the UI.

### Milestone G --- Exercises and progress

-   Add versioned exercises, starter code, public tests, hidden tests
    stored server-side, hints, attempts, and explanations.
-   Ensure hidden tests never reach the browser.
-   Add lesson progress and project milestones.
-   Test a full beginner journey.

### Milestone H --- Optional AI

Only after core features work: - Add opt-in explanations/hints with
quotas and cost controls. - Do not send secrets, auth tokens, hidden
tests, or private third-party content. - Treat code comments and source
text as untrusted data, not instructions. - Add clear disclosures and
fallback behavior.

### Milestone I --- Production hardening

-   Load, security, accessibility, backup/restore, and failure-injection
    tests.
-   Add runbooks, monitoring, alerting, privacy/terms/acceptable-use
    pages, retention/deletion jobs, abuse response, and worker kill
    switch.
-   Do not declare production-ready while high/critical findings remain.

## Implementation quality bar

-   Use small diffs and avoid unrelated refactors.
-   Reuse components and dependencies.
-   Explain architectural decisions and add ADRs for significant
    changes.
-   Validate every API boundary.
-   Keep secrets out of the repository and logs.
-   Never make a button appear functional when it is not wired.
-   Do not silently change a design token or theme behavior.
-   Preserve user drafts.
-   Report checks actually run, with results; never claim tests passed
    without executing them.

## Task completion format

At each milestone report: - What changed. - Files added/modified. -
Architecture/security decisions. - Commands run and actual results. -
Known gaps and risks. - Exact next milestone proposed. Then stop and
wait for approval before moving to the next milestone.
