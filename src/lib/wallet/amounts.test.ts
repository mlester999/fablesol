import { describe, expect, it } from 'vitest';
import { baseUnitsToDecimalString, decimalAmountToBaseUnits, formatDecimalString } from './amounts';

describe('decimalAmountToBaseUnits', () => {
  it('converts the 10,000 $FABLE threshold exactly at common decimals', () => {
    expect(decimalAmountToBaseUnits('10000', 0)).toBe(10_000n);
    expect(decimalAmountToBaseUnits('10000', 6)).toBe(10_000_000_000n);
    expect(decimalAmountToBaseUnits('10000', 9)).toBe(10_000_000_000_000n);
  });

  it('converts fractional amounts without floating point', () => {
    expect(decimalAmountToBaseUnits('0.000001', 6)).toBe(1n);
    expect(decimalAmountToBaseUnits('123.456', 6)).toBe(123_456_000n);
  });

  it('rejects amounts that cannot be represented exactly', () => {
    expect(() => decimalAmountToBaseUnits('1.2345', 3)).toThrow();
    expect(() => decimalAmountToBaseUnits('abc', 6)).toThrow();
    expect(() => decimalAmountToBaseUnits('-5', 6)).toThrow();
  });

  it('rejects invalid decimals', () => {
    expect(() => decimalAmountToBaseUnits('1', -1)).toThrow();
    expect(() => decimalAmountToBaseUnits('1', 19)).toThrow();
    expect(() => decimalAmountToBaseUnits('1', 1.5)).toThrow();
  });

  it('handles amounts beyond Number.MAX_SAFE_INTEGER exactly', () => {
    expect(decimalAmountToBaseUnits('18446744073709551615', 0)).toBe(18_446_744_073_709_551_615n);
  });
});

describe('baseUnitsToDecimalString', () => {
  it('renders exact decimal strings', () => {
    expect(baseUnitsToDecimalString(10_000_000_000n, 6)).toBe('10000');
    expect(baseUnitsToDecimalString(10_000_000_001n, 6)).toBe('10000.000001');
    expect(baseUnitsToDecimalString(0n, 9)).toBe('0');
    expect(baseUnitsToDecimalString('9999999999', 6)).toBe('9999.999999');
  });

  it('rejects negative amounts', () => {
    expect(() => baseUnitsToDecimalString(-1n, 6)).toThrow();
  });
});

describe('eligibility comparisons stay in integer space', () => {
  const decimals = 6;
  const required = decimalAmountToBaseUnits('10000', decimals);

  it('exactly 10,000 passes', () => {
    expect(decimalAmountToBaseUnits('10000', decimals) >= required).toBe(true);
  });

  it('one base unit below 10,000 fails', () => {
    expect(required - 1n >= required).toBe(false);
  });

  it('one base unit above 10,000 passes', () => {
    expect(required + 1n >= required).toBe(true);
  });
});

describe('formatDecimalString', () => {
  it('groups thousands and keeps fractions', () => {
    expect(formatDecimalString('10000')).toBe('10,000');
    expect(formatDecimalString('1234567.5')).toBe('1,234,567.5');
    expect(formatDecimalString('999')).toBe('999');
  });
});
