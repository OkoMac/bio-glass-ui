import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import type { OnboardingStep } from "@/types/onboarding";

const STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    type: "welcome",
    title: "Welcome to BION",
    subtitle: "Your health & wellness journey starts here.",
    icon: "🌟",
    highlights: [
      { icon: "🩺", title: "Medical & Health", desc: "GP consults, physiotherapy, nutrition and specialist care" },
      { icon: "💪", title: "Fitness & Movement", desc: "Personal training, yoga, pilates, boxing and more" },
      { icon: "✂️", title: "Beauty & Spa", desc: "Hair, nails, lashes, massage and wellness treatments" },
      { icon: "🧠", title: "Mental Wellness", desc: "Therapy, counselling, life coaching and mindfulness" },
    ],
  },
  {
    id: "goals",
    type: "quiz",
    title: "Your Wellness Goals",
    subtitle: "Tell us about yourself so we can personalise your experience.",
    questions: [
      {
        id: "primary_goal",
        question: "What is your primary wellness goal?",
        type: "single",
        required: true,
        isKnowledgeCheck: false,
        options: [
          { id: "fitness", text: "Get fitter and stronger" },
          { id: "health", text: "Manage a health condition" },
          { id: "beauty", text: "Look and feel my best" },
          { id: "mental", text: "Improve my mental wellbeing" },
          { id: "all", text: "All of the above!" },
        ],
      },
      {
        id: "frequency",
        question: "How often do you currently see a wellness professional?",
        type: "single",
        required: true,
        isKnowledgeCheck: false,
        options: [
          { id: "never", text: "Never — I'm just getting started" },
          { id: "occasionally", text: "Occasionally (a few times a year)" },
          { id: "monthly", text: "Monthly" },
          { id: "weekly", text: "Weekly or more" },
        ],
      },
      {
        id: "budget",
        question: "What's your approximate monthly wellness budget?",
        type: "single",
        required: false,
        isKnowledgeCheck: false,
        options: [
          { id: "low", text: "Under R500" },
          { id: "mid", text: "R500–R1,500" },
          { id: "high", text: "R1,500–R3,000" },
          { id: "premium", text: "R3,000+" },
        ],
      },
    ],
  },
  {
    id: "profile",
    type: "form",
    title: "Set Up Your Profile",
    subtitle: "This helps providers personalise your experience.",
    fields: [
      { id: "displayName", label: "Display Name", type: "text", placeholder: "What should we call you?", required: true },
      { id: "phone", label: "Phone Number", type: "tel", placeholder: "+27 82 123 4567", required: false },
      { id: "city", label: "City / Area", type: "text", placeholder: "e.g. Cape Town, Johannesburg", required: true },
      { id: "dateOfBirth", label: "Date of Birth", type: "text", placeholder: "YYYY-MM-DD", required: false },
      {
        id: "healthInterests",
        label: "Service Categories You're Interested In",
        type: "select",
        options: ["Fitness & Training", "Medical & Health", "Beauty & Grooming", "Mental Wellness", "Nutrition & Diet", "Spa & Massage"],
        required: false,
      },
    ],
  },
  {
    id: "social_presence",
    type: "form",
    title: "Your Social Presence",
    subtitle: "Optional — helps providers connect with you and personalise your experience.",
    canSkip: true,
    fields: [
      { id: "website",   label: "Personal Website",  type: "text", placeholder: "https://yoursite.co.za", required: false },
      { id: "instagram", label: "Instagram Handle",  type: "text", placeholder: "@yourhandle",            required: false },
      { id: "linkedin",  label: "LinkedIn Profile",  type: "text", placeholder: "linkedin.com/in/you",   required: false },
      { id: "facebook",  label: "Facebook Profile",  type: "text", placeholder: "facebook.com/you",      required: false },
    ],
  },
  {
    id: "how_bion_works",
    type: "info",
    title: "How BION Works",
    subtitle: "Three simple steps to better health.",
    highlights: [
      { icon: "🔍", title: "1. Discover", desc: "Browse hundreds of verified providers by category, location, rating and price. Use ServeAI to get personalised recommendations in plain English." },
      { icon: "📅", title: "2. Book", desc: "Pick a service, choose a time slot, pay with BIONWallet or card. Get a WhatsApp confirmation and a calendar reminder — all in under 60 seconds." },
      { icon: "📊", title: "3. Track", desc: "Log your progress, follow your prescriptions, earn BIONPoints for every session and watch your wellness journey unfold." },
    ],
  },
  {
    id: "wallet_rewards",
    type: "info",
    title: "BIONWallet & Rewards",
    subtitle: "Your money and your rewards — all in one place.",
    highlights: [
      { icon: "💳", title: "BIONWallet", desc: "Top up by card or EFT. If your employer runs a wellness programme, they fund your wallet automatically each month." },
      { icon: "⭐", title: "BIONPoints", desc: "Earn points for every booking, completed routine, streak day and referral. Redeem for discounts or exclusive perks." },
      { icon: "🏆", title: "Streaks & Badges", desc: "Keep your wellness streak alive and unlock achievement badges. Compete on the leaderboard with friends and colleagues." },
    ],
  },
  {
    id: "quiz",
    type: "quiz",
    title: "Quick Knowledge Check",
    subtitle: "Let's make sure you're ready to get the most out of BION.",
    passScore: 60,
    questions: [
      {
        id: "q1",
        question: "What can you use BIONWallet for?",
        type: "single",
        required: true,
        isKnowledgeCheck: true,
        explanation: "BIONWallet is used to pay for bookings on the platform. Your employer can also fund it through corporate wellness programmes.",
        options: [
          { id: "a", text: "Paying for bookings on BION", isCorrect: true },
          { id: "b", text: "Shopping at external stores" },
          { id: "c", text: "Withdrawing cash at ATMs" },
          { id: "d", text: "Paying utility bills" },
        ],
      },
      {
        id: "q2",
        question: "What is the BION Passport?",
        type: "single",
        required: true,
        isKnowledgeCheck: true,
        explanation: "Your BION Passport is your personal wellness record — booking history, provider connections, health documents and privacy controls all in one place.",
        options: [
          { id: "a", text: "A physical travel passport" },
          { id: "b", text: "Your personal wellness record on BION", isCorrect: true },
          { id: "c", text: "A membership card for gyms" },
          { id: "d", text: "A government ID verification system" },
        ],
      },
      {
        id: "q3",
        question: "How do you earn BIONPoints?",
        type: "multiple",
        required: true,
        isKnowledgeCheck: true,
        explanation: "You earn BIONPoints by booking sessions, completing routines, maintaining streaks, and referring friends to BION.",
        options: [
          { id: "a", text: "Booking and completing sessions", isCorrect: true },
          { id: "b", text: "Maintaining daily wellness streaks", isCorrect: true },
          { id: "c", text: "Cancelling appointments" },
          { id: "d", text: "Referring friends to BION", isCorrect: true },
        ],
      },
    ],
  },
  {
    id: "complete",
    type: "complete",
    title: "You're All Set! 🎉",
    subtitle: "Your BION account is ready.",
    description: "Start by exploring providers near you, or book a free intro session to get started. Your wellness journey begins today.",
  },
];

export default function ClientOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/welcome");
    return null;
  }

  return (
    <OnboardingShell
      userId={user.id ?? user.email}
      role="client"
      steps={STEPS}
      onComplete={() => navigate("/", { replace: true })}
    />
  );
}
