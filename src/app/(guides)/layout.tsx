import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';

export default function GuidesLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}
