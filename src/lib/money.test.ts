import { describe, expect, it } from 'vitest';
import { bpsToPercent, formatZAR, parseToCents, percentToBps } from './money';

const NBSP = '\u00A0';

describe('parseToCents', () => {
  it('reads plain amounts', () => {
    expect(parseToCents('5')).toBe(500);
    expect(parseToCents('0')).toBe(0);
    expect(parseToCents('1234.50')).toBe(123450);
  });

  it('treats a comma as a decimal point', () => {
    expect(parseToCents('1234,50')).toBe(123450);
  });

  it('pads a single decimal digit (12.5 is 50 cents, not 5)', () => {
    expect(parseToCents('12.5')).toBe(1250);
  });

  it('keeps leading zeros in cents (0.07 is 7 cents)', () => {
    expect(parseToCents('0.07')).toBe(7);
  });

  it('ignores spaces and a leading R', () => {
    expect(parseToCents('1 234,50')).toBe(123450);
    expect(parseToCents('R50')).toBe(5000);
    expect(parseToCents('R 50')).toBe(5000);
    expect(parseToCents(`1${NBSP}234,50`)).toBe(123450);
  });

  it('rejects things that are not a valid amount', () => {
    const bad = ['', '   ', 'abc', '-5', '12.345', '1,234.50', '1.2.3', '.5', '5.'];
    for (const input of bad) {
      expect(parseToCents(input)).toBeNull();
    }
  });

  it('rejects amounts too large to store exactly', () => {
    expect(parseToCents('99999999999999999')).toBeNull();
  });
});

describe('formatZAR', () => {
  it('formats with glued spaces and a decimal comma', () => {
    expect(formatZAR(123456)).toBe(`R${NBSP}1${NBSP}234,56`);
    expect(formatZAR(100000000)).toBe(`R${NBSP}1${NBSP}000${NBSP}000,00`);
  });

  it('shows small amounts and zero', () => {
    expect(formatZAR(0)).toBe(`R${NBSP}0,00`);
    expect(formatZAR(5)).toBe(`R${NBSP}0,05`);
    expect(formatZAR(100)).toBe(`R${NBSP}1,00`);
  });

  it('puts the minus sign before the R', () => {
    expect(formatZAR(-250000)).toBe(`-R${NBSP}2${NBSP}500,00`);
  });
});

describe('percent and basis points', () => {
  it('converts both ways', () => {
    expect(percentToBps(12.5)).toBe(1250);
    expect(bpsToPercent(1250)).toBe(12.5);
  });

  it('survives floating point noise (0.29 * 100 is 28.999...)', () => {
    expect(percentToBps(0.29)).toBe(29);
  });
});