import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsShell } from '@/components/docs/docs-shell';
import { createDocumentationMetadata } from '@/content/docs/metadata';
import { DOCUMENTATION_PAGES, getDocumentationPage } from '@/content/docs/pages';

interface DocsSlugPageProps {
  readonly params: Promise<{ slug: string[] }>;
}

export function generateStaticParams() {
  return DOCUMENTATION_PAGES.map((page) => ({
    slug: page.slug.split('/'),
  }));
}

export async function generateMetadata({ params }: DocsSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocumentationPage(slug.join('/'));
  if (!page) return {};
  return createDocumentationMetadata(page);
}

export default async function DocsSlugPage({ params }: DocsSlugPageProps) {
  const { slug } = await params;
  const page = getDocumentationPage(slug.join('/'));
  if (!page) notFound();
  return <DocsShell page={page} />;
}
