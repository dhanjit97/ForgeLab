import { describe, it, expect } from 'vitest';
import { getProfile, isProfileAllowed, CPP_STABLE } from './profiles';

describe('profiles', () => {
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

  it('getProfile throws for unknown profile', () => {
    expect(() => getProfile('no-such-profile' as never)).toThrow(
      'Unknown runtime profile: no-such-profile'
    );
  });

  it('isProfileAllowed returns true for allowed, false otherwise', () => {
    expect(isProfileAllowed('cpp-stable')).toBe(true);
    expect(isProfileAllowed('evil-profile')).toBe(false);
  });

  it('CPP_STABLE is exported and matches getProfile', () => {
    expect(CPP_STABLE).toEqual(getProfile('cpp-stable'));
  });
});
