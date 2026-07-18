/**
 * Guarded Supabase CLI operations against the hosted Fablesol project.
 * No Docker, no local stack — every operation targets the linked remote.
 *
 *   node scripts/admin/remote-db.mjs verify    Target check only
 *   node scripts/admin/remote-db.mjs list      List remote migrations
 *   node scripts/admin/remote-db.mjs dry-run   Show what a push would apply
 *   node scripts/admin/remote-db.mjs push      Apply migrations (gated)
 *   node scripts/admin/remote-db.mjs lint      Lint public+private schemas
 *
 * `push` additionally requires SUPABASE_REMOTE_WRITES_APPROVED=true.
 */

import { spawn } from 'node:child_process';
import process from 'node:process';

import { REPO_ROOT, printSummary, verifyFablesolTarget } from './guard.mjs';

const OPERATIONS = ['verify', 'list', 'dry-run', 'push', 'lint'];
const operation = process.argv[2];

const argumentsByOperation = {
  list: ['migration', 'list', '--linked'],
  'dry-run': ['db', 'push', '--linked', '--dry-run'],
  push: ['db', 'push', '--linked'],
  lint: [
    'db',
    'lint',
    '--linked',
    '--schema',
    'public,private',
    '--level',
    'warning',
    '--fail-on',
    'warning',
  ],
};

async function main() {
  if (operation === undefined || !OPERATIONS.includes(operation)) {
    throw new Error(`Expected one of: ${OPERATIONS.join(', ')}`);
  }

  const summary = verifyFablesolTarget();
  printSummary(summary, { operation });

  if (operation === 'verify') return;

  if (!summary.linked) {
    throw new Error(
      'The Supabase CLI is not linked. Run the documented `npx supabase link --project-ref <fablesol-ref>` first.',
    );
  }

  if (operation === 'push' && !summary.remoteWritesApproved) {
    throw new Error(
      'Remote writes are not approved. Set SUPABASE_REMOTE_WRITES_APPROVED=true in .env.local for this session, then retry.',
    );
  }

  await new Promise((resolve, reject) => {
    const child = spawn('npx', ['supabase', ...argumentsByOperation[operation]], {
      cwd: REPO_ROOT,
      env: process.env,
      stdio: 'inherit',
    });
    child.once('error', (error) => {
      reject(new Error(`Unable to start the Supabase CLI: ${error.message}`));
    });
    child.once('exit', (code, signal) => {
      if (signal === null && code === 0) resolve(undefined);
      else reject(new Error('Supabase CLI operation failed'));
    });
  });
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Operation failed'}\n`);
  process.exitCode = 1;
});
