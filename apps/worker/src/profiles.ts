// @forgelab/worker/profiles — server-side runtime profile registry.
//
// Profiles map a profile ID to a pinned image and fixed server-side commands.
// The client submits only a profile ID — never an image name, shell command,
// or arbitrary compiler flags (EXECUTION_SECURITY.md §4).

import { ResourceLimits, CPP_DEFAULT_LIMITS } from './limits';

export interface CompileSpec {
  // Command (argv array) to compile the source.
  cmd: string[];
}

export interface RunSpec {
  // Command (argv array) to run the compiled binary.
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

const SOURCE_NAME = 'main.cpp';
const BINARY_NAME = 'main';

// Fixed server-side compile command for C++. The source filename is a profile
// constant — never user-supplied.
const compileCmd: string[] = [
  'g++',
  '-O2',
  '-Wall',
  '-o',
  `/workspace/${BINARY_NAME}`,
  `/workspace/${SOURCE_NAME}`,
];

// Fixed server-side run command.
const runCmd: string[] = [`/workspace/${BINARY_NAME}`];

export const CPP_STABLE: RuntimeProfile = {
  id: 'cpp-stable',
  language: 'cpp',
  image: 'gcc:13', // SPIKE: pinned by tag. Production pins by immutable digest (ADR-001).
  workdir: WORKDIR,
  sourceName: SOURCE_NAME,
  binaryName: BINARY_NAME,
  compile: { cmd: compileCmd },
  run: { cmd: runCmd },
  stdinSupported: true,
  limits: CPP_DEFAULT_LIMITS,
};

export const PROFILES: Record<string, RuntimeProfile> = {
  'cpp-stable': CPP_STABLE,
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
