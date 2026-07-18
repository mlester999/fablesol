import Image from 'next/image';
import Link from 'next/link';
import { GAME_NAME } from '@/content/game/brand';

/** Official Fablesol emblem beside the wordmark. */
export function BrandMark({ href = '/' }: { readonly href?: string }) {
  return (
    <Link className="brand-mark" href={href}>
      <span className="brand-mark__badge" aria-hidden="true">
        <Image src="/logo-no-bg.png" alt="" width={40} height={40} priority />
      </span>
      <span>{GAME_NAME}</span>
    </Link>
  );
}
