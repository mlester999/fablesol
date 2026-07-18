import type { MetadataRoute } from 'next';
import { DOCUMENTATION_ROUTES } from '@/content/docs/pages';
import { SITE_URL } from '@/content/game/brand';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['/', '/play', ...DOCUMENTATION_ROUTES];
  const unique = Array.from(new Set(routes));
  return unique.map((route) => ({
    url: `${SITE_URL}${route === '/' ? '' : route}`,
    lastModified: new Date('2026-07-18'),
    changeFrequency: route === '/' || route === '/how-to-play' ? 'weekly' : 'monthly',
    priority:
      route === '/'
        ? 1
        : route === '/how-to-play' || route === '/docs' || route === '/play'
          ? 0.9
          : 0.7,
  }));
}
