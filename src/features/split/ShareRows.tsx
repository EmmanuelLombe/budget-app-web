import { useState } from 'react'
import { formatZAR } from '../../lib/money'
import { formatBps, type PercentError } from '../../lib/percent'
import { TOTAL_BPS, allocate, validateShares } from '../../lib/split'
import type { ShareDraft } from './useShareDraft'

const ERROR_TEXT: Record<PercentError, string> = {
  EMPTY: 'Enter a number (0 if none)',
  NOT_A_NUMBER: 'Numbers only, like 40 or 12.5',
  TOO_PRECISE: 'At most 2 decimal places',
  OUT_OF_RANGE: 'Can’t be more than 100',
}

interface Props {
  draft: ShareDraft
  /** The amount used for the rand previews under each row. */
  exampleCents: number
  /** Keeps element ids unique if two editors are ever on one page. */
  idPrefix: string
}

export default function ShareRows({ draft, exampleCents, idPrefix }: Props) {
  const { rows, texts, shares, hasInvalid, totalBps, diff } = draft
  const [remainderTarget, setRemainderTarget] = useState(rows[0]?.bucket.id ?? '')

  // Exact amounts once the split is valid, a rounded-down estimate while editing.
  const exact =
    !hasInvalid && validateShares(shares) === null
      ? allocate(exampleCents, shares)
      : null
  const previewCents = (id: string, bps: number) =>
    exact ? exact[id] : Math.floor((exampleCents * bps) / TOTAL_BPS)

  const totalLabel =
    diff === 0
      ? '100%'
      : diff > 0
        ? `${formatBps(totalBps)}%, ${formatBps(diff)}% still unassigned`
        : `${formatBps(totalBps)}%, ${formatBps(-diff)}% over`

  return (
    <div>
      <ul className="space-y-4">
        {rows.map(({ bucket, result }) => {
          const bps = result.ok ? result.bps : 0
          const inputId = `${idPrefix}-${bucket.id}`
          return (
            <li key={bucket.id}>
              <div className="flex items-center justify-between gap-4">
                <label htmlFor={inputId} className="font-medium">
                  {bucket.name}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={inputId}
                    inputMode="decimal"
                    autoComplete="off"
                    value={texts[bucket.id] ?? ''}
                    onChange={(e) => draft.setText(bucket.id, e.target.value)}
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
                  `${formatZAR(previewCents(bucket.id, bps))} of ${formatZAR(exampleCents)}`
                )}
              </p>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 border-t border-black/10 pt-4 dark:border-white/10" role="status">
        <p className={diff === 0 ? 'font-medium' : 'font-medium text-amber-600 dark:text-amber-500'}>
          Total: {totalLabel}
        </p>

        {!hasInvalid && diff > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor={`${idPrefix}-remainder`} className="text-sm">
              Give the remaining {formatBps(diff)}% to
            </label>
            <select
              id={`${idPrefix}-remainder`}
              value={remainderTarget}
              onChange={(e) => setRemainderTarget(e.target.value)}
              className="rounded-lg border border-black/15 bg-transparent px-2 py-2 dark:border-white/20"
            >
              {rows.map(({ bucket }) => (
                <option key={bucket.id} value={bucket.id}>
                  {bucket.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => draft.giveRemainder(remainderTarget)}
              className="rounded-lg border border-black/15 px-3 py-2 dark:border-white/20"
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  )
}