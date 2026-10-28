# ForgeLab

A public web platform for learning C, C++, Rust, and Python through
structured lessons, sandboxed browser execution, snippets, exercises, and
engineering projects.

## Status

Documentation and Phase 0 foundation only. No code has been shipped to
production. See `IMPLEMENTATION_PLAN.md` and `OPENCODE_PROMPT.md`.

## Documentation

-   `PRODUCT_REQUIREMENTS.md` — PRD, goals, personas, acceptance criteria
-   `ARCHITECTURE.md` — control plane / execution plane split, components
-   `DESIGN.md` — UI design system and interaction rules
-   `EXECUTION_SECURITY.md` — sandbox threat model and controls
-   `CONTENT_MODEL.md` — lesson, snippet, exercise, project formats
-   `API_CONTRACT.md` — `/api/v1` execution lifecycle
-   `IMPLEMENTATION_PLAN.md` — phased build plan
-   `AGENTS.md` — coding-agent guardrails
-   `DECISIONS_AND_OPEN_QUESTIONS.md` — open decisions

## Stack (planned)

Frontend: React + TypeScript + Vite
API: TypeScript + Fastify
Database: PostgreSQL
Editor: Monaco Editor (lazy-loaded)
Execution: isolated worker (sandbox technology TBD)

## License

TBD — see `DECISIONS_AND_OPEN_QUESTIONS.md` for the content licensing decision.
