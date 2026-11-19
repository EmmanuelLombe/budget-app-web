import { describe, expect, it } from 'vitest'
import { summarisePeriod } from './summary'
import type {
  Bucket,
  Cents,
  Income,
  SplitSnapshot,
  Transaction,
} from './types'

const buckets: Bucket[] = [
  { id: 'a', name: 'Needs', sortOrder: 1 },
  { id: 'b', name: 'Wants', sortOrder: 2 },
]

const snapshots: SplitSnapshot[] = [
  {
    effectiveFrom: '2026-11-01',
    shares: [
      { bucketId: 'a', bps: 5000 },
      { bucketId: 'b', bps: 5000 },
    ],
  },
]

function income(amountCents: Cents, periodId = 'p1'): Income {
  return {
    id: 'i',
    periodId,
    amountCents,
    receivedAt: '2026-11-05',
    createdAt: '2026-11-05T08:00:00Z',
  }
}

function expense(
  amountCents: Cents,
  bucketId: string | null,
  periodId = 'p1',
): Transaction {
  return {
    id: 't',
    periodId,
    amountCents,
    categoryId: 'c',
    bucketId,
    occurredAt: '2026-11-06',
    createdAt: '2026-11-06T12:00:00Z',
  }
}

function run(incomes: Income[], transactions: Transaction[], bs = buckets) {
  return summarisePeriod({
    periodId: 'p1',
    buckets: bs,
    incomes,
    transactions,
    snapshots,
  })
}

function bucketOf(summary: ReturnType<typeof run>, id: string) {
  const found = summary.buckets.find((b) => b.bucketId === id)
  if (!found) throw new Error(`bucket ${id} missing from summary`)
  return found
}

describe('summarisePeriod', () => {
  it('works out allocated, spent and remaining per bucket', () => {
    const a = bucketOf(run([income(100000)], [expense(20000, 'a')]), 'a')
    expect(a.allocatedCents).toBe(50000)
    expect(a.spentCents).toBe(20000)
    expect(a.remainingCents).toBe(30000)
    expect(a.usedPercent).toBe(40)
    expect(a.status).toBe('ok')
  })

  it('marks a bucket over budget with negative remaining', () => {
    const a = bucketOf(run([income(100000)], [expense(60000, 'a')]), 'a')
    expect(a.remainingCents).toBe(-10000)
    expect(a.usedPercent).toBe(120)
    expect(a.status).toBe('over')
  })

  it('marks a bucket near its limit at exactly 80%', () => {
    const at80 = bucketOf(run([income(100000)], [expense(40000, 'a')]), 'a')
    const below = bucketOf(run([income(100000)], [expense(39999, 'a')]), 'a')
    expect(at80.status).toBe('near')
    expect(below.status).toBe('ok')
  })

  it('handles a bucket with nothing allocated', () => {
    const withGoals: Bucket[] = [...buckets, { id: 'c', name: 'Goals', sortOrder: 3 }]
    const empty = bucketOf(run([income(100000)], [], withGoals), 'c')
    expect(empty.allocatedCents).toBe(0)
    expect(empty.usedPercent).toBeNull()
    expect(empty.status).toBe('ok')

    const overspent = bucketOf(run([income(100000)], [expense(100, 'c')], withGoals), 'c')
    expect(overspent.usedPercent).toBeNull()
    expect(overspent.status).toBe('over')
  })

  it('counts spending with no bucket separately, and totals still add up', () => {
    const s = run([income(100000)], [expense(5000, null), expense(3000, 'a')])
    expect(s.unassignedSpentCents).toBe(5000)
    expect(s.spentCents).toBe(8000)
    expect(s.remainingCents).toBe(92000)
    const bucketSpent = s.buckets.reduce((sum, b) => sum + b.spentCents, 0)
    expect(bucketSpent + s.unassignedSpentCents).toBe(s.spentCents)
  })

  it('only counts the requested period', () => {
    const s = run(
      [income(100000), income(900000, 'p2')],
      [expense(1000, 'a'), expense(7000, 'a', 'p2')],
    )
    expect(s.incomeCents).toBe(100000)
    expect(s.spentCents).toBe(1000)
  })

  it('hides archived buckets unless they have data in the period', () => {
    const archived: Bucket = {
      id: 'd',
      name: 'Old',
      sortOrder: 3,
      archivedAt: '2026-10-01T00:00:00Z',
    }
    const bs = [...buckets, archived]

    const hidden = run([income(100000)], [], bs)
    expect(hidden.buckets.map((b) => b.bucketId)).toEqual(['a', 'b'])

    const shown = run([income(100000)], [expense(2500, 'd')], bs)
    expect(shown.buckets.map((b) => b.bucketId)).toEqual(['a', 'b', 'd'])
  })
})