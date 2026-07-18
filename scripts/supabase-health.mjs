#!/usr/bin/env node
/**
 * Internal hosted-Supabase connectivity check (no Docker involved).
 *
 * Usage:  npm run supabase:health
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from the
 * process environment or .env.local, then pings the hosted project's auth
 * health endpoint. Never prints key values.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, '');
    }
  } catch {
    // .env.local is optional
  }
}

loadDotEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.log('Supabase is not configured yet.');
  console.log('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  console.log('(see .env.example). Public pages work without them in Phase 1.');
  process.exit(0);
}

const started = Date.now();
try {
  const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
    headers: { apikey: anonKey },
    signal: AbortSignal.timeout(8000),
  });
  const latency = Date.now() - started;
  if (response.ok) {
    console.log(`Hosted Supabase reachable (HTTP ${response.status}, ${latency}ms).`);
    process.exit(0);
  }
  console.error(`Hosted Supabase responded with HTTP ${response.status} after ${latency}ms.`);
  process.exit(1);
} catch (error) {
  console.error(`Could not reach hosted Supabase: ${error?.message ?? error}`);
  process.exit(1);
}
