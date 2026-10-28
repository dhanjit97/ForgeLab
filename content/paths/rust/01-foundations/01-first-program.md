---
schema_version: 1
slug: rust-first-program
title: Your First Rust Program
language: rust
level: beginner
module: foundations
estimated_minutes: 20
prerequisites: []
objectives:
  - Write a complete Rust program with a main function
  - Use the println! macro to write to stdout
  - Compile and run a Rust program using the rust-stable runtime profile
runtime_profile: rust-stable
content_version: 1
published: true
tags:
  - rust
  - foundations
  - hello-world
---

# Your First Rust Program

## What you will learn

- The structure of a minimal Rust program
- How the `main` function works as the entry point
- How to print text to stdout with the `println!` macro
- How to compile and run a Rust program in ForgeLab

## Explanation

Every Rust program begins execution in a function named `main`. Rust does
not require a `return` statement in `main`; the compiler handles the exit
code.

The `println!` macro writes text to stdout with a newline. Macros in Rust
are indicated by the `!` suffix. Rust programs are compiled ahead of time
with `rustc` (or managed by Cargo).

## Worked example

```rust
fn main() {
    println!("Hello, ForgeLab!");
}
```

## Expected output

```
Hello, ForgeLab!
```

## Try it yourself

Edit the example below, then run it. Try changing the text and observe how
the output changes.

```runnable
{
  "id": "rust-first-program-01",
  "language": "rust",
  "runtime_profile": "rust-stable",
  "files": [
    {
      "name": "main.rs",
      "content": "fn main() {\n    println!(\"Hello, ForgeLab!\");\n}\n"
    }
  ],
  "stdin": "",
  "expected_stdout": "Hello, ForgeLab!\n",
  "notes": "A minimal Rust program. Compiles with rustc and runs under the rust-stable profile."
}
```

## Common mistakes

- Forgetting the semicolon after `println!` can produce a warning (though
  Rust will often still compile).
- Using `print!` instead of `println!` omits the trailing newline, which can
  make output appear on the same line as the shell prompt.
- Rust strings are UTF-8; non-ASCII characters work but may change byte
  length.

## Summary

You wrote, compiled, and ran your first Rust program. You learned that `main`
is the entry point, `println!` writes to stdout, and Rust compiles ahead of
time to machine code.

## Next steps

- Learn about variables, mutability, and shadowing in Rust
- Explore Rust's ownership and borrowing model
