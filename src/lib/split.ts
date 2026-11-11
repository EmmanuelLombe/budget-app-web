import type { Cents, ISODate, Income, SplitShare, SplitSnapshot } from './types';

export const TOTAL_BPS = 10000; // 100% in basis points

export type SplitError =
  | { code: 'EMPTY_SPLIT' }
  | { code: 'NON_INTEGER' }
  | { code: 'BAD_TOTAL'; totalBps: number };

/** Checks a list of shares. Returns null if fine, or an error describing the problem. */
export function validateShares(shares: SplitShare[]): SplitError | null {
  if (shares.length === 0) return { code: 'EMPTY_SPLIT' };
  if (shares.some((s) => !Number.isInteger(s.bps) || s.bps < 0)) {
    return { code: 'NON_INTEGER' };
  }
  const totalBps = shares.reduce((sum, s) => sum + s.bps, 0);
  return totalBps === TOTAL_BPS ? null : { code: 'BAD_TOTAL', totalBps };
}

/**
 * Splits an amount across buckets using the largest remainder method.
 * The result always adds up to exactly totalCents.
 */
export function allocate(
  totalCents: Cents,
  shares: SplitShare[],
): Record<string, Cents> {
  if (!Number.isInteger(totalCents)) throw new Error('NON_INTEGER');
  if (totalCents < 0) throw new Error('NEGATIVE_INCOME');
  const err = validateShares(shares);
  if (err) throw new Error(err.code);

  // Step 1: give every bucket its whole-cent share, and remember the leftover bit.
  const rows = shares.map((s, index) => {
    const exact = totalCents * s.bps; // scaled up by 10000, still a whole number
    return {
      bucketId: s.bucketId,
      index,
      cents: Math.floor(exact / TOTAL_BPS),
      remainder: exact % TOTAL_BPS,
    };
  });

  // Step 2: some cents are still unhanded-out. Count them.
  let leftover = totalCents - rows.reduce((sum, r) => sum + r.cents, 0);

  // Step 3: hand them out one at a time to the buckets with the biggest remainders.
  [...rows]
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .forEach((r) => {
      if (leftover > 0) {
        r.cents += 1;
        leftover -= 1;
      }
    });

  // Step 4: turn the rows into a simple { bucketId: cents } result.
  const result: Record<string, Cents> = {};
  for (const r of rows) {
    result[r.bucketId] = (result[r.bucketId] ?? 0) + r.cents;
  }
  return result;
}

/**
 * Gives whatever is missing from 100% to one chosen bucket.
 * Used by the split screen's "give the remainder to…" button.
 * Returns null if the other buckets already total more than 100%.
 */
export function fillRemainder(
  shares: SplitShare[],
  targetBucketId: string,
): SplitShare[] | null {
  const othersTotal = shares
    .filter((s) => s.bucketId !== targetBucketId)
    .reduce((sum, s) => sum + s.bps, 0);

  const remainder = TOTAL_BPS - othersTotal;
  if (remainder < 0) return null;

  return shares.map((s) =>
    s.bucketId === targetBucketId ? { ...s, bps: remainder } : s,
  );
}

/**
 * Finds the split that applies on a given date: the snapshot with the
 * latest effectiveFrom that is on or before that date.
 */
export function splitInForce(
  snapshots: SplitSnapshot[],
  date: ISODate,
): SplitSnapshot {
  let best: SplitSnapshot | null = null;

  for (const snap of snapshots) {
    const startedYet = snap.effectiveFrom <= date;
    const newerThanBest = best === null || snap.effectiveFrom > best.effectiveFrom;
    if (startedYet && newerThanBest) best = snap;
  }

  if (best === null) throw new Error('NO_SPLIT_IN_FORCE');
  return best;
}

/**
 * Splits one income into buckets. A custom allocation on the income wins;
 * otherwise the split in force on the day it was received is used.
 */
export function allocateIncome(
  income: Income,
  snapshots: SplitSnapshot[],
): Record<string, Cents> {
  const shares =
    income.allocation ?? splitInForce(snapshots, income.receivedAt).shares;
  return allocate(income.amountCents, shares);
}

/** Totals the allocation of several incomes, bucket by bucket. */
export function allocateIncomes(
  incomes: Income[],
  snapshots: SplitSnapshot[],
): Record<string, Cents> {
  const totals: Record<string, Cents> = {};

  for (const income of incomes) {
    const parts = allocateIncome(income, snapshots);
    for (const [bucketId, cents] of Object.entries(parts)) {
      totals[bucketId] = (totals[bucketId] ?? 0) + cents;
    }
  }
  return totals;
}