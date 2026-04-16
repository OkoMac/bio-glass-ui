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
  return then.toISOString().slice(0, 10);
}
