import type { Bps } from './types'
import { TOTAL_BPS } from './split'

export type PercentError =
  | 'EMPTY'
  | 'NOT_A_NUMBER'
  | 'TOO_PRECISE'
  | 'OUT_OF_RANGE'

export type PercentResult =
  | { ok: true; bps: Bps }
  | { ok: false; error: PercentError }

/**
 * Turns what a person typed ("40", "12.5", "12,5", "40%") into basis points.
 * Works on the text directly, never on decimals, so there are no
 * floating-point surprises.
 */
export function parsePercentToBps(input: string): PercentResult {
  const text = input.trim().replace(/%$/, '').trim()
  if (text === '') return { ok: false, error: 'EMPTY' }

  // Digits, then optionally a . or , and more digits. Nothing else.
  const match = /^(\d*)(?:[.,](\d*))?$/.exec(text)
  if (!match) return { ok: false, error: 'NOT_A_NUMBER' }

  const whole = match[1] ?? ''
  const fraction = match[2] ?? ''
  if (whole === '' && fraction === '') {
    return { ok: false, error: 'NOT_A_NUMBER' }
  }
  if (fraction.length > 2) return { ok: false, error: 'TOO_PRECISE' }

  const bps = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (bps > TOTAL_BPS) return { ok: false, error: 'OUT_OF_RANGE' }

  return { ok: true, bps }
}

/** Basis points back to text for an input box: 1250 -> "12.5", 4000 -> "40". */
export function formatBps(bps: Bps): string {
  const whole = Math.floor(bps / 100)
  const fraction = bps % 100
  if (fraction === 0) return String(whole)
  return `${whole}.${String(fraction).padStart(2, '0').replace(/0$/, '')}`
}