import type { Metadata } from 'next';
import { GAME_NAME, SITE_URL } from '@/content/game/brand';
import type { DocumentationPage } from './types';

export function createDocumentationMetadata(page: {
  title: string;
  description: string;
  route: string;
}): Metadata {
  const title = `${page.title} · ${GAME_NAME} Docs`;
  const url = `${SITE_URL}${page.route}`;
  return {
    title,
    description: page.description,
    alternates: { canonical: page.route },
    openGraph: {
      title,
      description: page.description,
      url,
      siteName: GAME_NAME,
      type: 'article',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: page.description,
    },
  };
}

export function serializeStructuredData(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function createArticleStructuredData(page: DocumentationPage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.description,
    dateModified: page.lastReviewed,
    author: { '@type': 'Organization', name: GAME_NAME },
    mainEntityOfPage: `${SITE_URL}${page.route}`,
  };
}
