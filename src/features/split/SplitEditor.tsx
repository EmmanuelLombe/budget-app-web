import { useMemo, useState } from 'react'
import Card from '../../components/ui/Card'
import { todayISO } from '../../lib/dates'
import { formatZAR } from '../../lib/money'
import { splitInForce } from '../../lib/split'
import type { SplitShare } from '../../lib/types'
import { useBudgetStore } from '../../store/useBudgetStore'
import ShareRows from './ShareRows'
import { useShareDraft } from './useShareDraft'
import Button from '../../components/ui/Button'

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

  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const draft = useShareDraft(active, current, () => setMessage(null))

  const savedBps = (bucketId: string) =>
    current.find((s) => s.bucketId === bucketId)?.bps ?? 0
  const dirty = draft.shares.some((s) => s.bps !== savedBps(s.bucketId))
  const canSave = draft.valid && dirty

  // Example amount for the rand previews: the most recent income, or R10,000.
  const latest = [...incomes].sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))[0]
  const exampleCents = latest?.amountCents ?? 1_000_000

  function save() {
    const error = saveSplit(draft.shares, today)
    setMessage(
      error
        ? { ok: false, text: 'That split couldn’t be saved. Check the total is 100%.' }
        : { ok: true, text: 'Saved. It applies to income from today onwards.' },
    )
  }

  return (
    <Card>
      <h2 className="text-xl">Income split</h2>
      <p className="mt-1 text-sm text-muted">
        Each bit of income is divided between your buckets using these
        percentages. Previews use {formatZAR(exampleCents)}
        {latest ? ' (your latest income)' : ''}.
      </p>

      <div className="mt-6">
        <ShareRows draft={draft} exampleCents={exampleCents} idPrefix="split" />
      </div>

      <div className="mt-6">
        <Button variant="primary" onClick={save} disabled={!canSave} type="button"
          // type="button"
          // onClick={save}
          // disabled={!canSave}
          // className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          Save split
        </Button>
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