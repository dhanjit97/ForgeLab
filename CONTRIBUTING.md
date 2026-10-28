# Contributing to ForgeLab

ForgeLab is a documentation-driven project. The product requirements,
architecture, design, and execution-security specs live in the repository
root and are the source of truth for implementation.

## Getting started

1.  Clone the repo and run `npm install` at the root.
2.  Copy `.env.example` to `.env` and fill in non-secret values.
3.  Run `npm run dev:web` and `npm run dev:api` to start the frontend and API.
4.  Run `npm run lint`, `npm run format:check`, `npm run typecheck`, and
    `npm run test` before opening a pull request.

## Workflow

Follow `AGENTS.md` and `IMPLEMENTATION_PLAN.md`. Implement one vertical
slice at a time. For non-trivial changes, propose a plan and wait for
approval before making broad changes. Do not commit unless asked.

## Security

Never run learner code in the API process. Never commit secrets. All
execution happens in isolated workers with network deny-by-default.
Sandbox changes require adversarial tests and a security review.

## Open decisions

See `DECISIONS_AND_OPEN_QUESTIONS.md` for decisions that still need to be
made (sandbox provider, auth, hosting, anonymous execution, runtime
versions, licensing, AI provider, retention, moderation, domain name).
