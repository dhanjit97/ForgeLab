import { describe, it, expect } from 'vitest';
import { dockerHostConfig, dockerCreateConfig, CPP_DEFAULT_LIMITS } from './limits';

type DockerCfg = Record<string, unknown>;

describe('dockerHostConfig', () => {
  it('enforces no network, all capabilities dropped', () => {
    const cfg: DockerCfg = dockerHostConfig(CPP_DEFAULT_LIMITS);
    expect(cfg['NetworkMode']).toBe('none');
    expect(cfg['CapDrop']).toEqual(['ALL']);
    expect(cfg['CapAdd']).toEqual([]);
    expect(cfg['OomKillDisable']).toBe(false);
  });

  it('maps memory and cpu limits', () => {
    const cfg: DockerCfg = dockerHostConfig(CPP_DEFAULT_LIMITS);
    expect(cfg['Memory']).toBe(256 * 1024 * 1024);
    expect(cfg['MemorySwap']).toBe(256 * 1024 * 1024);
    expect(cfg['CpuPeriod']).toBe(100_000);
    expect(cfg['CpuQuota']).toBe(100_000); // 1.0 CPU
    expect(cfg['PidsLimit']).toBe(32);
  });

  it('creates a bounded nosuid exec tmpfs workspace', () => {
    const cfg: DockerCfg = dockerHostConfig(CPP_DEFAULT_LIMITS);
    const tmpfs = cfg['Tmpfs'] as Record<string, string>;
    expect(tmpfs['/workspace']).toContain('rw');
    expect(tmpfs['/workspace']).toContain('nosuid');
    expect(tmpfs['/workspace']).toContain('exec');
    expect(tmpfs['/workspace']).toContain('size=64m');
  });

  it('scales cpu quota with cpuCpus', () => {
    const cfg: DockerCfg = dockerHostConfig({
      ...CPP_DEFAULT_LIMITS,
      cpuCpus: 0.5,
    });
    expect(cfg['CpuQuota']).toBe(50_000);
  });
});

describe('dockerCreateConfig', () => {
  it('uses non-root user and fixed workdir', () => {
    const cfg: DockerCfg = dockerCreateConfig(
      'gcc:13',
      ['g++', '-o', '/workspace/main', '/workspace/main.cpp'],
      '/workspace'
    );
    expect(cfg['Image']).toBe('gcc:13');
    expect(cfg['User']).toBe('1000:1000');
    expect(cfg['WorkingDir']).toBe('/workspace');
    expect(cfg['Tty']).toBe(false);
  });
});
