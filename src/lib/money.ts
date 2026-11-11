import type { Bps, Cents } from './types';

const NBSP = '\u00A0';

export function parseToCents(input: string): Cents | null {
  const s = input
    .trim()
    .replace(/^R\s*/i, '')       // drop a leading "R"
    .replace(/[\s\u00A0]/g, '')  // drop all spaces
    .replace(',', '.');          // treat a comma as a decimal point

  const match = s.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;

  const rands = match[1];
  const cents = (match[2] ?? '').padEnd(2, '0');

  const total = Number(rands) * 100 + Number(cents);
  return Number.isSafeInteger(total) ? total : null;
}

/** Formats cents as South African rand, e.g. 123456 -> "R 1 234,56". */
export function formatZAR(cents: Cents): string {
  const abs = Math.abs(cents);
  const rands = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const c = (abs % 100).toString().padStart(2, '0');
  return `${cents < 0 ? '-' : ''}R${NBSP}${rands},${c}`;
}

/** For charts and display only. Never store or add the result. */
export function centsToNumber(cents: Cents): number {
  return cents / 100;
}

/** 12.5 (%) -> 1250 (basis points). */
export function percentToBps(pct: number): Bps {
  return Math.round(pct * 100);
}

/** 1250 (basis points) -> 12.5 (%). */
export function bpsToPercent(bps: Bps): number {
  return bps / 100;
}