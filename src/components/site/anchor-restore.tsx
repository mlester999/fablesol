'use client';

import { useEffect } from 'react';

/**
 * Guide pages lazy-load interactive widgets that are taller than their
 * loading placeholders, so content above an anchor target can grow after
 * the browser has already jumped to the hash and push the heading out of
 * view. Once hydration and the first widget mounts settle, re-anchor to
 * the hash; scroll-padding-top on the root keeps the landing below the
 * sticky header.
 */
export function AnchorRestore() {
  useEffect(() => {
    const { hash } = window.location;
    if (!hash) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    }, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
