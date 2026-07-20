import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { ADMIN_PERMISSION_KEYS, ADMIN_ROLE_KEYS, ADMIN_ROLE_NAMES } from './catalog';

/**
 * Contract test: the TypeScript catalog must stay in lockstep with the seeded
 * system catalog migration. The database is authoritative; this fails loudly
 * if either side drifts.
 */
const migrationSql = [
  '20260718131000_admin_authorization_catalog.sql',
  '20260719122000_player_catalog.sql',
]
  .map((file) =>
    readFileSync(path.resolve(__dirname, '../../../../../supabase/migrations/', file), 'utf8'),
  )
  .join('\n');

describe('admin catalog contract', () => {
  it('matches the seven seeded system roles', () => {
    const seededRoles = [
      ...migrationSql.matchAll(/^\s{2}\('([a-z_]+)', '[^']+', '[^']+', true\),?$/gmu),
    ].map((match) => match[1]);

    expect(seededRoles).toHaveLength(7);
    expect([...ADMIN_ROLE_KEYS].sort()).toEqual([...seededRoles].sort());
  });

  it('matches the seeded permission keys exactly', () => {
    const seededPermissions = [
      ...migrationSql.matchAll(/^\s{2}\('([a-z_.]+\.[a-z_.]+)', '[^']+', '[^']+', '[a-z_]+',/gmu),
    ].map((match) => match[1]);

    expect(seededPermissions.length).toBeGreaterThan(20);
    expect([...ADMIN_PERMISSION_KEYS].sort()).toEqual([...seededPermissions].sort());
  });

  it('names every role', () => {
    for (const key of ADMIN_ROLE_KEYS) {
      expect(ADMIN_ROLE_NAMES[key]).toBeTruthy();
    }
  });

  it('grants every mapped permission key that exists in the catalog', () => {
    const mappedKeys = [...migrationSql.matchAll(/^\s+\('([a-z_]+)', '([a-z_.]+)'\),?$/gmu)].map(
      (match) => ({ role: match[1], permission: match[2] }),
    );

    expect(mappedKeys.length).toBeGreaterThan(30);
    for (const mapping of mappedKeys) {
      expect(ADMIN_ROLE_KEYS).toContain(mapping.role);
      expect(ADMIN_PERMISSION_KEYS).toContain(mapping.permission);
    }
  });
});
