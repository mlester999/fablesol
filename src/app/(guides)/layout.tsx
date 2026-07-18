import type { ReactNode } from 'react';
import { AnchorRestore } from '@/components/site/anchor-restore';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';

export default function GuidesLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="site-shell">
      <SiteHeader />
      <AnchorRestore />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}
