# Implementation Plan

## Delivery strategy

Build vertical slices and prove the execution boundary early. Do not
spend weeks polishing the dashboard before the first safe compile/run
path works. Do not expose public execution until security release gates
pass.

## Phase 0 --- Decisions and repository foundation

Deliver: - Confirm product name, domain, deployment target, and initial
hosting budget. - Record ADRs for API stack, authentication, sandbox
technology, queue, retention, and AI policy. - Monorepo skeleton,
formatter/linter, TypeScript strict mode, tests, environment schema,
CI. - `AGENTS.md`, this documentation, threat model, contribution
instructions. Acceptance: - Clean checkout installs reproducibly. - CI
runs formatting, lint, type checks, unit tests, content validation. - No
secrets in repository.

## Phase 1 --- UI prototype with mock data

Deliver: - App shell, navigation, theme tokens, typography, responsive
layout. - Learn landing, lesson page, snippet list/detail, guide/project
page, progress page. - Code Lab UI with mocked execution states only. -
Keyboard/focus/reduced-motion checks. Acceptance: - UI works with mock
data. - Visual checks cover desktop and mobile. - No fake controls
presented as real functionality. - Do not build the compiler yet; keep
API interfaces typed and mocked.

## Phase 2 --- Content model and curriculum

Deliver: - Content schemas, sample lessons for all four languages,
snippets and one project guide. - CI validation for metadata, links, and
required sections. - Search/filter for content. Acceptance: - Invalid
content fails CI. - All sample runnable blocks have a valid runtime
profile. - Content is reviewed for accuracy.

## Phase 3 --- Identity, persistence, progress

Deliver: - Authentication integration and secure session policy. -
PostgreSQL schema/migrations. - Progress, private snippets, account data
export/delete path. Acceptance: - Authorization tests cover cross-user
access. - Session cookie and CSRF strategy are documented and tested. -
User data is not exposed by public endpoints.

## Phase 4 --- Execution spike (security-first)

Deliver: - Select and test one isolation technology before implementing
all languages. - Threat model reviewed by an engineer experienced in
sandboxing. - Prototype one language end-to-end with strict limits and
network disabled. - Worker broker, job lifecycle, cleanup, quotas,
metrics, kill switch. - Adversarial test suite. Acceptance: - Hostile
test programs are terminated/contained. - Worker has no
application/database secrets. - API remains responsive during worker
failures. - No public release yet.

## Phase 5 --- Four-language Code Lab

Deliver: - Pinned profiles for C, C++, Rust, Python. - Multi-phase
compile/run flow, stdin, bounded output, diagnostics, cancellation. -
Queue state and error state UX. - Rate limiting and usage budgets.
Acceptance: - Each language passes smoke tests. - Limits enforced at the
worker, not just the API. - Cross-user result access is blocked. -
Sandbox cleanup verified for success and failure.

## Phase 6 --- Exercises and learning progression

Deliver: - Starter code, public and hidden tests, hints, attempts,
lesson completion. - Project milestones and next-step navigation.
Acceptance: - Hidden tests never reach browser. - Exercise versioning
works. - A complete beginner journey succeeds end-to-end.

## Phase 7 --- Optional AI

Deliver only after core experience works: - Opt-in explanation/hint
endpoint. - Data minimization, provider policy, quotas, cost
monitoring. - Clear AI labels and failure fallback. Acceptance: - AI
unavailable does not block learning. - No secrets or hidden tests are
sent. - Prompt-injection attempts in source comments are treated as
untrusted content.

## Phase 8 --- Production readiness

Deliver: - Load tests, accessibility audit, security review,
backups/restore test, monitoring and alerts. - Incident response
runbook, privacy policy, terms, acceptable-use policy,
retention/deletion jobs. - Abuse operations and support contact.
Acceptance: - Recovery objectives and quota policies documented. -
Execution sandbox sign-off recorded. - Rollback and kill-switch drills
completed. - No unresolved critical/high security findings.

## Suggested milestone order

1.  Repository and design prototype.
2.  Content validation.
3.  One safe execution profile.
4.  User progress.
5.  Remaining languages.
6.  Exercises.
7.  Optional AI.
8.  Hardening and public launch.

## Definition of done for every task

-   Requirements met and acceptance criteria listed.
-   Tests added/updated.
-   Formatting, lint, type checks, and relevant tests pass.
-   No unrelated refactor.
-   No new dependency without rationale.
-   Documentation updated.
-   Actual command results reported honestly.
-   Security implications reviewed for any execution, auth, file,
    network, or data-retention change.
