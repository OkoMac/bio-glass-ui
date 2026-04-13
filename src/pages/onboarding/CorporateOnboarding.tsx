import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { WebCrawlerStep } from "@/components/onboarding/WebCrawlerStep";
import { BatchUploadStep } from "@/components/onboarding/BatchUploadStep";
import { useOnboarding } from "@/hooks/useOnboarding";
import type { OnboardingStep, CrawlResult, ServiceRecommendation, BatchEmployee } from "@/types/onboarding";
import { useState } from "react";

const STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    type: "welcome",
    title: "Corporate Wellness with BION",
    subtitle: "Invest in your team. Watch performance soar.",
    icon: "🏢",
    highlights: [
      { icon: "📉", title: "Reduce Absenteeism", desc: "Healthy employees take 62% fewer sick days. BION helps you get there." },
      { icon: "💡", title: "Measurable ROI", desc: "Track engagement, spending and wellness outcomes with real-time dashboards." },
      { icon: "🎯", title: "Employee-Driven", desc: "Staff choose their own services — within your approved categories and budget." },
      { icon: "🔒", title: "Privacy-First", desc: "You see aggregate spending data only. Individual session details stay private." },
    ],
  },
  {
    id: "company_details",
    type: "form",
    title: "Company Details",
    subtitle: "Tell us about your organisation.",
    canSkip: true,
    fields: [
      { id: "companyName", label: "Company Name", type: "text", placeholder: "e.g. Acme Holdings (Pty) Ltd", required: true, aiHint: "businessName" },
      {
        id: "industry",
        label: "Industry",
        type: "select",
        options: ["Financial Services", "Technology", "Healthcare", "Retail", "Manufacturing", "Legal & Professional Services", "Government & Public Sector", "Education", "Mining & Resources", "Other"],
        required: true,
      },
      { id: "employeeCount", label: "Number of Employees", type: "number", placeholder: "e.g. 250", required: true },
      { id: "hrContactName", label: "HR / Wellness Contact Name", type: "text", placeholder: "Full name", required: true },
      { id: "hrContactEmail", label: "HR Contact Email", type: "email", placeholder: "hr@company.co.za", required: true },
      { id: "hrContactPhone", label: "HR Contact Phone", type: "tel", placeholder: "+27 11 123 4567", required: false },
      { id: "companyWebsite", label: "Company Website",   type: "url",  placeholder: "https://company.co.za",            required: false, aiHint: "url" },
      { id: "linkedin",       label: "Company LinkedIn",  type: "text", placeholder: "linkedin.com/company/yourcompany",  required: false },
      { id: "instagram",      label: "Company Instagram", type: "text", placeholder: "@yourcompany",                      required: false },
      { id: "facebook",       label: "Company Facebook",  type: "text", placeholder: "facebook.com/yourcompany",          required: false },
    ],
  },
  {
    id: "website_crawl",
    type: "webcrawl",
    title: "Analyse Your Company",
    subtitle: "We'll look at your company to recommend the right wellness programme structure.",
    canSkip: true,
  },
  {
    id: "programme_setup",
    type: "form",
    title: "Wellness Programme Setup",
    subtitle: "Define your programme rules and budget.",
    canSkip: true,
    fields: [
      { id: "monthlyBudgetPerEmployee", label: "Monthly Budget per Employee (R)", type: "number", placeholder: "e.g. 1200", required: true },
      {
        id: "allowedCategories",
        label: "Allowed Service Categories",
        type: "select",
        options: ["All Categories", "Fitness Only", "Medical & Health Only", "Mental Health Only", "Fitness + Mental Health", "Custom (configure after setup)"],
        required: true,
      },
      {
        id: "rolloverPolicy",
        label: "Unused Credits at Month End",
        type: "select",
        options: ["Expire (use it or lose it)", "Roll over for 1 month", "Roll over indefinitely"],
        required: true,
      },
      {
        id: "maxSessionsPerMonth",
        label: "Max Sessions per Employee per Month",
        type: "select",
        options: ["No limit", "4 sessions", "8 sessions", "12 sessions"],
        required: false,
      },
      {
        id: "approvalRequired",
        label: "Booking Approval Required?",
        type: "select",
        options: ["No — employees book freely", "Yes — manager approval required"],
        required: true,
      },
    ],
  },
  {
    id: "employee_upload",
    type: "batch-upload",
    title: "Onboard Your Employees",
    subtitle: "Upload your employee list — they'll receive invitation emails automatically.",
    canSkip: true,
  },
  {
    id: "dashboard_tour",
    type: "info",
    title: "Your Corporate Dashboard",
    subtitle: "Full visibility into your wellness investment.",
    highlights: [
      { icon: "📊", title: "Spending Overview", desc: "See total spend, average per employee, and breakdown by service category. Export monthly reports for finance." },
      { icon: "👥", title: "Employee Management", desc: "View each employee's wallet balance, booking count, and engagement score. Adjust individual budgets and permissions." },
      { icon: "📈", title: "Wellness Analytics", desc: "Track engagement rates, most-booked services, wellness score trends and ROI metrics over time." },
      { icon: "🔔", title: "Alerts & Compliance", desc: "Get notified of budget overruns, low engagement and programme milestone achievements." },
    ],
  },
  {
    id: "corporate_dpa",
    type: "consent",
    title: "Data Processing Agreement",
    subtitle: "Required for POPIA compliance when handling employee wellness data.",
    consentItems: [
      { id: "dpa_agree", label: "I accept the BION Data Processing Agreement. Employee personal data will be processed in accordance with POPIA and used solely for wellness programme delivery.", required: true },
      { id: "aggregate_only", label: "I understand that HR/management will only see aggregate anonymised data. Individual employee session details are never disclosed to the employer.", required: true },
      { id: "employee_consent", label: "I confirm that employees will be informed about the wellness programme and their participation is voluntary.", required: true },
      { id: "billing_terms", label: "I accept the corporate billing terms: monthly budget per employee, unused credits do not roll over unless otherwise agreed.", required: true },
    ],
  },
  {
    id: "quiz",
    type: "quiz",
    title: "Corporate Platform Check",
    subtitle: "Confirm you understand how the programme works.",
    canSkip: false,
    passScore: 60,
    questions: [
      {
        id: "cq1",
        question: "What can HR see about employee sessions?",
        type: "single",
        required: true,
        isKnowledgeCheck: true,
        explanation: "BION protects employee privacy. HR/corporate admins can see aggregate spending data (total spend, category breakdown) but never individual session details.",
        options: [
          { id: "a", text: "Full session details and notes" },
          { id: "b", text: "Nothing — all data is private" },
          { id: "c", text: "Aggregate spending data only — individual sessions stay private", isCorrect: true },
          { id: "d", text: "Employee health records" },
        ],
      },
      {
        id: "cq2",
        question: "What happens to employee BIONWallet credits when they leave the company?",
        type: "single",
        required: true,
        isKnowledgeCheck: true,
        explanation: "When an employee leaves, their corporate BIONWallet credits are deactivated and returned to the company. Their personal account (with personal top-ups) remains active.",
        options: [
          { id: "a", text: "Credits are kept by the employee permanently" },
          { id: "b", text: "Corporate credits are deactivated and returned to the company", isCorrect: true },
          { id: "c", text: "Credits are donated to charity" },
          { id: "d", text: "Credits expire after 30 days" },
        ],
      },
      {
        id: "cq3",
        question: "How do employees access their wellness benefits?",
        type: "single",
        required: true,
        isKnowledgeCheck: true,
        explanation: "Employees receive an invitation email to join BION, link to the corporate account, and start booking services using their funded BIONWallet.",
        options: [
          { id: "a", text: "They must visit the HR office" },
          { id: "b", text: "By signing up to BION, linking to the corporate account and using their BIONWallet", isCorrect: true },
          { id: "c", text: "By calling BION support" },
          { id: "d", text: "Manually through payroll" },
        ],
      },
    ],
  },
  {
    id: "complete",
    type: "complete",
    title: "Programme Ready to Launch! 🎉",
    subtitle: "Your corporate wellness programme is configured.",
    description: "Employees will receive invitations and can start booking immediately. Head to your Corporate Dashboard to monitor engagement from day one.",
  },
];

export default function CorporateOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [crawlData, setCrawlData] = useState<CrawlResult | undefined>();

  if (!user) {
    navigate("/welcome");
    return null;
  }

  const userId = user.id ?? user.email;
  const ob = useOnboarding(userId, "corporate", STEPS);

  const handleCrawlComplete = (result: CrawlResult, _recs: ServiceRecommendation[]) => {
    setCrawlData(result);
    ob.setCrawlData(result);
    const prefill: Record<string, string> = {};
    if (result.businessName) prefill.companyName = result.businessName;
    ob.setFormData(prefill);
  };

  const handleEmployeesChange = (employees: BatchEmployee[]) => {
    ob.setBatchEmployees(employees);
  };

  return (
    <OnboardingShell
      ob={ob}
      role="corporate"
      steps={STEPS}
      onComplete={() => navigate("/corporate/dashboard", { replace: true })}
      renderWebCrawlStep={(step) => (
        <WebCrawlerStep
          title={step.title}
          subtitle={step.subtitle}
          mode="corporate"
          onCrawlComplete={handleCrawlComplete}
          existingCrawl={crawlData}
        />
      )}
      renderBatchUploadStep={(step) => (
        <BatchUploadStep
          title={step.title}
          subtitle={step.subtitle}
          employees={ob.progress.batchEmployees ?? []}
          onEmployeesChange={handleEmployeesChange}
        />
      )}
    />
  );
}
