/**
 * Shared visibility rule for the floating top-corner buttons:
 * CalendarButton (top-left), InstallButton + NotificationBell (top-right).
 *
 * These only belong on pages that DON'T already render their own top
 * chrome (back-arrow, title, Save button etc.). Otherwise they stack on
 * top of page-level controls and cover them — see screenshot 2026-04-27
 * where Install + Bell + page Save button were all fighting for the
 * top-right corner of /settings.
 *
 * The previous behaviour was a small per-component hide-list which kept
 * missing pages. This is the inverted shape: by default we hide; only
 * the explicit "shell" homes show the floating chrome.
 */
const FLOATING_CHROME_ALLOW = [
  "/",              // root directory / landing
  "/home",          // client home
  "/discover",      // discover tab
  "/routines",      // routines tab
  "/marketplace",   // marketplace
  "/feed",          // feed tab
  "/wellness",      // wellness home
  "/dashboard",     // generic dashboard landing
  "/welcome",       // welcome / onboarding
  "/tools",         // tools page
];

export function shouldShowFloatingChrome(pathname: string): boolean {
  // Exact match or prefix match (e.g. "/home" matches "/home/foo").
  return FLOATING_CHROME_ALLOW.some(
    p => pathname === p || pathname.startsWith(p + "/"),
  );
}
