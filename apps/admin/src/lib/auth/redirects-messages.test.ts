import { describe, expect, it } from 'vitest';

import { AUTH_MESSAGES, loginNoticeMessage, resetNoticeMessage } from './messages';
import { ADMIN_ROUTES, destinationForAuthorization } from './redirects';

describe('destinationForAuthorization', () => {
  it('routes every outcome to its page', () => {
    expect(
      destinationForAuthorization({
        outcome: 'authorized',
        context: {
          userId: '00000000-0000-4000-8000-000000000000',
          fullName: 'Test Admin',
          email: 'admin@example.com',
          roleKey: 'super_admin',
          roleName: 'Super Admin',
          permissionKeys: [],
        },
      }),
    ).toBe(ADMIN_ROUTES.dashboard);
    expect(destinationForAuthorization({ outcome: 'unauthenticated' })).toBe(ADMIN_ROUTES.login);
    expect(destinationForAuthorization({ outcome: 'unauthorized' })).toBe(
      ADMIN_ROUTES.unauthorized,
    );
    expect(destinationForAuthorization({ outcome: 'suspended' })).toBe(ADMIN_ROUTES.suspended);
  });
});

describe('auth notices', () => {
  it('maps login notices and stays silent on unknown values', () => {
    expect(loginNoticeMessage('invalid')).toBe(AUTH_MESSAGES.invalidCredentials);
    expect(loginNoticeMessage('password-updated')).toBe(AUTH_MESSAGES.passwordUpdated);
    expect(loginNoticeMessage('nonsense')).toBeUndefined();
    expect(loginNoticeMessage(undefined)).toBeUndefined();
  });

  it('maps reset notices', () => {
    expect(resetNoticeMessage('mismatch')).toBe(AUTH_MESSAGES.passwordMismatch);
    expect(resetNoticeMessage('weak')).toBe(AUTH_MESSAGES.passwordWeak);
    expect(resetNoticeMessage('invalid')).toBe(AUTH_MESSAGES.resetInvalid);
    expect(resetNoticeMessage('other')).toBeUndefined();
  });

  it('never reveals whether an account exists', () => {
    for (const message of Object.values(AUTH_MESSAGES)) {
      expect(message.toLowerCase()).not.toContain('no account');
      expect(message.toLowerCase()).not.toContain('not found');
      expect(message.toLowerCase()).not.toContain('does not exist');
    }
  });
});
