import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Nunito_Sans } from 'next/font/google';
import { GAME_DESCRIPTION, GAME_NAME, GAME_TAGLINE, SITE_URL } from '@/content/game/brand';
import './globals.css';

/**
 * Typography: Fraunces (warm storybook display serif) for titles and
 * Nunito Sans (friendly, highly readable) for body text. Both are
 * self-hosted variable fonts via next/font — no runtime font requests.
 */
const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-display-face',
  display: 'swap',
  axes: ['opsz', 'SOFT'],
});

const bodyFont = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-body-face',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${GAME_NAME} · ${GAME_TAGLINE}`,
    template: `%s · ${GAME_NAME}`,
  },
  description: GAME_DESCRIPTION,
  openGraph: {
    siteName: GAME_NAME,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
