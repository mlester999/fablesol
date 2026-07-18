import { DOCUMENTATION_REVIEW_DATE } from '@/content/game/brand';
import type { DocumentationBlock, DocumentationPage, DocumentationSectionContent } from './types';

export function definePage(page: Omit<DocumentationPage, 'lastReviewed'>): DocumentationPage {
  return { ...page, lastReviewed: DOCUMENTATION_REVIEW_DATE };
}

export function section(
  id: string,
  title: string,
  paragraphs: readonly string[],
  blocks?: readonly DocumentationBlock[],
): DocumentationSectionContent {
  return {
    id,
    title,
    paragraphs,
    ...(blocks === undefined ? {} : { blocks }),
  };
}

export function callout(
  tone: 'tip' | 'important' | 'safety' | 'rule' | 'provisional' | 'example',
  title: string,
  text: string,
): DocumentationBlock {
  return { type: 'callout', tone, title, text };
}

export function list(items: readonly string[], ordered = false): DocumentationBlock {
  return { type: 'list', ordered, items };
}

export function steps(items: readonly { title: string; text: string }[]): DocumentationBlock {
  return { type: 'steps', items };
}

export function table(
  caption: string,
  columns: readonly string[],
  rows: readonly (readonly string[])[],
): DocumentationBlock {
  return { type: 'table', caption, columns, rows };
}

export function links(
  items: readonly { label: string; href: string; description: string }[],
): DocumentationBlock {
  return { type: 'links', links: items };
}

export function interactive(
  component: Extract<DocumentationBlock, { type: 'interactive' }>['component'],
): DocumentationBlock {
  return { type: 'interactive', component };
}
