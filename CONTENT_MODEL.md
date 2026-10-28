# Learning Content Model

## 1. Content principles

-   Content is version-controlled, reviewed, and validated in CI.
-   Examples must state the compiler/interpreter version or supported
    profile.
-   Teaching shortcuts are labeled as such.
-   Every code example has expected behavior and is tested in an
    isolated CI environment.
-   Avoid claiming a snippet is production-safe without review.
-   External links are checked; important concepts should not depend on
    a single external resource.

## 2. Suggested directory layout

content/ paths/ c/ index.md 01-foundations/ 01-first-program.md
02-variables-and-types.md cpp/ rust/ python/ guides/ algorithms/
operating-systems/ networking/ databases/ concurrency/ system-design/
snippets/ projects/ exercises/

## \## 3. Lesson front matter example

schema_version: 1 slug: python-functions title: Functions in Python
language: python level: beginner module: fundamentals estimated_minutes:
20 prerequisites: - python-variables objectives: - Define a function
with parameters. - Return a value from a function. runtime_profile:
python-stable content_version: 1 published: true tags: - functions -
fundamentals ---

## 4. Required lesson sections

-   What you will learn
-   Explanation
-   Worked example
-   Expected output
-   Try it yourself
-   Common mistakes
-   Summary
-   Next steps Optional: deeper dive, diagrams, alternative language
    comparison, further reading.

## 5. Example block format

Use fenced code blocks for static display and a structured runnable
block when needed. A runnable block should include: - `id`: stable
content ID - `language`: one of c, cpp, rust, python -
`runtime_profile`: allowlisted ID - `files`: relative filename and
source content - `stdin`: optional sample input - `expected_stdout`:
optional exact sample output - `notes`: explanation and assumptions

Never accept arbitrary compiler flags or image names from content front
matter. Validate runtime profile IDs against a server-side allowlist.

## 6. Exercise schema concept

-   `id`, `slug`, `title`, `language`, `difficulty`, `version`
-   `prompt_markdown`
-   `starter_files`
-   `public_test_cases`
-   `hidden_test_reference` stored server-side only
-   `limits_profile`
-   `hints`
-   `solution_explanation`
-   `learning_objectives`
-   `rubric` for non-exact-output evaluation where appropriate

Hidden tests and full reference solutions must not be shipped to the
browser before the attempt is finalized. Never put hidden test values in
public source maps or client bundles.

## 7. Snippet metadata

-   `id`, `title`, `language`, `level`, `tags`
-   `description`, `code`, `expected_output`
-   `runtime_profile`, `version_notes`
-   `pitfalls`, `related_lessons`, `license/attribution` if externally
    sourced
-   `visibility`, `owner_id` for user snippets

## 8. Project guide structure

-   Overview and motivation
-   Prerequisites
-   Learning objectives
-   Scope and non-goals
-   Architecture and data flow
-   Milestones
-   Acceptance criteria
-   Testing strategy
-   Security and reliability considerations
-   Deployment/run instructions
-   Stretch goals
-   Common failure modes
-   Production-hardening checklist

## 9. CI validation

-   Validate front matter against a schema.
-   Check unique slugs and IDs.
-   Check internal links and referenced prerequisites.
-   Check runnable blocks use allowlisted profiles.
-   Test public examples in isolated CI jobs with resource limits.
-   Ensure all required sections exist.
-   Ensure hidden tests and private snippets are not included in public
    content bundles.
-   Require review for published content changes.
