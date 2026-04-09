/**
 * BION Onboarding AI — privacy-aware knowledge base assistant.
 * Rules:
 *  - Never reveals data about OTHER users (bookings, progress, identity).
 *  - Shares data only when the querying user is the owner, or is linked
 *    (corporate admin viewing their employees, provider viewing their booked client).
 *  - Answers all BION platform questions from the knowledge base.
 */

import type { ChatMessage, CrawlResult, ServiceRecommendation } from "@/types/onboarding";

// ─── Knowledge Base ────────────────────────────────────────────────────────────

const KB: Record<string, string> = {
  // General
  "what is bion":
    "BION is Africa's all-in-one wellness platform. Clients book health, beauty, medical and professional services. Providers manage their full practice — bookings, clients, prescriptions and analytics. Corporates fund employee wellness through BIONWallet. Everything is connected in one place.",

  "how does bion work":
    "Clients discover and book certified providers. Providers manage their calendar, clients and services through the BION dashboard. Corporate employers fund employee BIONWallets so staff can book any service. All parties see their data in real time.",

  "what services are on bion":
    "BION covers: Fitness & Personal Training, Yoga & Pilates, Medical GP & Specialist Consults, Physiotherapy, Nutrition & Dietetics, Mental Health & Therapy, Beauty & Hair, Spa & Massage, Dental, Eyebrow & Nail care, Corporate Wellness programmes, and Professional Life/Business Coaching.",

  // Client
  "how do i book":
    "Go to Discover → search or browse by category → tap any provider → choose a service and time slot → pay via BIONWallet or card → done! You'll get a WhatsApp confirmation and a calendar reminder.",

  "what is bion passport":
    "Your BION Passport is your personal wellness record. It stores your booking history, linked providers, progress metrics and health documents. You control exactly who can see your data — you can revoke access at any time.",

  "what are bionpoints":
    "BIONPoints are your reward currency. You earn them by booking sessions, completing routines, logging progress, maintaining streaks and referring friends. Redeem points for discounts on future bookings or exclusive perks.",

  "how does bionwallet work":
    "BIONWallet is your in-app balance. Top it up by card or EFT, or receive credits from your corporate employer. Use it to pay for any service on the platform instantly. It's a closed-loop system — funds stay within BION.",

  "how do i track progress":
    "Go to Progress in the bottom nav. Log metrics like weight, body fat, resting HR, or mood. Your providers can also log data for you after sessions. Charts show trends over time, and coaches see your progress to adjust programmes.",

  // Provider
  "how do i set up my services":
    "After completing onboarding, go to Pro → Services. Tap + New Service, fill in the name, description, duration and price. BION suggests pricing based on your category and SA market data. Services appear on your public profile immediately.",

  "how do i manage bookings":
    "Pro → Bookings shows all pending, confirmed and past bookings. Tap any booking to confirm, decline or mark complete. You can also send messages to clients directly from the booking card.",

  "what is bion fee":
    "BION charges an 8% platform fee on every completed booking. This covers payment processing, client acquisition, insurance and platform infrastructure. You keep 92% of every booking.",

  "how do i get paid":
    "Earnings appear in Pro → Billing → Payout. Request a payout at any time and funds arrive within 1–2 business days via EFT to your registered bank account. A minimum payout threshold of R100 applies.",

  "how do clients find me":
    "Clients find you via Search (by service, location, rating), Category browsing, Featured placements (for top-rated providers), and B_ — our AI that recommends you to clients whose needs match your services.",

  "can bion set up my account":
    "Yes! Use the AI Setup Agent during onboarding. It analyses your website, pre-fills your profile, creates your service list with market-rate pricing, and sets up your availability. You review and confirm everything before it goes live.",

  // Corporate
  "how does corporate wellness work":
    "Your company creates a wellness programme and assigns a monthly budget per employee. Employees receive BIONWallet credits and can book any approved service category. You see real-time spending, engagement rates, and wellness ROI in the dashboard.",

  "how do i add employees":
    "Go to Corporate → Employees → Batch Upload. Download the CSV template, fill in employee names, emails and optionally departments. Upload the file — BION validates the list and sends invitation emails to all employees automatically.",

  "what is the monthly budget":
    "You set the monthly credit amount per employee. The SA average is R800–R1500/employee/month for active wellness programmes. Unused credits can roll over (configurable) or expire at month end.",

  "can i restrict services":
    "Yes. Under Programme Settings, choose allowed categories (e.g., only Fitness and Mental Health). Employees can only spend their wallet on those categories.",

  // Social media & Google sign-in
  "how do i sign in with google":
    "On the login screen, tap 'Continue with Google'. BION will redirect you to Google to select your account, then bring you straight back — no password needed. Your Google profile name and photo will pre-fill your BION account.",

  "why add social media":
    "Adding your social handles lets providers learn more about you before your session, helps the AI recommend the right services based on your industry or lifestyle, and makes your public profile (for providers) look more credible to potential clients.",

  "what social media can i link":
    "You can add your Instagram, LinkedIn, Facebook and personal website during onboarding. These are optional and you can update them later in Settings → Profile. Providers can also link their business Instagram and LinkedIn to their public BION mini-site.",

  "how do i add my instagram":
    "On the Social Presence step during onboarding, enter your Instagram handle (e.g. @yourhandle). You can also update it after onboarding in Settings → Profile → Social Links. Your Instagram will appear on your public profile if you're a provider.",

  "how do i add my linkedin":
    "On the Social Presence or Business Details step, enter your LinkedIn URL (e.g. linkedin.com/in/yourname). For providers, this appears on your BION mini-site and helps corporate clients verify your credentials.",

  "how do i update my social links":
    "Go to Settings → Profile and scroll to Social Links. You can add or update your website, Instagram, LinkedIn and Facebook at any time. Changes reflect on your public profile immediately.",

  "what is a bion mini site":
    "Every provider gets a free public mini-site at bion.app/yourname. It shows your services, pricing, reviews, social links and a booking button. Share your mini-site URL on your social profiles to drive bookings.",

  // Compliance & Privacy
  "is bion popia compliant":
    "Yes. BION is fully POPIA (Protection of Personal Information Act) compliant. Data is stored in South Africa, encrypted at rest and in transit. Users control their own data and can request deletion at any time. Medical data requires explicit consent and is only visible to the treating provider.",

  "who can see my data":
    "Only you can see your personal data. Your booked providers can see your appointment history and progress (that you've shared with them). If your employer funded your wallet, they can see aggregate spending data — never individual session details. You can adjust permissions in Profile → Privacy.",

  "how is my data protected":
    "All data is encrypted (AES-256 at rest, TLS 1.3 in transit). We use Supabase (SOC 2 Type II certified) for our database. We never sell personal data. Medical records are HIPAA-aligned and POPIA-compliant.",

  // Troubleshooting
  "i cant log in":
    "Try resetting your password via the Sign In screen → Forgot Password. If you still can't access your account, contact support at help@bion.app or via the in-app chat.",

  "how do i cancel a booking":
    "Go to Schedule → tap the booking → Cancel. Cancellations made 24+ hours before the appointment are fully refunded to your BIONWallet. Late cancellations (within 24 hours) may incur a fee per the provider's cancellation policy.",

  "how do i contact support":
    "You can reach BION support via: in-app chat (tap the ? icon), email at help@bion.app, or WhatsApp on +27 87 123 4567. Support is available Mon–Fri 8am–6pm SAST.",
};

// ─── Privacy Guard ─────────────────────────────────────────────────────────────

const BLOCKED_PATTERNS = [
  /other user/i,
  /another user/i,
  /give me.*data/i,
  /show me.*data/i,
  /tell me about.*user/i,
  /list.*users/i,
  /all.*users/i,
  /other.*client/i,
  /another.*client/i,
  /different.*client/i,
  /other.*provider/i,
  /user.*id/i,
  /hack/i,
  /bypass/i,
  /access.*account/i,
];

const PRIVACY_RESPONSE =
  "I can only share data that belongs to you or that you're authorized to view (e.g., your own booking history, or if you're a corporate admin — your linked employees' aggregate data). I can't share information about other users. If you have a support concern, please contact help@bion.app.";

// ─── Response Engine ───────────────────────────────────────────────────────────

function findBestMatch(query: string): string | null {
  const q = query.toLowerCase();
  let bestKey: string | null = null;
  let bestScore = 0;

  for (const key of Object.keys(KB)) {
    const keyWords = key.split(" ");
    const score = keyWords.filter((w) => q.includes(w)).length / keyWords.length;
    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      bestKey = key;
    }
  }

  return bestKey ? KB[bestKey] : null;
}

function fallbackResponse(query: string, role: string): string {
  const q = query.toLowerCase();

  if (q.includes("price") || q.includes("cost") || q.includes("how much")) {
    return "Pricing on BION depends on the service and provider. You can see full pricing on any provider's profile before booking. I can also recommend pricing for your specific services — just ask me about a specific service type.";
  }

  if (q.includes("book") || q.includes("appointment") || q.includes("session")) {
    return role === "client"
      ? "To book, go to Discover, find a provider, tap their profile, choose a service and pick a time slot. It takes under 60 seconds."
      : "Clients can book your services directly from your profile page. Make sure your availability is set up in Pro → Availability.";
  }

  if (q.includes("payment") || q.includes("pay") || q.includes("wallet")) {
    return "BIONWallet is how payments work on BION. Clients top it up or receive corporate credits, then use it to pay instantly at booking. No card details needed at checkout.";
  }

  return "Great question! I'm not sure I have the exact answer for that. Could you rephrase, or check our Help Centre at help.bion.app for detailed guides? You can also reach our team at help@bion.app.";
}

// ─── RAG: User-Account Retrieval ──────────────────────────────────────────────
// When the user asks about their own form data (social links, bio, business name,
// etc.) we retrieve directly from formData rather than the static KB.

type RAGField = { label: string; patterns: RegExp[] };

const RAG_FIELDS: RAGField[] = [
  { label: "website",          patterns: [/my website/i, /my site/i, /my url/i] },
  { label: "instagram",        patterns: [/my instagram/i, /my ig/i, /@/] },
  { label: "linkedin",         patterns: [/my linkedin/i, /my linked in/i] },
  { label: "facebook",         patterns: [/my facebook/i, /my fb/i] },
  { label: "bio",              patterns: [/my bio/i, /my introduction/i, /my description/i] },
  { label: "businessName",     patterns: [/my business name/i, /my practice name/i, /my company name/i] },
  { label: "companyName",      patterns: [/my company/i, /my organisation/i, /my org/i] },
  { label: "displayName",      patterns: [/my name/i, /my display name/i] },
  { label: "location",         patterns: [/my location/i, /my city/i, /where am i/i] },
  { label: "companyWebsite",   patterns: [/company website/i, /company url/i, /our site/i] },
];

function retrieveFromFormData(query: string, formData: Record<string, string>): string | null {
  for (const field of RAG_FIELDS) {
    if (field.patterns.some((p) => p.test(query))) {
      const value = formData[field.label];
      if (value) {
        return `Based on what you entered during onboarding, your **${field.label.replace(/([A-Z])/g, " $1").toLowerCase()}** is: **${value}**. You can update this in Settings at any time.`;
      } else {
        return `I don't see a **${field.label.replace(/([A-Z])/g, " $1").toLowerCase()}** saved yet. You can add it on the current step or update it later in Settings → Profile.`;
      }
    }
  }
  return null;
}

// ─── Context-Aware Responses ──────────────────────────────────────────────────

export function getCrawlInsightMessage(crawl: CrawlResult, recommendations: ServiceRecommendation[]): string {
  const topServices = recommendations.slice(0, 3).map((r) => `**${r.name}** (R${r.suggestedPrice.min}–R${r.suggestedPrice.max})`).join(", ");
  return `Based on your website (${crawl.businessName}), I've analysed your ${crawl.businessType} business and found these top service opportunities: ${topServices}. I've pre-filled your service list below — review and adjust any prices or descriptions before publishing.`;
}

export function getSetupCompletionMessage(businessName: string): string {
  return `Your BION provider profile for **${businessName}** is ready to go live! I've set up your services, pricing and availability based on your website and SA market data. Review everything below, make any tweaks, and tap "Confirm & Go Live" when you're happy.`;
}

// ─── Main Chat Function ────────────────────────────────────────────────────────

export function getAIResponse(
  userMessage: string,
  role: string,
  context?: {
    crawlData?: CrawlResult;
    stepTitle?: string;
    formData?: Record<string, string>;
  }
): string {
  // Privacy guard
  if (BLOCKED_PATTERNS.some((p) => p.test(userMessage))) {
    return PRIVACY_RESPONSE;
  }

  // Direct KB match
  const kbAnswer = findBestMatch(userMessage);
  if (kbAnswer) return kbAnswer;

  // RAG: retrieve from user's own account data
  if (context?.formData) {
    const ragAnswer = retrieveFromFormData(userMessage, context.formData);
    if (ragAnswer) return ragAnswer;
  }

  // Context-aware: crawl step help
  if (context?.crawlData && /recommend|service|price|offer/i.test(userMessage)) {
    const { crawlData } = context;
    return `For your ${crawlData.businessType} business "${crawlData.businessName}", I recommend focusing on ${crawlData.services.slice(0, 3).join(", ")}. These are in high demand in the SA market and align with what's on your website. Pricing is pre-filled from current market rates — you can adjust as needed.`;
  }

  // Context-aware: step help
  if (context?.stepTitle) {
    const step = context.stepTitle.toLowerCase();
    if (step.includes("website") || step.includes("crawl")) {
      return "Enter your business website URL and I'll analyse it to find your services, location and contact info. This helps me set up your profile automatically. If you don't have a website, skip this step and fill in the details manually.";
    }
    if (step.includes("service") || step.includes("price")) {
      return "Add each service you offer with a name, description, duration and price. I've pre-filled suggestions based on your website — you can edit, remove or add more. Prices shown are based on current SA market data for your service category.";
    }
    if (step.includes("availability")) {
      return "Set the days and hours you're available for bookings. You can also set buffer time between appointments and an advance booking window (e.g., clients can book up to 30 days ahead). Update this any time from Pro → Availability.";
    }
    if (step.includes("employee") || step.includes("batch") || step.includes("upload")) {
      return "Download the CSV template, fill in your employees' names and email addresses. Optionally add department and a monthly wellness budget. Upload the file and I'll validate each row, then send invitation emails to all employees automatically.";
    }
    if (step.includes("social") || step.includes("presence") || step.includes("linkedin") || step.includes("instagram")) {
      return "Add your social media handles so providers and clients can connect with you. Instagram and LinkedIn are most useful — providers check these before sessions to personalise your experience. All fields are optional and your data is never shared without your consent.";
    }
  }

  return fallbackResponse(userMessage, role);
}

// ─── Chat History Builder ─────────────────────────────────────────────────────

export function buildInitialMessages(role: string, stepTitle?: string): ChatMessage[] {
  const greetings: Record<string, string> = {
    client: "Hi! I'm your BION onboarding assistant 👋 I'll help you set up your account and answer any questions along the way. What would you like to know?",
    provider: "Welcome to BION! I'm here to help you set up your provider profile, recommend services and explain how the platform works. Ask me anything!",
    corporate: "Hello! I'll guide you through setting up your corporate wellness programme. I can help with employee onboarding, budget planning and policy setup. What do you need?",
    admin: "Welcome, Admin! I can help with platform setup, verification processes and any configuration questions. What would you like to know?",
  };

  return [
    {
      id: "init",
      role: "assistant",
      content: greetings[role] ?? greetings.client,
      timestamp: new Date(),
    },
  ];
}
