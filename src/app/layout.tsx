import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { GAME_DESCRIPTION, GAME_NAME, GAME_TAGLINE, SITE_URL } from '@/content/game/brand';
import './globals.css';

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
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
