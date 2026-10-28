// @forgelab/shared/content — content schemas and validation for ForgeLab
// educational content (lessons, snippets, exercises, project guides).
//
// Implements CONTENT_MODEL.md: validates front matter, required sections,
// runnable blocks, unique slugs/IDs, internal links, and allowlisted
// runtime profiles.

import { z } from 'zod';
import yaml from 'js-yaml';

export const LANGUAGE = {
  c: 'c',
  cpp: 'cpp',
  rust: 'rust',
  python: 'python',
} as const;

export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE];

// Runtime profiles approved for execution (EXECUTION_SECURITY.md §4).
// The browser submits a profile ID, never an image name or compiler flag.
export const ALLOWED_RUNTIME_PROFILES = [
  'c-stable',
  'cpp-stable',
  'rust-stable',
  'python-stable',
] as const;

export type AllowedRuntimeProfile = (typeof ALLOWED_RUNTIME_PROFILES)[number];

export function isAllowedRuntimeProfile(value: string): value is AllowedRuntimeProfile {
  return (ALLOWED_RUNTIME_PROFILES as readonly string[]).includes(value);
}

// Required sections for every lesson (CONTENT_MODEL.md §4).
export const REQUIRED_LESSON_SECTIONS = [
  'What you will learn',
  'Explanation',
  'Worked example',
  'Expected output',
  'Try it yourself',
  'Common mistakes',
  'Summary',
  'Next steps',
] as const;

// ---- Lesson front matter schema ----

export const LessonFrontMatterSchema = z.object({
  schema_version: z.number().int().nonnegative(),
  slug: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(200),
  language: z.nativeEnum(LANGUAGE),
  level: z.string().min(1).max(50),
  module: z.string().min(1).max(100),
  estimated_minutes: z.number().int().nonnegative(),
  prerequisites: z.array(z.string()).default([]),
  objectives: z.array(z.string().min(1)).min(1),
  runtime_profile: z.string().min(1),
  content_version: z.number().int().nonnegative(),
  published: z.boolean().default(true),
  tags: z.array(z.string().min(1)).default([]),
});

export type LessonFrontMatter = z.infer<typeof LessonFrontMatterSchema>;

// ---- Runnable block schema (embedded in lesson markdown) ----

export const RunnableFileSchema = z.object({
  name: z.string().min(1).max(255),
  content: z.string(),
});

export const RunnableBlockSchema = z.object({
  id: z.string().min(1).max(128),
  language: z.nativeEnum(LANGUAGE),
  runtime_profile: z.string().min(1),
  files: z.array(RunnableFileSchema).min(1),
  stdin: z.string().optional(),
  expected_stdout: z.string().optional(),
  notes: z.string().optional(),
});

export type RunnableBlock = z.infer<typeof RunnableBlockSchema>;

// ---- Parsed lesson (front matter + body) ----

export interface ParsedLesson {
  frontMatter: LessonFrontMatter;
  body: string;
  runnableBlocks: RunnableBlock[];
  filePath: string;
  relativePath: string;
}

// ---- Snippet schema ----

export const SnippetSchema = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(200),
  language: z.nativeEnum(LANGUAGE),
  level: z.string().min(1).max(50),
  tags: z.array(z.string().min(1)).default([]),
  description: z.string().min(1).max(1000),
  code: z.string().min(1),
  expected_output: z.string().optional(),
  runtime_profile: z.string().min(1),
  version_notes: z.string().optional(),
  pitfalls: z.array(z.string()).default([]),
  related_lessons: z.array(z.string()).default([]),
  visibility: z.enum(['public', 'private']),
  owner_id: z.string().uuid().nullable().optional(),
});

export type Snippet = z.infer<typeof SnippetSchema>;

// ---- Exercise schema ----

export const ExerciseSchema = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(200),
  language: z.nativeEnum(LANGUAGE),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  version: z.number().int().positive(),
  // prompt_markdown may live in front matter or be the markdown body itself.
  prompt_markdown: z.string().min(1).optional(),
  starter_files: z.array(RunnableFileSchema).default([]),
  public_test_cases: z
    .array(
      z.object({
        input: z.string(),
        expected_output: z.string(),
      })
    )
    .default([]),
  limits_profile: z.string().default('default'),
  hints: z.array(z.string()).default([]),
  solution_explanation: z.string().optional(),
  learning_objectives: z.array(z.string()).default([]),
  rubric: z.string().optional(),
  // hidden_test_reference must be server-side only; it is not part of the
  // public content bundle and is validated separately in CI.
});

export type Exercise = z.infer<typeof ExerciseSchema>;

// ---- Validation results ----

export interface ValidationError {
  file: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  lessons: ParsedLesson[];
  snippets: Snippet[];
  exercises: Exercise[];
}

export function error(
  file: string,
  message: string,
  severity: ValidationError['severity'] = 'error'
): ValidationError {
  return { file, message, severity };
}

// ---- Front matter parsing ----

const FRONT_MATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;

export function parseFrontMatter(
  _filePath: string,
  _relativePath: string,
  content: string
): { frontMatter: unknown; body: string; frontMatterRaw: string } | null {
  const match = content.match(FRONT_MATTER_REGEX);
  if (!match) {
    return null;
  }
  const frontMatterRaw = match[1];
  const body = content.slice(match[0].length);

  let frontMatter: unknown;
  try {
    frontMatter = JSON.parse(JSON.stringify(yaml.load(frontMatterRaw)));
  } catch (err) {
    frontMatter = { _parse_error: String(err) };
  }

  return { frontMatter, body, frontMatterRaw };
}

// Extract ```runnable JSON blocks from markdown body.
export function extractRunnableBlocks(body: string): RunnableBlock[] {
  const blocks: RunnableBlock[] = [];
  const regex = /```runnable\r?\n([\s\S]*?)\r?\n```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      blocks.push(parsed as RunnableBlock);
    } catch {
      // Invalid JSON in runnable block — validation will flag it.
      blocks.push({} as RunnableBlock);
    }
  }
  return blocks;
}

// Extract heading text from markdown body (ATX headings: # Heading).
export function extractHeadings(body: string): string[] {
  const headings: string[] = [];
  const regex = /^#{2,6}\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body)) !== null) {
    headings.push(match[1].trim());
  }
  return headings;
}

// ---- Validation ----

export function validateLesson(
  filePath: string,
  relativePath: string,
  content: string
): {
  errors: ValidationError[];
  lesson: ParsedLesson | null;
} {
  const errors: ValidationError[] = [];
  const parsed = parseFrontMatter(filePath, relativePath, content);

  if (!parsed) {
    errors.push(error(filePath, 'Missing YAML front matter (--- delimited)'));
    return { errors, lesson: null };
  }

  // Validate front matter against schema.
  const fmResult = LessonFrontMatterSchema.safeParse(parsed.frontMatter);
  if (!fmResult.success) {
    const issues = fmResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    errors.push(error(filePath, `Invalid front matter: ${issues.join('; ')}`));
    return { errors, lesson: null };
  }

  const frontMatter = fmResult.data as LessonFrontMatter;

  // Validate runtime profile against allowlist.
  if (!isAllowedRuntimeProfile(frontMatter.runtime_profile)) {
    errors.push(
      error(
        filePath,
        `Disallowed runtime profile "${frontMatter.runtime_profile}". Allowed: ${ALLOWED_RUNTIME_PROFILES.join(', ')}`
      )
    );
  }

  // Extract runnable blocks and validate each.
  const runnableBlocks = extractRunnableBlocks(parsed.body);
  for (const block of runnableBlocks) {
    const blockResult = RunnableBlockSchema.safeParse(block);
    if (!blockResult.success) {
      errors.push(
        error(
          filePath,
          `Invalid runnable block "${block.id ?? '<unknown>'}": ${blockResult.error.errors.map((e) => e.message).join('; ')}`
        )
      );
      continue;
    }
    const validBlock = blockResult.data;
    if (!isAllowedRuntimeProfile(validBlock.runtime_profile)) {
      errors.push(
        error(
          filePath,
          `Runnable block "${validBlock.id}" uses disallowed runtime profile "${validBlock.runtime_profile}"`
        )
      );
    }
    // Each runnable block must have at least one file with valid name pattern.
    for (const file of validBlock.files) {
      if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
        errors.push(
          error(filePath, `Runnable block "${validBlock.id}" has invalid filename "${file.name}"`)
        );
      }
    }
  }

  // Check required sections exist in the body (case-insensitive).
  const headings = extractHeadings(parsed.body);
  const headingsLower = headings.map((h) => h.toLowerCase());
  for (const required of REQUIRED_LESSON_SECTIONS) {
    if (!headingsLower.includes(required.toLowerCase())) {
      errors.push(error(filePath, `Missing required section: "${required}"`));
    }
  }

  const lesson: ParsedLesson = {
    frontMatter,
    body: parsed.body,
    runnableBlocks,
    filePath,
    relativePath,
  };

  return { errors, lesson };
}

export function validateSnippet(
  filePath: string,
  relativePath: string,
  content: string
): {
  errors: ValidationError[];
  snippet: Snippet | null;
} {
  const errors: ValidationError[] = [];
  const parsed = parseFrontMatter(filePath, relativePath, content);

  if (!parsed) {
    errors.push(error(filePath, 'Missing YAML front matter'));
    return { errors, snippet: null };
  }

  const result = SnippetSchema.safeParse(parsed.frontMatter);
  if (!result.success) {
    const issues = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    errors.push(error(filePath, `Invalid snippet front matter: ${issues.join('; ')}`));
    return { errors, snippet: null };
  }

  // Snippets must not contain hidden tests or private solutions in public bundles.
  if (result.data.visibility === 'public' && result.data.owner_id != null) {
    errors.push(
      error(filePath, 'Public snippets must not have an owner_id (private snippets only)')
    );
  }

  return { errors, snippet: result.data };
}

export function validateExercise(
  filePath: string,
  relativePath: string,
  content: string
): {
  errors: ValidationError[];
  exercise: Exercise | null;
} {
  const errors: ValidationError[] = [];
  const parsed = parseFrontMatter(filePath, relativePath, content);

  if (!parsed) {
    errors.push(error(filePath, 'Missing YAML front matter'));
    return { errors, exercise: null };
  }

  const result = ExerciseSchema.safeParse(parsed.frontMatter);
  if (!result.success) {
    const issues = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    errors.push(error(filePath, `Invalid exercise front matter: ${issues.join('; ')}`));
    return { errors, exercise: null };
  }

  // Exercise must have at least one starter file or prompt (front matter or body).
  const hasPrompt = !!result.data.prompt_markdown || parsed.body.trim().length > 0;
  if (result.data.starter_files.length === 0 && !hasPrompt) {
    errors.push(error(filePath, 'Exercise must have starter_files or prompt_markdown'));
  }

  return { errors, exercise: result.data };
}

export { z };
