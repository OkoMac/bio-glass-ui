/**
 * Provider quick-reply message templates.
 * Used in provider Messages page for fast client communication.
 */

export interface QuickReply {
  id: string;
  label: string;
  emoji: string;
  template: string;
  category: "booking" | "followup" | "reminder" | "general";
}

export const QUICK_REPLIES: QuickReply[] = [
  // Booking responses
  {
    id: "confirm",
    label: "Confirm booking",
    emoji: "✅",
    template: "Hi! Your booking is confirmed. Looking forward to seeing you on {date} at {time}. Please arrive 5 minutes early.",
    category: "booking",
  },
  {
    id: "reschedule",
    label: "Request reschedule",
    emoji: "📅",
    template: "Hi! Unfortunately I need to reschedule our session. Could you pick a new time that works for you? I have availability this week.",
    category: "booking",
  },
  {
    id: "cancel",
    label: "Cancel with apology",
    emoji: "😔",
    template: "Hi, I'm very sorry but I need to cancel our upcoming session. I apologise for the inconvenience. Would you like to rebook for another day?",
    category: "booking",
  },

  // Follow-up
  {
    id: "howfeeling",
    label: "Post-session check-in",
    emoji: "💪",
    template: "Hi! How are you feeling after your session? Any soreness or questions? Remember to stay hydrated and follow the routine I gave you.",
    category: "followup",
  },
  {
    id: "progress",
    label: "Progress check",
    emoji: "📊",
    template: "Hi! Just checking in on your progress. How have you been doing with the programme? Let me know if you'd like to adjust anything.",
    category: "followup",
  },
  {
    id: "rebookprompt",
    label: "Encourage rebooking",
    emoji: "🔄",
    template: "Hi! It's been a while since your last session. Consistency is key to results! Would you like to book your next appointment?",
    category: "followup",
  },

  // Reminders
  {
    id: "tomorrow",
    label: "Tomorrow reminder",
    emoji: "⏰",
    template: "Just a friendly reminder — your session is tomorrow at {time}. See you then!",
    category: "reminder",
  },
  {
    id: "payment",
    label: "Payment reminder",
    emoji: "💳",
    template: "Hi! Just a quick note — your session payment is still pending. You can pay via the BION app or at your next visit. Let me know if you have any questions.",
    category: "reminder",
  },

  // General
  {
    id: "thanks",
    label: "Thank you",
    emoji: "🙏",
    template: "Thank you for choosing me as your provider! If you enjoyed the session, I'd appreciate a review on BION. It helps other people find quality care.",
    category: "general",
  },
  {
    id: "welcome",
    label: "Welcome new client",
    emoji: "👋",
    template: "Welcome to my practice! I'm looking forward to working with you. Before your first session, please fill in your Health Profile on the BION app so I can prepare.",
    category: "general",
  },
];

/** Replace {date} and {time} placeholders with actual values */
export function fillTemplate(template: string, date?: string, time?: string): string {
  return template
    .replace("{date}", date ?? "your appointment date")
    .replace("{time}", time ?? "your appointment time");
}
