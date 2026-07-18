import { FAQ_ITEMS, GLOSSARY } from '@/content/game';
import { DOCUMENTATION_PAGES } from './pages';
import type { DocumentationSearchEntry } from './types';

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function createDocumentationSearchIndex(): readonly DocumentationSearchEntry[] {
  const entries: DocumentationSearchEntry[] = [];

  entries.push({
    id: 'how-to-play',
    title: 'How to Play',
    route: '/how-to-play',
    section: 'Player guide',
    category: 'How to Play',
    description: 'Interactive cinematic introduction to Fablesol systems.',
    excerpt:
      'Enter the world, care for animals, learn COPPER and $FABLE, meet your cat, and explore Cat Battle.',
    searchText: normalize(
      'how to play fablesol introduction first day animals copper fable cat dice cat battle tournaments',
    ),
  });

  entries.push({
    id: 'docs-home',
    title: 'Documentation home',
    route: '/docs',
    section: 'Player guide',
    category: 'Getting Started',
    description: 'Browse all Fablesol player guides by category.',
    excerpt: 'Structured documentation for progression, economy, cats, battles, and fair play.',
    searchText: normalize('documentation home docs index guides categories'),
  });

  for (const page of DOCUMENTATION_PAGES) {
    entries.push({
      id: page.slug,
      title: page.title,
      route: page.route,
      section: page.section,
      category: page.section,
      description: page.description,
      excerpt: page.content[0]?.paragraphs[0] ?? page.description,
      searchText: normalize(
        [
          page.title,
          page.description,
          page.eyebrow,
          page.section,
          ...page.keywords,
          ...page.content.flatMap((section) => [
            section.title,
            ...section.paragraphs,
            ...(section.blocks ?? []).flatMap((block) => {
              if (block.type === 'list') return block.items;
              if (block.type === 'callout') return [block.title, block.text];
              if (block.type === 'steps') return block.items.flatMap((i) => [i.title, i.text]);
              if (block.type === 'table') {
                return [block.caption, ...block.columns, ...block.rows.flat()];
              }
              return [];
            }),
          ]),
        ].join(' '),
      ),
    });

    for (const section of page.content) {
      entries.push({
        id: `${page.slug}#${section.id}`,
        title: page.title,
        route: `${page.route}#${section.id}`,
        section: page.section,
        category: page.section,
        description: page.description,
        heading: section.title,
        excerpt: section.paragraphs[0] ?? page.description,
        searchText: normalize(
          [page.title, section.title, ...section.paragraphs, ...page.keywords].join(' '),
        ),
      });
    }
  }

  for (const term of GLOSSARY) {
    entries.push({
      id: `glossary-${term.id}`,
      title: term.term,
      route: `/docs/glossary#${term.id}`,
      section: 'Glossary',
      category: 'Glossary',
      description: term.definition,
      heading: term.term,
      excerpt: term.definition,
      searchText: normalize(`${term.term} ${term.definition} glossary`),
    });
  }

  for (const item of FAQ_ITEMS) {
    entries.push({
      id: `faq-${item.id}`,
      title: item.question,
      route: `/docs/faq#${item.id}`,
      section: 'FAQ',
      category: 'FAQ',
      description: item.answer,
      heading: item.question,
      excerpt: item.answer,
      searchText: normalize(`${item.question} ${item.answer} faq`),
    });
  }

  return entries;
}

export function searchDocumentation(
  query: string,
  limit = 12,
): readonly DocumentationSearchEntry[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const tokens = q.split(' ').filter(Boolean);
  const index = createDocumentationSearchIndex();

  const scored = index
    .map((entry) => {
      let score = 0;
      const hay = entry.searchText;
      if (hay.includes(q)) score += 20;
      if (normalize(entry.title).includes(q)) score += 30;
      if (entry.heading && normalize(entry.heading).includes(q)) score += 18;
      for (const token of tokens) {
        if (hay.includes(token)) score += 4;
        if (normalize(entry.title).includes(token)) score += 6;
      }
      return { entry, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));

  // Prefer page-level hits before deep anchors when scores are close
  const seen = new Set<string>();
  const results: DocumentationSearchEntry[] = [];
  for (const row of scored) {
    const key =
      row.entry.route.split('#')[0] + '::' + row.entry.title + '::' + (row.entry.heading ?? '');
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(row.entry);
    if (results.length >= limit) break;
  }
  return results;
}
