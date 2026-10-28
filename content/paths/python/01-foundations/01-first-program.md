---
schema_version: 1
slug: python-first-program
title: Your First Python Program
language: python
level: beginner
module: foundations
estimated_minutes: 20
prerequisites: []
objectives:
  - Write a complete Python program
  - Use the print function to write to stdout
  - Run a Python program using the python-stable runtime profile
runtime_profile: python-stable
content_version: 1
published: true
tags:
  - python
  - foundations
  - hello-world
---

# Your First Python Program

## What you will learn

- The structure of a minimal Python program
- How Python executes code from top to bottom
- How to print text to stdout with `print`
- How to run a Python program in ForgeLab

## Explanation

Python is an interpreted language. There is no separate compile step; the
Python interpreter reads and executes your source file from top to bottom.

A Python program does not require a `main` function, though it is common to
define one and call it conditionally with `if __name__ == "__main__":`.

The built-in `print` function writes text to stdout, adding a newline by
default.

## Worked example

```python
print("Hello, ForgeLab!")
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
  "id": "python-first-program-01",
  "language": "python",
  "runtime_profile": "python-stable",
  "files": [
    {
      "name": "main.py",
      "content": "print(\"Hello, ForgeLab!\")\n"
    }
  ],
  "stdin": "",
  "expected_stdout": "Hello, ForgeLab!\n",
  "notes": "A minimal Python program. Runs under the python-stable profile."
}
```

## Common mistakes

- Forgetting parentheses around the argument to `print` (Python 3 requires
  them).
- Mixing tabs and spaces for indentation causes `IndentationError`.
- Forgetting that `print` adds a trailing newline by default.

## Summary

You wrote and ran your first Python program. You learned that Python runs
top to bottom, `print` writes to stdout, and there is no separate compile
step.

## Next steps

- Learn about variables, types, and functions in Python
- Explore Python's standard library
