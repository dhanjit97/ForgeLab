// @forgelab/worker/profiles — server-side runtime profile registry.
//
// Profiles map a profile ID to a pinned image and fixed server-side commands.
// The client submits only a profile ID — never an image name, shell command,
// or arbitrary compiler flags (EXECUTION_SECURITY.md §4).

import { ResourceLimits } from './limits';

export interface CompileSpec {
  // Command (argv array) to compile the source. Empty for interpreted
  // languages that do not require a compile phase.
  cmd: string[];
}

export interface RunSpec {
  // Command (argv array) to run the source or compiled binary.
  cmd: string[];
}

export interface RuntimeProfile {
  id: string;
  language: string;
  image: string;
  workdir: string;
  sourceName: string;
  binaryName: string;
  compile: CompileSpec;
  run: RunSpec;
  stdinSupported: boolean;
  limits: ResourceLimits;
}

export const WORKDIR = '/workspace';

// Common limits shared by compiled languages (C, C++).
const COMPILED_DEFAULT_LIMITS: ResourceLimits = {
  wallClockMs: 10_000, // 10 seconds per phase
  memoryBytes: 256 * 1024 * 1024, // 256 MiB
  cpuCpus: 1.0,
  pidsLimit: 32,
  outputBytes: 1 * 1024 * 1024, // 1 MiB combined stdout/stderr
  workspaceBytes: 64 * 1024 * 1024, // 64 MiB workspace
} as const;

// Rust compilation is heavier; allow more time and memory.
const RUST_LIMITS: ResourceLimits = {
  ...COMPILED_DEFAULT_LIMITS,
  wallClockMs: 30_000,
  memoryBytes: 512 * 1024 * 1024,
  cpuCpus: 2.0,
} as const;

// Python is interpreted; no compile phase, lighter weight.
const PYTHON_LIMITS: ResourceLimits = {
  ...COMPILED_DEFAULT_LIMITS,
} as const;

export const C_STABLE: RuntimeProfile = {
  id: 'c-stable',
  language: 'c',
  image: 'gcc:13', // SPIKE: pinned by tag. Production pins by immutable digest (ADR-001).
  workdir: WORKDIR,
  sourceName: 'main.c',
  binaryName: 'main',
  compile: {
    cmd: ['gcc', '-O2', '-Wall', '-o', '/workspace/main', '/workspace/main.c'],
  },
  run: { cmd: ['/workspace/main'] },
  stdinSupported: true,
  limits: COMPILED_DEFAULT_LIMITS,
};

export const CPP_STABLE: RuntimeProfile = {
  id: 'cpp-stable',
  language: 'cpp',
  image: 'gcc:13', // SPIKE: pinned by tag. Production pins by immutable digest (ADR-001).
  workdir: WORKDIR,
  sourceName: 'main.cpp',
  binaryName: 'main',
  compile: {
    cmd: ['g++', '-O2', '-Wall', '-o', '/workspace/main', '/workspace/main.cpp'],
  },
  run: { cmd: ['/workspace/main'] },
  stdinSupported: true,
  limits: COMPILED_DEFAULT_LIMITS,
};

export const RUST_STABLE: RuntimeProfile = {
  id: 'rust-stable',
  language: 'rust',
  image: 'rust:1', // SPIKE: pinned by tag. Production pins by immutable digest (ADR-001).
  workdir: WORKDIR,
  sourceName: 'main.rs',
  binaryName: 'main',
  compile: {
    cmd: ['rustc', '-O2', '-o', '/workspace/main', '/workspace/main.rs'],
  },
  run: { cmd: ['/workspace/main'] },
  stdinSupported: true,
  limits: RUST_LIMITS,
};

export const PYTHON_STABLE: RuntimeProfile = {
  id: 'python-stable',
  language: 'python',
  image: 'python:3.11-slim', // SPIKE: pinned by tag. Production pins by immutable digest (ADR-001).
  workdir: WORKDIR,
  sourceName: 'main.py',
  binaryName: 'main.py',
  compile: { cmd: [] }, // Python is interpreted; no compile phase
  run: { cmd: ['python', '/workspace/main.py'] },
  stdinSupported: true,
  limits: PYTHON_LIMITS,
};

export const PROFILES: Record<string, RuntimeProfile> = {
  'c-stable': C_STABLE,
  'cpp-stable': CPP_STABLE,
  'rust-stable': RUST_STABLE,
  'python-stable': PYTHON_STABLE,
};

export function getProfile(profileId: string): RuntimeProfile {
  const profile = PROFILES[profileId];
  if (!profile) {
    throw new Error(`Unknown runtime profile: ${profileId}`);
  }
  return profile;
}

export function isProfileAllowed(profileId: string): boolean {
  return profileId in PROFILES;
}
