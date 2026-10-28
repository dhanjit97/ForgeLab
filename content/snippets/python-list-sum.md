---
schema_version: 1
id: python-list-sum-01
slug: python-list-sum
title: Summing a List in Python
language: python
level: beginner
tags:
  - python
  - builtins
description: Computes the sum of a list of integers using the built-in sum().
code: |
  numbers = [1, 2, 3, 4, 5]
  print(sum(numbers))
expected_output: "15\n"
runtime_profile: python-stable
version_notes: "Python 3.x built-in sum()."
pitfalls:
  - "sum() works on iterables of numbers; mixed types raise TypeError."
related_lessons:
  - python-first-program
visibility: public
owner_id: null
---
