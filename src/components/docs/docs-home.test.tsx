import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { DocsHome } from './docs-home';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
import {
  DOCUMENTATION_PAGES,
  DOCUMENTATION_ROUTES,
  DOCUMENTATION_SECTIONS,
} from '@/content/docs/pages';

afterEach(cleanup);

/** Public pages must never mention the internal technology stack. */
const TECH_LEAK = /supabase|postgres|docker|next\.?js|\breact\b|three\.?js|tailwind|webgl|\bapi\b/i;

describe('docs homepage', () => {
  it('renders the player guide hero with search and How to Play access', () => {
    render(<DocsHome />);
    expect(screen.getByRole('heading', { level: 1, name: /Fablesol Player Guide/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Search the player guide/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Start with How to Play/ })).toBeTruthy();
  });

  it('invents no statistics and shows no redundant status badges', () => {
    const { container } = render(<DocsHome />);
    // Live guides need no Live badge, and no status dashboard belongs here.
    expect(screen.queryByText('Live')).toBeNull();
    expect(container.textContent).not.toMatch(/feature status:/i);
    expect(container.textContent).not.toContain('—');
    expect(container.textContent).not.toMatch(/players online/i);
    expect(container.textContent).not.toMatch(/monthly (active )?users/i);
    expect(container.textContent).not.toMatch(/testimonial|award|partner/i);
  });

  it('shows six featured guides linking to real documentation routes', () => {
    render(<DocsHome />);
    const featured = screen.getByRole('region', { name: /featured guides/i });
    const links = within(featured).getAllByRole('link');
    expect(links).toHaveLength(6);
    for (const link of links) {
      expect(DOCUMENTATION_ROUTES).toContain(link.getAttribute('href'));
    }
  });

  it('quick answers and important topics link only to real routes', () => {
    render(<DocsHome />);
    for (const regionName of [/quick answers/i, /important topics/i]) {
      const region = screen.getByRole('region', { name: regionName });
      const links = within(region).getAllByRole('link');
      expect(links.length).toBeGreaterThan(4);
      for (const link of links) {
        expect(DOCUMENTATION_ROUTES).toContain(link.getAttribute('href'));
      }
    }
  });

  it('renders every category with a link to every guide', () => {
    render(<DocsHome />);
    const categories = screen.getByRole('region', { name: /browse by category/i });
    for (const section of DOCUMENTATION_SECTIONS) {
      const band = within(categories).getByRole('region', { name: section });
      const pages = DOCUMENTATION_PAGES.filter((page) => page.section === section);
      for (const page of pages) {
        const link = within(band).getByRole('link', { name: page.title });
        expect(link.getAttribute('href')).toBe(page.route);
      }
    }
  });

  it('offers glossary and FAQ entry points', () => {
    render(<DocsHome />);
    const duo = screen.getByRole('region', { name: /glossary and faq/i });
    expect(
      within(duo)
        .getByRole('link', { name: /Glossary/ })
        .getAttribute('href'),
    ).toBe('/docs/glossary');
    expect(within(duo).getByRole('link', { name: /FAQ/ }).getAttribute('href')).toBe('/docs/faq');
  });

  it('never leaks internal technology terms', () => {
    const { container } = render(<DocsHome />);
    expect(container.textContent).not.toMatch(TECH_LEAK);
  });
});
