import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { validateNewPassword } from '@/lib/auth/password';
import { Notice } from './notice';
import { PasswordGeneratorField } from './password-generator-field';
import { InvitationLinkPanel } from './team/invitation-link-panel';

describe('Notice', () => {
  it('renders as a polite status with the tone class', () => {
    render(<Notice tone="warning">Careful now.</Notice>);
    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent('Careful now.');
    expect(notice.className).toContain('notice--warning');
  });
});

describe('InvitationLinkPanel', () => {
  it('renders nothing until a link exists', () => {
    const { container } = render(<InvitationLinkPanel state={{ status: 'idle' }} />);
    expect(container).toBeEmptyDOMElement();
    const failed = render(<InvitationLinkPanel state={{ status: 'error', message: 'nope' }} />);
    expect(failed.container).toBeEmptyDOMElement();
  });

  it('shows the single-use link once created', () => {
    render(
      <InvitationLinkPanel
        state={{
          status: 'created',
          email: 'new.admin@example.com',
          acceptanceUrl: 'http://localhost:3601/invite/abc',
        }}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Invitation created');
    expect(screen.getByText('http://localhost:3601/invite/abc')).toBeInTheDocument();
  });
});

describe('PasswordGeneratorField', () => {
  it('fills both fields with one matching, compliant password', async () => {
    const user = userEvent.setup();
    render(<PasswordGeneratorField label="New password" confirmationLabel="Confirm" />);

    await user.click(screen.getByRole('button', { name: 'Suggest a strong password' }));

    const password = screen.getByLabelText('New password');
    const confirmation = screen.getByLabelText('Confirm');
    expect(password).toHaveValue(confirmation.getAttribute('value') ?? '');
    const value = (password as HTMLInputElement).value;
    expect(validateNewPassword(value, value)).toEqual({ valid: true });
    expect(screen.getByRole('status')).toHaveTextContent('password manager');
  });
});
