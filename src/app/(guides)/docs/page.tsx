import type { Metadata } from 'next';
import { DocsShell } from '@/components/docs/docs-shell';
import { docsIndexPage } from '@/content/docs/index-page';
import { createDocumentationMetadata } from '@/content/docs/metadata';

export const metadata: Metadata = createDocumentationMetadata(docsIndexPage);

export default function DocsIndexRoute() {
  return <DocsShell index page={docsIndexPage} />;
}
