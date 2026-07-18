import Link from 'next/link';
import { GAME_NAME } from '@/content/game/brand';

export function BrandMark({ href = '/' }: { readonly href?: string }) {
  return (
    <Link className="brand-mark" href={href}>
      <span className="brand-mark__badge" aria-hidden="true">
        🌿
      </span>
      <span>{GAME_NAME}</span>
    </Link>
  );
}
