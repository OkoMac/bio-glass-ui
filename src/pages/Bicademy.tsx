import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Award, Lock, CheckCircle, Clock, ChevronRight, Loader2, Sparkles, TrendingUp, ArrowLeft } from "lucide-react";
import { useCourses, useEnrollments, useRangerAccreditation, type Course } from "@/hooks/useBicademy";
import { useAuth } from "@/contexts/AuthContext";
import GlassCard from "@/components/GlassCard";

const DIFFICULTY_META = {
  beginner:     { label: "Beginner",     color: "text-teal",   bg: "bg-teal/10" },
  intermediate: { label: "Intermediate", color: "text-amber",  bg: "bg-amber/10" },
  advanced:     { label: "Advanced",     color: "text-coral",  bg: "bg-coral/10" },
};

export default function Bicademy() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courses, loading: coursesLoading } = useCourses();
  const { byCourseId, loading: enrollLoading } = useEnrollments();
  const { accreditation, loading: accredLoading } = useRangerAccreditation();

  const loading = coursesLoading || enrollLoading || accredLoading;

  const requiredCourses = courses.filter((c) => c.required_for_accreditation);
  const completedCount = requiredCourses.filter((c) => byCourseId[c.id]?.assessment_passed).length;
  const overallProgress = requiredCourses.length > 0 ? (completedCount / requiredCourses.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8 md:pt-20 space-y-6">
        {/* Hero */}
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="shrink-0 w-9 h-9 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-indigo/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-indigo" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">BION Bicademy</p>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {user?.role === "sales_rep" ? "Ranger Training" : "Training Courses"}
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {user?.role === "sales_rep"
              ? "Complete the core syllabus to become a certified BION Ranger — unlocks commission eligibility + Tier 2 support escalations."
              : "On-demand training to get the most out of the BION platform."}
          </p>
        </header>

        {/* Accreditation card (sales reps only) */}
        {user?.role === "sales_rep" && !loading && (
          <AccreditationBanner
            accredited={!!accreditation?.accredited}
            certificateCode={accreditation?.certificate_code ?? null}
            averageScore={accreditation?.average_score ?? null}
            supportTier={accreditation?.support_tier ?? 1}
            completedCount={completedCount}
            totalRequired={requiredCourses.length}
            progress={overallProgress}
          />
        )}

        {/* Courses */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : courses.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <GraduationCap className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">No courses available</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {courses.length} course{courses.length !== 1 ? "s" : ""} · {completedCount} passed
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {courses.map((c, i) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  enrollment={byCourseId[c.id]}
                  locked={isCourseLocked(c, courses, byCourseId)}
                  delay={i * 0.04}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function isCourseLocked(c: Course, all: Course[], byId: Record<string, { assessment_passed?: boolean }>) {
  // Lock final assessment until all earlier required courses pass
  if (c.course_code === "RANGER-110") {
    return all
      .filter((x) => x.required_for_accreditation && x.course_code !== "RANGER-110")
      .some((x) => !byId[x.id]?.assessment_passed);
  }
  return false;
}

function CourseCard({
  course, enrollment, locked, delay,
}: {
  course: Course;
  enrollment?: { assessment_passed?: boolean; assessment_score?: number | null; lessons_completed?: string[] };
  locked: boolean;
  delay: number;
}) {
  const diff = DIFFICULTY_META[course.difficulty] ?? DIFFICULTY_META.beginner;
  const passed = !!enrollment?.assessment_passed;
  const started = !!enrollment && (enrollment.lessons_completed?.length ?? 0) > 0;

  const Card = locked ? "div" : Link;
  const cardProps = locked
    ? { className: "block cursor-not-allowed opacity-50" }
    : { to: `/bicademy/${course.course_code}`, className: "block" };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Card {...(cardProps as any)}>
        <GlassCard hover={!locked} className="p-4 h-full flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-mono text-muted-foreground">{course.course_code}</p>
              <h3 className="text-sm font-semibold text-foreground mt-0.5 truncate">{course.title}</h3>
            </div>
            {locked ? <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              : passed ? <CheckCircle className="w-4 h-4 text-teal shrink-0" />
              : started ? <TrendingUp className="w-4 h-4 text-amber shrink-0" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
          </div>

          {course.description && (
            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{course.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-auto">
            <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${diff.bg} ${diff.color}`}>
              {diff.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-white/[0.02]">
              <Clock className="w-2.5 h-2.5" /> {course.estimated_minutes} min
            </span>
            {course.required_for_accreditation && (
              <span className="text-[10px] font-semibold text-indigo">Required</span>
            )}
            {passed && enrollment?.assessment_score != null && (
              <span className="text-[10px] font-semibold text-teal ml-auto">
                {enrollment.assessment_score}%
              </span>
            )}
          </div>
        </GlassCard>
      </Card>
    </motion.div>
  );
}

function AccreditationBanner({
  accredited, certificateCode, averageScore, supportTier,
  completedCount, totalRequired, progress,
}: {
  accredited: boolean;
  certificateCode: string | null;
  averageScore: number | null;
  supportTier: 1 | 2;
  completedCount: number;
  totalRequired: number;
  progress: number;
}) {
  if (accredited) {
    return (
      <Link to="/bicademy/accreditation">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="relative p-5 rounded-2xl bg-gradient-to-br from-indigo via-indigo/90 to-teal/80 text-white overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-12 translate-x-12" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest opacity-80">Certified BION Ranger · Tier {supportTier}</p>
              <p className="text-lg font-bold truncate">{certificateCode}</p>
              <p className="text-xs opacity-80">
                Avg score {averageScore?.toFixed(1) ?? "—"}% · {completedCount}/{totalRequired} courses passed
              </p>
            </div>
            <Sparkles className="w-5 h-5 opacity-70" />
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo/10 flex items-center justify-center">
          <Award className="w-5 h-5 text-indigo" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Ranger Accreditation</p>
          <p className="text-[11px] text-muted-foreground">Pass all {totalRequired} required courses to earn your certificate + start earning commissions.</p>
        </div>
        <p className="text-xl font-bold text-indigo">{completedCount}/{totalRequired}</p>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo to-teal"
          initial={{ width: 0 }} animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
