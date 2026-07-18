/**
 * Fablesol hosted-Supabase safety guard.
 *
 * Every remote command verifies the target project before doing anything:
 *  - SUPABASE_PROJECT_REF must be configured and must match the
 *    NEXT_PUBLIC_SUPABASE_URL hostname.
 *  - The SHA-256 fingerprint of the ref must NOT match the Starville
 *    reference project (deny-listed below), so no Fablesol command can ever
 *    run against Starville.
 *  - When the Supabase CLI is linked (supabase/.temp/project-ref), the linked
 *    ref must match the configured ref.
 *
 * Writes stay opt-in through explicit environment gates:
 *  - SUPABASE_REMOTE_WRITES_APPROVED=true  → migration push
 *  - RUN_HOSTED_SUPABASE_TESTS=true        → hosted read-only smoke tests
 *  - ADMIN_BOOTSTRAP_ENABLED=true          → Super Admin bootstrap apply
 *
 * No secrets are ever printed; project refs are masked in output.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** SHA-256 of the Starville project ref. Fablesol commands refuse this target. */
const STARVILLE_DENY_FINGERPRINT =
  'be4e7b84d3b35c39f9cbb688cdf5b0bc694a1b0a9f122fb634e957b2ba5dce73';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function parseEnvFile(filePath) {
  const values = {};
  if (!existsSync(filePath)) return values;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

/** Root .env.local merged under real environment variables (env wins). */
export function loadEnvironment() {
  return { ...parseEnvFile(path.join(REPO_ROOT, '.env.local')), ...process.env };
}

export function fingerprint(value) {
  return createHash('sha256').update(value).digest('hex');
}

function maskRef(ref) {
  return ref.length <= 4 ? '****' : `${ref.slice(0, 4)}…${ref.slice(-2)}`;
}

/**
 * Verifies the configured hosted target and returns a safe, non-secret
 * summary plus the gate states. Throws with a clear message on any mismatch.
 */
export function verifyFablesolTarget(environment = loadEnvironment()) {
  const projectRef = (environment.SUPABASE_PROJECT_REF ?? '').trim();
  const supabaseUrl = (environment.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();

  if (projectRef === '') {
    throw new Error('SUPABASE_PROJECT_REF is not configured in .env.local');
  }
  if (!/^[a-z0-9]{16,24}$/.test(projectRef)) {
    throw new Error('SUPABASE_PROJECT_REF does not look like a Supabase project ref');
  }

  const refFingerprint = fingerprint(projectRef);
  if (refFingerprint === STARVILLE_DENY_FINGERPRINT) {
    throw new Error(
      'REFUSED: the configured project is the Starville reference project. ' +
        'Fablesol commands never run against Starville.',
    );
  }

  if (supabaseUrl !== '') {
    let hostname;
    try {
      hostname = new URL(supabaseUrl).hostname;
    } catch {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
    }
    if (!hostname.startsWith(`${projectRef}.`)) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL does not belong to SUPABASE_PROJECT_REF; refusing to continue',
      );
    }
  }

  const linkedRefPath = path.join(REPO_ROOT, 'supabase', '.temp', 'project-ref');
  let linked = false;
  if (existsSync(linkedRefPath)) {
    const linkedRef = readFileSync(linkedRefPath, 'utf8').trim();
    if (linkedRef !== projectRef) {
      throw new Error(
        'The Supabase CLI is linked to a different project than SUPABASE_PROJECT_REF. ' +
          'Re-run the documented `supabase link` command for the Fablesol project.',
      );
    }
    linked = true;
  }

  return {
    projectRefMasked: maskRef(projectRef),
    projectRefFingerprint: refFingerprint,
    linked,
    remoteWritesApproved: environment.SUPABASE_REMOTE_WRITES_APPROVED === 'true',
    hostedTestsApproved: environment.RUN_HOSTED_SUPABASE_TESTS === 'true',
    bootstrapEnabled: environment.ADMIN_BOOTSTRAP_ENABLED === 'true',
  };
}

export function printSummary(summary, extra = {}) {
  process.stdout.write(`${JSON.stringify({ ...summary, ...extra })}\n`);
}
