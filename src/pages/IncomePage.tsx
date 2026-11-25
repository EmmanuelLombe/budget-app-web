import { useMemo, useState } from 'react'
import Card from '../components/ui/Card'
import IncomeForm from '../features/income/IncomeForm'
import { formatZAR } from '../lib/money'
import { useBudgetStore } from '../store/useBudgetStore'

export default function IncomePage() {
  const incomes = useBudgetStore((s) => s.incomes)
  const deleteIncome = useBudgetStore((s) => s.deleteIncome)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing = incomes.find((i) => i.id === editingId)

  // Newest first.
  const sorted = useMemo(
    () =>
      [...incomes].sort((a, b) =>
        a.receivedAt < b.receivedAt ? 1 : a.receivedAt > b.receivedAt ? -1 : 0,
      ),
    [incomes],
  )

  function remove(id: string) {
    if (!window.confirm('Delete this income? This can’t be undone.')) return
    if (id === editingId) setEditingId(null)
    deleteIncome(id)
  }

  return (
    <div>
      <header>
        <h1 className="text-3xl">Income</h1>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        {/* key makes the form start fresh when you switch between incomes */}
        <IncomeForm
          key={editing?.id ?? 'new'}
          editing={editing}
          onDone={() => setEditingId(null)}
        />

        <Card>
          <h2 className="text-xl">Your income</h2>
          {sorted.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No income yet. Add your first on the left.</p>
          ) : (
            <ul className="mt-4 divide-y divide-black/10 dark:divide-white/10">
              {sorted.map((income) => (
                <li key={income.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{income.label ?? 'Income'}</p>
                    <p className="text-sm text-muted">
                      {income.receivedAt}
                      {income.allocation ? ' · Custom split' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatZAR(income.amountCents)}</p>
                    <div className="mt-1 flex justify-end gap-3 text-sm">
                      <button type="button" onClick={() => setEditingId(income.id)} className="underline">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(income.id)}
                        className="text-red-600 underline dark:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}