---
schema_version: 1
slug: c-even-check
title: Check if a Number is Even in C
id: c-even-check-01
language: c
difficulty: beginner
version: 1
starter_files:
  - name: main.c
    content: |
      #include <stdio.h>

      int main(void) {
          int n = 0;
          /* TODO: read n from stdin and print "even" or "odd" */
          return 0;
      }
public_test_cases:
  - input: "4\n"
    expected_output: "even\n"
  - input: "7\n"
    expected_output: "odd\n"
limits_profile: default
hints:
  - "Use scanf to read an integer from stdin."
  - "Use the % operator to check divisibility by 2."
solution_explanation: "Read n with scanf, then print \"even\" if n % 2 == 0, otherwise \"odd\"."
learning_objectives:
  - Read integer input from stdin
  - Use the modulo operator
  - Branch with if/else
rubric: exact-output
---

# Is it even or odd?

Write a C program that reads an integer from stdin and prints `"even"` if
the number is even, or `"odd"` if it is odd.

## Input

A single integer `n` on one line.

## Output

Print `"even"` or `"odd"` followed by a newline.

## Examples

| Input | Output |
|-------|--------|
| 4 | even |
| 7 | odd |

## Hints

- Use `scanf("%d", &n)` to read the integer.
- Use `n % 2 == 0` to test for evenness.
