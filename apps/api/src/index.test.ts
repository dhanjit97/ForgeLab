import { describe, it, expect } from 'vitest';
import { ExecutionRequestSchema } from '@forgelab/shared';

describe('API execution request validation', () => {
  it('validates a cpp request', () => {
    const result = ExecutionRequestSchema.safeParse({
      language: 'cpp',
      runtimeProfile: 'cpp-stable',
      files: [{ name: 'main.cpp', content: '#include <iostream>\nint main() {}\n' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown language', () => {
    const result = ExecutionRequestSchema.safeParse({
      language: 'go' as never,
      runtimeProfile: 'go-stable',
      files: [{ name: 'main.go', content: 'package main\n' }],
    });
    expect(result.success).toBe(false);
  });
});
