import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Repository hygiene guard. Fails the suite when generated build output,
 * caches, database dumps, environment secrets, oversized generated files, or
 * Docker artifacts become tracked. Runs against `git ls-files`, so it checks
 * exactly what a commit would contain.
 */

const REPO_ROOT = join(__dirname, '..');

function trackedFiles(): readonly string[] {
  const output = execFileSync('git', ['ls-files'], { cwd: REPO_ROOT, encoding: 'utf8' });
  return output.split('\n').filter((line) => line.length > 0);
}

const FORBIDDEN_PATH_PATTERNS: readonly { readonly label: string; readonly pattern: RegExp }[] = [
  { label: 'Next.js build output (.next)', pattern: /(^|\/)\.next\// },
  { label: 'node_modules', pattern: /(^|\/)node_modules\// },
  { label: 'Turbo cache (.turbo)', pattern: /(^|\/)\.turbo\// },
  { label: 'Supabase CLI temp state', pattern: /(^|\/)supabase\/\.temp\// },
  { label: 'TypeScript build info', pattern: /\.tsbuildinfo$/ },
  { label: 'environment secrets (.env files)', pattern: /(^|\/)\.env(\.|$)(?!example)/ },
  { label: 'database dump', pattern: /\.(dump|sql\.gz|pgdump)$/ },
  { label: 'private key material', pattern: /\.(pem|key|p12|keystore)$/ },
  {
    label: 'Docker artifacts',
    pattern: /(^|\/)(Dockerfile|docker-compose[^/]*\.ya?ml|\.dockerignore)$/i,
  },
];

const MAXIMUM_TRACKED_FILE_BYTES = 5 * 1024 * 1024;

describe('repository hygiene', () => {
  const files = trackedFiles();

  for (const { label, pattern } of FORBIDDEN_PATH_PATTERNS) {
    it(`tracks no ${label}`, () => {
      const offenders = files.filter((file) => pattern.test(file));
      expect(offenders, `Tracked files must not include ${label}`).toEqual([]);
    });
  }

  it('tracks no oversized generated files', () => {
    const offenders = files.filter((file) => {
      try {
        return statSync(join(REPO_ROOT, file)).size > MAXIMUM_TRACKED_FILE_BYTES;
      } catch {
        return false;
      }
    });
    expect(offenders, 'Tracked files must stay under 5 MB').toEqual([]);
  });

  it('keeps local env files ignored', () => {
    const result = execFileSync('git', ['check-ignore', '.env.local', 'apps/admin/.env.local'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(result).toContain('.env.local');
    expect(result).toContain('apps/admin/.env.local');
  });
});
