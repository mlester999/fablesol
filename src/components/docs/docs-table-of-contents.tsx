'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  readonly id: string;
  readonly title: string;
}

export function DocsTableOfContents({ items }: { readonly items: readonly TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    if (items.length === 0) return;
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id;
        if (top) setActive(top);
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.4, 0.8] },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div>
      <p className="docs-eyebrow">On this page</p>
      <nav aria-label="Table of contents">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={active === item.id ? 'location' : undefined}
          >
            {item.title}
          </a>
        ))}
      </nav>
    </div>
  );
}
