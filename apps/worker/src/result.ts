// @forgelab/worker/result — structured execution result types.
//
// Every job returns a bounded, structured result. Raw output is truncated at
// the configured output byte limit; nothing unbounded is ever returned to the
// caller (EXECUTION_SECURITY.md §5–6).

export type ExecutionStatus =
  | 'succeeded'
  | 'compile_error'
  | 'runtime_error'
  | 'timed_out'
  | 'resource_limited'
  | 'cancelled'
  | 'failed'
  | 'expired';

export interface Diagnostic {
  phase: 'compile' | 'run';
  message: string;
  line?: number;
  column?: number;
}

export interface ResourceUsage {
  memoryPeakBytes?: number;
  cpuTimeMs?: number;
  exitSignal?: string;
}

export interface ExecutionResult {
  status: ExecutionStatus;
  phase: 'compile' | 'run' | null;
  stdout: string;
  stderr: string;
  diagnostics: Diagnostic[];
  exitCode: number | null;
  durationMs: number;
  truncated: boolean;
  resourceUsage?: ResourceUsage;
}

export function boundedOutput(
  output: string,
  maxBytes: number
): {
  value: string;
  truncated: boolean;
} {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(output);
  if (bytes.length <= maxBytes) {
    return { value: output, truncated: false };
  }
  const truncatedBytes = bytes.slice(0, maxBytes);
  return {
    value: new TextDecoder().decode(truncatedBytes),
    truncated: true,
  };
}

export function failedResult(
  phase: 'compile' | 'run',
  message: string,
  startMs: number
): ExecutionResult {
  return {
    status: phase === 'compile' ? 'compile_error' : 'runtime_error',
    phase,
    stdout: '',
    stderr: message,
    diagnostics: [{ phase, message }],
    exitCode: null,
    durationMs: Date.now() - startMs,
    truncated: false,
  };
}

export function workerFailureResult(message: string, startMs: number): ExecutionResult {
  return {
    status: 'failed',
    phase: null,
    stdout: '',
    stderr: message,
    diagnostics: [{ phase: 'compile', message }],
    exitCode: null,
    durationMs: Date.now() - startMs,
    truncated: false,
  };
}
