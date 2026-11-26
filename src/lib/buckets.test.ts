import { describe, it, expect } from 'vitest'
import {
  MAX_BUCKET_NAME_LENGTH,
  canArchiveBucket,
  effectivecolorIndex,
  nextSortOrder,
  pickcolorIndex,
  stampcolorIndexes,
  validateBucketName,
} from './buckets'
import type { Bucket, SplitShare } from './types'

function bucket(id: string, name: string, sortOrder: number, archived = false): Bucket {
  return archived
    ? { id, name, sortOrder, archivedAt: '2026-11-01T08:00:00Z' }
    : { id, name, sortOrder }
}

const three: Bucket[] = [
  bucket('necessities', 'Necessities', 1),
  bucket('personal', 'Personal', 2),
  bucket('savings', 'Savings', 3),
]

describe('validateBucketName', () => {
  it('accepts a normal name, even with spaces around it', () => {
    expect(validateBucketName('  Holiday  ', three)).toBeNull()
  })

  it('rejects empty and whitespace-only names', () => {
    expect(validateBucketName('', three)).not.toBeNull()
    expect(validateBucketName('   ', three)).not.toBeNull()
  })

  it('allows exactly the max length and rejects one more', () => {
    expect(validateBucketName('a'.repeat(MAX_BUCKET_NAME_LENGTH), three)).toBeNull()
    expect(validateBucketName('a'.repeat(MAX_BUCKET_NAME_LENGTH + 1), three)).not.toBeNull()
  })

  it('counts length after trimming', () => {
    expect(validateBucketName(`  ${'a'.repeat(MAX_BUCKET_NAME_LENGTH)}  `, three)).toBeNull()
  })

  it('rejects a duplicate of an active bucket, ignoring case and padding', () => {
    expect(validateBucketName('savings', three)).not.toBeNull()
    expect(validateBucketName('  SAVINGS ', three)).not.toBeNull()
  })

  it('does not clash with an archived bucket', () => {
    const list = [...three, bucket('old', 'Holiday', 4, true)]
    expect(validateBucketName('Holiday', list)).toBeNull()
  })

  it('lets a bucket keep or re-case its own name when ignoreId is given', () => {
    expect(validateBucketName('NECESSITIES', three, 'necessities')).toBeNull()
  })

  it('still rejects renaming to another active bucket name', () => {
    expect(validateBucketName('Personal', three, 'necessities')).not.toBeNull()
  })
})

describe('canArchiveBucket', () => {
  const noShare: SplitShare[] = [
    { bucketId: 'necessities', bps: 6000 },
    { bucketId: 'personal', bps: 4000 },
  ]

  it('allows archiving a bucket with no share today', () => {
    expect(canArchiveBucket('savings', three, noShare)).toBeNull()
  })

  it('treats a 0 bps entry as no share', () => {
    const withZero: SplitShare[] = [...noShare, { bucketId: 'savings', bps: 0 }]
    expect(canArchiveBucket('savings', three, withZero)).toBeNull()
  })

  it('blocks archiving while the bucket has a share, and says what to do', () => {
    const shares: SplitShare[] = [...noShare, { bucketId: 'savings', bps: 500 }]
    const error = canArchiveBucket('savings', three, shares)
    expect(error).not.toBeNull()
    expect(error).toMatch(/split/i)
  })

  it('blocks archiving the last active bucket', () => {
    const list = [bucket('a', 'A', 1), bucket('b', 'B', 2, true)]
    expect(canArchiveBucket('a', list, [])).not.toBeNull()
  })

  it('does not count archived buckets as remaining', () => {
    const list = [bucket('a', 'A', 1), bucket('b', 'B', 2), bucket('c', 'C', 3, true)]
    expect(canArchiveBucket('a', list, [])).toBeNull()
    expect(canArchiveBucket('b', [bucket('a', 'A', 1, true), bucket('b', 'B', 2)], [])).not.toBeNull()
  })

  it('rejects an unknown or already archived bucket', () => {
    expect(canArchiveBucket('nope', three, [])).not.toBeNull()
    const list = [...three, bucket('old', 'Old', 4, true)]
    expect(canArchiveBucket('old', list, [])).not.toBeNull()
  })
})

describe('nextSortOrder', () => {
  it('starts at 1 when there are no buckets', () => {
    expect(nextSortOrder([])).toBe(1)
  })

  it('is one more than the highest existing order', () => {
    expect(nextSortOrder(three)).toBe(4)
  })

  it('counts archived buckets so orders never collide on restore', () => {
    const list = [...three, bucket('old', 'Old', 9, true)]
    expect(nextSortOrder(list)).toBe(10)
  })
})

//added

describe('effectivecolorIndex', () => {
  it('uses colorIndex when set, ignoring sortOrder', () => {
    expect(effectivecolorIndex({ colorIndex: 5, sortOrder: 1 })).toBe(5)
  })

  it('falls back to sortOrder when colorIndex is missing', () => {
    expect(effectivecolorIndex({ sortOrder: 3 })).toBe(3)
  })

  it('wraps after the last colour', () => {
    expect(effectivecolorIndex({ sortOrder: 7 })).toBe(1)
    expect(effectivecolorIndex({ colorIndex: 12 })).toBe(6)
  })
})

describe('pickcolorIndex', () => {
  it('starts at 1 with no buckets', () => {
    expect(pickcolorIndex([])).toBe(1)
  })

  it('takes the next free colour for the three seed buckets', () => {
    expect(pickcolorIndex(three)).toBe(4)
  })

  it('reuses the colour of an archived bucket', () => {
    const list = [bucket('a', 'A', 1), bucket('b', 'B', 2, true), bucket('c', 'C', 3)]
    expect(pickcolorIndex(list)).toBe(2)
  })

  it('spreads evenly once all six colours are taken', () => {
    const six = [1, 2, 3, 4, 5, 6].map((n) => bucket(`b${n}`, `B${n}`, n))
    const seven = [...six, { ...bucket('b7', 'B7', 7), colorIndex: 1 }]
    expect(pickcolorIndex(seven)).toBe(2)
  })
})

describe('stampcolorIndexes', () => {
  it('fills in colorIndex from the current sortOrder', () => {
    const stamped = stampcolorIndexes(three)
    expect(stamped.map((b) => b.colorIndex)).toEqual([1, 2, 3])
  })

  it('leaves an existing colorIndex alone', () => {
    const list = [{ ...bucket('a', 'A', 1), colorIndex: 5 }]
    expect(stampcolorIndexes(list)[0]?.colorIndex).toBe(5)
  })

  it('keeps the colour when the bucket is later reordered', () => {
    const [first] = stampcolorIndexes([bucket('a', 'A', 1)])
    const moved = { ...first!, sortOrder: 3 }
    expect(effectivecolorIndex(moved)).toBe(1)
  })
})