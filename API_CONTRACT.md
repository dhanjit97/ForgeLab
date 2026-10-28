# API Contract (MVP Outline)

Use a versioned API prefix such as `/api/v1`. All request/response
bodies must be validated against schemas. Return consistent error
objects with a stable code, human-readable message, request ID, and
optional safe details.

## Authentication

Authentication provider/session design is an ADR. Every authenticated
endpoint must validate the session and apply authorization at the object
level.

## Public content

-   `GET /api/v1/paths`
-   `GET /api/v1/paths/:slug`
-   `GET /api/v1/lessons/:slug`
-   `GET /api/v1/guides/:slug`
-   `GET /api/v1/snippets` --- reviewed public snippets only, with
    pagination and filters.
-   `GET /api/v1/exercises/:id` --- public prompt and starter code only;
    never hidden tests.

## Progress and private snippets

-   `GET /api/v1/me/progress`
-   `PUT /api/v1/me/progress/:lessonId`
-   `GET /api/v1/me/snippets`
-   `POST /api/v1/me/snippets`
-   `PATCH /api/v1/me/snippets/:id`
-   `DELETE /api/v1/me/snippets/:id` All user-owned resource routes
    enforce ownership. Use pagination and request-size limits.

## Execution

### `POST /api/v1/executions`

Example request: { "language": "cpp", "runtimeProfile": "cpp-stable",
"files": \[ {"name": "main.cpp", "content": "#include
`<iostream>`{=html}`\nint `{=tex}main(){ std::cout \<\< \"Hello\\n\";
}"} \], "stdin": "" }

Server validates the profile and payload; browser cannot select image,
executable, arbitrary shell, or compiler flags.

Example response: { "id": "opaque-job-id", "status": "queued",
"pollAfterMs": 800 }

### `GET /api/v1/executions/:id`

Returns only the requesting user's job or an authorized anonymous job.
Example: { "id": "opaque-job-id", "status": "succeeded", "phase": "run",
"stdout": "Hello`\n`{=tex}", "stderr": "","diagnostics": \[\],
"exitCode": 0, "durationMs": 42, "truncated": false }

Statuses: `queued`, `starting`, `compiling`, `running`, `succeeded`,
`compile_error`, `runtime_error`, `timed_out`, `resource_limited`,
`cancelled`, `failed`, `expired`.

-   `POST /api/v1/executions/:id/cancel`
-   `GET /api/v1/executions/:id` polling is sufficient for MVP; SSE can
    be added later.

The exact API may use different field names after schema review, but its
semantics must remain stable.

## Errors

-   `400 VALIDATION_ERROR`
-   `401 UNAUTHENTICATED`
-   `403 FORBIDDEN`
-   `404 NOT_FOUND`
-   `413 PAYLOAD_TOO_LARGE`
-   `429 RATE_LIMITED`
-   `503 EXECUTION_CAPACITY_UNAVAILABLE`
-   `504 EXECUTION_TIMEOUT`

Do not expose stack traces, host paths, internal addresses, environment
variables, or worker internals in client errors.

## Operational endpoints

Health/readiness endpoints must not disclose infrastructure details.
Worker admin/control endpoints are private and must never be exposed
through public routing.
