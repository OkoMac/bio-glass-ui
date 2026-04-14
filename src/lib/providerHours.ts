/**
 * Parse provider availability strings to determine if they're open now.
 * Works with common patterns from scraped data:
 * - "Mon-Fri 8am-6pm, Sat 9am-2pm"
 * - "Weekdays 8-5"
 * - "Available daily"
 * - "By appointment"
 */

export type OpenStatus = {
  isOpen: boolean;
  label: string; // "Open now", "Closed", "Opens 9am", "Open until 6pm"
  color: "teal" | "muted" | "coral";
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function parseHour(str: string): number | null {
  const m = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const mins = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = m[3]?.toLowerCase();
  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;
  return hour + mins / 60;
}

export function getOpenStatus(availability: string): OpenStatus {
  if (!availability || typeof availability !== "string") {
    return { isOpen: false, label: "Hours unknown", color: "muted" };
  }

  const lower = availability.toLowerCase();

  if (/by appointment|by appt|appointment only/i.test(lower)) {
    return { isOpen: true, label: "By appointment", color: "muted" };
  }

  if (/24\s*\/?\s*7|24 hours|always/i.test(lower)) {
    return { isOpen: true, label: "Open 24/7", color: "teal" };
  }

  const now = new Date();
  const dayIdx = now.getDay();
  const currentDay = DAY_KEYS[dayIdx];
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Check if current day is mentioned as included
  const isWeekday = dayIdx >= 1 && dayIdx <= 5;
  const isWeekend = dayIdx === 0 || dayIdx === 6;

  let dayMatches = false;
  if (/daily|everyday|all week/i.test(lower)) dayMatches = true;
  else if (isWeekday && /weekday|mon.*fri|monday.*friday/i.test(lower)) dayMatches = true;
  else if (isWeekend && /weekend|sat.*sun/i.test(lower)) dayMatches = true;
  else if (lower.includes(currentDay)) dayMatches = true;

  if (!dayMatches) {
    return { isOpen: false, label: "Closed today", color: "muted" };
  }

  // Try to parse hours from the string
  const timeMatches = availability.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–to]+\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!timeMatches) {
    return { isOpen: true, label: "Available today", color: "teal" };
  }

  const openStr = timeMatches[0].split(/[-–to]+/)[0].trim();
  const closeStr = timeMatches[0].split(/[-–to]+/).pop()?.trim() ?? "";
  const openHour = parseHour(openStr);
  const closeHour = parseHour(closeStr);

  if (openHour === null || closeHour === null) {
    return { isOpen: true, label: "Available today", color: "teal" };
  }

  if (currentHour < openHour) {
    const hrs = Math.floor(openHour);
    const mins = Math.round((openHour - hrs) * 60);
    const ampm = hrs >= 12 ? "pm" : "am";
    const display = `${hrs > 12 ? hrs - 12 : hrs || 12}${mins > 0 ? `:${mins.toString().padStart(2, "0")}` : ""}${ampm}`;
    return { isOpen: false, label: `Opens ${display}`, color: "muted" };
  }

  if (currentHour >= closeHour) {
    return { isOpen: false, label: "Closed", color: "muted" };
  }

  // Currently open
  const hrs = Math.floor(closeHour);
  const mins = Math.round((closeHour - hrs) * 60);
  const ampm = hrs >= 12 ? "pm" : "am";
  const display = `${hrs > 12 ? hrs - 12 : hrs || 12}${mins > 0 ? `:${mins.toString().padStart(2, "0")}` : ""}${ampm}`;
  return { isOpen: true, label: `Open until ${display}`, color: "teal" };
}
