import { periodForDate } from '../lib/periods'
import type {
  Bucket,
  Category,
  Cents,
  Income,
  ISODate,
  SplitShare,
  SplitSnapshot,
  Transaction,
} from '../lib/types'

// ---------- dates (always relative to today, so the demo never goes stale) ----------

const now = new Date()
const pad = (n: number) => String(n).padStart(2, '0')

/** 'YYYY-MM-DD' for a month offset from the current month. Day must be 1-28. */
function dateIn(monthOffset: number, day: number): ISODate {
  const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(day)}`
}

const today: ISODate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

// ---------- seeded randomness (same "random" numbers on every reload) ----------

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = mulberry32(2026)

/** A random amount in cents between two rand values, rounded to 5 cents. */
function randCents(minRand: number, maxRand: number): Cents {
  const rand = minRand + random() * (maxRand - minRand)
  return Math.round((rand * 100) / 5) * 5
}

function randDay(min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1))
}

function pick<T>(items: T[]): T {
  return items[Math.floor(random() * items.length)] as T
}

// ---------- buckets, categories, splits ----------

export const buckets: Bucket[] = [
  { id: 'necessities', name: 'Necessities', sortOrder: 1, colorIndex: 1 },
  { id: 'personal', name: 'Personal', sortOrder: 2, colorIndex: 2 },
  { id: 'savings', name: 'Savings', sortOrder: 3, colorIndex: 3 },
]

export const categories: Category[] = [
  { id: 'rent', name: 'Rent', bucketId: 'necessities' },
  { id: 'groceries', name: 'Groceries', bucketId: 'necessities' },
  { id: 'transport', name: 'Transport', bucketId: 'necessities' },
  { id: 'utilities', name: 'Utilities & data', bucketId: 'necessities' },
  { id: 'dining', name: 'Dining out', bucketId: 'personal' },
  { id: 'shopping', name: 'Shopping', bucketId: 'personal' },
  { id: 'entertainment', name: 'Entertainment', bucketId: 'personal' },
  { id: 'subscriptions', name: 'Subscriptions', bucketId: 'personal' },
  { id: 'emergency', name: 'Emergency', bucketId: 'savings' },
  { id: 'other', name: 'Other', bucketId: null },
]

// 50/30/20 to start, then 55/25/20 from the 15th of last month.
export const splitSnapshots: SplitSnapshot[] = [
  {
    effectiveFrom: dateIn(-2, 1),
    shares: [
      { bucketId: 'necessities', bps: 5000 },
      { bucketId: 'personal', bps: 3000 },
      { bucketId: 'savings', bps: 2000 },
    ],
  },
  {
    effectiveFrom: dateIn(-1, 15),
    shares: [
      { bucketId: 'necessities', bps: 5500 },
      { bucketId: 'personal', bps: 2500 },
      { bucketId: 'savings', bps: 2000 },
    ],
  },
]

// ---------- incomes ----------

type IncomeDraft = {
  date: ISODate
  cents: Cents
  label: string
  allocation?: SplitShare[]
}

const incomeDrafts: IncomeDraft[] = [
  { date: dateIn(-2, 1), cents: 3_200_000, label: 'Salary' },
  { date: dateIn(-1, 1), cents: 3_200_000, label: 'Salary' },
  {
    date: dateIn(-1, 6),
    cents: 410_000,
    label: 'Tax refund',
    allocation: [{ bucketId: 'savings', bps: 10000 }], // custom: straight to savings
  },
  { date: dateIn(-1, 20), cents: 320_000, label: 'Freelance project' },
  { date: dateIn(0, 1), cents: 3_200_000, label: 'Salary' },
  { date: dateIn(0, 9), cents: 280_000, label: 'Freelance project' },
]

export const incomes: Income[] = incomeDrafts
  .filter((d) => d.date <= today)
  .map((d, i) => ({
    id: `inc-${pad(i + 1)}`,
    periodId: periodForDate(d.date).id,
    amountCents: d.cents,
    receivedAt: d.date,
    createdAt: `${d.date}T08:00:00Z`,
    label: d.label,
    ...(d.allocation ? { allocation: d.allocation } : {}),
  }))

// ---------- transactions ----------

type TxDraft = { date: ISODate; categoryId: string; cents: Cents; note?: string }

const drafts: TxDraft[] = []

function add(
  monthOffset: number,
  day: number,
  categoryId: string,
  cents: Cents,
  note?: string,
) {
  drafts.push({ date: dateIn(monthOffset, day), categoryId, cents, note })
}

for (const m of [-2, -1, 0]) {
  // fixed monthly costs
  add(m, 1, 'rent', 850_000, 'Monthly rent')
  add(m, 3, 'utilities', 69_900, 'Fibre')
  add(m, 10, 'utilities', 34_900, 'Phone contract')
  add(m, 12, 'subscriptions', 19_900, 'Netflix')
  add(m, 14, 'subscriptions', 5_999, 'Spotify')
  add(m, 5, 'utilities', randCents(380, 620), 'Prepaid electricity')
  add(m, 20, 'utilities', randCents(380, 620), 'Prepaid electricity')

  // everyday spending
  for (let i = 0; i < 5; i++) {
    add(m, randDay(1, 28), 'groceries', randCents(450, 950), pick(['Checkers', 'Woolworths', 'Pick n Pay', 'Spar']))
  }
  for (let i = 0; i < 4; i++) {
    add(m, randDay(1, 28), 'transport', randCents(90, 420), pick(['Uber', 'Fuel', 'Gautrain']))
  }
  for (let i = 0; i < 8; i++) {
    add(m, randDay(1, 28), 'dining', randCents(180, 650), pick(['Lunch', 'Dinner out', 'Coffee', 'Takeaways']))
  }
  for (let i = 0; i < 3; i++) {
    add(m, randDay(1, 28), 'shopping', randCents(350, 1400), pick(['Clothes', 'Shoes', 'Home items']))
  }
  for (let i = 0; i < 3; i++) {
    add(m, randDay(1, 28), 'entertainment', randCents(120, 380), pick(['Movies', 'Concert ticket', 'Games']))
  }
}

// one-offs: an emergency from the savings bucket, and one expense that fits no bucket
add(-1, 17, 'emergency', 185_000, 'Car tyre replacement')
add(-1, 22, 'other', 50_000, 'Family contribution')
add(0, 3, 'shopping', 650_000, 'Phone upgrade')

export const transactions: Transaction[] = drafts
  .filter((d) => d.date <= today)
  .sort((a, b) => a.date.localeCompare(b.date))
  .map((d, i) => {
    const category = categories.find((c) => c.id === d.categoryId)
    return {
      id: `tx-${String(i + 1).padStart(3, '0')}`,
      periodId: periodForDate(d.date).id,
      amountCents: d.cents,
      categoryId: d.categoryId,
      bucketId: category?.bucketId ?? null,
      occurredAt: d.date,
      createdAt: `${d.date}T12:00:00Z`,
      ...(d.note ? { note: d.note } : {}),
    }
  })