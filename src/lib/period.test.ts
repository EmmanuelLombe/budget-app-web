import { describe, expect, it } from 'vitest';
import { periodForDate } from './periods';

describe('periodForDate', () => {
  it('returns the whole calendar month containing the date', () => {
    expect(periodForDate('2026-11-20')).toEqual({
      id: '2026-11-01',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    });
  });

  it('puts the first and last day of a month in the same period', () => {
    expect(periodForDate('2026-11-01')).toEqual(periodForDate('2026-11-30'));
  });

  it('gives different periods to adjacent months', () => {
    expect(periodForDate('2026-10-31').id).toBe('2026-10-01');
    expect(periodForDate('2026-11-01').id).toBe('2026-11-01');
  });

  it('ends 31-day months on the 31st', () => {
    expect(periodForDate('2026-01-15').endDate).toBe('2026-01-31');
    expect(periodForDate('2026-12-15').endDate).toBe('2026-12-31');
  });

  it('ends February on the 28th in a normal year', () => {
    expect(periodForDate('2026-02-10').endDate).toBe('2026-02-28');
  });

  it('ends February on the 29th in a leap year', () => {
    expect(periodForDate('2028-02-10').endDate).toBe('2028-02-29');
  });

  it('handles century years correctly (2100 is not a leap year, 2000 was)', () => {
    expect(periodForDate('2100-02-10').endDate).toBe('2100-02-28');
    expect(periodForDate('2000-02-10').endDate).toBe('2000-02-29');
  });

  it('rejects dates that do not exist or are badly formatted', () => {
    const bad = [
      '2026-02-31', '2026-11-31', '2026-02-29',
      '2026-13-01', '2026-00-10', '2026-11-00',
      '2026-5-1', '26-05-01', 'abc', '',
    ];
    for (const date of bad) {
      expect(() => periodForDate(date)).toThrow('INVALID_DATE');
    }
  });
});