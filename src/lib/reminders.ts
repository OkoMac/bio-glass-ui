/**
 * B_ Reminder Engine
 * Scans all user data (routines, calendar, medication, food, water, sleep)
 * and generates timely reminders. Reminders are shown as notifications
 * and surfaced through the B_ assistant.
 */

export interface Reminder {
  id: string;
  type: "medication" | "workout" | "appointment" | "skincare" | "meal" | "water" | "sleep" | "wellness" | "beauty" | "general";
  title: string;
  body: string;
  time: string;       // HH:mm
  priority: "high" | "medium" | "low";
  icon: string;        // emoji
  actionUrl?: string;  // deep link in app
  dismissed: boolean;
}

const STORAGE_KEY = "bion_reminders_dismissed";

function getDismissed(): Set<string> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const raw = localStorage.getItem(`${STORAGE_KEY}_${today}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

export function dismissReminder(id: string): void {
  const today = new Date().toISOString().split("T")[0];
  const dismissed = getDismissed();
  dismissed.add(id);
  localStorage.setItem(`${STORAGE_KEY}_${today}`, JSON.stringify([...dismissed]));
}

/**
 * Generate all reminders for the current time based on user data
 */
export function generateReminders(): Reminder[] {
  const now = new Date();
  const hour = now.getHours();
  const today = now.toISOString().split("T")[0];
  const dismissed = getDismissed();
  const reminders: Reminder[] = [];

  // ── Routines ──────────────────────────────────────
  try {
    const routines = JSON.parse(localStorage.getItem("bion_routines") ?? "[]");
    for (const r of routines) {
      if (r.type === "medication") {
        // Morning meds (6-10am)
        if (hour >= 6 && hour < 10) {
          reminders.push({
            id: `med_am_${today}`,
            type: "medication",
            title: "Morning Medication",
            body: `Time to take your morning supplements from "${r.title}"`,
            time: "08:00",
            priority: "high",
            icon: "💊",
            actionUrl: "/routines",
            dismissed: false,
          });
        }
        // Evening meds (19-22)
        if (hour >= 19 && hour < 22) {
          reminders.push({
            id: `med_pm_${today}`,
            type: "medication",
            title: "Evening Medication",
            body: `Don't forget your evening supplements from "${r.title}"`,
            time: "21:00",
            priority: "high",
            icon: "💊",
            actionUrl: "/routines",
            dismissed: false,
          });
        }
      }

      if (r.type === "workout" && r.schedule) {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const todayName = dayNames[now.getDay()];
        if (r.schedule.includes(todayName) && hour >= 6 && hour < 18) {
          reminders.push({
            id: `workout_${r.id}_${today}`,
            type: "workout",
            title: r.title,
            body: `Today is ${todayName} — "${r.title}" is scheduled. ${r.exercises?.length ?? 0} exercises waiting.`,
            time: "07:00",
            priority: "medium",
            icon: "🏋️",
            actionUrl: "/routines",
            dismissed: false,
          });
        }
      }

      if (r.type === "skincare") {
        if (hour >= 6 && hour < 9) {
          reminders.push({
            id: `skin_am_${today}`,
            type: "skincare",
            title: "AM Skincare Routine",
            body: `Start your morning skincare: cleanse, tone, serum, moisturise + SPF`,
            time: "07:00",
            priority: "low",
            icon: "✨",
            actionUrl: "/routines",
            dismissed: false,
          });
        }
        if (hour >= 20 && hour < 23) {
          reminders.push({
            id: `skin_pm_${today}`,
            type: "skincare",
            title: "PM Skincare Routine",
            body: `Time for your evening skincare: double cleanse, tone, treatment, moisturise`,
            time: "21:00",
            priority: "low",
            icon: "✨",
            actionUrl: "/routines",
            dismissed: false,
          });
        }
      }

      if (r.type === "wellness") {
        if (hour >= 5 && hour < 8) {
          reminders.push({
            id: `wellness_am_${today}`,
            type: "wellness",
            title: "Morning Mindfulness",
            body: `Start your day with "${r.title}" — gratitude, breathing, meditation`,
            time: "06:30",
            priority: "medium",
            icon: "🧘",
            actionUrl: "/routines",
            dismissed: false,
          });
        }
      }

      if (r.type === "meal") {
        if (hour >= 7 && hour < 9) {
          reminders.push({
            id: `meal_bfast_${today}`,
            type: "meal",
            title: "Breakfast Time",
            body: `Follow your "${r.title}" meal plan — log your breakfast in the Food Tracker`,
            time: "08:00",
            priority: "low",
            icon: "🥗",
            actionUrl: "/food-tracker",
            dismissed: false,
          });
        }
      }

      if (r.type === "beauty") {
        const dayOfWeek = now.getDay();
        if ((dayOfWeek === 0 || dayOfWeek === 3) && hour >= 18 && hour < 21) {
          reminders.push({
            id: `beauty_${today}`,
            type: "beauty",
            title: "Beauty Routine",
            body: `Today is your beauty routine day — "${r.title}"`,
            time: "19:00",
            priority: "low",
            icon: "💅",
            actionUrl: "/routines",
            dismissed: false,
          });
        }
      }
    }
  } catch { /* ignore */ }

  // ── Calendar events ───────────────────────────────
  try {
    const events = JSON.parse(localStorage.getItem("bion_calendar_events") ?? "[]");
    const todayEvents = events.filter((e: any) => e.date === today && !e.completed);
    for (const evt of todayEvents) {
      if (evt.time) {
        const [evtH] = evt.time.split(":").map(Number);
        // Remind 1 hour before
        if (hour === evtH - 1 || (hour === evtH && now.getMinutes() < 30)) {
          reminders.push({
            id: `cal_${evt.id}`,
            type: "appointment",
            title: evt.title,
            body: `${evt.provider ? `With ${evt.provider} · ` : ""}${evt.time}${evt.location ? ` · ${evt.location}` : ""}`,
            time: evt.time,
            priority: "high",
            icon: "📅",
            actionUrl: "/calendar",
            dismissed: false,
          });
        }
      }
    }
  } catch { /* ignore */ }

  // ── Water ─────────────────────────────────────────
  try {
    const waterCount = parseInt(localStorage.getItem(`bion_water_${today}`) ?? "0");
    const goals = JSON.parse(localStorage.getItem("bion_food_goals") ?? "{}");
    const waterGoal = goals.water ?? 8;
    if (hour >= 10 && hour < 20 && waterCount < Math.floor(waterGoal * (hour - 6) / 14)) {
      reminders.push({
        id: `water_${today}_${hour}`,
        type: "water",
        title: "Drink Water",
        body: `You've had ${waterCount} of ${waterGoal} glasses today. Stay hydrated!`,
        time: `${hour}:00`,
        priority: "low",
        icon: "💧",
        actionUrl: "/water-tracker",
        dismissed: false,
      });
    }
  } catch { /* ignore */ }

  // ── Food logging ──────────────────────────────────
  try {
    const entries = JSON.parse(localStorage.getItem("bion_food_tracker") ?? "[]");
    const todayMeals = entries.filter((e: any) => e.date === today);
    if (hour >= 12 && hour < 14 && !todayMeals.some((e: any) => e.meal === "lunch")) {
      reminders.push({
        id: `food_lunch_${today}`,
        type: "meal",
        title: "Log Lunch",
        body: "Don't forget to log your lunch — take a photo for instant calorie estimates",
        time: "12:30",
        priority: "low",
        icon: "🍽️",
        actionUrl: "/food-tracker",
        dismissed: false,
      });
    }
    if (hour >= 19 && hour < 21 && !todayMeals.some((e: any) => e.meal === "dinner")) {
      reminders.push({
        id: `food_dinner_${today}`,
        type: "meal",
        title: "Log Dinner",
        body: "Log your dinner to stay on track with your calorie goals",
        time: "19:30",
        priority: "low",
        icon: "🍽️",
        actionUrl: "/food-tracker",
        dismissed: false,
      });
    }
  } catch { /* ignore */ }

  // ── Sleep ─────────────────────────────────────────
  if (hour >= 22) {
    reminders.push({
      id: `sleep_${today}`,
      type: "sleep",
      title: "Bedtime",
      body: "Time to wind down. Aim for 7.5 hours of sleep tonight.",
      time: "22:00",
      priority: "medium",
      icon: "😴",
      actionUrl: "/sleep-tracker",
      dismissed: false,
    });
  }

  // Mark dismissed ones
  return reminders.map(r => ({
    ...r,
    dismissed: dismissed.has(r.id),
  }));
}

/**
 * Get active (non-dismissed) reminders
 */
export function getActiveReminders(): Reminder[] {
  return generateReminders().filter(r => !r.dismissed);
}

/**
 * Get reminder summary for B_ assistant
 */
export function getReminderSummary(): string {
  const active = getActiveReminders();
  if (active.length === 0) return "No pending reminders right now. You're all caught up!";

  const lines = active.map(r => `${r.icon} **${r.title}** — ${r.body}`);
  return `**You have ${active.length} reminder${active.length > 1 ? "s" : ""}:**\n\n${lines.join("\n\n")}`;
}

/**
 * Request browser notification permission
 */
export function requestNotificationPermission(): void {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

/**
 * Show a browser notification
 */
export function showNotification(title: string, body: string, icon?: string): void {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: icon ?? "/icon-192.png",
      badge: "/icon-192.png",
      tag: title,
    });
  }
}
