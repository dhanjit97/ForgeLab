---
schema_version: 1
slug: hello-world-cli
title: Hello World CLI Tool
language: multi
level: beginner
module: projects
estimated_minutes: 120
prerequisites:
  - c-foundations
  - cpp-foundations
  - rust-foundations
  - python-foundations
objectives:
  - Build a small command-line program that prints a greeting
  - Compare how C, C++, Rust, and Python express the same idea
  - Understand compile-time vs interpreted execution
runtime_profile: c-stable
content_version: 1
published: true
tags:
  - project
  - comparison
  - multi-language
---

# Hello World CLI Tool

## Overview and motivation

Build the same "Hello, World" program in C, C++, Rust, and Python. This
mini-project highlights how each language compiles or interprets code, and
how the developer experience differs across the four languages ForgeLab
supports.

## Prerequisites

Completion of the "Your First Program" lesson in at least one language.
Familiarity with running programs in the Code Lab.

## Learning objectives

- Write a greeting program in C, C++, Rust, and Python
- Observe compile-time errors vs runtime errors in each language
- Compare program size, startup behavior, and syntax

## Scope and non-goals

**In scope:** A single source file per language that prints a greeting to
stdout and exits with code 0.

**Non-goals:** Command-line argument parsing, file I/O, packaging, or
distribution.

## Architecture and data flow

Each program follows the same flow:

1. Source file is written (one per language)
2. Source is compiled (C, C++, Rust) or interpreted (Python)
3. Program executes `main` / module top-level
4. `printf` / `std::cout` / `println!` / `print` writes to stdout
5. Process exits with code 0

## Milestones

| Milestone | Description | Acceptance criteria |
|-----------|-------------|---------------------|
| 1 | C version | Compiles with c-stable, prints "Hello, ForgeLab!" |
| 2 | C++ version | Compiles with cpp-stable, prints "Hello, ForgeLab!" |
| 3 | Rust version | Compiles with rust-stable, prints "Hello, ForgeLab!" |
| 4 | Python version | Runs with python-stable, prints "Hello, ForgeLab!" |
| 5 | Comparison notes | Document differences observed across languages |

## Acceptance criteria

- All four programs compile/run without errors
- Each prints exactly `Hello, ForgeLab!\n` to stdout
- Each exits with code 0

## Testing strategy

Run each program in the ForgeLab Code Lab and compare stdout to the
expected output. No hidden tests for this introductory project.

## Security and reliability considerations

This project runs only in the sandboxed Code Lab. No network access, no file
system access beyond the per-job workspace.

## Deployment/run instructions

Open each source file in the Code Lab, select the matching language profile,
and click Run. Verify stdout matches the expected output.

## Stretch goals

- Accept a name as a command-line argument and print "Hello, <name>!"
- Add a unit test for each language version
- Measure and compare startup time across languages

## Common failure modes

- Compile errors from missing headers or syntax issues
- Runtime errors from incorrect escape sequences
- Mismatched expected output (e.g. missing newline)

## Production-hardening checklist

- [ ] All four language versions verified
- [ ] Output compared exactly to expected
- [ ] Exit code confirmed as 0
