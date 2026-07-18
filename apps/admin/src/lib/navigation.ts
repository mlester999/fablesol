import type { AdminNavigationItem } from '@/components/navigation-state';
import type { AdminPermissionKey } from './auth/catalog';
import type { AdminAuthorizationContext } from './auth/types';

interface AdminModuleDefinition {
  readonly item: AdminNavigationItem;
  readonly requiredPermission: AdminPermissionKey;
}

/**
 * Phase 2A module registry. A module appears in navigation only when the
 * signed-in administrator holds its view permission; the server re-checks the
 * same permission on every page and action regardless of what is visible.
 */
export const ADMIN_MODULES: readonly AdminModuleDefinition[] = [
  {
    item: { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', group: 'Operations', exact: true },
    requiredPermission: 'dashboard.view',
  },
  {
    item: { href: '/announcements', label: 'Announcements', icon: 'announcements', group: 'Operations' },
    requiredPermission: 'announcements.view',
  },
  {
    item: { href: '/maintenance', label: 'Maintenance', icon: 'maintenance', group: 'Operations' },
    requiredPermission: 'maintenance.view',
  },
  {
    item: { href: '/features', label: 'Feature availability', icon: 'features', group: 'Operations' },
    requiredPermission: 'features.view',
  },
  {
    item: { href: '/settings', label: 'Game settings', icon: 'settings', group: 'Configuration' },
    requiredPermission: 'settings.view',
  },
  {
    item: { href: '/team', label: 'Team', icon: 'team', group: 'Administration' },
    requiredPermission: 'admins.view',
  },
  {
    item: { href: '/audit', label: 'Audit log', icon: 'audit', group: 'Administration' },
    requiredPermission: 'audit.view',
  },
];

export function resolveAdminNavigation(
  context: AdminAuthorizationContext,
): readonly AdminNavigationItem[] {
  return ADMIN_MODULES.filter((module) =>
    context.permissionKeys.includes(module.requiredPermission),
  ).map((module) => module.item);
}
