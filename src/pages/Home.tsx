import { useMemo, useState } from 'react'
import DonutChart from '../components/charts/donutChart'
import { bucketColor } from '../components/charts/bucketColour'
import Card from '../components/ui/Card'
import BucketDetail from '../features/dashboard/bucketDetail'
import Overview from '../features/dashboard/Overview'
import { periodForDate } from '../lib/periods'
import { summarisePeriod } from '../lib/summary'
import { useBudgetStore } from '../store/useBudgetStore'
import { todayISO } from '../lib/dates'

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // One field per call, so React only re-renders when that field changes.
  const buckets = useBudgetStore((s) => s.buckets)
  const incomes = useBudgetStore((s) => s.incomes)
  const transactions = useBudgetStore((s) => s.transactions)
  const snapshots = useBudgetStore((s) => s.splitSnapshots)

  const summary = useMemo(
    () =>
      summarisePeriod({
        periodId: periodForDate(todayISO()).id,
        buckets,
        incomes,
        transactions,
        snapshots,
      }),
    [buckets, incomes, transactions, snapshots],
  )

  const month = new Intl.DateTimeFormat('en-ZA', {
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const slices = summary.buckets.map((b) => ({
    id: b.bucketId,
    name: b.name,
    cents: b.allocatedCents,
    color: bucketColor(b.sortOrder),
  }))

  const selected = summary.buckets.find((b) => b.bucketId === selectedId) ?? null

  return (
    <div>
      <header>
        <h1 className="text-3xl">Home</h1>
        <p className="mt-1 text-sm text-muted">{month}</p>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <DonutChart
            slices={slices}
            selectedId={selectedId}
            onSelect={setSelectedId}
            totalLabel="Income"
          />
        </Card>

        {selected ? (
          <BucketDetail
            summary={selected}
            color={bucketColor(selected.sortOrder)}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <Overview summary={summary} onSelect={setSelectedId} />
        )}
      </div>
    </div>
  )
}