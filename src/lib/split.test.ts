import { describe, expect, it } from 'vitest';

import {
    allocate,
    allocateIncome, allocateIncomes,
    fillRemainder,
    splitInForce,
    validateShares,
} from './split';

import type { Income, SplitShare, SplitSnapshot } from './types';

// Builds shares named b0, b1, b2... from a list of basis points.
const shares = (...bps: number[]): SplitShare[] =>
  bps.map((b, i) => ({ bucketId: `b${i}`, bps: b }));

const sum = (o: Record<string, number>) =>
  Object.values(o).reduce((a, b) => a + b, 0);

const makeIncome = (over: Partial<Income>): Income => ({
  id: 'i1',
  periodId: '2026-11-01',
  amountCents: 100000,
  receivedAt: '2026-11-02',
  createdAt: '2026-11-02T08:00:00Z',
  ...over,
});

describe('allocate', () => {
  it('splits evenly when the maths is exact', () => {
    expect(allocate(100000, shares(5000, 3000, 2000))).toEqual({
      b0: 50000, b1: 30000, b2: 20000,
    });
  });

  it('gives the spare cent to the biggest remainder (R1.00 in thirds)', () => {
    expect(allocate(100, shares(3333, 3333, 3334))).toEqual({ b0: 33, b1: 33, b2: 34 });
  });

  it('breaks ties in favour of the earlier bucket (5 cents, 50/50)', () => {
    expect(allocate(5, shares(5000, 5000))).toEqual({ b0: 3, b1: 2 });
  });

  it('handles 1 cent across three buckets', () => {
    expect(allocate(1, shares(3333, 3333, 3334))).toEqual({ b0: 0, b1: 0, b2: 1 });
  });

  it('gives zero to everyone when the income is zero', () => {
    expect(allocate(0, shares(5000, 5000))).toEqual({ b0: 0, b1: 0 });
  });

  it('gives a 0% bucket nothing', () => {
    expect(allocate(12345, shares(10000, 0))).toEqual({ b0: 12345, b1: 0 });
  });

  it('combines amounts if the same bucket appears twice', () => {
    const twice: SplitShare[] = [
      { bucketId: 'a', bps: 5000 },
      { bucketId: 'a', bps: 5000 },
    ];
    expect(allocate(999, twice)).toEqual({ a: 999 });
  });

  it('never loses or invents a cent (2000 repeatable pseudo-random cases)', () => {
    let seed = 12345;
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed;
    };
    for (let n = 0; n < 2000; n++) {
      const total = next() % 10_000_000;
      const a = next() % 10001;
      const b = next() % (10001 - a);
      const result = allocate(total, shares(a, b, 10000 - a - b));
      expect(sum(result)).toBe(total);
    }
  });

  it('refuses shares that do not total 100%', () => {
    expect(() => allocate(100, shares(5000, 5500))).toThrow('BAD_TOTAL');
    expect(() => allocate(100, shares(5000, 4000))).toThrow('BAD_TOTAL');
  });

  it('refuses an empty split', () => {
    expect(() => allocate(100, [])).toThrow('EMPTY_SPLIT');
  });

  it('refuses fractional or negative basis points', () => {
    expect(() => allocate(100, shares(5000.5, 4999.5))).toThrow('NON_INTEGER');
    expect(() => allocate(100, shares(-1000, 11000))).toThrow('NON_INTEGER');
  });

  it('refuses negative or fractional income', () => {
    expect(() => allocate(-1, shares(10000))).toThrow('NEGATIVE_INCOME');
    expect(() => allocate(10.5, shares(10000))).toThrow('NON_INTEGER');
  });
});

describe('validateShares', () => {
  it('returns null for a valid split', () => {
    expect(validateShares(shares(6000, 4000))).toBeNull();
  });

  it('reports the actual total when it is wrong', () => {
    expect(validateShares(shares(5000, 5500))).toEqual({ code: 'BAD_TOTAL', totalBps: 10500 });
    expect(validateShares(shares(5000, 4000))).toEqual({ code: 'BAD_TOTAL', totalBps: 9000 });
  });

  it('reports an empty split', () => {
    expect(validateShares([])).toEqual({ code: 'EMPTY_SPLIT' });
  });
});

describe('fillRemainder', () => {
  it('gives the missing percentage to the chosen bucket', () => {
    expect(fillRemainder(shares(3300, 3300, 3300), 'b2')).toEqual(shares(3300, 3300, 3400));
  });

  it('recalculates the target instead of adding to it', () => {
    expect(fillRemainder(shares(5000, 3000, 500), 'b2')).toEqual(shares(5000, 3000, 2000));
  });

  it('returns null when the other buckets already total more than 100%', () => {
    expect(fillRemainder(shares(6000, 5000, 0), 'b2')).toBeNull();
  });

  it('does not change the list it was given', () => {
    const original = shares(3300, 3300, 3300);
    fillRemainder(original, 'b2');
    expect(original).toEqual(shares(3300, 3300, 3300));
  });
});

describe('splitInForce', () => {
  const snapA: SplitSnapshot = { effectiveFrom: '2026-11-01', shares: shares(5000, 5000) };
  const snapB: SplitSnapshot = { effectiveFrom: '2026-11-15', shares: shares(7000, 3000) };

  it('picks the earlier split before the change', () => {
    expect(splitInForce([snapA, snapB], '2026-11-10')).toBe(snapA);
  });

  it('picks the new split on the day it starts', () => {
    expect(splitInForce([snapA, snapB], '2026-11-15')).toBe(snapB);
  });

  it('picks the new split after the change', () => {
    expect(splitInForce([snapA, snapB], '2026-11-20')).toBe(snapB);
  });

  it('does not depend on the order of the list', () => {
    expect(splitInForce([snapB, snapA], '2026-11-10')).toBe(snapA);
    expect(splitInForce([snapB, snapA], '2026-11-20')).toBe(snapB);
  });

  it('throws if the date is before the first split', () => {
    expect(() => splitInForce([snapA, snapB], '2026-10-31')).toThrow('NO_SPLIT_IN_FORCE');
  });

  it('throws if there are no splits at all', () => {
    expect(() => splitInForce([], '2026-11-10')).toThrow('NO_SPLIT_IN_FORCE');
  });
});

describe('allocateIncome and allocateIncomes', () => {
  const snapshots: SplitSnapshot[] = [
    { effectiveFrom: '2026-11-01', shares: shares(5000, 5000) },
    { effectiveFrom: '2026-11-15', shares: shares(7000, 3000) },
  ];

  it('uses the split in force on the day the income was received', () => {
    const early = makeIncome({ receivedAt: '2026-11-02' });
    const late = makeIncome({ receivedAt: '2026-11-20' });
    expect(allocateIncome(early, snapshots)).toEqual({ b0: 50000, b1: 50000 });
    expect(allocateIncome(late, snapshots)).toEqual({ b0: 70000, b1: 30000 });
  });

  it('uses a custom allocation instead of the default split', () => {
    const custom = makeIncome({ allocation: shares(0, 10000) });
    expect(allocateIncome(custom, snapshots)).toEqual({ b0: 0, b1: 100000 });
  });

  it('keeps earlier income under the old split after a mid-month change', () => {
    const incomes = [
      makeIncome({ id: 'i1', receivedAt: '2026-11-02' }),
      makeIncome({ id: 'i2', receivedAt: '2026-11-20' }),
    ];
    expect(allocateIncomes(incomes, snapshots)).toEqual({ b0: 120000, b1: 80000 });
  });

  it('adds custom and default incomes together', () => {
    const incomes = [
      makeIncome({ id: 'i1', receivedAt: '2026-11-02' }),
      makeIncome({ id: 'i2', receivedAt: '2026-11-02', amountCents: 20000, allocation: shares(0, 10000) }),
    ];
    expect(allocateIncomes(incomes, snapshots)).toEqual({ b0: 50000, b1: 70000 });
  });

  it('returns nothing for no incomes', () => {
    expect(allocateIncomes([], snapshots)).toEqual({});
  });

  it('throws if an income has no split to use', () => {
    const tooEarly = makeIncome({ receivedAt: '2026-10-01' });
    expect(() => allocateIncome(tooEarly, snapshots)).toThrow('NO_SPLIT_IN_FORCE');
  });
});