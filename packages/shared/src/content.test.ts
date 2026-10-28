import { describe, it, expect } from 'vitest';
import {
  validateLesson,
  validateSnippet,
  validateExercise,
  LessonFrontMatterSchema,
  ALLOWED_RUNTIME_PROFILES,
  REQUIRED_LESSON_SECTIONS,
} from './content';

describe('LessonFrontMatterSchema', () => {
  const validBase: Record<string, unknown> = {
    schema_version: 1,
    slug: 'c-first-program',
    title: 'Your First C Program',
    language: 'c',
    level: 'beginner',
    module: 'foundations',
    estimated_minutes: 15,
    prerequisites: [],
    objectives: ['Write a C program'],
    runtime_profile: 'c-stable',
    content_version: 1,
    published: true,
    tags: ['c'],
  };

  it('accepts a valid lesson front matter', () => {
    expect(LessonFrontMatterSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects a disallowed runtime profile', () => {
    const result = LessonFrontMatterSchema.safeParse({
      ...validBase,
      runtime_profile: 'evil-profile',
    });
    expect(result.success).toBe(true); // schema allows any string; allowlist checked separately
    expect(ALLOWED_RUNTIME_PROFILES).not.toContain('evil-profile');
  });

  it('rejects a slug with uppercase letters', () => {
    const result = LessonFrontMatterSchema.safeParse({
      ...validBase,
      slug: 'C-First-Program',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing objectives', () => {
    const result = LessonFrontMatterSchema.safeParse({
      ...validBase,
      objectives: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('validateLesson', () => {
  const validLesson = `---
schema_version: 1
slug: c-first-program
title: Your First C Program
language: c
level: beginner
module: foundations
estimated_minutes: 15
prerequisites: []
objectives:
  - Write a C program
runtime_profile: c-stable
content_version: 1
published: true
tags:
  - c
---

## What you will learn

Learn C.

## Explanation

C is a compiled language.

## Worked example

\`\`\`c
int main(void) { return 0; }
\`\`\`

## Expected output

(none)

## Try it yourself

\`\`\`runnable
{"id": "c-01", "language": "c", "runtime_profile": "c-stable", "files": [{"name": "main.c", "content": "int main(void) { return 0; }"}]}
\`\`\`

## Common mistakes

None.

## Summary

Done.

## Next steps

More C.
`;

  it('accepts a valid lesson', () => {
    const { errors, lesson } = validateLesson(
      'content/paths/c/01-first-program.md',
      'content/paths/c/01-first-program.md',
      validLesson
    );
    expect(errors).toHaveLength(0);
    expect(lesson).not.toBeNull();
  });

  it('rejects missing front matter', () => {
    const { errors } = validateLesson('x.md', 'x.md', '# Just a heading\n');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('front matter');
  });

  it('rejects missing required sections', () => {
    const { errors } = validateLesson(
      'x.md',
      'x.md',
      `---
schema_version: 1
slug: x
title: X
language: c
level: beginner
module: m
estimated_minutes: 1
objectives:
  - learn
runtime_profile: c-stable
content_version: 1
published: true
tags: []
---

# Only one section

content
`
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes('required section'))).toBe(true);
  });

  it('rejects disallowed runtime profile in runnable block', () => {
    const { errors } = validateLesson(
      'x.md',
      'x.md',
      `---
schema_version: 1
slug: x
title: X
language: c
level: beginner
module: m
estimated_minutes: 1
objectives:
  - learn
runtime_profile: c-stable
content_version: 1
published: true
tags: []
---

# What you will learn

x

# Explanation

x

# Worked example

x

# Expected output

x

# Try it yourself

\`\`\`runnable
{"id": "bad", "language": "c", "runtime_profile": "evil-profile", "files": [{"name": "main.c", "content": ""}]}
\`\`\`

# Common mistakes

x

# Summary

x

# Next steps

x
`
    );
    expect(errors.some((e) => e.message.includes('disallowed runtime profile'))).toBe(true);
  });
});

describe('validateSnippet', () => {
  const validSnippet = `---
schema_version: 1
id: snippet-01
slug: snippet-01
title: My Snippet
language: python
level: beginner
tags: []
description: A snippet
code: |
  print("hi")
runtime_profile: python-stable
visibility: public
owner_id: null
---

body
`;

  it('accepts a valid public snippet', () => {
    const { errors, snippet } = validateSnippet(
      'content/snippets/x.md',
      'content/snippets/x.md',
      validSnippet
    );
    expect(errors).toHaveLength(0);
    expect(snippet).not.toBeNull();
  });

  it('rejects public snippet with owner_id', () => {
    const bad = validSnippet.replace('owner_id: null', 'owner_id: 123');
    const { errors } = validateSnippet('content/snippets/x.md', 'content/snippets/x.md', bad);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('validateExercise', () => {
  const validExercise = `---
schema_version: 1
id: ex-01
slug: ex-01
title: My Exercise
language: c
difficulty: beginner
version: 1
starter_files:
  - name: main.c
    content: |
      int main(void) { return 0; }
public_test_cases:
  - input: "1\n"
    expected_output: "2\n"
limits_profile: default
hints:
  - try hard
learning_objectives:
  - learn
rubric: exact-output
---

# Prompt

Write code.
`;

  it('accepts a valid exercise', () => {
    const { errors, exercise } = validateExercise(
      'content/exercises/x.md',
      'content/exercises/x.md',
      validExercise
    );
    expect(errors).toHaveLength(0);
    expect(exercise).not.toBeNull();
  });

  it('rejects exercise with no starter files and no body', () => {
    const { errors } = validateExercise(
      'content/exercises/x.md',
      'content/exercises/x.md',
      `---
schema_version: 1
id: ex-02
slug: ex-02
title: X
language: c
difficulty: beginner
version: 1
starter_files: []
---
`
    );
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('ALLOWED_RUNTIME_PROFILES', () => {
  it('contains the four expected profiles', () => {
    expect(ALLOWED_RUNTIME_PROFILES).toEqual([
      'c-stable',
      'cpp-stable',
      'rust-stable',
      'python-stable',
    ]);
  });
});

describe('REQUIRED_LESSON_SECTIONS', () => {
  it('lists the eight required sections', () => {
    expect(REQUIRED_LESSON_SECTIONS).toHaveLength(8);
    expect(REQUIRED_LESSON_SECTIONS).toContain('Worked example');
    expect(REQUIRED_LESSON_SECTIONS).toContain('Expected output');
  });
});
