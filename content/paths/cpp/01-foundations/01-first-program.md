---
schema_version: 1
slug: cpp-first-program
title: Your First C++ Program
language: cpp
level: beginner
module: foundations
estimated_minutes: 15
prerequisites: []
objectives:
  - Write a complete C++ program with a main function
  - Use iostream to write to stdout
  - Compile and run a C++ program using the cpp-stable runtime profile
runtime_profile: cpp-stable
content_version: 1
published: true
tags:
  - cpp
  - foundations
  - hello-world
---

# Your First C++ Program

## What you will learn

- The structure of a minimal C++ program
- How the `main` function works as the entry point
- How to print text to stdout with `std::cout`
- How to compile and run a C++ program in ForgeLab

## Explanation

Every C++ program begins execution in a function named `main`. The `main`
function returns an `int`; returning `0` signals success to the operating
system.

The `<iostream>` header declares `std::cout`, the standard output stream.
C++ programs are compiled ahead of time into machine code before they can run.

## Worked example

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, ForgeLab!" << std::endl;
    return 0;
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
  "id": "cpp-first-program-01",
  "language": "cpp",
  "runtime_profile": "cpp-stable",
  "files": [
    {
      "name": "main.cpp",
      "content": "#include <iostream>\n\nint main() {\n    std::cout << \"Hello, ForgeLab!\" << std::endl;\n    return 0;\n}\n"
    }
  ],
  "stdin": "",
  "expected_stdout": "Hello, ForgeLab!\n",
  "notes": "A minimal C++ program. Compiles with g++ and runs under the cpp-stable profile."
}
```

## Common mistakes

- Forgetting `#include <iostream>` makes `std::cout` undefined.
- Forgetting `std::endl` or `\n` can leave output unflushed.
- Using `cout` without the `std::` prefix (and without `using namespace std;`)
  causes a compile error.

## Summary

You wrote, compiled, and ran your first C++ program. You learned that `main`
is the entry point, `std::cout` writes to stdout, and `return 0;` signals
success.

## Next steps

- Learn about variables and types in C++
- Explore user input with `std::cin`
