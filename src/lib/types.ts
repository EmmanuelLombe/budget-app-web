/** All money is integer cents (ZAR). Percentages are basis points: 10000 = 100%. */
export type Cents = number;
export type Bps = number;
export type ISODate = string;     // 'YYYY-MM-DD'
export type ISODateTime = string; // '2026-11-05T14:32:00Z'

export interface Bucket {
  id: string;
  name: string;
  sortOrder: number;
  archivedAt?: ISODateTime; // undefined = active
}

export interface Category {
  id: string;
  name: string;
  bucketId: string | null; // null = not assigned to an active bucket
}

export interface BudgetPeriod {
  id: string;
  startDate: ISODate; // inclusive
  endDate: ISODate;   // inclusive
}

export interface SplitShare {
  bucketId: string;
  bps: Bps;
}

export interface SplitSnapshot {
  effectiveFrom: ISODate;
  shares: SplitShare[];
}

export interface Income {
  id: string;
  periodId: string;
  amountCents: Cents;
  receivedAt: ISODate;
  createdAt: ISODateTime;
  label?: string;
  allocation?: SplitShare[]; // if set, overrides the default split for this income only
}

export interface Transaction {
  id: string;
  periodId: string;
  amountCents: Cents; // always positive; it's an expense
  categoryId: string;
  bucketId: string | null;   // saved when logged, not looked up later
  occurredAt: ISODate;
  createdAt: ISODateTime;
  note?: string;
}