import { describe, it, expect } from 'vitest';
import { ExecutionRequestSchema, ExecutionResultSchema } from './index';

describe('ExecutionRequestSchema', () => {
  it('accepts a valid single-file C++ request', () => {
    const result = ExecutionRequestSchema.safeParse({
      language: 'cpp',
      runtimeProfile: 'cpp-stable',
      files: [
        {
          name: 'main.cpp',
          content: '#include <iostream>\nint main() { std::cout << "Hello\\n"; }\n',
        },
      ],
      stdin: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty files array', () => {
    const result = ExecutionRequestSchema.safeParse({
      language: 'cpp',
      runtimeProfile: 'cpp-stable',
      files: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects source over the byte limit', () => {
    const result = ExecutionRequestSchema.safeParse({
      language: 'cpp',
      runtimeProfile: 'cpp-stable',
      files: [{ name: 'main.cpp', content: 'x'.repeat(300 * 1024) }],
    });
    expect(result.success).toBe(false);
  });
});

describe('ExecutionResultSchema', () => {
  it('accepts a successful result', () => {
    const result = ExecutionResultSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'succeeded',
      phase: 'run',
      stdout: 'Hello\n',
      stderr: '',
      diagnostics: [],
      exitCode: 0,
      durationMs: 42,
      truncated: false,
    });
    expect(result.success).toBe(true);
  });
});
