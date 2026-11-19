import { describe, expect, it } from 'vitest'
import { periodForDate } from '../lib/periods'
import { allocateIncomes, validateShares } from '../lib/split'
import { buckets, categories, incomes, splitSnapshots, transactions } from './seed'

describe('seed data', () => {
  it('has valid splits', () => {
    for (const snap of splitSnapshots) {
      expect(validateShares(snap.shares)).toBeNull()
    }
  })

  it('allocates every cent of income', () => {
    const totals = allocateIncomes(incomes, splitSnapshots)
    const allocated = Object.values(totals).reduce((a, b) => a + b, 0)
    const received = incomes.reduce((sum, i) => sum + i.amountCents, 0)
    expect(allocated).toBe(received)
  })

  it('uses positive whole-cent amounts', () => {
    for (const t of transactions) {
      expect(Number.isInteger(t.amountCents)).toBe(true)
      expect(t.amountCents).toBeGreaterThan(0)
    }
  })

  it('links each transaction to a real category and bucket', () => {
    for (const t of transactions) {
      const category = categories.find((c) => c.id === t.categoryId)
      expect(category).toBeDefined()
      expect(t.bucketId).toBe(category?.bucketId ?? null)
      if (t.bucketId) {
        expect(buckets.some((b) => b.id === t.bucketId)).toBe(true)
      }
    }
  })

  it('puts every record in the right period', () => {
    for (const t of transactions) {
      expect(t.periodId).toBe(periodForDate(t.occurredAt).id)
    }
    for (const i of incomes) {
      expect(i.periodId).toBe(periodForDate(i.receivedAt).id)
    }
  })

  it('has unique ids', () => {
    const ids = [...transactions.map((t) => t.id), ...incomes.map((i) => i.id)]
    expect(new Set(ids).size).toBe(ids.length)
  })
})