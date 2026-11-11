import { describe, expect, it } from 'vitest';
import { canLogExpense } from './expenses';
import type { ExpenseCheckInput } from './expenses';

const base: ExpenseCheckInput = {
  bucketId: 'wants',
  isArchived: false,
  shareBps: 0,
  allocatedCents: 0,
  spentCents: 0,
};

const withOverrides = (over: Partial<ExpenseCheckInput>): ExpenseCheckInput => ({
  ...base,
  ...over,
});

describe('canLogExpense', () => {
  it('always allows unallocated spending', () => {
    expect(canLogExpense(withOverrides({ bucketId: null }))).toEqual({ ok: true });
  });

  it('never allows an archived bucket, even with a share and money', () => {
    const result = canLogExpense(
      withOverrides({ isArchived: true, shareBps: 2000, allocatedCents: 50000 }),
    );
    expect(result).toEqual({ ok: false, reason: 'ARCHIVED' });
  });

  it('allows a bucket with a share even before any income has arrived', () => {
    expect(canLogExpense(withOverrides({ shareBps: 2000 }))).toEqual({ ok: true });
  });

  it('allows a bucket with no share if it still has unspent money', () => {
    const result = canLogExpense(
      withOverrides({ shareBps: 0, allocatedCents: 200000, spentCents: 50000 }),
    );
    expect(result).toEqual({ ok: true });
  });

  it('blocks a bucket with no share and no money received', () => {
    expect(canLogExpense(withOverrides({}))).toEqual({
      ok: false,
      reason: 'NO_SHARE_OR_BALANCE',
    });
  });

  it('blocks a no-share bucket whose money is exactly used up', () => {
    const result = canLogExpense(
      withOverrides({ shareBps: 0, allocatedCents: 200000, spentCents: 200000 }),
    );
    expect(result).toEqual({ ok: false, reason: 'NO_SHARE_OR_BALANCE' });
  });

  it('blocks a no-share bucket that is already overspent', () => {
    const result = canLogExpense(
      withOverrides({ shareBps: 0, allocatedCents: 200000, spentCents: 250000 }),
    );
    expect(result).toEqual({ ok: false, reason: 'NO_SHARE_OR_BALANCE' });
  });

  it('still allows an overspent bucket that has a share', () => {
    const result = canLogExpense(
      withOverrides({ shareBps: 2000, allocatedCents: 200000, spentCents: 250000 }),
    );
    expect(result).toEqual({ ok: true });
  });
});