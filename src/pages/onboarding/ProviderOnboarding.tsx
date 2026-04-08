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
      { icon: "💰", title: "95% Payout Rate", desc: "BION charges only 5%. The rest is yours. Instant via Paystack split payment to your bank account after each completed session." },
      { icon: "📊", title: "Built-in Analytics", desc: "Track revenue, client retention, no-show rates and growth trends in real time." },
      { icon: "🤖", title: "AI-Powered Growth", desc: "ServeAI matches you with clients whose needs fit your services automatically." },
    ],
  },
  {
    id: "business_profile",
    type: "form",
    title: "Your Business Details",
    subtitle: "These appear on your public profile.",
    canSkip: true,
    fields: [
      { id: "businessName", label: "Business / Practice Name", type: "text", placeholder: "e.g. FitLife Studio", required: true, aiHint: "businessName" },
      {
        id: "vertical",
        label: "Service Category",
        type: "select",
        options: ["Fitness & Personal Training", "Yoga & Pilates", "Medical / GP", "Physiotherapy & Rehab", "Nutrition & Dietetics", "Beauty & Hair", "Spa & Massage", "Mental Health & Therapy", "Dental", "Corporate Wellness", "Life & Business Coaching", "Other"],
        required: true,
      },
      { id: "location", label: "Business Location / City", type: "text", placeholder: "e.g. Sandton, Johannesburg", required: true, aiHint: "location" },
      { id: "phone", label: "Business Phone", type: "tel", placeholder: "+27 11 123 4567", required: false, aiHint: "phone" },
      { id: "email", label: "Business Email", type: "email", placeholder: "bookings@yourpractice.co.za", required: false, aiHint: "email" },
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
      { icon: "💸", title: "5% Platform Fee", desc: "BION charges 5% per completed booking — covering payment processing, client acquisition, insurance and platform infrastructure." },
      { icon: "🏦", title: "Instant Payouts", desc: "Instant via Paystack split payment to your bank account after each completed session." },
      { icon: "🛡️", title: "No-Show Protection", desc: "Enable your cancellation policy to protect revenue. Late-cancellation fees (your choice) go directly to you." },
      { icon: "📈", title: "Grow Your Revenue", desc: "Track your revenue growth with built-in analytics." },
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
    id: "quiz",
    type: "quiz",
    title: "Provider Knowledge Check",
    subtitle: "Confirm you understand the key platform rules.",
    canSkip: true,
    passScore: 66,
    questions: [
      {
        id: "pq1",
        question: "What percentage of each booking does BION keep?",
        type: "single",
        required: true,
        isKnowledgeCheck: true,
        explanation: "BION charges a 5% platform fee. You keep 95% of every completed booking.",
        options: [
          { id: "a", text: "5%", isCorrect: true },
          { id: "b", text: "8%" },
          { id: "c", text: "15%" },
          { id: "d", text: "20%" },
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
