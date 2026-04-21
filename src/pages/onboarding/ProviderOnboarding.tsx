import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { WebCrawlerStep } from "@/components/onboarding/WebCrawlerStep";
import { AISetupStep } from "@/components/onboarding/AISetupStep";
import { useOnboarding } from "@/hooks/useOnboarding";
import type { OnboardingStep, CrawlResult, ServiceRecommendation, AIGeneratedProfile } from "@/types/onboarding";
import { useState } from "react";

const STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    type: "welcome",
    title: "Welcome to BION for Providers",
    subtitle: "Grow your practice with Africa's premier wellness platform.",
    icon: "🏥",
    highlights: [
      { icon: "📅", title: "Effortless Bookings", desc: "Clients book you 24/7 — calendar, confirmations and reminders handled automatically." },
      { icon: "💰", title: "90% of every booking is yours", desc: "BION deducts a 5% platform fee and ring-fences a 5% acquisition-marketing contribution that we spend acquiring new clients for you. Payout lands in your wallet instantly via Paystack." },
      { icon: "📊", title: "Built-in Analytics", desc: "Track revenue, client retention, no-show rates and growth trends in real time." },
      { icon: "🤖", title: "AI-Powered Growth", desc: "B_ matches you with clients whose needs fit your services automatically." },
    ],
  },
  {
    id: "business_profile",
    type: "form",
    title: "Your Business Details",
    subtitle: "These appear on your public profile and are used for verification.",
    canSkip: false,
    fields: [
      { id: "businessName", label: "Business / Practice Name", type: "text", placeholder: "e.g. FitLife Studio", required: true, aiHint: "businessName" },
      {
        id: "legalStructure",
        label: "Legal Structure",
        type: "select",
        options: ["Sole Proprietor", "Pty Ltd", "CC (Close Corporation)", "NPC / Non-Profit", "Partnership", "Incorporated (Inc)", "Trust", "Other"],
        required: true,
      },
      { id: "businessRegistrationNumber", label: "Business Registration Number (if registered)", type: "text", placeholder: "e.g. 2023/123456/07 — leave blank if sole proprietor", required: false },
      {
        id: "vertical",
        label: "Service Category",
        type: "select",
        options: ["Fitness & Personal Training", "Yoga & Pilates", "Medical / GP", "Physiotherapy & Rehab", "Nutrition & Dietetics", "Beauty & Hair", "Spa & Massage", "Mental Health & Therapy", "Dental", "Corporate Wellness", "Life & Business Coaching", "Other"],
        required: true,
      },
      { id: "location", label: "Business Location / City", type: "text", placeholder: "e.g. Sandton, Johannesburg", required: true, aiHint: "location" },
      { id: "phone", label: "Business Phone", type: "tel", placeholder: "+27 11 123 4567", required: true, aiHint: "phone" },
      { id: "email", label: "Business Email", type: "email", placeholder: "bookings@yourpractice.co.za", required: true, aiHint: "email" },
      { id: "bio",       label: "Short Bio / Introduction", type: "textarea", placeholder: "Tell clients about your experience and approach…", required: false, aiHint: "description" },
      { id: "website",   label: "Business Website",         type: "text",     placeholder: "https://yourpractice.co.za",                  required: false, aiHint: "url" },
      { id: "instagram", label: "Instagram Handle",         type: "text",     placeholder: "@yourpractice",                               required: false },
      { id: "linkedin",  label: "LinkedIn Profile",         type: "text",     placeholder: "linkedin.com/in/yourname",                    required: false },
      { id: "facebook",  label: "Facebook Page",            type: "text",     placeholder: "facebook.com/yourpractice",                   required: false },
    ],
  },
  {
    id: "website_crawl",
    type: "webcrawl",
    title: "Analyse Your Website",
    subtitle: "We'll read your site and suggest the perfect service list with market-rate pricing.",
    canSkip: true,
  },
  {
    id: "ai_setup",
    type: "ai-setup",
    title: "AI Account Setup",
    subtitle: "Let AI build your full profile, services and availability — review before publishing.",
    canSkip: true,
  },
  {
    id: "bion_fee",
    type: "info",
    title: "BION Fee & Payouts",
    subtitle: "Simple, transparent pricing.",
    highlights: [
      { icon: "💸", title: "5% Platform Fee", desc: "Deducted from every completed booking — covers payment processing, insurance, support and platform infrastructure." },
      { icon: "📣", title: "5% Acquisition Marketing", desc: "Ring-fenced from every completed booking and spent on vouchers that bring you new clients. Vouchers are redeemable only at your practice and go to nearby people who have never booked with you." },
      { icon: "🧮", title: "You keep 90% + client fee", desc: "On a R100 service, the client pays R105. Provider net: R90. The 5% client fee and BION's share of costs are invisible to you." },
      { icon: "🏦", title: "Instant Wallet Payout", desc: "Your share lands in your BION wallet the moment a booking completes. Withdraw to your bank any time (10% cash-out fee covers bank transfers + FICA); free to keep in-wallet for re-investing." },
    ],
  },
  {
    id: "dashboard_tour",
    type: "info",
    title: "Your Provider Dashboard",
    subtitle: "Everything you need to run your practice.",
    highlights: [
      { icon: "📋", title: "Today's View", desc: "See all upcoming sessions, pending confirmations and quick stats for the day." },
      { icon: "👥", title: "Client CRM", desc: "Full client profiles with booking history, progress tracking, prescriptions and notes." },
      { icon: "📝", title: "Prescription Builder", desc: "Create workout plans, meal plans and care programmes — assign them directly to clients." },
      { icon: "💬", title: "Direct Messaging", desc: "Chat with clients, send files, leave voice notes and broadcast updates to all your clients at once." },
    ],
  },
  {
    id: "provider_agreement",
    type: "consent",
    title: "Provider Agreement",
    subtitle: "Review and accept to continue.",
    consentItems: [
      { id: "fee_agree",     label: "I understand and accept: a 5% platform fee is deducted from every completed booking, and a further 5% is ring-fenced as an acquisition-marketing contribution that BION spends on client-acquisition vouchers redeemable only at my practice. My net payout is 90% of the bill, settled to my BION wallet on completion.", required: true },
      { id: "voucher_ack",   label: "I understand that BION charges a 5% transaction fee on acquisition vouchers when they are redeemed at my practice. Withdrawals from my BION wallet to my bank incur a 10% cash-out fee; keeping funds in-wallet is free.", required: true },
      { id: "popia_dpa",     label: "I consent to BION processing my personal and business data as a data processor under POPIA. Client data shared with me will be used only for service delivery.", required: true },
      { id: "cancellation",  label: "I understand the BION cancellation policy: client cancels 24h+ before = full refund to wallet; client cancels <24h = 50% fee; provider cancels = full client refund + 10% transaction fee from my wallet + cancellation strike. I will respond to booking requests within 24 hours.", required: true },
      { id: "verification",  label: "I confirm that my qualifications and professional registrations (if applicable — HPCSA/SANC/AHPCSA) are current and valid, and I authorise BION to verify them against the relevant public register.", required: true },
      { id: "dispute_ack",   label: "I accept that disputes raised by clients are mediated by BION's B_ AI, and that my response + evidence must be submitted within the 7-day window to avoid automatic refund to the buyer.", required: true },
    ],
  },
  {
    id: "quiz",
    type: "quiz",
    title: "Provider Knowledge Check",
    subtitle: "Confirm you understand the key platform rules.",
    canSkip: false,
    passScore: 66,
    questions: [
      {
        id: "pq1",
        question: "On a R100 booking, what is your net payout after all BION deductions?",
        type: "single",
        required: true,
        isKnowledgeCheck: true,
        explanation: "Client pays R105. After the 5% platform fee and 5% acquisition-marketing contribution, you keep R90 (90%). The marketing contribution funds new-client vouchers redeemable only at your practice — it is not revenue to BION.",
        options: [
          { id: "a", text: "R95" },
          { id: "b", text: "R90", isCorrect: true },
          { id: "c", text: "R85" },
          { id: "d", text: "R100" },
        ],
      },
      {
        id: "pq2",
        question: "How quickly do payouts arrive after you request one?",
        type: "single",
        required: true,
        isKnowledgeCheck: true,
        explanation: "Payouts are instant via Paystack split payment to your bank account after each completed session.",
        options: [
          { id: "a", text: "Instantly via Paystack split payment", isCorrect: true },
          { id: "b", text: "1–2 business days" },
          { id: "c", text: "5–7 business days" },
          { id: "d", text: "Once a month" },
        ],
      },
      {
        id: "pq3",
        question: "Which of the following can you do in the Provider Dashboard?",
        type: "multiple",
        required: true,
        isKnowledgeCheck: true,
        explanation: "The Provider Dashboard includes a full CRM, prescription builder, messaging, analytics and availability management.",
        options: [
          { id: "a", text: "View and manage your bookings", isCorrect: true },
          { id: "b", text: "Send prescriptions to clients", isCorrect: true },
          { id: "c", text: "See other providers' revenue" },
          { id: "d", text: "Track your revenue analytics", isCorrect: true },
        ],
      },
    ],
  },
  {
    id: "complete",
    type: "complete",
    title: "You're Live! 🚀",
    subtitle: "Your provider profile is published on BION.",
    description: "Clients can now discover and book you. Check your dashboard to set final availability, review your services and share your BION profile link.",
  },
];

export default function ProviderOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // We need access to progress outside the shell to pass crawl/form data to complex steps
  const [crawlData, setCrawlData] = useState<CrawlResult | undefined>();
  const [recommendations, setRecommendations] = useState<ServiceRecommendation[]>([]);
  const [aiProfile, setAiProfile] = useState<AIGeneratedProfile | undefined>();
  const [formData, setFormData] = useState<Record<string, string>>({});

  if (!user) {
    navigate("/welcome");
    return null;
  }

  const userId = user.id ?? user.email;

  // Shared hook — also used by the shell internally, but we need it here to feed formData to sub-steps
  const ob = useOnboarding(userId, "provider", STEPS);

  const handleCrawlComplete = (result: CrawlResult, recs: ServiceRecommendation[]) => {
    setCrawlData(result);
    setRecommendations(recs);
    ob.setCrawlData(result);
    // Pre-fill form fields from crawl
    const prefill: Record<string, string> = {};
    if (result.businessName) prefill.businessName = result.businessName;
    if (result.description) prefill.bio = result.description;
    if (result.phone) prefill.phone = result.phone;
    if (result.email) prefill.email = result.email;
    ob.setFormData(prefill);
    setFormData((d) => ({ ...d, ...prefill }));
  };

  const handleAIProfile = (profile: AIGeneratedProfile) => {
    setAiProfile(profile);
    ob.setFormData({
      businessName: profile.businessName,
      bio: profile.description,
    });
  };

  return (
    <OnboardingShell
      ob={ob}
      role="provider"
      steps={STEPS}
      onComplete={() => navigate("/pro/dashboard", { replace: true })}
      renderWebCrawlStep={(step) => (
        <WebCrawlerStep
          title={step.title}
          subtitle={step.subtitle}
          mode="provider"
          onCrawlComplete={handleCrawlComplete}
          existingCrawl={crawlData}
        />
      )}
      renderAISetupStep={(step) => (
        <AISetupStep
          title={step.title}
          subtitle={step.subtitle}
          crawlData={crawlData}
          existingFormData={{ ...ob.progress.formData, ...formData }}
          onProfileGenerated={handleAIProfile}
        />
      )}
    />
  );
}
