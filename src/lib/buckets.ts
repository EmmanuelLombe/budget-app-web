import type { Bucket, SplitShare, Category, ISODateTime } from './types'

export const MAX_BUCKET_NAME_LENGTH = 30

const isActive = (b: Bucket) => !b.archivedAt

/** Returns an error message, or null when the name is fine.
 *  The store should save the trimmed name, not the raw input.
 *  Pass ignoreId when renaming (or restoring) so a bucket doesn't clash with itself. */
export function validateBucketName(
  name: string,
  buckets: Bucket[],
  ignoreId?: string,
): string | null {
  const trimmed = name.trim()
  if (trimmed === '') return 'Give the bucket a name.'
  if (trimmed.length > MAX_BUCKET_NAME_LENGTH) {
    return `Keep the name to ${MAX_BUCKET_NAME_LENGTH} characters or fewer.`
  }
  const wanted = trimmed.toLowerCase()
  const clash = buckets.some(
    (b) => isActive(b) && b.id !== ignoreId && b.name.trim().toLowerCase() === wanted,
  )
  if (clash) return 'You already have an active bucket with that name.'
  return null
}

/** Returns an error message, or null when the bucket can be archived.
 *  todaysShares is the split currently in force. */
export function canArchiveBucket(
  bucketId: string,
  buckets: Bucket[],
  todaysShares: SplitShare[],
): string | null {
  const bucket = buckets.find((b) => b.id === bucketId)
  if (!bucket) return 'That bucket no longer exists.'
  if (!isActive(bucket)) return 'That bucket is already archived.'

  // Checked before the share rule: the last bucket always holds 100%,
  // and there would be nowhere to move that share to.
  const othersActive = buckets.filter((b) => isActive(b) && b.id !== bucketId)
  if (othersActive.length === 0) return 'You need at least one active bucket.'

  const share = todaysShares.find((s) => s.bucketId === bucketId)
  if (share && share.bps > 0) {
    return `${bucket.name} still has a share of today's split. Move its share to another bucket on the split screen first.`
  }
  return null
}

/** Order for a new bucket: after everything, archived included,
 *  so a restored bucket can never collide with an active one. */
export function nextSortOrder(buckets: Bucket[]): number {
  return Math.max(0, ...buckets.map((b) => b.sortOrder)) + 1
}

export const BUCKET_COLOR_COUNT = 6

type Colorable = { colorIndex?: number; sortOrder?: number }

/** The colour slot (1-6) a bucket uses. Falls back to sortOrder for old data. */
export function effectiveColorIndex(b: Colorable): number {
  const n = b.colorIndex ?? b.sortOrder ?? 1
  const c = BUCKET_COLOR_COUNT
  return ((((n - 1) % c) + c) % c) + 1
}

/** Color for a new bucket: the least-used slot among active buckets, lowest first. */
export function pickColorIndex(buckets: Bucket[]): number {
  const counts: number[] = new Array(BUCKET_COLOR_COUNT).fill(0)
  for (const b of buckets) {
    if (isActive(b)) counts[effectiveColorIndex(b) - 1]! += 1
  }
  return counts.indexOf(Math.min(...counts)) + 1
}

/** Pins every bucket's colour to what it shows today. Call before reordering. */
export function stampColorIndexes(buckets: Bucket[]): Bucket[] {
  return buckets.map((b) =>
    b.colorIndex === undefined ? { ...b, colorIndex: effectiveColorIndex(b) } : b,
  )
}

//added

export type BucketChange = { buckets: Bucket[] } | { error: string }
export type MoveDirection = 'up' | 'down'

export function addBucket(buckets: Bucket[], name: string, id: string): BucketChange {
  const error = validateBucketName(name, buckets)
  if (error) return { error }
  const pinned = stampColorIndexes(buckets)
  const added: Bucket = {
    id,
    name: name.trim(),
    sortOrder: nextSortOrder(pinned),
    colorIndex: pickColorIndex(pinned),
  }
  return { buckets: [...pinned, added] }
}

export function renameBucket(buckets: Bucket[], id: string, name: string): BucketChange {
  if (!buckets.some((b) => b.id === id)) return { error: 'That bucket no longer exists.' }
  const error = validateBucketName(name, buckets, id)
  if (error) return { error }
  return {
    buckets: buckets.map((b) => (b.id === id ? { ...b, name: name.trim() } : b)),
  }
}

export function archiveBucket(
  buckets: Bucket[],
  id: string,
  todaysShares: SplitShare[],
  archivedAt: ISODateTime,
): BucketChange {
  const error = canArchiveBucket(id, buckets, todaysShares)
  if (error) return { error }
  return {
    buckets: buckets.map((b) => (b.id === id ? { ...b, archivedAt } : b)),
  }
}

export function restoreBucket(buckets: Bucket[], id: string): BucketChange {
  const target = buckets.find((b) => b.id === id)
  if (!target) return { error: 'That bucket no longer exists.' }
  if (!target.archivedAt) return { error: 'That bucket is not archived.' }
  const error = validateBucketName(target.name, buckets, id)
  if (error) return { error: `${error} Rename one of them first.` }
  return {
    buckets: buckets.map((b) => {
      if (b.id !== id) return b
      const { archivedAt: _archivedAt, ...active } = b
      return active
    }),
  }
}

/** Swaps sortOrder with the neighbouring active bucket. Colours are pinned first,
 *  so reordering never recolours anything. At the edge it returns the list unchanged. */
export function moveBucket(
  buckets: Bucket[],
  id: string,
  direction: MoveDirection,
): BucketChange {
  const pinned = stampColorIndexes(buckets)
  const active = pinned.filter(isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  const i = active.findIndex((b) => b.id === id)
  if (i === -1) return { error: 'That bucket is not active.' }

  const me = active[i]!
  const neighbour = active[direction === 'up' ? i - 1 : i + 1]
  if (!neighbour) return { buckets: pinned }

  return {
    buckets: pinned.map((b) => {
      if (b.id === me.id) return { ...b, sortOrder: neighbour.sortOrder }
      if (b.id === neighbour.id) return { ...b, sortOrder: me.sortOrder }
      return b
    }),
  }
}

/** Unlinks every category from a bucket (used when archiving it).
 *  Existing transactions are untouched and keep the bucket id they were saved with. */
export function detachCategories(categories: Category[], bucketId: string): Category[] {
  return categories.map((c) => (c.bucketId === bucketId ? { ...c, bucketId: null } : c))
}