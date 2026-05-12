import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, Clock, Sparkles, Loader2,
} from "lucide-react";
import { useCourseDetail, useEnrollments, useEnrollmentActions } from "@/hooks/useBicademy";
import { toast } from "sonner";
import { trackEvent } from "@/lib/habits";

export default function BicademyLesson() {
  const { code, n } = useParams<{ code: string; n: string }>();
  const lessonNumber = parseInt(n ?? "1", 10);
  const navigate = useNavigate();
  const { course, lessons, loading } = useCourseDetail(code ?? null);
  const { byCourseId, refresh } = useEnrollments();
  const { markLessonComplete } = useEnrollmentActions();
  const [saving, setSaving] = useState(false);

  // Scroll to top on lesson change
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [lessonNumber]);

  // Log the article_read event once we've resolved the lesson (content is on screen).
  useEffect(() => {
    if (!course || !code) return;
    trackEvent("article_read", {
      category: "education",
      metadata: { course_code: code, lesson_number: lessonNumber, course_title: course.title },
    });
  }, [code, lessonNumber, course]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!course) return null;

  const lesson = lessons.find((l) => l.lesson_number === lessonNumber);
  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">Lesson not found.</p>
        <button onClick={() => navigate(`/bicademy/${code}`)} className="mt-3 text-xs text-indigo" title="navigate(`/bicademy/$ `)} className='mt-3 text-xs text-indigo'>← Back" aria-label="navigate(`/bicademy/$ `)} className='mt-3 text-xs text-indigo'>← Back">← Back</button>
      </div>
    );
  }

  const enrollment = byCourseId[course.id];
  const done = new Set(enrollment?.lessons_completed ?? []);
  const isLastLesson = lessonNumber === lessons.length;
  const prevLesson = lessons.find((l) => l.lesson_number === lessonNumber - 1);
  const nextLesson = lessons.find((l) => l.lesson_number === lessonNumber + 1);

  const handleComplete = async () => {
    try {
      setSaving(true);
      await markLessonComplete(course.id, lesson.id);
      await refresh();
      toast.success("Lesson complete");
      if (nextLesson) {
        navigate(`/bicademy/${code}/lesson/${nextLesson.lesson_number}`);
      } else {
        navigate(`/bicademy/${code}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 md:px-8 pt-8 md:pt-20 space-y-6">
        <button
          onClick={() => navigate(`/bicademy/${code}`)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
         title="navigate(`/bicademy/$ `)} className='flex items-center gap-2 text-xs text-mut…" aria-label="navigate(`/bicademy/$ `)} className='flex items-center gap-2 text-xs text-mut…">
          <ArrowLeft className="w-4 h-4" /> {course.course_code}
        </button>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
            <span>Lesson {lessonNumber} of {lessons.length}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.duration_minutes} min</span>
          </div>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo to-teal"
              initial={{ width: 0 }} animate={{ width: `${(lessonNumber / lessons.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Lesson content */}
        <motion.article
          key={lesson.id}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert prose-sm md:prose-base max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-h1:text-3xl md:prose-h1:text-4xl prose-h1:mb-3
            prose-h2:text-xl md:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3
            prose-h3:text-base md:prose-h3:text-lg prose-h3:mt-6
            prose-p:text-foreground/85 prose-p:leading-relaxed
            prose-ul:my-3 prose-li:my-0.5 prose-li:text-foreground/85
            prose-strong:text-foreground prose-strong:font-semibold
            prose-em:text-foreground/90
            prose-table:my-4 prose-table:text-xs md:prose-table:text-sm
            prose-th:text-foreground prose-th:font-semibold prose-th:border-b prose-th:border-white/10 prose-th:px-2 prose-th:py-1
            prose-td:text-foreground/85 prose-td:border-b prose-td:border-white/5 prose-td:px-2 prose-td:py-1
            prose-code:text-teal prose-code:bg-teal/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']"
        >
          <ReactMarkdown>{lesson.content ?? ""}</ReactMarkdown>
        </motion.article>

        {/* Key takeaways */}
        {lesson.key_takeaways.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-indigo/15 to-teal/10 border border-indigo/20 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo" />
              <p className="text-xs font-semibold text-foreground uppercase tracking-widest">Key takeaways</p>
            </div>
            <ul className="space-y-1.5 pl-1">
              {lesson.key_takeaways.map((t, i) => (
                <li key={i} className="text-xs md:text-sm text-foreground/90 flex items-start gap-2">
                  <span className="text-indigo font-bold mt-0.5">·</span>{t}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-3 pt-4">
          <button
            onClick={() => prevLesson && navigate(`/bicademy/${code}/lesson/${prevLesson.lesson_number}`)}
            disabled={!prevLesson}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
           title="prevLesson && navigate(`/bicademy/$ /lesson/$ `)} disabled= className='flex i…" aria-label="prevLesson && navigate(`/bicademy/$ /lesson/$ `)} disabled= className='flex i…">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={handleComplete}
            disabled={saving}
            className="flex-1 max-w-xs py-3 rounded-pill bg-gradient-to-r from-indigo to-teal text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
           title=": <> }" aria-label=": <> }">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" />
              : done.has(lesson.id) ? <><CheckCircle className="w-4 h-4" /> {isLastLesson ? "Back to course" : "Next lesson"}</>
              : <>{isLastLesson ? "Complete course" : "Mark done & continue"} <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
