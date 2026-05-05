/**
 * Local-time YYYY-MM-DD for daily-bucket localStorage keys
 * (`bion_water_${localDateKey()}`, `bion_food_${localDateKey()}`, etc).
 *
 * Why not toISOString().slice(0, 10)?
 *   ISO is UTC. In SAST (UTC+2), the user's "today" rolls over at 00:00
 *   local but ISO doesn't roll over until 02:00 SAST. Reported by user
 *   2026-05-05 00:03: water tile still showed 8/8 glasses three minutes
 *   into the new day because the read was using the previous-UTC-day key.
 *
 * Returns the user's local civil date — the right granularity for "have
 * I drunk water today / eaten today" questions.
 */
import { getSASTDateKey } from "@/utils/sastDate";

export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * formatRelativeTime — short human-readable "time ago" helper used in
 * audit logs, activity feeds, and other timeline UIs.
 *
 * Returns strings like:
 *   "just now"     — < 60 seconds
 *   "5 min ago"    — < 60 minutes
 *   "3h ago"       — < 24 hours
 *   "2d ago"       — <= 7 days
 *   "2026-04-08"   — > 7 days (absolute ISO date)
 */
export function formatRelativeTime(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const now = Date.now();
  const diffMs = now - then.getTime();
  if (diffMs < 0) return "just now"; // clock skew / future timestamps
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days <= 7) return `${days}d ago`;
  // > 7 days — show absolute date in YYYY-MM-DD
  return getSASTDateKey(then);
}