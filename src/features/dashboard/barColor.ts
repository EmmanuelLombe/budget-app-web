import type { BucketStatus } from '../../lib/summary'

/** The bucket's own colour while healthy, then amber or rose as it fills up. */
export function barColor(status: BucketStatus, bucketColor: string): string {
  if (status === 'over') return 'var(--over)'
  if (status === 'near') return 'var(--warn)'
  return bucketColor
}