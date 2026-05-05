/**
 * SAST (South African Standard Time) date utilities.
 *
 * South Africa is UTC+2 and does NOT observe daylight saving.
 * DO NOT use toISOString().slice(0,10) — that gives UTC dates which
 * cut off at 22:00 SAST, breaking daily counters, streaks, and logs.
 *
 * Usage:
 *   import { getSASTDateKey, getSASTToday } from "@/utils/sastDate";
 *   const today = getSASTDateKey(); // "2026-05-04" in SAST
 */

/** Return today's date as "YYYY-MM-DD" in SAST timezone. */
export function getSASTDateKey(date: Date = new Date()): string {
  const sa = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  return sa.toISOString().slice(0, 10);
}

/** Return a Date set to 00:00:00 SAST today. */
export function getSASTToday(): Date {
  const now = new Date();
  const sa = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  sa.setUTCHours(0, 0, 0, 0);
  return new Date(sa.getTime() - 2 * 60 * 60 * 1000);
}

/** Return an ISO string with SAST offset (for DB queries). */
export function getSASTStartOfDay(date: Date = new Date()): string {
  const sa = getSASTToday();
  return sa.toISOString();
}

/** Return end of today in SAST (23:59:59.999). */
export function getSASTEndOfDay(date: Date = new Date()): string {
  const sa = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  sa.setUTCHours(23, 59, 59, 999);
  return new Date(sa.getTime() - 2 * 60 * 60 * 1000).toISOString();
}
