import type { AdminNavigationItem } from '@/components/navigation-state';
import {
  activeAdminNavigationHref,
  isAdminNavigationItemActive,
} from '@/components/navigation-state';

export interface AdminRouteMeta {
  readonly title: string;
  readonly description?: string;
  readonly breadcrumbGroup?: string;
  readonly breadcrumbParent?: string;
  readonly parentHref?: string;
}

export const ADMIN_ROUTE_METADATA: readonly {
  readonly path: string;
  readonly exact?: boolean;
  readonly meta: AdminRouteMeta;
}[] = [
  {
    path: '/dashboard',
    exact: true,
    meta: {
      title: 'Dashboard',
      description: 'Access summary and platform status for authorized administrators.',
      breadcrumbGroup: 'Operations',
    },
  },
  {
    path: '/players',
    exact: true,
    meta: {
      title: 'Players',
      description: 'Player directory: profiles, wallet links, and $FABLE access state.',
      breadcrumbGroup: 'Operations',
    },
  },
  {
    path: '/players',
    meta: {
      title: 'Player detail',
      description: 'Profile facts, wallet history, access history, and security events.',
      breadcrumbGroup: 'Operations',
      breadcrumbParent: 'Players',
      parentHref: '/players',
    },
  },
  {
    path: '/announcements',
    meta: {
      title: 'Announcements',
      description: 'Draft, publish, and cancel public announcements.',
      breadcrumbGroup: 'Operations',
    },
  },
  {
    path: '/maintenance',
    meta: {
      title: 'Maintenance',
      description: 'Versioned maintenance configuration with draft and publish control.',
      breadcrumbGroup: 'Operations',
    },
  },
  {
    path: '/features',
    meta: {
      title: 'Feature availability',
      description: 'Versioned availability overrides for the public feature registry.',
      breadcrumbGroup: 'Operations',
    },
  },
  {
    path: '/settings',
    meta: {
      title: 'Game settings',
      description: 'Versioned presentation settings. Display-only in Phase 2A.',
      breadcrumbGroup: 'Configuration',
    },
  },
  {
    path: '/team',
    meta: {
      title: 'Team',
      description: 'Administrator accounts, roles, and invitations.',
      breadcrumbGroup: 'Administration',
    },
  },
  {
    path: '/audit',
    meta: {
      title: 'Audit log',
      description: 'Append-only administrative audit history.',
      breadcrumbGroup: 'Administration',
    },
  },
] as const;

export interface AdminBreadcrumb {
  readonly label: string;
  readonly href?: string;
}

export interface ResolvedAdminPageChrome {
  readonly title: string;
  readonly description?: string | undefined;
  readonly breadcrumbs: readonly AdminBreadcrumb[];
  readonly activeNavigationHref?: string | undefined;
}

function matchesRoute(pathname: string, path: string, exact: boolean | undefined): boolean {
  if (exact === true) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function resolveAdminRouteMeta(pathname: string): AdminRouteMeta | undefined {
  // Longest registered path wins so nested routes beat their parents.
  const matches = ADMIN_ROUTE_METADATA.filter(({ path, exact }) =>
    matchesRoute(pathname, path, exact),
  ).sort((first, second) => second.path.length - first.path.length);
  return matches[0]?.meta;
}

export function resolveAdminPageChrome(
  pathname: string,
  navigation: readonly AdminNavigationItem[],
): ResolvedAdminPageChrome {
  const activeNavigationHref = activeAdminNavigationHref(pathname, navigation);
  const activeItem = navigation.find((item) => item.href === activeNavigationHref);
  const meta = resolveAdminRouteMeta(pathname);

  const title = meta?.title ?? activeItem?.label ?? 'Administration';
  const description = meta?.description;
  const breadcrumbs: AdminBreadcrumb[] = [];

  const groupLabel =
    meta?.breadcrumbGroup ??
    activeItem?.group ??
    (activeItem === undefined ? undefined : 'Operations');

  if (groupLabel !== undefined) {
    breadcrumbs.push({ label: groupLabel });
  }

  const parentHref = meta?.parentHref;
  const parentLabel = meta?.breadcrumbParent;
  if (parentHref !== undefined && parentLabel !== undefined) {
    const parentVisible =
      navigation.some((item) => item.href === parentHref) ||
      navigation.some((item) => isAdminNavigationItemActive(parentHref, item));
    if (parentVisible) {
      breadcrumbs.push({ label: parentLabel, href: parentHref });
    }
  }

  const currentLabel =
    meta !== undefined && meta.title !== activeItem?.label
      ? meta.title
      : (activeItem?.label ?? title);
  if (breadcrumbs.length > 0 || meta !== undefined || activeItem !== undefined) {
    breadcrumbs.push({ label: currentLabel });
  }

  return {
    title: activeItem !== undefined && meta === undefined ? activeItem.label : title,
    description,
    breadcrumbs,
    activeNavigationHref,
  };
}
