import { useState } from 'react'
import { formatBps, parsePercentToBps } from '../../lib/percent'
import { TOTAL_BPS, fillRemainder } from '../../lib/split'
import type { Bucket, SplitShare } from '../../lib/types'

function toTexts(active: Bucket[], shares: SplitShare[]): Record<string, string> {
  return Object.fromEntries(
    active.map((b) => [
      b.id,
      formatBps(shares.find((s) => s.bucketId === b.id)?.bps ?? 0),
    ]),
  )
}

/**
 * Holds what's typed in a set of percentage boxes and works out
 * the totals. `initial` is only used on the first render; use reset() later.
 */
export function useShareDraft(
  active: Bucket[],
  initial: SplitShare[],
  onEdit?: () => void,
) {
  const [texts, setTexts] = useState(() => toTexts(active, initial))

  const rows = active.map((bucket) => ({
    bucket,
    result: parsePercentToBps(texts[bucket.id] ?? ''),
  }))
  // An invalid box counts as 0 for the total.
  const shares: SplitShare[] = rows.map((r) => ({
    bucketId: r.bucket.id,
    bps: r.result.ok ? r.result.bps : 0,
  }))
  const hasInvalid = rows.some((r) => !r.result.ok)
  const totalBps = shares.reduce((sum, s) => sum + s.bps, 0)
  const diff = TOTAL_BPS - totalBps

  return {
    rows,
    texts,
    shares,
    hasInvalid,
    totalBps,
    diff,
    /** Every box is a valid number and they total exactly 100%. */
    valid: !hasInvalid && diff === 0,
    setText(bucketId: string, value: string) {
      setTexts((t) => ({ ...t, [bucketId]: value }))
      onEdit?.()
    },
    giveRemainder(targetBucketId: string) {
      const filled = fillRemainder(shares, targetBucketId)
      if (!filled) return
      setTexts(toTexts(active, filled))
      onEdit?.()
    },
    reset(next: SplitShare[]) {
      setTexts(toTexts(active, next))
    },
  }
}

export type ShareDraft = ReturnType<typeof useShareDraft>   