import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import type { OnboardingStep } from "@/types/onboarding";

const STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    type: "welcome",
    title: "BION Platform Admin",
    subtitle: "You have full visibility and control of the BION platform.",
    icon: "🛡️",
    highlights: [
      { icon: "👥", title: "User Management", desc: "View, search and manage all clients, providers and corporate accounts on the platform." },
      { icon: "✅", title: "Provider Verification", desc: "Review and approve provider applications, verify credentials and manage compliance." },
      { icon: "📊", title: "Platform Analytics", desc: "Monitor GMV, session volume, churn, no-show rates and platform health metrics." },
      { icon: "⚙️", title: "Settings & Config", desc: "Manage commission rates, feature flags, content policies and notification templates." },
    ],
  },
  {
    id: "verification_process",
    type: "info",
    title: "Provider Verification",
    subtitle: "Maintaining platform quality and compliance.",
    highlights: [
      { icon: "📋", title: "Application Review", desc: "Providers submit their business registration, professional credentials and identity documents. You review and approve/reject with feedback." },
      { icon: "🏥", title: "Medical Verticals", desc: "HPCSA (Health Professions Council SA) registration required for doctors and physiotherapists. SANC registration for nurses. Verify against official registers." },
      { icon: "💅", title: "Beauty & Fitness", desc: "Industry certificates required (e.g., REPSSA for fitness trainers). Check credentials are current and from accredited institutions." },
      { icon: "⚖️", title: "POPIA Compliance", desc: "All providers must accept the BION Data Processor Agreement. Medical providers must have a POPIA information officer on file." },
    ],
  },
  {
    id: "verification_quiz",
    type: "quiz",
    title: "Verification Process Check",
    subtitle: "Confirm you know the credential requirements by vertical.",
    canSkip: true,
    passScore: 66,
    questions: [
      {
        id: "aq1",
        question: "Which registration body must GP doctors be verified against?",
        type: "single",
        required: true,
        isKnowledgeCheck: true,
        explanation: "The Health Professions Council of South Africa (HPCSA) governs medical practitioners. Always verify active registration on the HPCSA online register.",
        options: [
          { id: "a", text: "SANC (South African Nursing Council)" },
          { id: "b", text: "HPCSA (Health Professions Council SA)", isCorrect: true },
          { id: "c", text: "SAPC (SA Pharmacy Council)" },
          { id: "d", text: "CIPC (Companies and Intellectual Property Commission)" },
        ],
      },
      {
        id: "aq2",
        question: "Which data protection law governs BION's operations in South Africa?",
        type: "single",
        required: true,
        isKnowledgeCheck: true,
        explanation: "POPIA (Protection of Personal Information Act) is South Africa's data protection law. BION must be fully POPIA compliant for all user data processing.",
        options: [
          { id: "a", text: "GDPR (General Data Protection Regulation)" },
          { id: "b", text: "HIPAA (Health Insurance Portability and Accountability Act)" },
          { id: "c", text: "POPIA (Protection of Personal Information Act)", isCorrect: true },
          { id: "d", text: "ECTA (Electronic Communications and Transactions Act)" },
        ],
      },
    ],
  },
  {
    id: "corporate_management",
    type: "info",
    title: "Corporate Account Management",
    subtitle: "How corporate accounts work on the platform.",
    highlights: [
      { icon: "🏢", title: "Account Creation", desc: "Corporate accounts are created via Admin → Users → + Corporate. Assign an account manager and set initial commission rate." },
      { icon: "💳", title: "BIONWallet Top-Up", desc: "Corporates fund employee wallets via EFT or direct debit. You can monitor wallet balances and set credit limits." },
      { icon: "🔗", title: "Employee Linking", desc: "When employees accept their invitation, their account is automatically linked to the corporate plan. You can manually link or unlink accounts." },
      { icon: "📑", title: "Invoicing & Billing", desc: "Corporates receive monthly invoices for all employee bookings. You manage disputes, refunds and account adjustments from Admin → Billing." },
    ],
  },
  {
    id: "platform_settings",
    type: "form",
    title: "Platform Configuration",
    subtitle: "Review and confirm key platform settings.",
    canSkip: true,
    fields: [
      { id: "defaultCommission", label: "Default Platform Commission (%)", type: "number", placeholder: "8", required: true },
      {
        id: "providerAutoApproval",
        label: "Provider Auto-Approval",
        type: "select",
        options: ["Disabled — manual review required", "Enabled for low-risk categories only", "Enabled for all categories"],
        required: true,
      },
      {
        id: "reviewThreshold",
        label: "Provider Account Review Threshold (Negative Reviews)",
        type: "select",
        options: ["3 negative reviews", "5 negative reviews", "10 negative reviews", "Manual review only"],
        required: true,
      },
      {
        id: "maintenanceMode",
        label: "Maintenance Mode",
        type: "select",
        options: ["Off", "Scheduled (set date in settings)", "Active now"],
        required: true,
      },
    ],
  },
  {
    id: "complete",
    type: "complete",
    title: "Admin Setup Complete 🛡️",
    subtitle: "Platform administration is configured.",
    description: "Head to the Admin Dashboard to review pending provider applications, monitor platform health and manage user accounts. Your admin toolkit is fully unlocked.",
  },
];

export default function AdminOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/welcome");
    return null;
  }

  const handleComplete = () => {
    
    // Try React Router navigation first
    try {
      navigate("/admin/dashboard", { replace: true });
      
      // Fallback after 1 second if navigation didn't work
      setTimeout(() => {
        if (window.location.pathname.includes("/onboarding")) {
          window.location.href = "/admin/dashboard";
        }
      }, 1000);
    } catch (error) {
      console.error("Navigation error:", error);
      // Direct fallback
      window.location.href = "/admin/dashboard";
    }
  };

  return (
    <OnboardingShell
      userId={user.id ?? user.email}
      role="admin"
      steps={STEPS}
      onComplete={handleComplete}
    />
  );
}
