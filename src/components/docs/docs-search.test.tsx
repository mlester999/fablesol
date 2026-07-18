import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocsSearch } from './docs-search';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

afterEach(() => {
  cleanup();
  push.mockClear();
});

function stubDialog() {
  const dialog = document.querySelector('dialog') as HTMLDialogElement;
  dialog.showModal = () => {
    dialog.setAttribute('open', '');
  };
  dialog.close = () => {
    dialog.removeAttribute('open');
  };
  return dialog;
}

describe('docs search', () => {
  it('finds results and opens the selected one with keyboard only', async () => {
    const user = userEvent.setup();
    render(<DocsSearch />);
    stubDialog();
    await user.click(screen.getByRole('button', { name: /Search/ }));
    const input = screen.getByRole('combobox', { name: /Search docs/i });
    await user.type(input, 'Divine');
    const options = await screen.findAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    await user.keyboard('{ArrowDown}{ArrowUp}{Enter}');
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0]?.[0]).toMatch(/^\//);
  });

  it('announces an honest empty state', async () => {
    const user = userEvent.setup();
    render(<DocsSearch />);
    stubDialog();
    await user.click(screen.getByRole('button', { name: /Search/ }));
    await user.type(screen.getByRole('combobox', { name: /Search docs/i }), 'zzznomatch123');
    expect(screen.getByText(/No results/)).toBeTruthy();
  });
});
