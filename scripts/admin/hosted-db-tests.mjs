/**
 * Read-only hosted smoke tests for the Phase 2A admin schema.
 * Gated by RUN_HOSTED_SUPABASE_TESTS=true; uses only the anon key and never
 * writes. TAP-style output.
 *
 *   RUN_HOSTED_SUPABASE_TESTS=true npm run db:test:hosted
 */

import process from 'node:process';

import { loadEnvironment, printSummary, verifyFablesolTarget } from './guard.mjs';

const results = [];

function record(name, passed, detail) {
  results.push({ name, passed, detail });
  process.stdout.write(`${passed ? 'ok' : 'not ok'} ${results.length} - ${name}\n`);
  if (!passed && detail) process.stdout.write(`# ${detail}\n`);
}

async function main() {
  const environment = loadEnvironment();
  const summary = verifyFablesolTarget(environment);
  printSummary(summary, { suite: 'hosted-read-only-smoke' });

  if (!summary.hostedTestsApproved) {
    throw new Error(
      'Hosted tests are not approved. Set RUN_HOSTED_SUPABASE_TESTS=true for this session, then retry.',
    );
  }

  const url = environment.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = environment.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
  }

  const { createClient } = await import('@supabase/supabase-js');
  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Public read functions fail safe and are anon-callable.
  const maintenance = await anon.rpc('get_public_maintenance');
  record(
    'get_public_maintenance returns an object with an active flag',
    !maintenance.error &&
      typeof maintenance.data === 'object' &&
      maintenance.data !== null &&
      typeof maintenance.data.active === 'boolean',
    maintenance.error?.message,
  );

  const announcements = await anon.rpc('get_public_announcements');
  record(
    'get_public_announcements returns an array',
    !announcements.error && Array.isArray(announcements.data),
    announcements.error?.message,
  );

  const features = await anon.rpc('get_public_feature_availability');
  record(
    'get_public_feature_availability returns an object',
    !features.error && typeof features.data === 'object' && features.data !== null,
    features.error?.message,
  );

  const settings = await anon.rpc('get_public_game_settings');
  record(
    'get_public_game_settings returns an object',
    !settings.error && typeof settings.data === 'object' && settings.data !== null,
    settings.error?.message,
  );

  // RLS lockdown: anon can never read administrator tables.
  for (const table of ['admin_members', 'admin_roles', 'admin_invitations', 'admin_audit_log']) {
    const read = await anon.from(table).select('*').limit(1);
    record(
      `anon cannot read ${table}`,
      read.error !== null || (read.data ?? []).length === 0,
      read.error === null ? 'unexpected rows returned' : undefined,
    );
  }

  // Invitation opener is anon-callable but fails safe on unknown tokens.
  const unknownToken = await anon.rpc('open_admin_invitation', {
    p_token_hash: 'f'.repeat(64),
  });
  record(
    'open_admin_invitation rejects an unknown token',
    !unknownToken.error && unknownToken.data?.status === 'invalid',
    unknownToken.error?.message,
  );

  const failed = results.filter((result) => !result.passed).length;
  process.stdout.write(`1..${results.length}\n# ${results.length - failed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Hosted tests failed'}\n`);
  process.exitCode = 1;
});
