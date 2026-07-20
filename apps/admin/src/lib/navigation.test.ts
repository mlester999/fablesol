import { describe, expect, it } from 'vitest';

import { ADMIN_PERMISSION_KEYS } from './auth/catalog';
import type { AdminAuthorizationContext } from './auth/types';
import { ADMIN_MODULES, resolveAdminNavigation } from './navigation';

function contextWith(
  permissionKeys: AdminAuthorizationContext['permissionKeys'],
): AdminAuthorizationContext {
  return {
    userId: '00000000-0000-4000-8000-000000000000',
    fullName: 'Test Admin',
    email: 'admin@example.com',
    roleKey: 'read_only_analyst',
    roleName: 'Read-only Analyst',
    permissionKeys,
  };
}

describe('resolveAdminNavigation', () => {
  it('shows every module to a full-permission context', () => {
    const navigation = resolveAdminNavigation(contextWith([...ADMIN_PERMISSION_KEYS]));
    expect(navigation).toHaveLength(ADMIN_MODULES.length);
  });

  it('hides modules the context cannot view', () => {
    const navigation = resolveAdminNavigation(
      contextWith(['dashboard.view', 'announcements.view']),
    );
    expect(navigation.map((item) => item.href)).toEqual(['/dashboard', '/announcements']);
  });

  it('shows nothing without permissions', () => {
    expect(resolveAdminNavigation(contextWith([]))).toHaveLength(0);
  });

  it('gates the team module behind admins.view specifically', () => {
    const navigation = resolveAdminNavigation(contextWith(['admins.view']));
    expect(navigation.map((item) => item.href)).toEqual(['/team']);
  });
});
