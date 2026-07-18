import { describe, expect, it } from 'vitest';

import {
  activeAdminNavigationHref,
  groupAdminNavigationItems,
  isAdminNavigationItemActive,
  readSidebarCollapsePreference,
  resolveInitialSidebarCollapsed,
  writeSidebarCollapsePreference,
  type AdminNavigationItem,
} from './navigation-state';

const items: readonly AdminNavigationItem[] = [
  { href: '/dashboard', label: 'Dashboard', group: 'Operations', exact: true },
  { href: '/announcements', label: 'Announcements', group: 'Operations' },
  { href: '/team', label: 'Team', group: 'Administration' },
];

describe('navigation activity', () => {
  it('honors exact matches', () => {
    const dashboard = items[0] as AdminNavigationItem;
    expect(isAdminNavigationItemActive('/dashboard', dashboard)).toBe(true);
    expect(isAdminNavigationItemActive('/dashboard/deep', dashboard)).toBe(false);
  });

  it('matches nested paths for non-exact items', () => {
    const announcements = items[1] as AdminNavigationItem;
    expect(isAdminNavigationItemActive('/announcements', announcements)).toBe(true);
    expect(isAdminNavigationItemActive('/announcements?edit=1', announcements)).toBe(false);
    expect(isAdminNavigationItemActive('/announcements/nested', announcements)).toBe(true);
  });

  it('resolves the longest matching href', () => {
    expect(activeAdminNavigationHref('/team', items)).toBe('/team');
    expect(activeAdminNavigationHref('/nowhere', items)).toBeUndefined();
  });
});

describe('navigation grouping', () => {
  it('keeps the preferred group order and defaults unknown groups', () => {
    const groups = groupAdminNavigationItems([
      { href: '/x', label: 'X', group: 'Zed' },
      ...items,
      { href: '/y', label: 'Y' },
    ]);
    expect(groups.map((group) => group.label)).toEqual(['Operations', 'Administration', 'Zed']);
    const operations = groups[0];
    expect(operations?.items.map((item) => item.label)).toContain('Y');
  });
});

describe('sidebar collapse persistence', () => {
  function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> & { store: Map<string, string> } {
    const store = new Map<string, string>();
    return {
      store,
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => void store.set(key, value),
    };
  }

  it('round-trips the preference and survives broken storage', () => {
    const storage = memoryStorage();
    writeSidebarCollapsePreference(storage, true);
    expect(readSidebarCollapsePreference(storage)).toBe(true);
    expect(resolveInitialSidebarCollapsed(false, storage)).toBe(true);
    expect(resolveInitialSidebarCollapsed(true, null)).toBe(true);

    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readSidebarCollapsePreference(throwing)).toBeNull();
    expect(() => writeSidebarCollapsePreference(throwing, true)).not.toThrow();
  });
});
