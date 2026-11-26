import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  Bucket,
  Category,
  ISODate,
  Income,
  SplitShare,
  SplitSnapshot,
  Transaction,
} from '../lib/types'
import {
  validateIncomeInput,
  type IncomeError,
  type IncomeInput,
} from '../lib/incomes'
import { periodForDate } from '../lib/periods'
import {
  splitInForce,
  upsertSnapshot,
  validateShares,
  type SplitError,
} from '../lib/split'
import * as rules from '../lib/buckets'
import type { MoveDirection } from '../lib/buckets'
import { todayISO } from '../lib/dates'
import {
  buckets,
  categories,
  incomes,
  splitSnapshots,
  transactions,
} from '../data/seed'

interface BudgetData {
  buckets: Bucket[]
  categories: Category[]
  splitSnapshots: SplitSnapshot[]
  incomes: Income[]
  transactions: Transaction[]
}

interface BudgetActions {
  /** Saves a new default split from the given date. Returns an error, or null on success. */
  saveSplit: (shares: SplitShare[], effectiveFrom: ISODate) => SplitError | null
  addIncome: (input: IncomeInput) => IncomeError | null
  /** Replaces the editable fields of an income. Leaving allocation out removes a custom split. */
  updateIncome: (id: string, input: IncomeInput) => IncomeError | null
  deleteIncome: (id: string) => void
  /** Bucket actions return a message to show the user, or null on success. */
  addBucket: (name: string) => string | null
  renameBucket: (id: string, name: string) => string | null
  archiveBucket: (id: string) => string | null
  restoreBucket: (id: string) => string | null
  moveBucket: (id: string, direction: MoveDirection) => string | null
  resetToDemo: () => void
}

type BudgetStore = BudgetData & BudgetActions

/** A fresh copy of the demo data. A function, so each call gives new arrays. */
function demoData(): BudgetData {
  return {
    buckets: [...buckets],
    categories: [...categories],
    splitSnapshots: [...splitSnapshots],
    incomes: [...incomes],
    transactions: [...transactions],
  }
}

/** An empty label counts as no label. */
function cleanLabel(label: string | undefined): string | undefined {
  const trimmed = label?.trim()
  return trimmed ? trimmed : undefined
}

/** The shares of the split in force today. No split yet means no bucket has a share. */
function sharesToday(snapshots: SplitSnapshot[]): SplitShare[] {
  try {
    return splitInForce(snapshots, todayISO()).shares
  } catch {
    return []
  }
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      ...demoData(),

      saveSplit: (shares, effectiveFrom) => {
        const error = validateShares(shares)
        if (error) return error
        set((state) => ({
          splitSnapshots: upsertSnapshot(state.splitSnapshots, {
            effectiveFrom,
            shares,
          }),
        }))
        return null
      },

      addIncome: (input) => {
        const error = validateIncomeInput(input)
        if (error) return error
        const income: Income = {
          id: crypto.randomUUID(),
          periodId: periodForDate(input.receivedAt).id,
          amountCents: input.amountCents,
          receivedAt: input.receivedAt,
          createdAt: new Date().toISOString(),
          label: cleanLabel(input.label),
          allocation: input.allocation,
        }
        set((state) => ({ incomes: [...state.incomes, income] }))
        return null
      },

      updateIncome: (id, input) => {
        const existing = get().incomes.find((i) => i.id === id)
        if (!existing) return { code: 'NOT_FOUND' }
        const error = validateIncomeInput(input)
        if (error) return error
        const updated: Income = {
          id: existing.id,
          createdAt: existing.createdAt,
          periodId: periodForDate(input.receivedAt).id, // the date may have moved to another period
          amountCents: input.amountCents,
          receivedAt: input.receivedAt,
          label: cleanLabel(input.label),
          allocation: input.allocation,
        }
        set((state) => ({
          incomes: state.incomes.map((i) => (i.id === id ? updated : i)),
        }))
        return null
      },

      deleteIncome: (id) =>
        set((state) => ({ incomes: state.incomes.filter((i) => i.id !== id) })),

      addBucket: (name) => {
        const result = rules.addBucket(get().buckets, name, crypto.randomUUID())
        if ('error' in result) return result.error
        set({ buckets: result.buckets })
        return null
      },

      renameBucket: (id, name) => {
        const result = rules.renameBucket(get().buckets, id, name)
        if ('error' in result) return result.error
        set({ buckets: result.buckets })
        return null
      },

      archiveBucket: (id) => {
        const state = get()
        const result = rules.archiveBucket(
          state.buckets,
          id,
          sharesToday(state.splitSnapshots),
          new Date().toISOString(),
        )
        if ('error' in result) return result.error
        // One set() so no screen ever sees buckets and categories out of step.
        set({
          buckets: result.buckets,
          categories: rules.detachCategories(state.categories, id),
        })
        return null
      },

      restoreBucket: (id) => {
        const result = rules.restoreBucket(get().buckets, id)
        if ('error' in result) return result.error
        set({ buckets: result.buckets })
        return null
      },

      moveBucket: (id, direction) => {
        const result = rules.moveBucket(get().buckets, id, direction)
        if ('error' in result) return result.error
        set({ buckets: result.buckets })
        return null
      },

      resetToDemo: () => set(demoData()),
    }),
    {
      name: 'budget-app-data',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Save only the data, not the action functions.
      partialize: (state) => ({
        buckets: state.buckets,
        categories: state.categories,
        splitSnapshots: state.splitSnapshots,
        incomes: state.incomes,
        transactions: state.transactions,
      }),
    },
  ),
)

