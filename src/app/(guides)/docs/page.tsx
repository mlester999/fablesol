import type { Metadata } from 'next';
import { DocsHome } from '@/components/docs/docs-home';
import { docsIndexPage } from '@/content/docs/index-page';
import { createDocumentationMetadata } from '@/content/docs/metadata';

export const metadata: Metadata = createDocumentationMetadata(docsIndexPage);

export default function DocsIndexRoute() {
  return <DocsHome />;
}
