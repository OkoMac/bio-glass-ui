// ─── SCORM-style Onboarding Type System ─────────────────────────────────────

export type StepType =
  | "welcome"
  | "info"
  | "quiz"
  | "form"
  | "webcrawl"
  | "ai-setup"
  | "batch-upload"
  | "consent"
  | "complete";

export type LessonStatus =
  | "not_attempted"
  | "incomplete"
  | "completed"
  | "passed"
  | "failed";

// ─── Quiz ────────────────────────────────────────────────────────────────────

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: "single" | "multiple" | "text" | "rating";
  options?: QuizOption[];
  explanation?: string;
  required: boolean;
  /** true = has right/wrong answer and affects score */
  isKnowledgeCheck: boolean;
}

// ─── Form ────────────────────────────────────────────────────────────────────

export interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "url" | "select" | "textarea" | "number";
  placeholder?: string;
  options?: string[];
  required: boolean;
  /** Maps crawled data to this field for AI pre-fill */
  aiHint?: string;
}

// ─── Steps ───────────────────────────────────────────────────────────────────

export interface StepHighlight {
  icon: string;
  title: string;
  desc: string;
}

export interface ConsentItem {
  id: string;
  label: string;
  required: boolean;
}

export interface OnboardingStep {
  id: string;
  type: StepType;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  highlights?: StepHighlight[];
  questions?: QuizQuestion[];
  fields?: FormField[];
  consentItems?: ConsentItem[];
  /** Minimum score (0-100) required to pass a quiz step */
  passScore?: number;
  canSkip?: boolean;
}

// ─── SCORM Progress ──────────────────────────────────────────────────────────

export interface SCORMScore {
  raw: number;
  min: number;
  max: number;
  scaled: number;
}

export interface SCORMState {
  lessonStatus: LessonStatus;
  score: SCORMScore;
  location: string; // current step id
  startedAt: string;
  completedAt?: string;
  sessionSeconds: number;
}

export interface OnboardingProgress {
  userId: string;
  role: string;
  currentStep: number;
  completedSteps: string[];
  answers: Record<string, unknown>;
  formData: Record<string, string>;
  crawlData?: CrawlResult;
  scorm: SCORMState;
  batchEmployees?: BatchEmployee[];
}

// ─── Webcrawler ──────────────────────────────────────────────────────────────

export interface PriceHint {
  service: string;
  hint: string;
  detected?: number;
}

export interface CrawlResult {
  url: string;
  businessName?: string;
  description?: string;
  services: string[];
  priceHints: PriceHint[];
  location?: string;
  phone?: string;
  email?: string;
  socialLinks: string[];
  keywords: string[];
  businessType?: string;
  vertical?: string;
  rawExcerpts: string[];
  crawledAt: string;
  success: boolean;
}

export interface ServiceRecommendation {
  name: string;
  description: string;
  category: string;
  duration: number; // minutes
  suggestedPrice: { min: number; max: number; currency: string };
  rationale: string;
  confidence: "high" | "medium" | "low";
}

// ─── Batch Upload ─────────────────────────────────────────────────────────────

export interface BatchEmployee {
  id: string;
  name: string;
  email: string;
  department?: string;
  jobTitle?: string;
  monthlyBudget?: number;
  status: "pending" | "valid" | "duplicate" | "error";
  error?: string;
}

// ─── AI Setup ────────────────────────────────────────────────────────────────

export interface AIGeneratedProfile {
  businessName: string;
  tagline: string;
  description: string;
  services: AIGeneratedService[];
  availability: AIGeneratedAvailability;
  cancellationPolicy: string;
}

export interface AIGeneratedService {
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

export interface AIGeneratedAvailability {
  days: string[];
  startTime: string;
  endTime: string;
  bufferMinutes: number;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
}
