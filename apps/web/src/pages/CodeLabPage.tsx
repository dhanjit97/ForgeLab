import { useState, useEffect, useRef } from 'react';
import { ExecutionStatus } from '@forgelab/shared';

const LANGUAGES = [
  { key: 'c', label: 'C', profile: 'c-stable' },
  { key: 'cpp', label: 'C++', profile: 'cpp-stable' },
  { key: 'rust', label: 'Rust', profile: 'rust-stable' },
  { key: 'python', label: 'Python', profile: 'python-stable' },
] as const;

const STARTER_CODE: Record<'c' | 'cpp' | 'rust' | 'python', string> = {
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, ForgeLab\\n");\n    return 0;\n}\n`,
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, ForgeLab!" << std::endl;\n    return 0;\n}\n`,
  rust: `fn main() {\n    println!("Hello, ForgeLab!");\n}\n`,
  python: `print("Hello, ForgeLab!")\n`,
};

type ExecutionResult = {
  id: string;
  status: ExecutionStatus;
  phase: 'compile' | 'run' | null;
  stdout: string;
  stderr: string;
  diagnostics: Array<{ phase: string; message: string; line?: number; column?: number }>;
  exitCode: number | null;
  durationMs: number;
  truncated: boolean;
};

const API_BASE = 'http://127.0.0.1:3001';

export function CodeLabPage() {
  const [language, setLanguage] = useState<'c' | 'cpp' | 'rust' | 'python'>('cpp');
  const [code, setCode] = useState(STARTER_CODE.cpp);
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const clearPoll = () => {
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearPoll();
    };
  }, []);

  const handleRun = async () => {
    setError(null);
    setResult(null);
    setIsRunning(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/executions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          runtimeProfile: LANGUAGES.find((l) => l.key === language)!.profile,
          files: [{ name: getFileName(language), content: code }],
          stdin,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `Request failed with status ${res.status}`);
      }

      const { id } = (await res.json()) as { id: string };

      // Poll for the result.
      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE}/api/v1/executions/${id}`);
          if (!statusRes.ok) {
            throw new Error(`Status request failed with status ${statusRes.status}`);
          }
          const job = (await statusRes.json()) as ExecutionResult;

          const terminal =
            job.status === 'succeeded' ||
            job.status === 'compile_error' ||
            job.status === 'runtime_error' ||
            job.status === 'timed_out' ||
            job.status === 'failed' ||
            job.status === 'cancelled' ||
            job.status === 'expired';

          if (terminal) {
            clearPoll();
            setResult(job);
            setIsRunning(false);
          }
        } catch {
          // Keep polling on transient errors; the worker may still be starting.
        }
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsRunning(false);
    }
  };

  const getFileName = (lang: string) => {
    const ext: Record<string, string> = {
      c: 'main.c',
      cpp: 'main.cpp',
      rust: 'main.rs',
      python: 'main.py',
    };
    return ext[lang] ?? 'main.cpp';
  };

  const profile = LANGUAGES.find((l) => l.key === language);

  return (
    <section className="page code-lab-page">
      <header className="page-header">
        <h1>Code Lab</h1>
        <p className="lead">
          Write, compile, and run code in a sandboxed environment. Execution runs in an isolated
          worker — your code never touches the API server.
        </p>
      </header>
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}
      <div className="code-lab">
        <aside className="controls">
          <div className="control-group">
            <label htmlFor="language-select">Language / runtime</label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value as 'c' | 'cpp' | 'rust' | 'python');
                setCode(STARTER_CODE[e.target.value as keyof typeof STARTER_CODE]);
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label} ({l.profile})
                </option>
              ))}
            </select>
            <p className="hint">Pinned profile: {profile?.profile}</p>
          </div>
          <div className="control-group">
            <label htmlFor="stdin">stdin (optional)</label>
            <textarea
              id="stdin"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              rows={4}
              placeholder="Standard input..."
            />
          </div>
          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={handleRun}
              disabled={isRunning}
              aria-busy={isRunning}
            >
              {isRunning ? 'Running…' : 'Run'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setCode(STARTER_CODE[language]);
                setResult(null);
                setError(null);
                setIsRunning(false);
                clearPoll();
              }}
            >
              Reset
            </button>
          </div>
        </aside>
        <div className="editor-wrapper">
          <textarea
            className="editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            placeholder="Start typing code…"
          />
          <p className="editor-hint">
            Monaco Editor is lazy-loaded on Code Lab routes in the full build.
          </p>
        </div>
        <div className="output-panel">
          <h3>Output</h3>
          {result ? (
            <div className={`result status-${result.status}`}>
              <div className="result-meta">
                <span className="status-badge">{result.status}</span>
                <span>{result.durationMs} ms</span>
                <span>exit {result.exitCode}</span>
              </div>
              {result.stdout && (
                <div>
                  <h4>stdout</h4>
                  <pre>{result.stdout}</pre>
                </div>
              )}
              {result.stderr && (
                <div>
                  <h4>stderr</h4>
                  <pre className="stderr">{result.stderr}</pre>
                </div>
              )}
              {result.diagnostics.length > 0 && (
                <div>
                  <h4>Diagnostics</h4>
                  <ul>
                    {result.diagnostics.map((d, i) => (
                      <li key={i}>
                        {d.phase}: {d.message}
                        {d.line != null ? ` (line ${d.line})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">Run your code to see output here.</div>
          )}
        </div>
      </div>
    </section>
  );
}
