import { useMemo, useState } from 'react'
import Card from '../../components/ui/Card'
import { todayISO } from '../../lib/dates'
import {formatZAR as formatRand} from '../../lib/money'
import {
  formatBps,
  parsePercentToBps,
  type PercentError,
} from '../../lib/percent'
import {
  TOTAL_BPS,
  allocate,
  fillRemainder,
  splitInForce,
  validateShares,
} from '../../lib/split'
import type { SplitShare } from '../../lib/types'
import { useBudgetStore } from '../../store/useBudgetStore'

const ERROR_TEXT: Record<PercentError, string> = {
  EMPTY: 'Enter a number (0 if none)',
  NOT_A_NUMBER: 'Numbers only, like 40 or 12.5',
  TOO_PRECISE: 'At most 2 decimal places',
  OUT_OF_RANGE: 'Can’t be more than 100',
}


export default function SplitEditor() {
  const buckets = useBudgetStore((s) => s.buckets)
  const snapshots = useBudgetStore((s) => s.splitSnapshots)
  const incomes = useBudgetStore((s) => s.incomes)
  const saveSplit = useBudgetStore((s) => s.saveSplit)

  const today = todayISO()

  const active = useMemo(
    () =>
      buckets.filter((b) => !b.archivedAt).sort((a, b) => a.sortOrder - b.sortOrder),
    [buckets],
  )

  const current: SplitShare[] = useMemo(() => {
    try {
      return splitInForce(snapshots, today).shares
    } catch {
      return []
    }
  }, [snapshots, today])

  const savedBps = (bucketId: string) =>
    current.find((s) => s.bucketId === bucketId)?.bps ?? 0

  // What's typed in each box, as text. Starts from the split in force today.
  const [texts, setTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries(active.map((b) => [b.id, formatBps(savedBps(b.id))])),
  )
  const [remainderTarget, setRemainderTarget] = useState(active[0]?.id ?? '')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  // Turn the typed text into numbers. Invalid boxes count as 0 for the total.
  const rows = active.map((bucket) => ({
    bucket,
    result: parsePercentToBps(texts[bucket.id] ?? ''),
  }))
  const shares: SplitShare[] = rows.map((r) => ({
    bucketId: r.bucket.id,
    bps: r.result.ok ? r.result.bps : 0,
  }))
  const hasInvalid = rows.some((r) => !r.result.ok)
  const totalBps = shares.reduce((sum, s) => sum + s.bps, 0)
  const diff = TOTAL_BPS - totalBps
  const dirty = shares.some((s) => s.bps !== savedBps(s.bucketId))
  const canSave = !hasInvalid && diff === 0 && dirty

  // Example amount for the rand preview: the most recent income, or R10,000.
  const latest = [...incomes].sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))[0]
  const exampleCents = latest?.amountCents ?? 1_000_000
  const exact =
    !hasInvalid && validateShares(shares) === null
      ? allocate(exampleCents, shares)
      : null
  const previewCents = (id: string, bps: number) =>
    exact ? exact[id] : Math.floor((exampleCents * bps) / TOTAL_BPS)

  function setText(bucketId: string, value: string) {
    setTexts((t) => ({ ...t, [bucketId]: value }))
    setMessage(null)
  }

  function giveRemainder() {
    const filled = fillRemainder(shares, remainderTarget)
    if (!filled) return
    setTexts(Object.fromEntries(filled.map((s) => [s.bucketId, formatBps(s.bps)])))
    setMessage(null)
  }

  function save() {
    const error = saveSplit(shares, today)
    setMessage(
      error
        ? { ok: false, text: 'That split couldn’t be saved. Check the total is 100%.' }
        : { ok: true, text: 'Saved. It applies to income from today onwards.' },
    )
  }

  const totalLabel =
    diff === 0
      ? '100%'
      : diff > 0
        ? `${formatBps(totalBps)}%, ${formatBps(diff)}% still unassigned`
        : `${formatBps(totalBps)}%, ${formatBps(-diff)}% over`

  return (
    <Card>
      <h2 className="text-xl">Income split</h2>
      <p className="mt-1 text-sm text-muted">
        Each bit of income is divided between your buckets using these
        percentages. Previews use {formatRand(exampleCents)}
        {latest ? ' (your latest income)' : ''}.
      </p>

      <ul className="mt-6 space-y-4">
        {rows.map(({ bucket, result }) => {
          const bps = result.ok ? result.bps : 0
          return (
            <li key={bucket.id}>
              <div className="flex items-center justify-between gap-4">
                <label htmlFor={`split-${bucket.id}`} className="font-medium">
                  {bucket.name}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`split-${bucket.id}`}
                    inputMode="decimal"
                    value={texts[bucket.id] ?? ''}
                    onChange={(e) => setText(bucket.id, e.target.value)}
                    aria-invalid={!result.ok}
                    className="w-24 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-right dark:border-white/20"
                  />
                  <span aria-hidden="true">%</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted">
                {!result.ok ? (
                  <span className="text-red-600 dark:text-red-400">
                    {ERROR_TEXT[result.error]}
                  </span>
                ) : bps === 0 ? (
                  'No share'
                ) : (
                  `${formatRand(previewCents(bucket.id, bps))} of ${formatRand(exampleCents)}`
                )}
              </p>
            </li>
          )
        })}
      </ul>

      <div
        className="mt-6 border-t border-black/10 pt-4 dark:border-white/10"
        role="status"
      >
        <p
          className={
            diff === 0
              ? 'font-medium'
              : 'font-medium text-amber-700 dark:text-amber-400'
          }
        >
          Total: {totalLabel}
        </p>

        {!hasInvalid && diff > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor="remainder-target" className="text-sm">
              Give the remaining {formatBps(diff)}% to
            </label>
            <select
              id="remainder-target"
              value={remainderTarget}
              onChange={(e) => setRemainderTarget(e.target.value)}
              className="rounded-lg border border-black/15 bg-transparent px-2 py-2 dark:border-white/20"
            >
              {active.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={giveRemainder}
              className="rounded-lg border border-black/15 px-3 py-2 dark:border-white/20"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          Save split
        </button>
        {message && (
          <p
            role="status"
            className={`mt-3 text-sm ${message.ok ? 'text-muted' : 'text-red-600 dark:text-red-400'}`}
          >
            {message.text}
          </p>
        )}
        <p className="mt-3 text-sm text-muted">
          Income dated before today keeps the split it was received under.
        </p>
      </div>
    </Card>
  )
}