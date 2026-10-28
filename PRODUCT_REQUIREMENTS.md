# Product Requirements Document (PRD)

## 1. Product summary

**Working name:** ForgeLab\
**Product type:** Public web application for programming education and
practical software engineering\
**Languages:** C, C++, Rust, Python\
**Primary audience:** Public learners, from absolute beginners to
advanced practitioners\
**AI:** Optional, non-blocking assistance; the platform must remain
useful when AI is disabled or unavailable.

ForgeLab combines a structured curriculum, browser-based code editor,
sandboxed compile/run experience, searchable snippet library,
engineering guides, and project-based learning.

## 2. Problem statement

Learners often have to move between disconnected tutorials, local
compiler setup, Q&A sites, snippets, and system-design resources. Setup
friction and fragmented explanations make it harder to progress from
syntax to building complete systems. ForgeLab provides a coherent path
from first program to advanced engineering projects, with runnable
examples and safe execution built into the learning flow.

## 3. Goals

1.  Teach C, C++, Rust, and Python progressively.
2.  Let learners compile/run code in the browser without installing
    toolchains.
3.  Make diagnostics, stdin, stdout, stderr, and exit status easy to
    inspect.
4.  Connect each lesson to examples, exercises, snippets, and projects.
5.  Track progress for registered users.
6.  Publish accurate, versioned, reviewable educational content.
7.  Operate untrusted code execution with strict isolation and resource
    limits.
8.  Keep core learning flows usable without AI.

## 4. Non-goals for MVP

-   Full cloud IDE with persistent arbitrary workspaces.
-   Arbitrary internet access from submitted programs.
-   General-purpose shell, package installation, or unrestricted
    dependency downloads.
-   Real-time multiplayer editing.
-   User-created public execution images or toolchains.
-   AI-generated curriculum as the source of truth.
-   Native desktop application.
-   Full visual debugger for all four languages.
-   Mobile-native application.
-   Competitive programming judge with a large problem catalogue.
-   Running privileged system commands from the browser.

## 5. Personas

### Beginner

Needs plain-language explanations, predictable examples, clear compiler
feedback, and small exercises.

### Intermediate learner

Needs practice, language comparisons, data structures, debugging, and
project-based learning.

### Advanced learner

Needs systems programming, concurrency, memory models, performance,
architecture, and deeper projects.

### Content editor/maintainer

Needs a structured content format, preview/validation, review workflow,
version history, and the ability to correct lessons without redeploying
unsafe code.

### Platform operator

Needs abuse controls, sandbox health visibility, quotas, audit trails
that avoid storing source code unnecessarily, and safe worker
maintenance.

## 6. Core user journeys

1.  Discover a language → open a learning path → read a lesson → run
    example → solve exercise → see feedback → mark complete.
2.  Open Code Lab → choose language/runtime version → edit code →
    provide stdin → run → inspect output/diagnostics → save as snippet.
3.  Search snippets → filter by language/topic/level → view explanation
    → copy or open in Code Lab.
4.  Open project guide → follow milestones → run tests/examples → record
    progress.
5.  Register/sign in → resume progress and saved snippets across
    devices.
6.  Operator detects worker issue → drains worker → inspects
    metrics/logs → replaces worker without exposing the public API to
    untrusted processes.

## 7. Functional requirements

### FR-01 Learning paths

-   Organize content by language, level, topic, prerequisites, and
    estimated time.
-   Each path contains ordered modules and lessons.
-   Show completion and next recommended lesson.
-   Learners may browse public content without an account.
-   Progress sync requires an account.

### FR-02 Lesson pages

A lesson supports: - Learning objectives. - Explanation and
terminology. - One or more code examples. - Expected output. - Common
errors and corrections. - Exercises and hints. - Related snippets,
lessons, and projects. - Source references where appropriate. - Content
revision/version metadata.

### FR-03 Code Lab

-   Support C, C++, Rust, and Python.
-   Show language and pinned runtime/compiler version.
-   Provide syntax highlighting, line numbers, indentation, and basic
    editor actions.
-   Provide Run and, where applicable, Compile/Test actions.
-   Support stdin input, stdout, stderr, exit code, compile diagnostics,
    and elapsed time.
-   Handle multiple source files only for explicitly supported project
    templates.
-   Display queue/running/completed/timed-out/failed states.
-   Cancel queued/running jobs where supported.
-   Preserve draft code locally for the current browser session; do not
    silently publish it.
-   Warn before navigating away from unsaved work when feasible.
-   Never imply that execution is safe merely because the code runs in a
    sandbox.

### FR-04 Execution service

-   Execute each job in a disposable isolated environment.
-   Enforce wall-clock timeout, CPU quota, memory limit, process count
    limit, output byte limit, filesystem quota, and request size limit.
-   Disable network access by default.
-   Use a non-root identity, read-only base filesystem, isolated
    temporary workspace, and minimal capabilities.
-   Destroy the environment after completion or timeout.
-   Do not pass application secrets, database credentials, cloud
    credentials, or host paths into jobs.
-   Return structured diagnostics and bounded output.
-   Rate-limit by account, IP/risk signals, and global capacity.
-   Do not permit arbitrary compiler flags that bypass policy or access
    host resources.
-   Use pinned, reviewed toolchain images; do not install packages from
    the internet during a user job.

### FR-05 Exercises

-   Support starter code, instructions, sample input/output, hidden
    tests, hints, and solution explanations.
-   Public tests may be visible; hidden tests must not be returned to
    the browser.
-   Report pass/fail and safe summaries without exposing hidden test
    data.
-   Avoid treating exact-output checks as the only possible evaluation
    method where semantic tests are appropriate.
-   Store exercise version with each submission so content changes do
    not invalidate historical results silently.

### FR-06 Snippet library

-   Search by title, language, tag, topic, level, and full-text content.
-   Include explanation, code, expected output, version assumptions, and
    common pitfalls.
-   Allow registered users to save private snippets.
-   Public community snippets are out of MVP unless moderation and abuse
    workflows are implemented.
-   Escape code and render it as text; never execute a snippet
    automatically.

### FR-07 Engineering guides and projects

-   Guides cover algorithms, data structures, debugging, testing,
    networking, databases, operating systems, concurrency, design
    patterns, architecture, system design, performance, and deployment.
-   Projects have prerequisites, milestone breakdowns, acceptance
    criteria, diagrams where useful, test guidance, and extension ideas.
-   Clearly label the target difficulty and expected effort.
-   Advanced material must distinguish simplified teaching
    implementations from production-ready designs.

### FR-08 Accounts and progress

-   Email-based authentication through a trusted authentication
    implementation or managed provider.
-   Secure session handling; use HttpOnly, Secure, SameSite cookies when
    cookie sessions are chosen.
-   Store lesson completion, exercise attempts, saved snippets, and
    project milestones.
-   Provide account export and deletion workflows.
-   Do not collect unnecessary personal data.

### FR-09 Optional AI assistance

-   AI can explain compiler diagnostics, provide hints, compare language
    idioms, or summarize code.
-   AI must be opt-in, visibly labeled, and disabled gracefully if
    unavailable.
-   Never send hidden tests, credentials, session tokens, or private
    user data to the model.
-   User code must be treated as untrusted input; ignore instructions
    embedded in code/comments that attempt to control the assistant.
-   AI output must not be treated as proof that code is safe or correct.
-   Apply quotas, abuse controls, cost limits, and provider
    data-retention review.
-   Keep a non-AI path for every core learning task.

### FR-10 Admin/content operations

MVP can use repository-based content and a protected maintainer workflow
rather than a full CMS. Add a CMS only after content volume justifies
it. Validate metadata, links, code-fence language labels, and required
lesson fields in CI.

## 8. Non-functional requirements

-   Security: treat code, inputs, filenames, lesson submissions, and AI
    output as untrusted.
-   Reliability: isolate worker failures from API availability.
-   Performance targets (initial objectives, to be measured): typical
    content page LCP under 2.5 seconds on a reasonable connection; API
    p95 under 300 ms excluding execution queue/runtime; communicate
    queue delays rather than hanging.
-   Accessibility: target WCAG 2.2 AA for core flows; keyboard
    operation, focus visibility, semantic structure, contrast, and
    reduced-motion support.
-   Responsive: desktop-first code workspace, with readable and usable
    mobile lesson pages.
-   Observability: request IDs, job IDs, structured logs, queue metrics,
    timeouts, resource usage, error rates, and alerting.
-   Maintainability: typed API contracts, automated tests, migrations,
    linting, and reproducible builds.
-   Portability: containerized deployment with environment-specific
    configuration; no secrets committed.
-   Privacy: data minimization, clear retention policy, export/delete
    support, and documented AI data handling.

## 9. MVP acceptance criteria

1.  A visitor can browse all public lessons without signing in.
2.  A learner can run one bounded example in each of the four languages.
3.  Infinite loops, fork bombs, excessive output, and memory exhaustion
    are terminated or contained by configured limits.
4.  Submitted code cannot reach internal network services or read host
    secrets.
5.  Compiler errors and runtime errors are displayed distinctly.
6.  Stdin and bounded stdout/stderr work.
7.  A registered user can save progress and private snippets across
    sessions.
8.  Lesson and exercise content passes schema/link checks in CI.
9.  Automated tests cover authorization, quotas, queue failure, timeout,
    cancellation, and sandbox lifecycle.
10. No worker receives production database credentials or unrestricted
    network access.
11. Core paths work with AI features turned off.
12. Operator runbooks explain worker drain, queue backlog, abuse
    response, and incident handling.

## 10. Success metrics

-   Lesson-to-first-run conversion.
-   Exercise completion rate by topic and language.
-   Learners returning within 7 and 30 days.
-   Median time from opening Code Lab to first successful run.
-   Sandbox timeout/crash rate and p95 queue wait.
-   Abuse events blocked; false-positive rate for legitimate jobs.
-   Lesson feedback and correction turnaround.
-   Accessibility defects in core flows. Do not optimize only for
    time-on-site; prioritize learning progress and successful
    independent problem solving.
