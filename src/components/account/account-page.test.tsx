import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AccountPage from '@/app/(guides)/account/page';

/**
 * /account behavior without Supabase configuration: the page must stay
 * public-safe and honest. No fabricated balance, wallet, or session may
 * appear, no internal technology may be named, and the public style rules
 * (no em dashes) apply to everything the player can read.
 */
describe('account page', () => {
  it('shows an honest unavailable state and keeps the docs open', async () => {
    const { container } = render(await AccountPage());

    expect(screen.getByText(/Player accounts are not available right now/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Browse the docs' })).toBeTruthy();

    const text = container.textContent ?? '';
    // Never a fabricated balance, wallet address, or seed phrase prompt.
    expect(text).not.toMatch(/\d[\d,]* ?\$FABLE/);
    expect(text).not.toMatch(/0x[0-9a-fA-F]{6,}/);
    expect(text).not.toMatch(/seed phrase/i);
    // Never internal implementation technology in public player surfaces.
    expect(text).not.toMatch(/supabase|reown|postgres|service.role|RLS/i);
    // Public copy style: no em dashes.
    expect(text).not.toContain('—');
  });
});
