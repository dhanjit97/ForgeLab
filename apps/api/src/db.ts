// @forgelab/api/db — PostgreSQL connection pool.
//
// Parameterized access only; never concatenate user input into SQL
// (ARCHITECTURE.md §2, AGENTS.md coding rules).

import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});

pool.on('connect', () => {
  // no-op; kept for potential future telemetry hook
});

pool.on('error', (err: Error) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  try {
    return await pool.query(text, params);
  } finally {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.log(`[slow query] ${duration}ms ${text}`);
    }
  }
}

export async function closePool() {
  await pool.end();
}
