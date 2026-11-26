import type { Bucket, SplitShare } from './types'

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
export function effectivecolorIndex(b: Colorable): number {
  const n = b.colorIndex ?? b.sortOrder ?? 1
  const c = BUCKET_COLOR_COUNT
  return ((((n - 1) % c) + c) % c) + 1
}

/** Color for a new bucket: the least-used slot among active buckets, lowest first. */
export function pickcolorIndex(buckets: Bucket[]): number {
  const counts: number[] = new Array(BUCKET_COLOR_COUNT).fill(0)
  for (const b of buckets) {
    if (isActive(b)) counts[effectivecolorIndex(b) - 1]! += 1
  }
  return counts.indexOf(Math.min(...counts)) + 1
}

/** Pins every bucket's colour to what it shows today. Call before reordering. */
export function stampcolorIndexes(buckets: Bucket[]): Bucket[] {
  return buckets.map((b) =>
    b.colorIndex === undefined ? { ...b, colorIndex: effectivecolorIndex(b) } : b,
  )
}