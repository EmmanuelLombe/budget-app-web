import { useMemo, useState, type FormEvent } from 'react'
import Card from '../../components/ui/Card'
import { todayISO } from '../../lib/dates'
import { isValidISODate, type IncomeError } from '../../lib/incomes'
import { formatZAR, parseToCents } from '../../lib/money'
import { allocate, splitInForce } from '../../lib/split'
import type { Cents, Income, SplitShare } from '../../lib/types'
import ShareRows from '../split/ShareRows' // NEW
import { useShareDraft } from '../split/useShareDraft' // NEW
import { useBudgetStore } from '../../store/useBudgetStore'

const ERROR_TEXT: Record<IncomeError['code'], string> = {
  BAD_AMOUNT: 'Enter an amount above R0.',
  BAD_DATE: 'Pick a valid date.',
  NOT_FOUND: 'That income no longer exists.',
  EMPTY_SPLIT: 'The split for this income is empty.',
  NON_INTEGER: 'The split for this income has an invalid percentage.',
  BAD_TOTAL: 'The split for this income doesn’t total 100%.',
}

/** 150000 -> "1500", 150050 -> "1500,50". For filling the box when editing. */
function centsToInput(cents: Cents): string {
  const rands = Math.floor(cents / 100)
  const rest = cents % 100
  return rest === 0 ? String(rands) : `${rands},${String(rest).padStart(2, '0')}`
}

interface Props {
  editing?: Income
  onDone: () => void
}

export default function IncomeForm({ editing, onDone }: Props) {
  const buckets = useBudgetStore((s) => s.buckets)
  const snapshots = useBudgetStore((s) => s.splitSnapshots)
  const addIncome = useBudgetStore((s) => s.addIncome)
  const updateIncome = useBudgetStore((s) => s.updateIncome)

  const [amountText, setAmountText] = useState(
    editing ? centsToInput(editing.amountCents) : '',
  )
  const [date, setDate] = useState(editing?.receivedAt ?? todayISO())
  const [label, setLabel] = useState(editing?.label ?? '')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [custom, setCustom] = useState(Boolean(editing?.allocation)) // NEW

  // NEW: the boxes for a custom split
  const active = useMemo(
    () =>
      buckets.filter((b) => !b.archivedAt).sort((a, b) => a.sortOrder - b.sortOrder),
    [buckets],
  )
  function defaultSharesFor(onDate: string): SplitShare[] {
    try {
      return splitInForce(snapshots, onDate).shares
    } catch {
      return []
    }
  }
  const draft = useShareDraft(
    active,
    editing?.allocation ?? defaultSharesFor(date),
    () => {
      setError(null)
      setNotice(null)
    },
  )
  function toggleCustom(checked: boolean) {
    setCustom(checked)
    // Start from the existing custom split, or the normal split to tweak.
    if (checked) draft.reset(editing?.allocation ?? defaultSharesFor(date))
    setError(null)
    setNotice(null)
  }

  const cents = parseToCents(amountText)
  const amountInvalid = amountText.trim() !== '' && cents === null
  const dateValid = isValidISODate(date)
  const canSave =
    cents !== null && cents > 0 && dateValid && (!custom || draft.valid) // CHANGED

  const bucketName = (id: string) =>
    buckets.find((b) => b.id === id)?.name ?? 'Unknown bucket'

  // How this income would divide under the normal split. CHANGED: not used for custom splits,
  // because the custom rows below already show the amounts.
  const preview = (() => {
    if (custom || !cents || cents <= 0 || !dateValid) return null
    try {
      const shares = splitInForce(snapshots, date).shares
      const parts = allocate(cents, shares)
      return shares
        .filter((s) => s.bps > 0)
        .map((s) => ({
          id: s.bucketId,
          name: bucketName(s.bucketId),
          cents: parts[s.bucketId] ?? 0,
        }))
    } catch {
      return 'NO_SPLIT' as const
    }
  })()

  function submit(e: FormEvent) {
    e.preventDefault()
    if (cents === null || !canSave) return
    const input = {
      amountCents: cents,
      receivedAt: date,
      label,
      // CHANGED: unticking the box removes a custom split
      allocation: custom ? draft.shares.filter((s) => s.bps > 0) : undefined,
    }
    const err = editing ? updateIncome(editing.id, input) : addIncome(input)
    if (err) {
      setError(ERROR_TEXT[err.code])
      setNotice(null)
      return
    }
    setError(null)
    if (!editing) {
      setAmountText('')
      setLabel('')
      setCustom(false) // NEW
      setNotice('Income added.')
    }
    onDone()
  }

  const inputClass =
    'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20'

  return (
    <Card>
      <h2 className="text-xl">{editing ? 'Edit income' : 'Add income'}</h2>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="income-amount" className="block text-sm font-medium">
            Amount (R)
          </label>
          <input
            id="income-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 15 000,50"
            value={amountText}
            onChange={(e) => {
              setAmountText(e.target.value)
              setError(null)
              setNotice(null)
            }}
            aria-invalid={amountInvalid}
            className={`mt-1 ${inputClass}`}
          />
          {amountInvalid && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              Numbers only, with up to 2 decimals, like 15000 or 15 000,50.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="income-date" className="block text-sm font-medium">
            Date received
          </label>
          <input
            id="income-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setError(null)
              setNotice(null)
            }}
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div>
          <label htmlFor="income-label" className="block text-sm font-medium">
            Label <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="income-label"
            value={label}
            maxLength={60}
            placeholder="e.g. Salary, Freelance"
            onChange={(e) => setLabel(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>

        {/* NEW: custom split */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={custom}
              onChange={(e) => toggleCustom(e.target.checked)}
            />
            Use a custom split for this income
          </label>
          {custom && (
            <div className="mt-3 rounded-lg border border-black/10 p-4 dark:border-white/10">
              <p className="mb-4 text-sm text-muted">
                Only this income uses these percentages. Your normal split
                stays as it is.
              </p>
              <ShareRows
                draft={draft}
                exampleCents={cents && cents > 0 ? cents : 1_000_000}
                idPrefix="income-split"
              />
            </div>
          )}
        </div>

        {preview === 'NO_SPLIT' && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            No split was in force on this date. Pick a later date, or add an
            earlier split first.
          </p>
        )}
        {Array.isArray(preview) && (
          <div className="rounded-lg bg-black/5 p-3 text-sm dark:bg-white/10">
            <p className="font-medium">This will be split as</p>
            <ul className="mt-2 space-y-1">
              {preview.map((row) => (
                <li key={row.id} className="flex justify-between gap-4">
                  <span>{row.name}</span>
                  <span>{formatZAR(row.cents)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-muted">
            {notice}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {editing ? 'Save changes' : 'Add income'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={onDone}
              className="rounded-lg border border-black/15 px-4 py-2 dark:border-white/20"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </Card>
  )
}