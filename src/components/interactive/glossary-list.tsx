'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GLOSSARY } from '@/content/game/glossary';

export function GlossaryList() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter(
      (term) => term.term.toLowerCase().includes(q) || term.definition.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <section className="docs-section" aria-labelledby="glossary-interactive-heading">
      <h2 id="glossary-interactive-heading">Searchable glossary</h2>
      <div className="field">
        <label htmlFor="glossary-filter">Filter terms</label>
        <input
          id="glossary-filter"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Battle Power, COPPER, UTC…"
        />
      </div>
      <p className="live-region" aria-live="polite">
        {filtered.length} term{filtered.length === 1 ? '' : 's'}
      </p>
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {filtered.map((term) => (
          <article className="panel" id={term.id} key={term.id}>
            <h3>{term.term}</h3>
            <p>{term.definition}</p>
            {term.relatedRoutes?.length ? (
              <p>
                {term.relatedRoutes.map((route, index) => (
                  <span key={route}>
                    {index > 0 ? ' · ' : ''}
                    <Link href={route}>{route}</Link>
                  </span>
                ))}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
