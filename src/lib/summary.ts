import { allocateIncomes } from './split'
import type { Bucket, Cents, Income, SplitSnapshot, Transaction } from './types'

/** A bucket counts as "near" its limit once this percentage is used. */
export const NEAR_LIMIT_PERCENT = 80

export type BucketStatus = 'ok' | 'near' | 'over'

export interface BucketSummary {
  bucketId: string
  name: string
  sortOrder: number
  allocatedCents: Cents
  spentCents: Cents
  remainingCents: Cents // negative when over budget
  usedPercent: number | null // null when nothing was allocated
  status: BucketStatus
}

export interface PeriodSummary {
  incomeCents: Cents
  spentCents: Cents
  remainingCents: Cents
  unassignedSpentCents: Cents // spending that fits no bucket
  buckets: BucketSummary[]
}

export interface SummariseInput {
  periodId: string
  buckets: Bucket[]
  incomes: Income[]
  transactions: Transaction[]
  snapshots: SplitSnapshot[]
}

function statusFor(allocated: Cents, spent: Cents): BucketStatus {
  if (spent > allocated) return 'over'
  // integer maths: spent / allocated >= 80%  <=>  spent * 100 >= allocated * 80
  if (allocated > 0 && spent * 100 >= allocated * NEAR_LIMIT_PERCENT) return 'near'
  return 'ok'
}

export function summarisePeriod({
  periodId,
  buckets,
  incomes,
  transactions,
  snapshots,
}: SummariseInput): PeriodSummary {
  const periodIncomes = incomes.filter((i) => i.periodId === periodId)
  const periodTransactions = transactions.filter((t) => t.periodId === periodId)

  const allocated = allocateIncomes(periodIncomes, snapshots)

  const knownIds = new Set(buckets.map((b) => b.id))
  const spentByBucket: Record<string, Cents> = {}
  let unassignedSpentCents = 0

  for (const t of periodTransactions) {
    if (t.bucketId !== null && knownIds.has(t.bucketId)) {
      spentByBucket[t.bucketId] = (spentByBucket[t.bucketId] ?? 0) + t.amountCents
    } else {
      unassignedSpentCents += t.amountCents
    }
  }

  const summaries: BucketSummary[] = []

  for (const bucket of buckets) {
    const allocatedCents = allocated[bucket.id] ?? 0
    const spentCents = spentByBucket[bucket.id] ?? 0

    // Archived buckets disappear, unless they have data in this period.
    if (bucket.archivedAt && allocatedCents === 0 && spentCents === 0) continue

    summaries.push({
      bucketId: bucket.id,
      name: bucket.name,
      sortOrder: bucket.sortOrder,
      allocatedCents,
      spentCents,
      remainingCents: allocatedCents - spentCents,
      usedPercent:
        allocatedCents > 0 ? Math.round((spentCents * 100) / allocatedCents) : null,
      status: statusFor(allocatedCents, spentCents),
    })
  }

  summaries.sort((a, b) => a.sortOrder - b.sortOrder)

  const incomeCents = periodIncomes.reduce((sum, i) => sum + i.amountCents, 0)
  const spentCents = periodTransactions.reduce((sum, t) => sum + t.amountCents, 0)

  return {
    incomeCents,
    spentCents,
    remainingCents: incomeCents - spentCents,
    unassignedSpentCents,
    buckets: summaries,
  }
}