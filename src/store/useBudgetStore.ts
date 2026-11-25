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
import { upsertSnapshot, validateShares, type SplitError } from '../lib/split'
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

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set) => ({
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

// TEMPORARY: lets us poke the store from the browser console. Remove later.
if (import.meta.env.DEV) Object.assign(window, { budgetStore: useBudgetStore })