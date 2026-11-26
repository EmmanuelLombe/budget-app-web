import { validateShares, type SplitError } from './split'
import type { Cents, ISODate, SplitShare } from './types'

export interface IncomeInput {
  amountCents: Cents
  receivedAt: ISODate
  label?: string
  allocation?: SplitShare[] // custom split for this income only
}

export type IncomeError =
  | { code: 'BAD_AMOUNT' }
  | { code: 'BAD_DATE' }
  | { code: 'NOT_FOUND' }
  | SplitError

/** True for real calendar dates written as YYYY-MM-DD. */
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  )
}

/** Returns null if the income is fine, or the first problem found. */
export function validateIncomeInput(input: IncomeInput): IncomeError | null {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return { code: 'BAD_AMOUNT' }
  }
  if (!isValidISODate(input.receivedAt)) return { code: 'BAD_DATE' }
  if (input.allocation) return validateShares(input.allocation)
  return null
}