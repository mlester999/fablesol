'use client';

import { FAQ_ITEMS } from '@/content/game/faq';
import Link from 'next/link';

export function FaqAccordion() {
  return (
    <section className="docs-section" aria-labelledby="faq-interactive-heading">
      <h2 id="faq-interactive-heading">Interactive FAQ</h2>
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {FAQ_ITEMS.map((item) => (
          <details key={item.id} id={item.id} className="panel">
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{item.question}</summary>
            <p style={{ marginTop: '0.75rem' }}>{item.answer}</p>
            {item.relatedRoutes?.length ? (
              <p>
                Related:{' '}
                {item.relatedRoutes.map((route, index) => (
                  <span key={route}>
                    {index > 0 ? ', ' : ''}
                    <Link href={route}>{route}</Link>
                  </span>
                ))}
              </p>
            ) : null}
          </details>
        ))}
      </div>
    </section>
  );
}
