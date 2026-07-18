import { describe, expect, it } from 'vitest';

import type { AdminNavigationItem } from '@/components/navigation-state';
import { resolveAdminPageChrome, resolveAdminRouteMeta } from './route-meta';

const navigation: readonly AdminNavigationItem[] = [
  { href: '/dashboard', label: 'Dashboard', group: 'Operations', exact: true },
  { href: '/team', label: 'Team', group: 'Administration' },
];

describe('resolveAdminRouteMeta', () => {
  it('resolves registered routes and returns undefined for unknown paths', () => {
    expect(resolveAdminRouteMeta('/team')?.title).toBe('Team');
    expect(resolveAdminRouteMeta('/nope')).toBeUndefined();
  });
});

describe('resolveAdminPageChrome', () => {
  it('builds group + current breadcrumbs', () => {
    const chrome = resolveAdminPageChrome('/team', navigation);
    expect(chrome.title).toBe('Team');
    expect(chrome.breadcrumbs.map((crumb) => crumb.label)).toEqual(['Administration', 'Team']);
    expect(chrome.activeNavigationHref).toBe('/team');
  });

  it('falls back gracefully for unregistered paths', () => {
    const chrome = resolveAdminPageChrome('/mystery', navigation);
    expect(chrome.title).toBe('Administration');
    expect(chrome.activeNavigationHref).toBeUndefined();
  });
});
