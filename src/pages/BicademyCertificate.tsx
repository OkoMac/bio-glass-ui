// ============================================================
// BION Bicademy — Certificate page
//
// Route: /bicademy/certificate/:courseSlug
//
// Renders a print-ready certificate using the user's name + course
// title + completion date. v1 uses browser print-to-PDF (Cmd/Ctrl+P
// → Save as PDF). No server-side PDF generation yet.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, Printer, ArrowLeft, Loader2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCourseDetail, useEnrollments } from "@/hooks/useBicademy";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return new Date().toLocaleDateString("en-ZA", {
    day: "numeric", month: "long", year: "numeric",
  });
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function certificateCode(courseCode: string, profileId: string | null): string {
  // Deterministic short code derived from profile + course. Good enough
  // for visual identification; the authoritative cert id lives on the
  // server-side `ranger_accreditations.certificate_code` for Rangers.
  const base = `${courseCode}-${(profileId ?? "guest").slice(0, 6)}`.toUpperCase();
  return `BION-CERT-${base}`;
}

export default function BicademyCertificate() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { course, lessons, loading } = useCourseDetail(courseSlug ?? null);
  const { byCourseId, loading: enrollLoading } = useEnrollments();
  const [printing, setPrinting] = useState(false);

  // The URL becomes the document title briefly during print so the
  // generated PDF is named sensibly. Restore after.
  useEffect(() => {
    if (!course) return;
    const prev = document.title;
    document.title = `BION Certificate — ${course.title}`;
    return () => { document.title = prev; };
  }, [course]);

  const enrollment = course ? byCourseId[course.id] : undefined;
  const completedLessonCount = enrollment?.lessons_completed?.length ?? 0;
  const totalLessons = lessons.length;
  const eligible = useMemo(
    () => totalLessons > 0 && completedLessonCount >= totalLessons,
    [completedLessonCount, totalLessons],
  );

  if (loading || enrollLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-3">
        <p className="text-sm text-muted-foreground">Course not found.</p>
        <Link to="/bicademy" className="text-xs text-indigo">← Back to Bicademy</Link>
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Certificate locked</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Complete all {totalLessons} lessons of {course.title} to unlock your certificate.
            You've done {completedLessonCount} so far.
          </p>
        </div>
        <button
          onClick={() => navigate(`/bicademy/${course.course_code}`)}
          className="rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta"
         title="navigate(`/bicademy/$ `)} className='rounded-pill px-4 py-2 text-xs font-semi…" aria-label="navigate(`/bicademy/$ `)} className='rounded-pill px-4 py-2 text-xs font-semi…">
          Continue course
        </button>
      </div>
    );
  }

  const name = user?.name ?? "BION Member";
  const completedAt = enrollment?.completed_at ?? new Date().toISOString();
  const code = certificateCode(course.course_code, user?.profileId ?? null);

  const handlePrint = () => {
    setPrinting(true);
    // Let the print layout class apply, then invoke the browser dialog.
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrinting(false), 500);
    }, 50);
  };

  return (
    <div className={`min-h-screen bg-background ${printing ? "print-mode" : ""}`}>
      {/* Screen-only toolbar */}
      <div className="print:hidden sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(`/bicademy/${course.course_code}`)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
           title="navigate(`/bicademy/$ `)} className='flex items-center gap-2 text-xs text-mut…" aria-label="navigate(`/bicademy/$ `)} className='flex items-center gap-2 text-xs text-mut…">
            <ArrowLeft className="w-4 h-4" /> Back to course
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta"
           title="Print / Save as PDF" aria-label="Print / Save as PDF">
            <Printer className="w-3.5 h-3.5" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Certificate canvas */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="relative aspect-[1.414/1] w-full rounded-2xl overflow-hidden
                     bg-gradient-to-br from-indigo/15 via-background to-teal/15
                     border border-indigo/30 shadow-2xl print:shadow-none print:border-black/20"
          id="bion-certificate"
        >
          {/* Decorative corners */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-indigo/30 to-transparent -translate-y-20 translate-x-20" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-gradient-to-tr from-teal/25 to-transparent translate-y-28 -translate-x-28" />

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center text-center px-8 md:px-16 py-8 md:py-12">
            <div className="flex items-center gap-2 text-[10px] md:text-xs tracking-[0.3em] uppercase text-muted-foreground">
              <Award className="w-4 h-4 text-indigo" />
              BION Bicademy
            </div>
            <p className="mt-8 text-[11px] md:text-sm text-muted-foreground uppercase tracking-widest">
              Certificate of Completion
            </p>
            <p className="mt-6 text-xs md:text-base text-foreground/80">This is to certify that</p>
            <h1 className="mt-3 text-3xl md:text-5xl font-bold text-foreground font-serif italic">
              {name}
            </h1>
            <p className="mt-6 text-xs md:text-base text-foreground/80">has successfully completed</p>
            <h2 className="mt-3 text-xl md:text-3xl font-bold text-foreground">
              {course.title}
            </h2>
            <p className="mt-2 text-[10px] md:text-xs font-mono text-muted-foreground">
              {course.course_code}
            </p>

            <div className="mt-10 flex items-end justify-between w-full max-w-2xl text-left">
              <div>
                <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground">Date</p>
                <p className="text-xs md:text-sm font-semibold text-foreground mt-1">{formatDate(completedAt)}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground">Certificate code</p>
                <p className="text-xs md:text-sm font-mono font-semibold text-indigo mt-1">{code}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground">Issued by</p>
                <p className="text-xs md:text-sm font-semibold text-foreground mt-1">BION Health</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Screen-only secondary note */}
        <p className="print:hidden text-center text-[11px] text-muted-foreground mt-4">
          Use your browser's print dialog (Cmd/Ctrl + P) and pick "Save as PDF".
        </p>
      </div>

      {/* Print-only CSS: hide toolbar, use A4-landscape, remove body padding */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          #bion-certificate { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
