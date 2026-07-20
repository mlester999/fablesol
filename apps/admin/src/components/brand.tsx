import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface AdminBrandProps {
  readonly compact?: boolean;
  readonly markOnly?: boolean;
  readonly href?: string;
}

export function AdminBrand({ compact = false, markOnly = false, href }: AdminBrandProps) {
  const className = ['brand', compact ? 'brand--compact' : '', markOnly ? 'brand--mark-only' : '']
    .filter(Boolean)
    .join(' ');

  const content: ReactNode = (
    <>
      <Image alt="" className="brand-logo" height={40} priority src="/logo-no-bg.png" width={40} />
      <span className="brand-copy">
        <strong>Fablesol</strong>
        <span>Administration</span>
      </span>
    </>
  );

  if (href !== undefined) {
    return (
      <Link aria-label="Fablesol Administration" className={className} href={href}>
        {content}
      </Link>
    );
  }

  return (
    <div aria-label="Fablesol Administration" className={className}>
      {content}
    </div>
  );
}
