/**
 * Shared time-of-day greeting. Pinned to Africa/Johannesburg because BION is
 * SA-first and device clocks / browser timezones can't be trusted — we saw
 * "Good morning" appear at 20:35 local when the Brave test profile ran in UTC.
 */
export function getSastGreeting(): "Good morning" | "Good afternoon" | "Good evening" {
  const hour = Number(new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg", hour: "numeric", hour12: false,
  }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
