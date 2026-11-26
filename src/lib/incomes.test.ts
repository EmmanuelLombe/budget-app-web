import { describe, expect, it } from 'vitest'
import { isValidISODate, validateIncomeInput } from './incomes'

const ok = { amountCents: 2_000_000, receivedAt: '2026-11-25' }

describe('isValidISODate', () => {
  it.each(['2026-11-25', '2024-02-29'])('accepts %s', (d) => {
    expect(isValidISODate(d)).toBe(true)
  })
  it.each(['2026-02-30', '2025-02-29', '2026-13-01', '26-11-25', '', 'today'])(
    'rejects "%s"',
    (d) => {
      expect(isValidISODate(d)).toBe(false)
    },
  )
})

describe('validateIncomeInput', () => {
  it('accepts a normal income', () => {
    expect(validateIncomeInput(ok)).toBeNull()
  })
  it('rejects zero, negative and fractional amounts', () => {
    for (const amountCents of [0, -100, 10.5]) {
      expect(validateIncomeInput({ ...ok, amountCents })).toEqual({
        code: 'BAD_AMOUNT',
      })
    }
  })
  it('rejects a bad date', () => {
    expect(validateIncomeInput({ ...ok, receivedAt: '2026-02-30' })).toEqual({
      code: 'BAD_DATE',
    })
  })
  it('accepts a custom allocation that totals 100%', () => {
    const allocation = [
      { bucketId: 'a', bps: 7000 },
      { bucketId: 'b', bps: 3000 },
    ]
    expect(validateIncomeInput({ ...ok, allocation })).toBeNull()
  })
  it('rejects a custom allocation that does not total 100%', () => {
    expect(
      validateIncomeInput({ ...ok, allocation: [{ bucketId: 'a', bps: 5000 }] }),
    ).toEqual({ code: 'BAD_TOTAL', totalBps: 5000 })
  })
})