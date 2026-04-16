import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Loader2, Sparkles, CheckCircle, XCircle, AlertTriangle,
  ChevronRight, RotateCcw, Award,
} from "lucide-react";
import { useCourseDetail, useEnrollmentActions } from "@/hooks/useBicademy";
import GlassCard from "@/components/GlassCard";
import { toast } from "sonner";

type Phase = "intro" | "questions" | "result";

export default function BicademyAssessment() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { course, questions, loading } = useCourseDetail(code ?? null);
  const { submitAssessment } = useEnrollmentActions();

  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; total: number; correct: number } | null>(null);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!course) return null;

  const q = questions[current];
  const picked = q ? answers[q.id] : undefined;
  const progressPct = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  const handleSubmit = async () => {
    if (!course) return;
    try {
      setSubmitting(true);
      const r = await submitAssessment(course.id, answers, questions);
      setResult(r);
      setPhase("result");
      if (r.passed) toast.success(`Passed ${r.score}%`);
      else toast.error(`Scored ${r.score}% — need ${course.passing_score}%`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setPhase("intro");
    setAnswers({});
    setCurrent(0);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 md:px-8 pt-8 md:pt-12 space-y-6">
        <button
          onClick={() => navigate(`/bicademy/${code}`)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> {course.course_code}
        </button>

        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <GlassCard className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-indigo" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{course.course_code}</p>
                    <h1 className="text-xl font-bold text-foreground">Assessment</h1>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-foreground/90">
                  <p>{questions.length} questions · pass threshold <span className="font-semibold text-indigo">{course.passing_score}%</span></p>
                  <p className="text-xs text-muted-foreground">Unlimited attempts. Each attempt is logged.</p>
                </div>
                <div className="p-3 rounded-xl bg-amber/5 border border-amber/20 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber/90">
                    Answer honestly. Assessments score on first-attempt accuracy — your average score across courses determines your support tier.
                  </p>
                </div>
                <button
                  onClick={() => setPhase("questions")}
                  className="w-full py-3 rounded-pill bg-gradient-to-r from-indigo to-teal text-white text-sm font-semibold"
                >
                  Start assessment
                </button>
              </GlassCard>
            </motion.div>
          )}

          {phase === "questions" && q && (
            <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              {/* progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                  <span>Question {current + 1} of {questions.length}</span>
                  <span>{Math.round(progressPct)}%</span>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo to-teal"
                    initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              <GlassCard className="p-5 space-y-4">
                <h2 className="text-base md:text-lg font-semibold text-foreground leading-snug">{q.question_text}</h2>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isPicked = picked === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setAnswers({ ...answers, [q.id]: opt.id })}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isPicked
                            ? "border-indigo/50 bg-indigo/10 text-foreground"
                            : "border-white/5 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                            isPicked ? "border-indigo bg-indigo" : "border-white/20"
                          }`} />
                          <span className="text-sm">{opt.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </GlassCard>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setCurrent(Math.max(0, current - 1))}
                  disabled={current === 0}
                  className="text-xs text-muted-foreground disabled:opacity-30"
                >
                  ← Previous
                </button>
                {current < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrent(current + 1)}
                    disabled={!picked}
                    className="flex-1 max-w-xs py-2.5 rounded-pill bg-indigo text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || Object.keys(answers).length !== questions.length}
                    className="flex-1 max-w-xs py-2.5 rounded-pill bg-gradient-to-r from-indigo to-teal text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Submit</>}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {phase === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
              <GlassCard className={`p-6 text-center space-y-4 ${result.passed ? "bg-gradient-to-br from-teal/15 to-indigo/10" : "bg-coral/5"}`}>
                {result.passed ? (
                  <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-teal/20 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-teal" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Passed</p>
                      <p className="text-5xl font-bold text-teal font-data mt-1">{result.score}%</p>
                      <p className="text-xs text-muted-foreground mt-1">{result.correct} of {result.total} points</p>
                    </div>
                    <p className="text-sm text-foreground">{course.title} complete.</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-coral/20 flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-coral" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Didn't pass</p>
                      <p className="text-5xl font-bold text-coral font-data mt-1">{result.score}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Needed {course.passing_score}%</p>
                    </div>
                    <p className="text-sm text-foreground">Review the lessons and try again. No limit.</p>
                  </>
                )}
              </GlassCard>

              {/* Answer review */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Answer review</p>
                {questions.map((q, i) => {
                  const pickedId = answers[q.id];
                  const pickedOpt = q.options.find((o) => o.id === pickedId);
                  const correctOpt = q.options.find((o) => o.isCorrect);
                  const isCorrect = pickedOpt?.isCorrect;
                  return (
                    <div key={q.id} className={`p-3 rounded-xl border ${isCorrect ? "border-teal/20 bg-teal/5" : "border-coral/20 bg-coral/5"}`}>
                      <div className="flex items-start gap-2">
                        {isCorrect ? <CheckCircle className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" />
                          : <XCircle className="w-3.5 h-3.5 text-coral shrink-0 mt-0.5" />}
                        <div className="flex-1 text-xs space-y-1">
                          <p className="font-semibold text-foreground">{i + 1}. {q.question_text}</p>
                          <p className="text-muted-foreground">
                            Your answer: <span className={isCorrect ? "text-teal" : "text-coral"}>{pickedOpt?.text ?? "—"}</span>
                          </p>
                          {!isCorrect && correctOpt && (
                            <p className="text-muted-foreground">
                              Correct: <span className="text-teal">{correctOpt.text}</span>
                            </p>
                          )}
                          {q.explanation && (
                            <p className="text-foreground/80 italic mt-1">{q.explanation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                {result.passed ? (
                  <button
                    onClick={() => navigate("/bicademy")}
                    className="flex-1 py-3 rounded-pill bg-gradient-to-r from-indigo to-teal text-white text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" /> Back to Bicademy
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate(`/bicademy/${code}`)}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-foreground text-sm font-semibold"
                    >
                      Review lessons
                    </button>
                    <button
                      onClick={handleRetake}
                      className="flex-1 py-3 rounded-pill bg-indigo text-white text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Retake
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
