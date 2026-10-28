#!/usr/bin/env tsx
/**
 * migrate.ts — ForgeLab database migration runner.
 *
 * Executes every .sql file in apps/api/migrations/ in filename order against
 * the DATABASE_URL database. Intended for local/dev use and CI schema checks.
 * Migrations are committed to version control per ARCHITECTURE.md §2.
 *
 * Usage: DATABASE_URL=... npm run db:migrate
 */

import { pool } from './db';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

async function main() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    await pool.end();
    return;
  }

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    await pool.query(sql);
    console.log(`Applied migration: ${file}`);
  }

  console.log(`Migrations complete: ${files.length} file(s) applied.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
