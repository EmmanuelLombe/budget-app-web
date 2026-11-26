// const COLOR_COUNT = 6

// /** Maps a bucket's sortOrder to one of the six bucket colour variables. */
// export function bucketColor(sortOrder: number): string {
//   const index = ((((sortOrder - 1) % COLOR_COUNT) + COLOR_COUNT) % COLOR_COUNT) + 1
//   return `var(--bucket-${index})`
// }

import { effectiveColorIndex } from '../../lib/buckets'

/** Maps a bucket to one of the six bucket colour variables. */
export function bucketColor(bucket: { colorIndex?: number; sortOrder?: number }): string {
  return `var(--bucket-${effectiveColorIndex(bucket)})`
}