export const MINIMUM_PASSWORD_LENGTH = 12;
export const MAXIMUM_PASSWORD_LENGTH = 128;

export type PasswordValidation =
  { readonly valid: true } | { readonly valid: false; readonly reason: 'mismatch' | 'weak' };

export function validateNewPassword(password: string, confirmation: string): PasswordValidation {
  if (password !== confirmation) {
    return { valid: false, reason: 'mismatch' };
  }

  const characterClasses = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  const meetsComplexity = characterClasses.every((pattern) => pattern.test(password));

  if (
    password.length < MINIMUM_PASSWORD_LENGTH ||
    password.length > MAXIMUM_PASSWORD_LENGTH ||
    !meetsComplexity
  ) {
    return { valid: false, reason: 'weak' };
  }

  return { valid: true };
}

const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*-_=+?';
const ALL_CLASSES = [LOWERCASE, UPPERCASE, DIGITS, SYMBOLS] as const;
const COMBINED = ALL_CLASSES.join('');

function randomIndex(random: (limit: number) => number, limit: number): number {
  return random(limit);
}

function defaultRandom(limit: number): number {
  const values = new Uint32Array(1);
  // Rejection sampling keeps the distribution unbiased.
  const cap = Math.floor(0xffffffff / limit) * limit;
  let value: number;
  do {
    crypto.getRandomValues(values);
    value = values[0] ?? 0;
  } while (value >= cap);
  return value % limit;
}

/**
 * Generates a crypto-random password with at least one character from every
 * required class, so the result always passes `validateNewPassword`.
 * Ambiguous glyphs (l/I/1, O/0) are excluded for hand transcription.
 */
export function generateStrongPassword(length = 20, random = defaultRandom): string {
  const size = Math.min(Math.max(length, MINIMUM_PASSWORD_LENGTH), MAXIMUM_PASSWORD_LENGTH);
  const characters: string[] = [];

  for (const characterClass of ALL_CLASSES) {
    characters.push(characterClass[randomIndex(random, characterClass.length)] ?? 'a');
  }
  while (characters.length < size) {
    characters.push(COMBINED[randomIndex(random, COMBINED.length)] ?? 'a');
  }

  // Fisher-Yates shuffle so the guaranteed classes are not positionally predictable.
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(random, index + 1);
    const held = characters[index] as string;
    characters[index] = characters[swap] as string;
    characters[swap] = held;
  }

  return characters.join('');
}
