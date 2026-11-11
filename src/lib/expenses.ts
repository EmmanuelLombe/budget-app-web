import type { Bps, Cents } from './types';

export interface ExpenseCheckInput {
  bucketId: string | null; // null = unallocated
  isArchived: boolean;
  shareBps: Bps;           // share in the split in force on the expense date
  allocatedCents: Cents;   // income allocated to this bucket in the expense's period
  spentCents: Cents;       // already spent from this bucket in that period
}

export type ExpenseCheck =
  | { ok: true }
  | { ok: false; reason: 'ARCHIVED' | 'NO_SHARE_OR_BALANCE' };

export function canLogExpense(input: ExpenseCheckInput): ExpenseCheck {
  if (input.bucketId === null) return { ok: true };
  if (input.isArchived) return { ok: false, reason: 'ARCHIVED' };

  const hasShare = input.shareBps > 0;
  const hasUnspentMoney = input.allocatedCents - input.spentCents > 0;

  return hasShare || hasUnspentMoney
    ? { ok: true }
    : { ok: false, reason: 'NO_SHARE_OR_BALANCE' };
}