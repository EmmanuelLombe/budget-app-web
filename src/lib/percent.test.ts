import { describe, expect, it } from 'vitest'
import { formatBps, parsePercentToBps } from './percent'

describe('parsePercentToBps', () => {
  it.each([
    ['40', 4000],
    ['12.5', 1250],
    ['12,5', 1250],
    ['33.33', 3333],
    [' 40% ', 4000],
    ['0', 0],
    ['100', 10000],
    ['.5', 50],
  ])('accepts %s', (input, bps) => {
    expect(parsePercentToBps(input)).toEqual({ ok: true, bps })
  })

  it.each([
    ['', 'EMPTY'],
    ['   ', 'EMPTY'],
    ['abc', 'NOT_A_NUMBER'],
    ['-5', 'NOT_A_NUMBER'],
    ['1e2', 'NOT_A_NUMBER'],
    ['.', 'NOT_A_NUMBER'],
    ['12.345', 'TOO_PRECISE'],
    ['101', 'OUT_OF_RANGE'],
  ])('rejects "%s" with %s', (input, error) => {
    expect(parsePercentToBps(input)).toEqual({ ok: false, error })
  })
})

describe('formatBps', () => {
  it('formats common values', () => {
    expect(formatBps(4000)).toBe('40')
    expect(formatBps(1250)).toBe('12.5')
    expect(formatBps(1205)).toBe('12.05')
  })

  it('round-trips through the parser', () => {
    for (const bps of [0, 1, 50, 1205, 1250, 3333, 10000]) {
      expect(parsePercentToBps(formatBps(bps))).toEqual({ ok: true, bps })
    }
  })
})