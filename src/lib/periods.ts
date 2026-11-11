import type { BudgetPeriod, ISODate } from './types';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Number of days in a month. month is 1-12. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Returns the calendar-month period that contains the given date.
 * '2026-11-20' -> { id: '2026-11-01', startDate: '2026-11-01', endDate: '2026-11-30' }
 */
export function periodForDate(date: ISODate): BudgetPeriod {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error('INVALID_DATE');

  const yearText = match[1];
  const year = Number(yearText);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new Error('INVALID_DATE');
  }

  const startDate = `${yearText}-${pad(month)}-01`;
  const endDate = `${yearText}-${pad(month)}-${pad(daysInMonth(year, month))}`;

  return { id: startDate, startDate, endDate };
}