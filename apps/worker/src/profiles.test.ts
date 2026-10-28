import { describe, it, expect } from 'vitest';
import {
  getProfile,
  isProfileAllowed,
  CPP_STABLE,
  C_STABLE,
  RUST_STABLE,
  PYTHON_STABLE,
} from './profiles';

describe('profiles', () => {
  it('c-stable profile has fixed server-side config', () => {
    const profile = getProfile('c-stable');
    expect(profile.id).toBe('c-stable');
    expect(profile.language).toBe('c');
    expect(profile.image).toBe('gcc:13');
    expect(profile.workdir).toBe('/workspace');
    expect(profile.sourceName).toBe('main.c');
    expect(profile.binaryName).toBe('main');
    expect(profile.stdinSupported).toBe(true);
    expect(profile.compile.cmd).toEqual([
      'gcc',
      '-O2',
      '-Wall',
      '-o',
      '/workspace/main',
      '/workspace/main.c',
    ]);
    expect(profile.run.cmd).toEqual(['/workspace/main']);
    expect(profile.limits.wallClockMs).toBe(10_000);
    expect(profile.limits.memoryBytes).toBe(256 * 1024 * 1024);
    expect(profile.limits.cpuCpus).toBe(1.0);
    expect(profile.limits.pidsLimit).toBe(32);
    expect(profile.limits.outputBytes).toBe(1 * 1024 * 1024);
    expect(profile.limits.workspaceBytes).toBe(64 * 1024 * 1024);
  });

  it('cpp-stable profile has fixed server-side config', () => {
    const profile = getProfile('cpp-stable');
    expect(profile.id).toBe('cpp-stable');
    expect(profile.language).toBe('cpp');
    expect(profile.image).toBe('gcc:13');
    expect(profile.workdir).toBe('/workspace');
    expect(profile.sourceName).toBe('main.cpp');
    expect(profile.binaryName).toBe('main');
    expect(profile.stdinSupported).toBe(true);
    expect(profile.compile.cmd).toEqual([
      'g++',
      '-O2',
      '-Wall',
      '-o',
      '/workspace/main',
      '/workspace/main.cpp',
    ]);
    expect(profile.run.cmd).toEqual(['/workspace/main']);
    expect(profile.limits.wallClockMs).toBe(10_000);
    expect(profile.limits.memoryBytes).toBe(256 * 1024 * 1024);
    expect(profile.limits.cpuCpus).toBe(1.0);
    expect(profile.limits.pidsLimit).toBe(32);
    expect(profile.limits.outputBytes).toBe(1 * 1024 * 1024);
    expect(profile.limits.workspaceBytes).toBe(64 * 1024 * 1024);
  });

  it('rust-stable profile has fixed server-side config', () => {
    const profile = getProfile('rust-stable');
    expect(profile.id).toBe('rust-stable');
    expect(profile.language).toBe('rust');
    expect(profile.image).toBe('rust:1');
    expect(profile.workdir).toBe('/workspace');
    expect(profile.sourceName).toBe('main.rs');
    expect(profile.binaryName).toBe('main');
    expect(profile.stdinSupported).toBe(true);
    expect(profile.compile.cmd).toEqual([
      'rustc',
      '-O2',
      '-o',
      '/workspace/main',
      '/workspace/main.rs',
    ]);
    expect(profile.run.cmd).toEqual(['/workspace/main']);
    // Rust gets heavier limits for compilation.
    expect(profile.limits.wallClockMs).toBe(30_000);
    expect(profile.limits.memoryBytes).toBe(512 * 1024 * 1024);
    expect(profile.limits.cpuCpus).toBe(2.0);
  });

  it('python-stable profile has no compile phase', () => {
    const profile = getProfile('python-stable');
    expect(profile.id).toBe('python-stable');
    expect(profile.language).toBe('python');
    expect(profile.image).toBe('python:3.11-slim');
    expect(profile.workdir).toBe('/workspace');
    expect(profile.sourceName).toBe('main.py');
    expect(profile.binaryName).toBe('main.py');
    expect(profile.stdinSupported).toBe(true);
    // Interpreted language: no compile command.
    expect(profile.compile.cmd).toEqual([]);
    expect(profile.run.cmd).toEqual(['python', '/workspace/main.py']);
    expect(profile.limits.wallClockMs).toBe(10_000);
    expect(profile.limits.memoryBytes).toBe(256 * 1024 * 1024);
  });

  it('getProfile throws for unknown profile', () => {
    expect(() => getProfile('no-such-profile' as never)).toThrow(
      'Unknown runtime profile: no-such-profile'
    );
  });

  it('isProfileAllowed returns true for allowed, false otherwise', () => {
    expect(isProfileAllowed('c-stable')).toBe(true);
    expect(isProfileAllowed('cpp-stable')).toBe(true);
    expect(isProfileAllowed('rust-stable')).toBe(true);
    expect(isProfileAllowed('python-stable')).toBe(true);
    expect(isProfileAllowed('evil-profile')).toBe(false);
  });

  it('profile constants match getProfile', () => {
    expect(C_STABLE).toEqual(getProfile('c-stable'));
    expect(CPP_STABLE).toEqual(getProfile('cpp-stable'));
    expect(RUST_STABLE).toEqual(getProfile('rust-stable'));
    expect(PYTHON_STABLE).toEqual(getProfile('python-stable'));
  });
});
