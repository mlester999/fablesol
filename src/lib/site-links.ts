/**
 * Official outbound links. Discord and X are the only approved social
 * platforms. URLs come from environment configuration so we never ship
 * invented links; when a URL is missing the UI shows an honest
 * "opens soon" state and the owner action is documented in DEVELOPMENT.md.
 */

import { getPublicEnv } from './env';

export interface SocialLink {
  readonly id: 'discord' | 'x';
  readonly label: string;
  /** Configured official URL, or undefined when the owner has not set one. */
  readonly href: string | undefined;
  readonly missingLabel: string;
}

const env = getPublicEnv();

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    id: 'discord',
    label: 'Discord',
    href: env.discordUrl,
    missingLabel: 'Official Discord opens soon',
  },
  {
    id: 'x',
    label: 'X',
    href: env.xUrl,
    missingLabel: 'Official X opens soon',
  },
] as const;
