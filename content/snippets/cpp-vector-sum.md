---
schema_version: 1
id: cpp-vector-sum-01
slug: cpp-vector-sum
title: Summing a Vector in C++
language: cpp
level: intermediate
tags:
  - cpp
  - stl
  - algorithms
description: Computes the sum of a vector of integers using std::accumulate.
code: |
  #include <iostream>
  #include <numeric>
  #include <vector>

  int main() {
      std::vector<int> v = {1, 2, 3, 4, 5};
      int sum = std::accumulate(v.begin(), v.end(), 0);
      std::cout << sum << std::endl;
      return 0;
  }
expected_output: "15\n"
runtime_profile: cpp-stable
version_notes: "Uses C++17 std::accumulate."
pitfalls:
  - "Forgetting <numeric> header makes std::accumulate undefined."
  - "Using an int accumulator can overflow for large inputs."
related_lessons:
  - cpp-first-program
visibility: public
owner_id: null
---
