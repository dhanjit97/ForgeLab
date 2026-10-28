---
schema_version: 1
slug: c-first-program
title: Your First C Program
language: c
level: beginner
module: foundations
estimated_minutes: 15
prerequisites: []
objectives:
  - Write a complete C program with a main function
  - Compile and run a C program using the c-stable runtime profile
  - Interpret compiler errors and program output
runtime_profile: c-stable
content_version: 1
published: true
tags:
  - c
  - foundations
  - hello-world
---

# Your First C Program

## What you will learn

- The structure of a minimal C program
- How the `main` function works as the entry point
- How to print text to stdout with `printf`
- How to compile and run a C program in ForgeLab

## Explanation

Every C program begins execution in a function named `main`. The `main`
function returns an `int` to the operating system; by convention, returning
`0` signals success.

The `<stdio.h>` header declares `printf`, which writes formatted text to the
standard output stream. C programs are compiled ahead of time into machine
code before they can run.

## Worked example

```c
#include <stdio.h>

int main(void) {
    printf("Hello, ForgeLab!\n");
    return 0;
}
```

## Expected output

```
Hello, ForgeLab!
```

## Try it yourself

Edit the example below, then run it. Try changing the text inside the
quotes and observe how the output changes.

```runnable
{
  "id": "c-first-program-01",
  "language": "c",
  "runtime_profile": "c-stable",
  "files": [
    {
      "name": "main.c",
      "content": "#include <stdio.h>\n\nint main(void) {\n    printf(\"Hello, ForgeLab!\\n\");\n    return 0;\n}\n"
    }
  ],
  "stdin": "",
  "expected_stdout": "Hello, ForgeLab!\n",
  "notes": "A minimal C program. Compiles with gcc and runs under the c-stable profile."
}
```

## Common mistakes

- Forgetting the `#include <stdio.h>` directive makes `printf` undefined.
- Forgetting `\n` at the end of the format string can leave output
  unflushed on some terminals.
- Returning a non-zero value from `main` signals failure to the shell.

## Summary

You wrote, compiled, and ran your first C program. You learned that `main`
is the entry point, `printf` writes to stdout, and a `return 0;` signals
success.

## Next steps

- Learn about variables and types in C
- Explore user input with `scanf`
