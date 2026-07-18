import { SOCIAL_LINKS, type SocialLink } from '@/lib/site-links';

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M19.6 5.9a17 17 0 0 0-4.2-1.3l-.2.4c1.6.4 2.4.9 3.2 1.5a11.6 11.6 0 0 0-12.8 0c.8-.6 1.7-1.1 3.2-1.5l-.2-.4a17 17 0 0 0-4.2 1.3C2.6 8.8 2.1 11.7 2.3 14.6c1.5 1.1 3 1.8 4.4 2.3l.7-1.2c-.8-.3-1.5-.6-2.1-1.1l.5-.4a12.4 12.4 0 0 0 10.4 0l.5.4c-.6.5-1.3.8-2.1 1.1l.7 1.2c1.4-.5 2.9-1.2 4.4-2.3.3-3.4-.5-6.3-2.1-8.7ZM8.9 13.3c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.4.7 1.3 1.5c0 .8-.6 1.5-1.3 1.5Zm6.2 0c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.4.7 1.3 1.5c0 .8-.6 1.5-1.3 1.5Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="currentColor">
      <path d="M17.8 3h3l-6.7 7.7L22 21h-6.2l-4.8-6.3L5.4 21h-3l7.2-8.2L2 3h6.3l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
    </svg>
  );
}

const ICONS: Record<SocialLink['id'], () => React.JSX.Element> = {
  discord: DiscordIcon,
  x: XIcon,
};

interface SocialIconLinksProps {
  readonly showLabels?: boolean;
}

/**
 * Renders the approved official social links (Discord and X only).
 * Missing URLs render an honest muted "opens soon" state — never a dead
 * or invented link.
 */
export function SocialIconLinks({ showLabels = false }: SocialIconLinksProps) {
  return (
    <>
      {SOCIAL_LINKS.map((social) => {
        const Icon = ICONS[social.id];
        if (!social.href) {
          return (
            <span
              key={social.id}
              className="social-link social-link--pending"
              title={social.missingLabel}
            >
              <Icon />
              {showLabels ? <span>{social.label}</span> : null}
              <span className="sr-only">{social.missingLabel}</span>
            </span>
          );
        }
        return (
          <a
            key={social.id}
            className="social-link"
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            title={`${social.label} (opens in a new tab)`}
          >
            <Icon />
            {showLabels ? <span>{social.label}</span> : null}
            <span className="sr-only">Official {social.label} community (opens in a new tab)</span>
          </a>
        );
      })}
    </>
  );
}
