/**
 * Original Fablesol spot illustrations — lightweight inline SVGs sharing
 * one flat, warm visual language. All are decorative (aria-hidden) unless
 * a label is passed; nothing here depicts real gameplay footage.
 */

interface IlloProps {
  readonly title?: string;
  readonly className?: string;
}

function svgProps({ title, className }: IlloProps) {
  return {
    className,
    role: title ? ('img' as const) : undefined,
    'aria-hidden': title ? undefined : true,
    'aria-label': title,
    focusable: false as const,
  };
}

/** Sprout in tilled soil — getting started. */
export function IlloSprout(props: IlloProps) {
  return (
    <svg viewBox="0 0 96 96" {...svgProps(props)}>
      <ellipse cx="48" cy="76" rx="30" ry="10" fill="#6b4f35" />
      <ellipse cx="48" cy="73" rx="30" ry="10" fill="#8a6a48" />
      <path d="M48 70V46" stroke="#2f5d46" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 54c0-12-9-17-21-17 0 12 9 17 21 17Z" fill="#4f8a62" />
      <path d="M48 47c0-10 7.6-14 18-14 0 10-7.6 14-18 14Z" fill="#2f5d46" />
      <circle cx="70" cy="24" r="10" fill="#e6c95c" />
    </svg>
  );
}

/** Cottage with smoke — cozy world. */
export function IlloCottage(props: IlloProps) {
  return (
    <svg viewBox="0 0 96 96" {...svgProps(props)}>
      <ellipse cx="48" cy="80" rx="34" ry="8" fill="#5c884b" />
      <rect x="26" y="44" width="44" height="34" rx="4" fill="#f3ead3" />
      <path d="M20 46 48 24l28 22Z" fill="#8b3a2a" />
      <rect x="58" y="28" width="7" height="14" rx="1.5" fill="#9c8a74" />
      <circle cx="63" cy="20" r="4" fill="#fdf9ee" opacity="0.8" />
      <circle cx="68" cy="13" r="3" fill="#fdf9ee" opacity="0.6" />
      <rect x="42" y="58" width="12" height="20" rx="2" fill="#6b4f35" />
      <rect x="30" y="52" width="9" height="9" rx="2" fill="#e6c95c" />
      <rect x="57" y="52" width="9" height="9" rx="2" fill="#e6c95c" />
    </svg>
  );
}

/** Copper coins — economy. */
export function IlloCoins(props: IlloProps) {
  return (
    <svg viewBox="0 0 96 96" {...svgProps(props)}>
      <ellipse cx="40" cy="70" rx="26" ry="10" fill="#8f541f" />
      <ellipse cx="40" cy="66" rx="26" ry="10" fill="#b06b2c" />
      <ellipse cx="40" cy="62" rx="26" ry="10" fill="#8f541f" />
      <ellipse cx="40" cy="58" rx="26" ry="10" fill="#b06b2c" />
      <ellipse cx="40" cy="55" rx="18" ry="6.5" fill="#d4a574" />
      <circle cx="67" cy="38" r="16" fill="#8f541f" />
      <circle cx="65" cy="36" r="16" fill="#c9a227" />
      <circle cx="65" cy="36" r="11" fill="#e6c95c" />
      <path d="M65 30v12M60 33.5h10" stroke="#8f541f" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/** Cat face — permanent companion. */
export function IlloCat(props: IlloProps) {
  return (
    <svg viewBox="0 0 96 96" {...svgProps(props)}>
      <path d="M26 34 20 12l18 8Z" fill="#c67a30" />
      <path d="M70 34l6-22-18 8Z" fill="#c67a30" />
      <path d="M26 32 22 17l12 6Z" fill="#e8b8b0" />
      <path d="M70 32l4-15-12 6Z" fill="#e8b8b0" />
      <circle cx="48" cy="52" r="30" fill="#d9873c" />
      <path
        d="M48 22c4 6 4 12 0 16M34 26c3 5 3 10 1 13M62 26c-3 5-3 10-1 13"
        stroke="#c67a30"
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="38" cy="48" r="4.2" fill="#22301f" />
      <circle cx="58" cy="48" r="4.2" fill="#22301f" />
      <circle cx="39.4" cy="46.6" r="1.3" fill="#fdf9ee" />
      <circle cx="59.4" cy="46.6" r="1.3" fill="#fdf9ee" />
      <path d="M45 58c1.6 2 4.4 2 6 0l-3-3.4Z" fill="#e8b8b0" />
      <path
        d="M48 61c-3 3-7 3.4-10 1.4M48 61c3 3 7 3.4 10 1.4"
        stroke="#8f541f"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 54h-9M25 60l-8 3M72 54h9M71 60l8 3"
        stroke="#c67a30"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Paw over crossed banners — Cat Battle. */
export function IlloBattle(props: IlloProps) {
  return (
    <svg viewBox="0 0 96 96" {...svgProps(props)}>
      <path d="M48 12 78 24v22c0 18-13 30-30 36-17-6-30-18-30-36V24Z" fill="#2f5d46" />
      <path
        d="M48 18l24 9.6V46c0 14.5-10.5 24.5-24 29.8C34.5 70.5 24 60.5 24 46V27.6Z"
        fill="#4f8a62"
      />
      <circle cx="48" cy="50" r="8.5" fill="#fdf9ee" />
      <circle cx="35" cy="41" r="4.6" fill="#fdf9ee" />
      <circle cx="61" cy="41" r="4.6" fill="#fdf9ee" />
      <circle cx="41" cy="32.5" r="4.2" fill="#fdf9ee" />
      <circle cx="55" cy="32.5" r="4.2" fill="#fdf9ee" />
    </svg>
  );
}

/** Trophy — tournaments. */
export function IlloTrophy(props: IlloProps) {
  return (
    <svg viewBox="0 0 96 96" {...svgProps(props)}>
      <path d="M28 18h40v14c0 14-8 24-20 24S28 46 28 32Z" fill="#c9a227" />
      <path d="M32 22h32v10c0 11-6.4 19-16 19s-16-8-16-19Z" fill="#e6c95c" />
      <path
        d="M28 24h-9c0 12 5 19 13 21M68 24h9c0 12-5 19-13 21"
        stroke="#b06b2c"
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="43" y="55" width="10" height="12" fill="#b06b2c" />
      <rect x="32" y="66" width="32" height="9" rx="3" fill="#8f541f" />
      <rect x="35" y="63" width="26" height="6" rx="2.5" fill="#b06b2c" />
      <path
        d="M48 28l2.6 5.6 6 .7-4.5 4.1 1.2 5.9-5.3-3-5.3 3 1.2-5.9-4.5-4.1 6-.7Z"
        fill="#8f541f"
      />
    </svg>
  );
}

/** Open field guide — rules and help. */
export function IlloBook(props: IlloProps) {
  return (
    <svg viewBox="0 0 96 96" {...svgProps(props)}>
      <path d="M48 26C40 20 28 18 16 18v52c12 0 24 2 32 8Z" fill="#fdf9ee" />
      <path d="M48 26c8-6 20-8 32-8v52c-12 0-24 2-32 8Z" fill="#f3ead3" />
      <path d="M48 26v52" stroke="#a3805c" strokeWidth="2.5" />
      <path
        d="M24 30c6 0 12 1 17 3M24 40c6 0 12 1 17 3M24 50c6 0 12 1 17 3M55 33c5-2 11-3 17-3M55 43c5-2 11-3 17-3M55 53c5-2 11-3 17-3"
        stroke="#a3805c"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M14 18v54c12 0 26 2 34 8 8-6 22-8 34-8V18"
        fill="none"
        stroke="#6b4f35"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Gem cluster — materials and rarities. */
export function IlloGem(props: IlloProps) {
  return (
    <svg viewBox="0 0 96 96" {...svgProps(props)}>
      <path d="M48 16 68 34 48 76 28 34Z" fill="#7c4dbd" />
      <path d="M48 16 68 34H28Z" fill="#9d74d6" />
      <path d="M40 34h16L48 62Z" fill="#c3a6ea" opacity="0.75" />
      <path d="M20 56l9 8-9 14-9-14Z" fill="#3b6ea5" />
      <path d="M20 56l9 8H11Z" fill="#6d9cc9" />
      <path d="M76 56l9 8-9 14-9-14Z" fill="#c9a227" />
      <path d="M76 56l9 8H67Z" fill="#e6c95c" />
    </svg>
  );
}

/** Pair of dice — Cat Dice. */
export function IlloDice(props: IlloProps) {
  return (
    <svg viewBox="0 0 96 96" {...svgProps(props)}>
      <rect
        x="14"
        y="30"
        width="38"
        height="38"
        rx="8"
        fill="#fdf9ee"
        transform="rotate(-8 33 49)"
      />
      <rect
        x="46"
        y="36"
        width="34"
        height="34"
        rx="7"
        fill="#e6c95c"
        transform="rotate(7 63 53)"
      />
      <g fill="#22301f">
        <circle cx="26" cy="42" r="3.4" />
        <circle cx="38" cy="52" r="3.4" />
        <circle cx="30" cy="62" r="3.4" />
      </g>
      <g fill="#8f541f">
        <circle cx="58" cy="48" r="3" />
        <circle cx="70" cy="60" r="3" />
      </g>
    </svg>
  );
}

/** Shield and lock — fair play and security. */
export function IlloShield(props: IlloProps) {
  return (
    <svg viewBox="0 0 96 96" {...svgProps(props)}>
      <path d="M48 10 80 22v24c0 20-14 33-32 40-18-7-32-20-32-40V22Z" fill="#40758c" />
      <path
        d="M48 16l26 9.7V46c0 16.5-11.5 27.5-26 33.6C33.5 73.5 22 62.5 22 46V25.7Z"
        fill="#6d9cc9"
      />
      <rect x="38" y="42" width="20" height="16" rx="4" fill="#fdf9ee" />
      <path d="M42 42v-5a6 6 0 0 1 12 0v5" stroke="#fdf9ee" strokeWidth="4" fill="none" />
      <circle cx="48" cy="49" r="2.6" fill="#40758c" />
    </svg>
  );
}

/** Hero-scale farm vignette for the docs homepage corner. */
export function IlloGuideScene(props: IlloProps) {
  return (
    <svg viewBox="0 0 220 160" {...svgProps(props)}>
      <ellipse cx="110" cy="140" rx="105" ry="18" fill="#5c884b" opacity="0.5" />
      <ellipse cx="110" cy="134" rx="95" ry="16" fill="#6d9c58" opacity="0.7" />
      <g>
        <rect x="52" y="74" width="52" height="42" rx="4" fill="#f3ead3" />
        <path d="M44 78 78 50l34 28Z" fill="#8b3a2a" />
        <rect x="90" y="56" width="8" height="16" rx="2" fill="#9c8a74" />
        <circle cx="96" cy="47" r="4.5" fill="#fdf9ee" opacity="0.75" />
        <circle cx="102" cy="39" r="3.2" fill="#fdf9ee" opacity="0.55" />
        <rect x="70" y="92" width="14" height="24" rx="2" fill="#6b4f35" />
        <rect x="58" y="84" width="10" height="10" rx="2" fill="#e6c95c" />
        <rect x="88" y="84" width="10" height="10" rx="2" fill="#e6c95c" />
      </g>
      <g>
        <rect x="140" y="96" width="16" height="22" rx="4" fill="#6b4f35" />
        <path d="M148 46c14 0 24 11 24 25s-10 24-24 24-24-10-24-24 10-25 24-25Z" fill="#2f6b45" />
        <path d="M148 56c10 0 17 8 17 17s-7 17-17 17-17-8-17-17 7-17 17-17Z" fill="#3a7a50" />
      </g>
      <g transform="translate(160 118)">
        <ellipse cx="14" cy="14" rx="13" ry="9" fill="#d9873c" />
        <circle cx="26" cy="8" r="7" fill="#e09a50" />
        <path d="m21 3 2.4-5 3 4.4Zm7 0 2.4-5 3 4.4Z" fill="#c67a30" />
        <path
          d="M1 12c-4-1-5-4-4-7"
          stroke="#c67a30"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(20 106)">
        <ellipse cx="12" cy="10" rx="12" ry="8" fill="#efe6d4" />
        <circle cx="22" cy="5" r="5.5" fill="#e0d2b8" />
        <path d="M19 0l1.6-3.4L23 0Z" fill="#c9b8988c" />
      </g>
      <circle cx="196" cy="26" r="14" fill="#e6c95c" opacity="0.9" />
      <g fill="#fff8e8" opacity="0.85">
        <ellipse cx="48" cy="24" rx="22" ry="7" />
        <ellipse cx="62" cy="19" rx="13" ry="5.5" />
      </g>
    </svg>
  );
}

/** Simple animal portraits used in galleries and pickers. */
export function AnimalPortrait({
  animal,
  className,
  title,
}: {
  readonly animal: 'cow' | 'pig' | 'horse' | 'chicken' | 'goat';
  readonly className?: string;
  readonly title?: string;
}) {
  const shared = svgProps({ title, className });
  if (animal === 'cow') {
    return (
      <svg viewBox="0 0 96 96" {...shared}>
        <path d="M20 34c-7-2-10-8-9-15 7-1 12 2 15 8Z" fill="#e0d2b8" />
        <path d="M76 34c7-2 10-8 9-15-7-1-12 2-15 8Z" fill="#e0d2b8" />
        <ellipse cx="48" cy="50" rx="30" ry="27" fill="#efe6d4" />
        <path d="M30 32c6-5 13-7 18-7 6 0 13 2 18 7l-5 10H35Z" fill="#8a6242" opacity="0.85" />
        <circle cx="38" cy="47" r="4" fill="#22301f" />
        <circle cx="58" cy="47" r="4" fill="#22301f" />
        <ellipse cx="48" cy="64" rx="16" ry="11" fill="#e8b8b0" />
        <ellipse cx="42" cy="63" rx="3" ry="4.2" fill="#c98b81" />
        <ellipse cx="54" cy="63" rx="3" ry="4.2" fill="#c98b81" />
      </svg>
    );
  }
  if (animal === 'pig') {
    return (
      <svg viewBox="0 0 96 96" {...shared}>
        <path d="M26 30 18 16l16 5Z" fill="#dd949b" />
        <path d="M70 30l8-14-16 5Z" fill="#dd949b" />
        <ellipse cx="48" cy="52" rx="30" ry="26" fill="#e7a7ad" />
        <circle cx="37" cy="46" r="4" fill="#22301f" />
        <circle cx="59" cy="46" r="4" fill="#22301f" />
        <ellipse cx="48" cy="60" rx="13" ry="9.5" fill="#dd949b" />
        <ellipse cx="43" cy="60" rx="2.8" ry="4" fill="#b96f77" />
        <ellipse cx="53" cy="60" rx="2.8" ry="4" fill="#b96f77" />
      </svg>
    );
  }
  if (animal === 'horse') {
    return (
      <svg viewBox="0 0 96 96" {...shared}>
        <path d="M34 26 28 10l14 8Z" fill="#7a5638" />
        <path d="M62 26l6-16-14 8Z" fill="#7a5638" />
        <path d="M48 18c-4 8-6 16-6 24h12c0-8-2-16-6-24Z" fill="#5f4630" />
        <ellipse cx="48" cy="54" rx="27" ry="27" fill="#8a6242" />
        <path
          d="M48 40c-3 6-4 12-4 18 0 5 1.6 9 4 12 2.4-3 4-7 4-12 0-6-1-12-4-18Z"
          fill="#e0d2b8"
          opacity="0.7"
        />
        <circle cx="36" cy="50" r="4" fill="#22301f" />
        <circle cx="60" cy="50" r="4" fill="#22301f" />
        <ellipse cx="48" cy="70" rx="13" ry="9" fill="#6f5138" />
        <ellipse cx="43" cy="69" rx="2.4" ry="3.6" fill="#543c28" />
        <ellipse cx="53" cy="69" rx="2.4" ry="3.6" fill="#543c28" />
      </svg>
    );
  }
  if (animal === 'chicken') {
    return (
      <svg viewBox="0 0 96 96" {...shared}>
        <path d="M38 20c0-6 4-10 10-10 0 4-1 7-3 9 4-1 8 0 10 3-4 2-8 2-11 1Z" fill="#c94f3d" />
        <ellipse cx="48" cy="54" rx="27" ry="26" fill="#f6f1e4" />
        <circle cx="38" cy="48" r="4" fill="#22301f" />
        <circle cx="58" cy="48" r="4" fill="#22301f" />
        <path d="M43 58h10l-5 8Z" fill="#e8a13c" />
        <path
          d="M42 66c2 2.5 4 3.6 6 3.6s4-1.1 6-3.6"
          stroke="#d8905e"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 96 96" {...shared}>
      <path d="M28 24c-6-4-8-9-6-16 6 1 10 5 11 11Z" fill="#a3805c" />
      <path d="M68 24c6-4 8-9 6-16-6 1-10 5-11 11Z" fill="#a3805c" />
      <path d="M22 34 12 30l8 10Z" fill="#bfb7a8" />
      <path d="M74 34l10-4-8 10Z" fill="#bfb7a8" />
      <ellipse cx="48" cy="52" rx="27" ry="26" fill="#cfc8bb" />
      <circle cx="38" cy="46" r="4" fill="#22301f" />
      <circle cx="58" cy="46" r="4" fill="#22301f" />
      <ellipse cx="48" cy="62" rx="11" ry="8" fill="#bfb7a8" />
      <path d="M44 70c1 4 2.6 6 4 6s3-2 4-6" fill="#bfb7a8" />
      <ellipse cx="44" cy="61" rx="2.2" ry="3.4" fill="#a49b8a" />
      <ellipse cx="52" cy="61" rx="2.2" ry="3.4" fill="#a49b8a" />
    </svg>
  );
}
