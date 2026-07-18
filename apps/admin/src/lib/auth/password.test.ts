import { describe, expect, it } from 'vitest';

import { generateStrongPassword, validateNewPassword } from './password';

describe('validateNewPassword', () => {
  it('rejects mismatched confirmations', () => {
    expect(validateNewPassword('Abcdefgh1234!', 'Abcdefgh1234?')).toEqual({
      valid: false,
      reason: 'mismatch',
    });
  });

  it('rejects short, long, and low-complexity passwords', () => {
    expect(validateNewPassword('Ab1!short', 'Ab1!short')).toEqual({ valid: false, reason: 'weak' });
    const tooLong = `Aa1!${'x'.repeat(130)}`;
    expect(validateNewPassword(tooLong, tooLong)).toEqual({ valid: false, reason: 'weak' });
    expect(validateNewPassword('alllowercase1234', 'alllowercase1234')).toEqual({
      valid: false,
      reason: 'weak',
    });
    expect(validateNewPassword('NoDigitsHere!!!!', 'NoDigitsHere!!!!')).toEqual({
      valid: false,
      reason: 'weak',
    });
  });

  it('accepts a compliant password', () => {
    expect(validateNewPassword('Abcdefgh1234!', 'Abcdefgh1234!')).toEqual({ valid: true });
  });
});

describe('generateStrongPassword', () => {
  it('always satisfies the validator', () => {
    for (let round = 0; round < 50; round += 1) {
      const password = generateStrongPassword();
      expect(password).toHaveLength(20);
      expect(validateNewPassword(password, password)).toEqual({ valid: true });
    }
  });

  it('clamps the requested length into the allowed range', () => {
    expect(generateStrongPassword(4)).toHaveLength(12);
    expect(generateStrongPassword(400)).toHaveLength(128);
  });

  it('produces distinct values', () => {
    const seen = new Set(Array.from({ length: 20 }, () => generateStrongPassword()));
    expect(seen.size).toBe(20);
  });
});
