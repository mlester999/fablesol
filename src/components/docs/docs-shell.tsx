import Link from 'next/link';
import {
  DOCUMENTATION_PAGES,
  DOCUMENTATION_SECTIONS,
  getDocumentationNeighbors,
  getRelatedDocumentationPages,
} from '@/content/docs/pages';
import { createArticleStructuredData, serializeStructuredData } from '@/content/docs/metadata';
import { DOCUMENTATION_REVISION } from '@/content/game/brand';
import { FAQ_ITEMS } from '@/content/game/faq';
import type { DocumentationPage } from '@/content/docs/types';
import { DocBlocks } from './doc-blocks';
import { DocsMobileNav } from './docs-mobile-nav';
import { DocsTableOfContents } from './docs-table-of-contents';
import { AvailabilityBadge } from '@/components/site/availability-badge';
import { FaqAccordion } from '@/components/interactive/faq-accordion';
import { GlossaryList } from '@/components/interactive/glossary-list';

interface DocsShellProps {
  readonly page: DocumentationPage;
  readonly index?: boolean;
}

export function DocsShell({ page, index = false }: DocsShellProps) {
  const related = getRelatedDocumentationPages(page);
  const neighbors = index ? undefined : getDocumentationNeighbors(page);
  const crumbs = [
    { name: 'Home', route: '/' },
    { name: 'Documentation', route: '/docs' },
    ...(page.route === '/docs' ? [] : [{ name: page.title, route: page.route }]),
  ];

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, indexPosition) => ({
      '@type': 'ListItem',
      position: indexPosition + 1,
      name: crumb.name,
      item: crumb.route,
    })),
  };

  return (
    <div className="docs-layout">
      <aside className="docs-sidebar" aria-label="Documentation sidebar">
        <nav aria-label="Documentation guides">
          <div className="docs-nav-group">
            <Link href="/docs" aria-current={page.route === '/docs' ? 'page' : undefined}>
              Documentation home
            </Link>
            <Link href="/how-to-play">How to Play</Link>
          </div>
          {DOCUMENTATION_SECTIONS.map((section) => (
            <div className="docs-nav-group" key={section}>
              <strong>{section}</strong>
              {DOCUMENTATION_PAGES.filter((entry) => entry.section === section).map((entry) => (
                <Link
                  key={entry.route}
                  href={entry.route}
                  aria-current={page.route === entry.route ? 'page' : undefined}
                >
                  {entry.title}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="docs-main">
        <nav className="docs-breadcrumbs" aria-label="Breadcrumb">
          <ol>
            {crumbs.map((crumb, crumbIndex) => (
              <li key={crumb.route}>
                {crumbIndex === crumbs.length - 1 ? (
                  <span aria-current="page">{crumb.name}</span>
                ) : (
                  <Link href={crumb.route}>{crumb.name}</Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <DocsMobileNav />

        <article className="docs-article">
          <p className="docs-eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p className="docs-lead">{page.description}</p>
          <p className="docs-meta">
            Audience: {page.audience} · {DOCUMENTATION_REVISION} · Reviewed {page.lastReviewed}
          </p>
          {page.availability ? (
            <p className="docs-availability">
              <AvailabilityBadge feature={page.availability} showNote />
            </p>
          ) : null}

          {page.content.map((section) => (
            <section className="docs-section" id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.blocks ? <DocBlocks blocks={section.blocks} /> : null}
            </section>
          ))}

          {page.slug === 'faq' ? <FaqAccordion /> : null}
          {page.slug === 'glossary' ? <GlossaryList /> : null}

          {related.length > 0 ? (
            <section className="docs-section" aria-labelledby="related-heading">
              <h2 id="related-heading">Related guides</h2>
              <div className="docs-related-grid">
                {related.map((entry) => (
                  <Link href={entry.route} key={entry.route}>
                    <small>{entry.section}</small>
                    <strong>{entry.title}</strong>
                    <p>{entry.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {neighbors ? (
            <nav className="docs-neighbors" aria-label="Previous and next guides">
              {neighbors.previous ? (
                <Link href={neighbors.previous.route} rel="prev">
                  <small>Previous</small>
                  <strong>← {neighbors.previous.title}</strong>
                </Link>
              ) : (
                <span />
              )}
              {neighbors.next ? (
                <Link href={neighbors.next.route} rel="next">
                  <small>Next</small>
                  <strong>{neighbors.next.title} →</strong>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </article>
      </div>

      <aside className="docs-toc" aria-label="On this page">
        <DocsTableOfContents
          items={page.content.map((section) => ({ id: section.id, title: section.title }))}
        />
      </aside>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeStructuredData(createArticleStructuredData(page)),
        }}
      />
      {page.slug === 'faq' ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeStructuredData({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQ_ITEMS.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              })),
            }),
          }}
        />
      ) : null}
    </div>
  );
}
