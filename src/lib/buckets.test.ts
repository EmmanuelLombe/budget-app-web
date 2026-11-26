import { describe, it, expect } from 'vitest'
import {
  MAX_BUCKET_NAME_LENGTH,
  addBucket,
  archiveBucket,
  canArchiveBucket,
  detachCategories,
  effectiveColorIndex,
  moveBucket,
  nextSortOrder,
  pickColorIndex,
  renameBucket,
  restoreBucket,
  stampColorIndexes,
  validateBucketName,
} from './buckets'
import type { BucketChange } from './buckets'
import type { Bucket, Category, SplitShare } from './types'

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

describe('effectiveColorIndex', () => {
  it('uses colorIndex when set, ignoring sortOrder', () => {
    expect(effectiveColorIndex({ colorIndex: 5, sortOrder: 1 })).toBe(5)
  })

  it('falls back to sortOrder when colorIndex is missing', () => {
    expect(effectiveColorIndex({ sortOrder: 3 })).toBe(3)
  })

  it('wraps after the last colour', () => {
    expect(effectiveColorIndex({ sortOrder: 7 })).toBe(1)
    expect(effectiveColorIndex({ colorIndex: 12 })).toBe(6)
  })
})

describe('pickColorIndex', () => {
  it('starts at 1 with no buckets', () => {
    expect(pickColorIndex([])).toBe(1)
  })

  it('takes the next free colour for the three seed buckets', () => {
    expect(pickColorIndex(three)).toBe(4)
  })

  it('reuses the colour of an archived bucket', () => {
    const list = [bucket('a', 'A', 1), bucket('b', 'B', 2, true), bucket('c', 'C', 3)]
    expect(pickColorIndex(list)).toBe(2)
  })

  it('spreads evenly once all six colours are taken', () => {
    const six = [1, 2, 3, 4, 5, 6].map((n) => bucket(`b${n}`, `B${n}`, n))
    const seven = [...six, { ...bucket('b7', 'B7', 7), colorIndex: 1 }]
    expect(pickColorIndex(seven)).toBe(2)
  })
})

describe('stampColorIndexes', () => {
  it('fills in colorIndex from the current sortOrder', () => {
    const stamped = stampColorIndexes(three)
    expect(stamped.map((b) => b.colorIndex)).toEqual([1, 2, 3])
  })

  it('leaves an existing colorIndex alone', () => {
    const list = [{ ...bucket('a', 'A', 1), colorIndex: 5 }]
    expect(stampColorIndexes(list)[0]?.colorIndex).toBe(5)
  })

  it('keeps the colour when the bucket is later reordered', () => {
    const [first] = stampColorIndexes([bucket('a', 'A', 1)])
    const moved = { ...first!, sortOrder: 3 }
    expect(effectiveColorIndex(moved)).toBe(1)
  })
})

//added

function ok(result: BucketChange): Bucket[] {
  if ('error' in result) throw new Error(`expected success, got: ${result.error}`)
  return result.buckets
}

function fail(result: BucketChange): string {
  if ('buckets' in result) throw new Error('expected an error')
  return result.error
}

describe('addBucket', () => {
  it('adds at the end with the next order and a free colour', () => {
    const list = ok(addBucket(three, 'Holiday', 'h1'))
    expect(list).toHaveLength(4)
    expect(list[3]).toEqual({ id: 'h1', name: 'Holiday', sortOrder: 4, colorIndex: 4 })
  })

  it('saves the trimmed name', () => {
    expect(ok(addBucket(three, '  Holiday  ', 'h1'))[3]?.name).toBe('Holiday')
  })

  it('rejects an empty or duplicate name', () => {
    expect(fail(addBucket(three, '   ', 'x'))).toBeTruthy()
    expect(fail(addBucket(three, 'savings', 'x'))).toBeTruthy()
  })

  it('pins the colours of the existing buckets', () => {
    const list = ok(addBucket(three, 'Holiday', 'h1'))
    expect(list.slice(0, 3).map((b) => b.colorIndex)).toEqual([1, 2, 3])
  })

  it('does not change the list it was given', () => {
    addBucket(three, 'Holiday', 'h1')
    expect(three).toHaveLength(3)
    expect(three[0]?.colorIndex).toBeUndefined()
  })
})

describe('renameBucket', () => {
  it('renames and trims', () => {
    const list = ok(renameBucket(three, 'savings', '  Rainy day  '))
    expect(list.find((b) => b.id === 'savings')?.name).toBe('Rainy day')
  })

  it('allows changing only the case of its own name', () => {
    const list = ok(renameBucket(three, 'savings', 'SAVINGS'))
    expect(list.find((b) => b.id === 'savings')?.name).toBe('SAVINGS')
  })

  it('rejects the name of another active bucket', () => {
    expect(fail(renameBucket(three, 'savings', 'personal'))).toBeTruthy()
  })

  it('rejects an unknown id', () => {
    expect(fail(renameBucket(three, 'nope', 'X'))).toBeTruthy()
  })

  it('allows renaming an archived bucket', () => {
    const list = [...three.slice(0, 2), bucket('savings', 'Savings', 3, true)]
    const renamed = ok(renameBucket(list, 'savings', 'Old savings'))
    expect(renamed.find((b) => b.id === 'savings')?.name).toBe('Old savings')
  })
})

describe('archiveBucket', () => {
  const noShare: SplitShare[] = [
    { bucketId: 'necessities', bps: 6000 },
    { bucketId: 'personal', bps: 4000 },
  ]
  const stamp = '2026-11-26T10:00:00Z'

  it('stamps archivedAt on that bucket only', () => {
    const list = ok(archiveBucket(three, 'savings', noShare, stamp))
    expect(list.find((b) => b.id === 'savings')?.archivedAt).toBe(stamp)
    expect(list.filter((b) => b.archivedAt)).toHaveLength(1)
  })

  it('refuses while the bucket still has a share today', () => {
    const shares = [...noShare, { bucketId: 'savings', bps: 500 }]
    expect(fail(archiveBucket(three, 'savings', shares, stamp))).toMatch(/split/i)
  })

  it('refuses to archive the last active bucket', () => {
    const list = [bucket('a', 'A', 1)]
    expect(fail(archiveBucket(list, 'a', [], stamp))).toBeTruthy()
  })
})

describe('restoreBucket', () => {
  const archived = [...three.slice(0, 2), bucket('savings', 'Savings', 3, true)]

  it('makes the bucket active again and keeps its order', () => {
    const restored = ok(restoreBucket(archived, 'savings')).find((b) => b.id === 'savings')
    expect(restored?.archivedAt).toBeUndefined()
    expect(restored?.sortOrder).toBe(3)
  })

  it('refuses when an active bucket now has the same name', () => {
    const list = [bucket('old', 'Holiday', 4, true), bucket('new', 'holiday', 5)]
    expect(fail(restoreBucket(list, 'old'))).toBeTruthy()
  })

  it('refuses an active or unknown bucket', () => {
    expect(fail(restoreBucket(three, 'savings'))).toBeTruthy()
    expect(fail(restoreBucket(three, 'nope'))).toBeTruthy()
  })
})

describe('moveBucket', () => {
  it('swaps order with the active bucket above', () => {
    const list = ok(moveBucket(three, 'personal', 'up'))
    expect(list.find((b) => b.id === 'personal')?.sortOrder).toBe(1)
    expect(list.find((b) => b.id === 'necessities')?.sortOrder).toBe(2)
  })

  it('swaps order with the active bucket below', () => {
    const list = ok(moveBucket(three, 'personal', 'down'))
    expect(list.find((b) => b.id === 'personal')?.sortOrder).toBe(3)
    expect(list.find((b) => b.id === 'savings')?.sortOrder).toBe(2)
  })

  it('does nothing at the top or bottom', () => {
    const orders = (l: Bucket[]) => l.map((b) => b.sortOrder)
    expect(orders(ok(moveBucket(three, 'necessities', 'up')))).toEqual([1, 2, 3])
    expect(orders(ok(moveBucket(three, 'savings', 'down')))).toEqual([1, 2, 3])
  })

  it('skips archived buckets when finding the neighbour', () => {
    const list = [bucket('a', 'A', 1), bucket('b', 'B', 2, true), bucket('c', 'C', 3)]
    const moved = ok(moveBucket(list, 'c', 'up'))
    expect(moved.find((b) => b.id === 'c')?.sortOrder).toBe(1)
    expect(moved.find((b) => b.id === 'a')?.sortOrder).toBe(3)
    expect(moved.find((b) => b.id === 'b')?.sortOrder).toBe(2)
  })

  it('keeps every bucket colour when reordering', () => {
    const moved = ok(moveBucket(three, 'personal', 'up'))
    const colours = Object.fromEntries(moved.map((b) => [b.id, effectiveColorIndex(b)]))
    expect(colours).toEqual({ necessities: 1, personal: 2, savings: 3 })
  })

  it('rejects an unknown or archived bucket', () => {
    expect(fail(moveBucket(three, 'nope', 'up'))).toBeTruthy()
    const list = [...three.slice(0, 2), bucket('savings', 'Savings', 3, true)]
    expect(fail(moveBucket(list, 'savings', 'up'))).toBeTruthy()
  })
})

describe('detachCategories', () => {
  const cats: Category[] = [
    { id: 'rent', name: 'Rent', bucketId: 'necessities' },
    { id: 'dining', name: 'Dining out', bucketId: 'personal' },
    { id: 'other', name: 'Other', bucketId: null },
  ]

  it('unlinks only the categories of that bucket', () => {
    const result = detachCategories(cats, 'personal')
    expect(result.map((c) => c.bucketId)).toEqual(['necessities', null, null])
  })
})