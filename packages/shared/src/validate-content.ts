#!/usr/bin/env tsx
/**
 * validate-content.ts — ForgeLab content validation CLI.
 *
 * Walks the content/ directory, validates every Markdown file's front matter
 * against the schema, checks unique slugs/IDs, required sections, runnable
 * blocks, internal links, and allowlisted runtime profiles. Exits non-zero
 * if any errors are found, so CI can fail the build on invalid content.
 *
 * Usage: npx tsx src/validate-content.ts [content-dir]
 * Default content-dir: ./content
 */

import { readdirSync, readFileSync } from 'fs';
import { join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  validateLesson,
  validateSnippet,
  validateExercise,
  LessonFrontMatter,
  isAllowedRuntimeProfile,
} from './content';

const CONTENT_DIR =
  process.argv[2] ?? resolve(fileURLToPath(import.meta.url), '../../../../content');

interface WalkResult {
  lessons: Array<{ path: string; frontMatter: LessonFrontMatter }>;
  snippets: Array<{ path: string; slug: string; id: string }>;
  exercises: Array<{ path: string; slug: string; id: string }>;
  allErrors: Array<{ file: string; message: string }>;
}

function walkMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

function classifyFile(relativePath: string): 'lesson' | 'snippet' | 'exercise' | 'guide' | 'index' {
  const lower = relativePath.toLowerCase().replace(/\\/g, '/');
  if (lower.includes('/exercises/')) return 'exercise';
  if (lower.includes('/snippets/')) return 'snippet';
  if (lower.includes('/guides/')) return 'guide';
  if (lower.endsWith('/index.md')) return 'index';
  return 'lesson';
}

function readFile(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}

function validateContent(contentDir: string): WalkResult {
  const files = walkMarkdownFiles(contentDir).sort();
  const result: WalkResult = {
    lessons: [],
    snippets: [],
    exercises: [],
    allErrors: [],
  };

  for (const filePath of files) {
    const relPath = relative(resolve(contentDir, '..'), filePath);
    const content = readFile(filePath);
    const kind = classifyFile(relPath);

    if (kind === 'index') {
      // Index files are path descriptions; skip deep validation but still
      // parse front matter for completeness.
      continue;
    }

    if (kind === 'lesson') {
      const { errors, lesson } = validateLesson(filePath, relPath, content);
      for (const e of errors) {
        result.allErrors.push({ file: relPath, message: e.message });
      }
      if (lesson) {
        result.lessons.push({ path: relPath, frontMatter: lesson.frontMatter });
      }
    } else if (kind === 'snippet') {
      const { errors, snippet } = validateSnippet(filePath, relPath, content);
      for (const e of errors) {
        result.allErrors.push({ file: relPath, message: e.message });
      }
      if (snippet) {
        result.snippets.push({
          path: relPath,
          slug: snippet.slug,
          id: snippet.id,
        });
      }
    } else if (kind === 'exercise') {
      const { errors, exercise } = validateExercise(filePath, relPath, content);
      for (const e of errors) {
        result.allErrors.push({ file: relPath, message: e.message });
      }
      if (exercise) {
        result.exercises.push({
          path: relPath,
          slug: exercise.slug,
          id: exercise.id,
        });
      }
    }
  }

  return result;
}

function checkUniqueSlugsAndIds(result: WalkResult): Array<{ file: string; message: string }> {
  const errors: Array<{ file: string; message: string }> = [];

  // Lesson slugs must be unique.
  const lessonSlugs = new Map<string, string>();
  for (const l of result.lessons) {
    const existing = lessonSlugs.get(l.frontMatter.slug);
    if (existing) {
      errors.push({
        file: l.path,
        message: `Duplicate lesson slug "${l.frontMatter.slug}" (also in ${existing})`,
      });
    } else {
      lessonSlugs.set(l.frontMatter.slug, l.path);
    }
  }

  // Snippet slugs and IDs must be unique.
  const snippetSlugs = new Map<string, string>();
  const snippetIds = new Map<string, string>();
  for (const s of result.snippets) {
    const existingSlug = snippetSlugs.get(s.slug);
    if (existingSlug) {
      errors.push({
        file: s.path,
        message: `Duplicate snippet slug "${s.slug}" (also in ${existingSlug})`,
      });
    } else {
      snippetSlugs.set(s.slug, s.path);
    }
    const existingId = snippetIds.get(s.id);
    if (existingId) {
      errors.push({
        file: s.path,
        message: `Duplicate snippet id "${s.id}" (also in ${existingId})`,
      });
    } else {
      snippetIds.set(s.id, s.path);
    }
  }

  // Exercise slugs and IDs must be unique.
  const exerciseSlugs = new Map<string, string>();
  const exerciseIds = new Map<string, string>();
  for (const e of result.exercises) {
    const existingSlug = exerciseSlugs.get(e.slug);
    if (existingSlug) {
      errors.push({
        file: e.path,
        message: `Duplicate exercise slug "${e.slug}" (also in ${existingSlug})`,
      });
    } else {
      exerciseSlugs.set(e.slug, e.path);
    }
    const existingId = exerciseIds.get(e.id);
    if (existingId) {
      errors.push({
        file: e.path,
        message: `Duplicate exercise id "${e.id}" (also in ${existingId})`,
      });
    } else {
      exerciseIds.set(e.id, e.path);
    }
  }

  return errors;
}

function checkPrerequisites(result: WalkResult): Array<{ file: string; message: string }> {
  const errors: Array<{ file: string; message: string }> = [];
  const knownSlugs = new Set<string>();
  for (const l of result.lessons) {
    knownSlugs.add(l.frontMatter.slug);
  }

  for (const l of result.lessons) {
    for (const prereq of l.frontMatter.prerequisites) {
      if (!knownSlugs.has(prereq)) {
        errors.push({
          file: l.path,
          message: `Unresolved prerequisite "${prereq}" (not a known lesson slug)`,
        });
      }
    }
  }

  return errors;
}

function checkRuntimes(result: WalkResult): Array<{ file: string; message: string }> {
  const errors: Array<{ file: string; message: string }> = [];
  for (const l of result.lessons) {
    if (!isAllowedRuntimeProfile(l.frontMatter.runtime_profile)) {
      errors.push({
        file: l.path,
        message: `Disallowed runtime profile "${l.frontMatter.runtime_profile}"`,
      });
    }
  }
  return errors;
}

function main(): void {
  const result = validateContent(CONTENT_DIR);
  const duplicateErrors = checkUniqueSlugsAndIds(result);
  const prereqErrors = checkPrerequisites(result);
  const runtimeErrors = checkRuntimes(result);

  const allErrors = [...result.allErrors, ...duplicateErrors, ...prereqErrors, ...runtimeErrors];

  if (allErrors.length > 0) {
    console.error(`Content validation failed: ${allErrors.length} error(s)\n`);
    for (const e of allErrors) {
      console.error(`  ${e.file}: ${e.message}`);
    }
    process.exit(1);
  }

  console.log(
    `Content validation passed: ${result.lessons.length} lesson(s), ${result.snippets.length} snippet(s), ${result.exercises.length} exercise(s).`
  );
}

main();
