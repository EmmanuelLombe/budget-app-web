import { useEffect, useState } from 'react'
import DonutChart from '../components/charts/donutChart'
import { bucketColor } from '../components/charts/bucketColour'
import Card from '../components/ui/Card'
import {
  getBuckets,
  getIncomes,
  getSplitSnapshots,
  getTransactions,
} from '../data/api'
import BucketDetail from '../features/dashboard/bucketDetail'
import Overview from '../features/dashboard/Overview'
import { periodForDate } from '../lib/periods'
import { summarisePeriod, type PeriodSummary } from '../lib/summary'

/** Today's date as 'YYYY-MM-DD' in the user's own time zone. */
function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function Home() {
  const [summary, setSummary] = useState<PeriodSummary | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [buckets, incomes, transactions, snapshots] = await Promise.all([
        getBuckets(),
        getIncomes(),
        getTransactions(),
        getSplitSnapshots(),
      ])
      if (cancelled) return
      setSummary(
        summarisePeriod({
          periodId: periodForDate(todayISO()).id,
          buckets,
          incomes,
          transactions,
          snapshots,
        }),
      )
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (!summary) return <p className="text-muted">Loading…</p>

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