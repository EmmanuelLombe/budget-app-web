import { describe, expect, it } from 'vitest'
import { splitInForce, upsertSnapshot } from './split'
import type { SplitSnapshot } from './types'

const old: SplitSnapshot = {
  effectiveFrom: '2026-01-01',
  shares: [{ bucketId: 'x', bps: 10000 }],
}
const mid: SplitSnapshot = {
  effectiveFrom: '2026-06-01',
  shares: [{ bucketId: 'x', bps: 10000 }],
}

describe('upsertSnapshot', () => {
  it('adds a snapshot with a new date, keeping the list sorted', () => {
    const next: SplitSnapshot = { ...old, effectiveFrom: '2026-03-01' }
    const result = upsertSnapshot([old, mid], next)
    expect(result.map((s) => s.effectiveFrom)).toEqual([
      '2026-01-01',
      '2026-03-01',
      '2026-06-01',
    ])
  })

  it('replaces a snapshot that has the same date', () => {
    const replacement: SplitSnapshot = {
      effectiveFrom: '2026-06-01',
      shares: [
        { bucketId: 'x', bps: 6000 },
        { bucketId: 'y', bps: 4000 },
      ],
    }
    const result = upsertSnapshot([old, mid], replacement)
    expect(result).toHaveLength(2)
    expect(splitInForce(result, '2026-06-01').shares).toEqual(replacement.shares)
  })

  it('does not change the list it was given', () => {
    const input = [old]
    upsertSnapshot(input, mid)
    expect(input).toEqual([old])
  })
})