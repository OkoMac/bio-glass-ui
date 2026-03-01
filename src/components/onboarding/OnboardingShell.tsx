import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Circle, ChevronRight, ChevronLeft,
  BookOpen, MessageCircle, X, Star,
} from "lucide-react";
import type { OnboardingStep, QuizQuestion } from "@/types/onboarding";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingChat } from "./OnboardingChat";

// ─── Props ────────────────────────────────────────────────────────────────────

type OnboardingHook = ReturnType<typeof useOnboarding>;

interface Props {
  /** If provided, the shell uses this hook instance (lifted from the page).
   *  This prevents duplicate hook calls when pages also need the hook state. */
  ob?: OnboardingHook;
  /** Required when ob is NOT provided (shell creates hook internally) */
  userId?: string;
  role: string;
  steps: OnboardingStep[];
  onComplete: () => void;
  /** Slots for complex step types — rendered when step.type matches */
  renderWebCrawlStep?: (step: OnboardingStep) => React.ReactNode;
  renderBatchUploadStep?: (step: OnboardingStep) => React.ReactNode;
  renderAISetupStep?: (step: OnboardingStep) => React.ReactNode;
}

// ─── Internal Shell that always receives a resolved ob ───────────────────────

interface ShellInnerProps extends Omit<Props, "ob" | "userId"> {
  ob: OnboardingHook;
}

// ─── Step Type Labels ─────────────────────────────────────────────────────────

const STEP_ICONS: Record<string, string> = {
  welcome: "🌟",
  info: "📖",
  quiz: "✅",
  form: "📝",
  webcrawl: "🌐",
  "ai-setup": "🤖",
  "batch-upload": "📤",
  complete: "🎉",
};

// ─── Welcome Step ─────────────────────────────────────────────────────────────

function WelcomeStep({ step }: { step: OnboardingStep }) {
  return (
    <div className="text-center space-y-6 py-4">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="text-6xl"
      >{step.icon ?? "🌟"}</motion.div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
        {step.subtitle && <p className="text-muted-foreground mt-1">{step.subtitle}</p>}
      </div>
      {step.description && (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">{step.description}</p>
      )}
      {step.highlights && (
        <div className="grid grid-cols-1 gap-3 text-left mt-4">
          {step.highlights.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 glass-1 rounded-xl p-3 border border-white/5"
            >
              <span className="text-xl shrink-0">{h.icon}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{h.title}</p>
                <p className="text-xs text-muted-foreground">{h.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Info Step ────────────────────────────────────────────────────────────────

function InfoStep({ step }: { step: OnboardingStep }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
        {step.subtitle && <p className="text-sm text-muted-foreground mt-1">{step.subtitle}</p>}
      </div>
      {step.description && (
        <p className="text-sm text-foreground/80 leading-relaxed">{step.description}</p>
      )}
      {step.highlights && (
        <div className="space-y-3">
          {step.highlights.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 p-4 glass-1 rounded-xl border border-white/5"
            >
              <span className="text-2xl shrink-0">{h.icon}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{h.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{h.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quiz Step ────────────────────────────────────────────────────────────────

function QuizStepRenderer({
  step,
  answers,
  onAnswer,
}: {
  step: OnboardingStep;
  answers: Record<string, unknown>;
  onAnswer: (qId: string, val: unknown) => void;
}) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const reveal = (qId: string) => setRevealed((s) => new Set([...s, qId]));

  if (!step.questions) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
        {step.subtitle && <p className="text-sm text-muted-foreground mt-1">{step.subtitle}</p>}
      </div>

      {step.questions.map((q: QuizQuestion, qi) => {
        const userAns = answers[q.id];
        const isRevealed = revealed.has(q.id);

        return (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qi * 0.08 }}
            className="glass-1 rounded-xl p-4 border border-white/5 space-y-3"
          >
            <p className="text-sm font-semibold text-foreground">
              <span className="text-indigo mr-2">Q{qi + 1}.</span>{q.question}
            </p>

            {/* Single / Multiple choice */}
            {(q.type === "single" || q.type === "multiple") && q.options && (
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const selected = Array.isArray(userAns)
                    ? userAns.includes(opt.id)
                    : userAns === opt.id;
                  const showCorrect = isRevealed && q.isKnowledgeCheck;
                  const isCorrectOpt = opt.isCorrect;

                  let borderColor = "border-white/10";
                  if (selected) borderColor = "border-indigo/60";
                  if (showCorrect && isCorrectOpt) borderColor = "border-teal/70";
                  if (showCorrect && selected && !isCorrectOpt) borderColor = "border-coral/70";

                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (q.type === "multiple") {
                          const cur = (userAns as string[]) ?? [];
                          onAnswer(q.id, cur.includes(opt.id) ? cur.filter((x) => x !== opt.id) : [...cur, opt.id]);
                        } else {
                          onAnswer(q.id, opt.id);
                        }
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${borderColor} ${
                        selected ? "bg-indigo/10 text-foreground" : "glass-1 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border border-current inline-flex items-center justify-center mr-2 shrink-0">
                        {selected && <span className="w-2 h-2 rounded-full bg-current" />}
                      </span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Text / Rating */}
            {q.type === "text" && (
              <textarea
                value={(userAns as string) ?? ""}
                onChange={(e) => onAnswer(q.id, e.target.value)}
                placeholder="Type your answer…"
                rows={3}
                className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5 resize-none"
              />
            )}

            {q.type === "rating" && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => onAnswer(q.id, n)}
                    className={`w-10 h-10 rounded-xl border text-sm font-semibold transition-all ${
                      userAns === n ? "border-indigo/60 bg-indigo/20 text-foreground" : "border-white/10 glass-1 text-muted-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

            {/* Check answer button (knowledge checks only) */}
            {q.isKnowledgeCheck && userAns !== undefined && !isRevealed && (
              <button
                onClick={() => reveal(q.id)}
                className="text-xs text-indigo underline"
              >
                Check answer
              </button>
            )}

            {/* Explanation */}
            {isRevealed && q.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-muted-foreground bg-teal/5 border border-teal/20 rounded-lg px-3 py-2"
              >
                💡 {q.explanation}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Form Step ────────────────────────────────────────────────────────────────

function FormStepRenderer({
  step,
  formData,
  onField,
}: {
  step: OnboardingStep;
  formData: Record<string, string>;
  onField: (id: string, val: string) => void;
}) {
  if (!step.fields) return null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
        {step.subtitle && <p className="text-sm text-muted-foreground mt-1">{step.subtitle}</p>}
      </div>
      <div className="space-y-3">
        {step.fields.map((field) => (
          <div key={field.id}>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {field.label}{field.required && <span className="text-coral ml-1">*</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                value={formData[field.id] ?? ""}
                onChange={(e) => onField(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5 resize-none"
              />
            ) : field.type === "select" && field.options ? (
              <select
                value={formData[field.id] ?? ""}
                onChange={(e) => onField(field.id, e.target.value)}
                className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground outline-none border border-white/5 bg-transparent"
              >
                <option value="" className="bg-gray-900">{field.placeholder ?? "Select…"}</option>
                {field.options.map((o) => (
                  <option key={o} value={o} className="bg-gray-900">{o}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={formData[field.id] ?? ""}
                onChange={(e) => onField(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Complete Step ────────────────────────────────────────────────────────────

function CompleteStep({
  step,
  score,
  completedCount,
  totalSteps,
}: {
  step: OnboardingStep;
  score: number;
  completedCount: number;
  totalSteps: number;
}) {
  return (
    <div className="text-center space-y-6 py-4">
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="w-24 h-24 mx-auto rounded-full gradient-indigo flex items-center justify-center text-5xl shadow-cta"
      >
        🎉
      </motion.div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
        {step.subtitle && <p className="text-muted-foreground mt-1">{step.subtitle}</p>}
      </div>

      {/* SCORM certificate stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Modules", value: `${completedCount}/${totalSteps}` },
          { label: "Score", value: `${score}%` },
          { label: "Status", value: score >= 70 ? "Passed ✅" : "Completed" },
        ].map((s) => (
          <div key={s.label} className="glass-1 rounded-xl p-3 border border-white/5">
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Stars based on score */}
      <div className="flex justify-center gap-1">
        {[1, 2, 3].map((n) => (
          <Star
            key={n}
            className={`w-6 h-6 ${n <= Math.ceil(score / 34) ? "text-amber-400 fill-amber-400" : "text-foreground/20"}`}
          />
        ))}
      </div>

      {step.description && (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
      )}
    </div>
  );
}

// ─── Outer wrapper: creates hook when pages don't need external hook access ───

function OnboardingShellWithInternalHook({
  userId, role, steps, onComplete,
  renderWebCrawlStep, renderBatchUploadStep, renderAISetupStep,
}: Props & { userId: string }) {
  const ob = useOnboarding(userId, role, steps);
  return (
    <OnboardingShellInner
      ob={ob} role={role} steps={steps} onComplete={onComplete}
      renderWebCrawlStep={renderWebCrawlStep}
      renderBatchUploadStep={renderBatchUploadStep}
      renderAISetupStep={renderAISetupStep}
    />
  );
}

/** Public API.
 *  - Pass `ob` (from page-level useOnboarding call) when the page also needs
 *    access to the hook (e.g. to call setCrawlData from a child component).
 *  - Pass `userId` when the page doesn't need the hook itself. */
export function OnboardingShell(props: Props) {
  if (props.ob) {
    return <OnboardingShellInner {...(props as ShellInnerProps)} />;
  }
  if (!props.userId) {
    throw new Error("OnboardingShell: provide either ob or userId prop");
  }
  return <OnboardingShellWithInternalHook {...props} userId={props.userId} />;
}

// ─── Inner Shell (always has a resolved ob) ───────────────────────────────────

function OnboardingShellInner({
  ob, role, steps, onComplete,
  renderWebCrawlStep, renderBatchUploadStep, renderAISetupStep,
}: ShellInnerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const step = ob.currentStepData;
  const canGoNext = ob.canProceed(step.id);

  const handleNext = () => {
    if (step.type === "complete") {
      ob.complete();
      onComplete();
    } else {
      ob.nextStep();
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-obsidian"
      style={{ background: "radial-gradient(ellipse at 50% 20%, rgba(99,102,241,0.07) 0%, #0A0A0F 60%)" }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:block">Course Outline</span>
          <span className="sm:hidden">Outline</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Module {ob.currentStep + 1}/{steps.length}
          </span>
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full gradient-indigo rounded-full transition-all duration-500"
              style={{ width: `${ob.progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{ob.progressPercent}%</span>
        </div>

        <button
          onClick={() => setChatOpen(true)}
          className="w-8 h-8 rounded-full glass-1 flex items-center justify-center text-muted-foreground hover:text-foreground border border-white/5"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            {step.type === "welcome" && <WelcomeStep step={step} />}
            {step.type === "info" && <InfoStep step={step} />}
            {step.type === "quiz" && (
              <QuizStepRenderer
                step={step}
                answers={ob.progress.answers}
                onAnswer={ob.setAnswer}
              />
            )}
            {step.type === "form" && (
              <FormStepRenderer
                step={step}
                formData={ob.progress.formData}
                onField={ob.setFormField}
              />
            )}
            {step.type === "webcrawl" && renderWebCrawlStep?.(step)}
            {step.type === "batch-upload" && renderBatchUploadStep?.(step)}
            {step.type === "ai-setup" && renderAISetupStep?.(step)}
            {step.type === "complete" && (
              <CompleteStep
                step={step}
                score={ob.progress.scorm.score.raw}
                completedCount={ob.progress.completedSteps.length}
                totalSteps={steps.length - 1}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom nav ── */}
      <div className="px-4 pb-8 pt-4 border-t border-white/5 shrink-0 max-w-lg mx-auto w-full">
        <div className="flex gap-3">
          {ob.currentStep > 0 && (
            <button
              onClick={ob.prevStep}
              className="flex items-center gap-1.5 px-4 py-3 glass-1 rounded-pill text-sm text-muted-foreground border border-white/5 hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            disabled={!canGoNext && step.type !== "welcome" && step.type !== "info" && step.type !== "webcrawl" && step.type !== "ai-setup" && step.type !== "batch-upload"}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-pill gradient-indigo text-primary-foreground font-semibold text-sm shadow-cta disabled:opacity-40"
          >
            {step.type === "complete" ? "Go to Dashboard →" : (
              <>
                {ob.currentStep === steps.length - 2 ? "Finish" : "Continue"}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>

        {step.canSkip && step.type !== "complete" && (
          <button
            onClick={ob.nextStep}
            className="w-full text-center text-xs text-muted-foreground mt-3"
          >
            Skip this step
          </button>
        )}
      </div>

      {/* ── Course Outline Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[95] bg-black/60"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-[96] w-72 glass-frosted border-r border-white/5 p-5 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-foreground">Course Outline</h3>
                <button onClick={() => setSidebarOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-1">
                {steps.map((s, i) => {
                  const done = ob.isStepComplete(s.id);
                  const active = i === ob.currentStep;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { ob.goToStep(i); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                        active ? "bg-indigo/15 border border-indigo/25" : "hover:bg-white/5"
                      }`}
                    >
                      <span className="text-lg shrink-0">{STEP_ICONS[s.type] ?? "📋"}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${active ? "text-foreground" : "text-muted-foreground"}`}>
                          {s.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">{s.type}</p>
                      </div>
                      {done ? (
                        <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-foreground/20 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* SCORM score badge */}
              <div className="mt-6 glass-1 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-muted-foreground">Your Score</p>
                <p className="text-2xl font-bold text-foreground">{ob.progress.scorm.score.raw}%</p>
                <p className="text-[10px] text-muted-foreground capitalize">{ob.progress.scorm.lessonStatus.replace("_", " ")}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── AI Chat Drawer ── */}
      <AnimatePresence>
        {chatOpen && (
          <OnboardingChat
            role={role}
            stepTitle={step.title}
            crawlData={ob.progress.crawlData}
            formData={ob.progress.formData}
            onClose={() => setChatOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
