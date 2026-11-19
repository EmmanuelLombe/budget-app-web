import type {
  Bucket,
  Category,
  Income,
  SplitSnapshot,
  Transaction,
} from '../lib/types'
import { buckets, categories, incomes, splitSnapshots, transactions } from './seed'

export async function getBuckets(): Promise<Bucket[]> {
  return [...buckets]
}

export async function getCategories(): Promise<Category[]> {
  return [...categories]
}

export async function getSplitSnapshots(): Promise<SplitSnapshot[]> {
  return [...splitSnapshots]
}

export async function getIncomes(periodId?: string): Promise<Income[]> {
  return periodId ? incomes.filter((i) => i.periodId === periodId) : [...incomes]
}

export async function getTransactions(periodId?: string): Promise<Transaction[]> {
  return periodId
    ? transactions.filter((t) => t.periodId === periodId)
    : [...transactions]
}