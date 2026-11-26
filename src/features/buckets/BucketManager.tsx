import { useMemo, useState, type FormEvent } from 'react'
import { bucketColor } from '../../components/charts/bucketColor'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { useBudgetStore } from '../../store/useBudgetStore'

const smallButton =
  'rounded-lg border px-3 py-2 text-sm disabled:opacity-40'

export default function BucketManager() {
  const buckets = useBudgetStore((s) => s.buckets)
  const addBucket = useBudgetStore((s) => s.addBucket)
  const renameBucket = useBudgetStore((s) => s.renameBucket)
  const archiveBucket = useBudgetStore((s) => s.archiveBucket)
  const restoreBucket = useBudgetStore((s) => s.restoreBucket)
  const moveBucket = useBudgetStore((s) => s.moveBucket)

  const active = useMemo(
    () => buckets.filter((b) => !b.archivedAt).sort((a, b) => a.sortOrder - b.sortOrder),
    [buckets],
  )
  const archived = useMemo(
    () => buckets.filter((b) => b.archivedAt).sort((a, b) => a.sortOrder - b.sortOrder),
    [buckets],
  )

  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // At most one row is in a special mode at a time.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    const result = addBucket(name)
    if (result) {
      setError(result)
      return
    }
    setName('')
    setError(null)
  }

  function handleMove(id: string, direction: 'up' | 'down') {
    setError(moveBucket(id, direction))
  }

  function startRename(id: string, currentName: string) {
    setConfirmingId(null)
    setEditingId(id)
    setDraftName(currentName)
    setError(null)
  }

  function cancelRename() {
    setEditingId(null)
    setError(null)
  }

  function handleRename(event: FormEvent) {
    event.preventDefault()
    if (editingId === null) return
    const result = renameBucket(editingId, draftName)
    if (result) {
      setError(result)
      return // stay in edit mode so the typed name is not lost
    }
    setEditingId(null)
    setError(null)
  }

  function startArchive(id: string) {
    setEditingId(null)
    setConfirmingId(id)
    setError(null)
  }

  function cancelArchive() {
    setConfirmingId(null)
    setError(null)
  }

  function handleArchive(id: string) {
    const result = archiveBucket(id)
    setConfirmingId(null) // close the confirm either way; the message explains a refusal
    setError(result)
  }

  function handleRestore(id: string) {
    setEditingId(null)
    setConfirmingId(null)
    setError(restoreBucket(id))
  }

  return (
    <Card>
      <h2 className="text-xl">Manage buckets</h2>
      <p className="mt-1 text-sm text-muted">
        The order here is the order on Home. Each bucket keeps its colour when you move it.
      </p>

      <ul className="mt-6 divide-y">
        {active.map((b, i) => (
          <li key={b.id} className="py-3 first:pt-0 last:pb-0">
            {/* Phone: name on top, buttons underneath. Wider screens: one row. */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {editingId === b.id ? (
                <form
                  onSubmit={handleRename}
                  className="flex flex-1 flex-wrap items-center gap-2"
                >
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => {
                      setDraftName(e.target.value)
                      setError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') cancelRename()
                    }}
                    aria-label={`New name for ${b.name}`}
                    autoFocus
                    className="min-w-0 flex-1 basis-40 rounded-lg border bg-transparent px-3 py-2"
                  />
                  <Button variant="primary" type="submit" >
                    Save
                  </Button>
                  <Button variant="secondary" type="button" onClick={cancelRename}>
                    Cancel
                  </Button>
                </form>
              ) : (
                <>
                  <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: bucketColor(b) }}
                    />
                    <span className="min-w-0 break-words">{b.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      aria-label={`Rename ${b.name}`}
                      onClick={() => startRename(b.id, b.name)}
                    >
                      Rename
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      aria-label={`Archive ${b.name}`}
                      disabled={active.length === 1}
                      onClick={() => startArchive(b.id)}
                    >
                      Archive
                    </Button>
                    <button
                      type="button"
                      className={smallButton}
                      aria-label={`Move ${b.name} up`}
                      disabled={i === 0}
                      onClick={() => handleMove(b.id, 'up')}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={smallButton}
                      aria-label={`Move ${b.name} down`}
                      disabled={i === active.length - 1}
                      onClick={() => handleMove(b.id, 'down')}
                    >
                      ↓
                    </button>
                  </div>
                </>
              )}
            </div>

            {confirmingId === b.id && (
              <div
                role="group"
                aria-label={`Confirm archiving ${b.name}`}
                className="mt-3 text-sm"
              >
                <p className="text-muted">
                  Archive {b.name}? It disappears from your current buckets but stays in
                  past months. Its categories are unlinked from it, and restoring it later
                  won’t relink them.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleArchive(b.id)}
                  >
                    Yes, archive
                  </Button>
                  <Button type="button" variant="secondary" onClick={cancelArchive}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-6">
        <label htmlFor="new-bucket" className="block text-sm text-muted">
          New bucket
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="new-bucket"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            placeholder="e.g. Holiday"
            className="min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2"
          />
          <Button variant="primary" type="submit">
            Add
          </Button>
        </div>
      </form>

      {archived.length > 0 && (
        <section className="mt-8" aria-labelledby="archived-heading">
          <h3 id="archived-heading" className="text-sm text-muted">
            Archived
          </h3>
          <ul className="mt-2 divide-y">
            {archived.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-full opacity-40"
                  style={{ backgroundColor: bucketColor(b) }}
                />
                <span className="min-w-0 flex-1 break-words text-muted">{b.name}</span>
                <button
                  type="button"
                  className={smallButton}
                  aria-label={`Restore ${b.name}`}
                  onClick={() => handleRestore(b.id)}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </Card>
  )
}