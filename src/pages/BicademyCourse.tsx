import { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, BookOpen, CheckCircle, Circle, ChevronRight,
  Sparkles, Clock, Loader2, Award, AlertTriangle,
} from "lucide-react";
import { useCourseDetail, useEnrollments, useEnrollmentActions } from "@/hooks/useBicademy";
import GlassCard from "@/components/GlassCard";

export default function BicademyCourse() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { course, lessons, questions, loading } = useCourseDetail(code ?? null);
  const { byCourseId, refresh } = useEnrollments();
  const { ensureEnrolled } = useEnrollmentActions();

  // Auto-enroll on first visit
  useEffect(() => {
    if (course) {
      ensureEnrolled(course.id).then(() => refresh()).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertTriangle className="w-8 h-8 text-coral" />
        <p className="text-sm">Course not found.</p>
        <Link to="/bicademy" className="text-xs text-indigo">← Back to Bicademy</Link>
      </div>
    );
  }

  const enrollment = byCourseId[course.id];
  const done = new Set(enrollment?.lessons_completed ?? []);
  const doneCount = lessons.filter((l) => done.has(l.id)).length;
  const allLessonsDone = lessons.length > 0 && doneCount === lessons.length;
  // Certificate is available as soon as every lesson is complete — the
  // formal assessment is optional for the certificate page itself.
  const certificateAvailable = allLessonsDone;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-8 md:pt-20 space-y-6">
        <button
          onClick={() => navigate("/bicademy")}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
         title="navigate('/bicademy')} className='flex items-center gap-2 text-xs text-muted-…" aria-label="navigate('/bicademy')} className='flex items-center gap-2 text-xs text-muted-…">
          <ArrowLeft className="w-4 h-4" /> Bicademy
        </button>

        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-mono text-muted-foreground">{course.course_code}</p>
            {course.required_for_accreditation && (
              <span className="text-[10px] font-semibold text-indigo px-2 py-0.5 rounded-full bg-indigo/10">Required</span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{course.title}</h1>
          {course.description && (
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{course.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {lessons.length} lessons</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.estimated_minutes} min</span>
            <span>pass ≥ {course.passing_score}%</span>
          </div>
        </header>

        {/* Progress */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-foreground">{doneCount} / {lessons.length} lessons</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo to-teal"
                initial={{ width: 0 }}
                animate={{ width: `${lessons.length > 0 ? (doneCount / lessons.length) * 100 : 0}%` }}
                transition={{ duration: 0.7 }}
              />
            </div>
          </div>
          {enrollment?.assessment_passed && (
            <span className="text-xs font-semibold text-teal flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Passed {enrollment.assessment_score}%
            </span>
          )}
        </div>

        {/* Lessons list */}
        {lessons.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Lessons coming soon.</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Lessons</p>
            {lessons.map((l, i) => {
              const isDone = done.has(l.id);
              return (
                <Link
                  key={l.id}
                  to={`/bicademy/${course.course_code}/lesson/${l.lesson_number}`}
                  className="block"
                >
                  <GlassCard hover className="p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isDone ? "bg-teal/10" : "bg-white/5"
                    }`}>
                      {isDone ? <CheckCircle className="w-4 h-4 text-teal" />
                        : <Circle className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Lesson {i + 1}</p>
                      <p className="text-sm font-semibold text-foreground truncate">{l.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground">{l.duration_minutes} min</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}

        {/* Certificate CTA — unlocks the moment every lesson is complete */}
        {certificateAvailable && (
          <div className="pt-2">
            <Link
              to={`/bicademy/certificate/${course.course_code}`}
              className="w-full p-4 rounded-2xl bg-gradient-to-br from-teal via-teal/90 to-indigo text-white hover:brightness-110 flex items-center gap-3 transition-all"
            >
              <Award className="w-5 h-5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Get your certificate</p>
                <p className="text-[11px] opacity-85">
                  You've completed every lesson. Print or save as PDF.
                </p>
              </div>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* Assessment CTA */}
        {questions.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => navigate(`/bicademy/${course.course_code}/assessment`)}
              disabled={!allLessonsDone && !enrollment?.assessment_attempts}
              className={`w-full p-4 rounded-2xl text-left flex items-center gap-3 transition-all ${
                allLessonsDone || (enrollment?.assessment_attempts ?? 0) > 0
                  ? "bg-gradient-to-r from-indigo to-teal text-white hover:brightness-110"
                  : "bg-white/[0.02] border border-white/5 text-muted-foreground cursor-not-allowed opacity-60"
              }`}
             title="navigate(`/bicademy/$ /assessment`)} disabled= className= `} > questions · %`…" aria-label="navigate(`/bicademy/$ /assessment`)} disabled= className= `} > questions · %`…">
              <Sparkles className="w-5 h-5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {enrollment?.assessment_passed ? "Retake assessment" : "Start assessment"}
                </p>
                <p className="text-[11px] opacity-80">
                  {questions.length} questions · {enrollment?.assessment_passed
                    ? `You passed with ${enrollment.assessment_score}%`
                    : allLessonsDone
                    ? `${questions.length} questions · pass ≥ ${course.passing_score}%`
                    : `Complete all ${lessons.length} lessons first`}
                </p>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
