const COLOUR_COUNT = 6

/** Maps a bucket's sortOrder to one of the six bucket colour variables. */
export function bucketColor(sortOrder: number): string {
  const index = ((((sortOrder - 1) % COLOUR_COUNT) + COLOUR_COUNT) % COLOUR_COUNT) + 1
  return `var(--bucket-${index})`
}