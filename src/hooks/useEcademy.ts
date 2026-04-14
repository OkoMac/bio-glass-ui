import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TargetRole = "sales_rep" | "provider" | "admin" | "all";
export type ContentType = "text" | "video" | "interactive" | "quiz" | "scenario";
export type QuestionType = "single" | "multiple" | "true_false" | "scenario";

export interface Course {
  id: string;
  course_code: string;
  title: string;
  description: string | null;
  target_role: TargetRole;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_minutes: number;
  order_index: number;
  passing_score: number;
  required_for_accreditation: boolean;
  published: boolean;
}

export interface Lesson {
  id: string;
  course_id: string;
  lesson_number: number;
  title: string;
  content_type: ContentType;
  content: string | null;
  video_url: string | null;
  duration_minutes: number;
  key_takeaways: string[];
}

export interface AssessmentQuestion {
  id: string;
  course_id: string;
  question_number: number;
  question_text: string;
  question_type: QuestionType;
  options: Array<{ id: string; text: string; isCorrect?: boolean }>;
  explanation: string | null;
  points: number;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  started_at: string;
  completed_at: string | null;
  last_lesson_id: string | null;
  lessons_completed: string[];
  assessment_score: number | null;
  assessment_attempts: number;
  assessment_passed: boolean;
  assessment_answers: Record<string, string> | null;
}

export interface RangerAccreditation {
  id: string;
  user_id: string;
  accredited: boolean;
  accredited_at: string | null;
  courses_completed: number;
  average_score: number | null;
  certificate_code: string | null;
  expires_at: string | null;
  support_tier: 1 | 2;
  created_at: string;
}

/** All published courses for the current user's target role (or 'all'). */
export function useCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const role = user?.role === "sales_rep" ? "sales_rep"
                 : user?.role === "provider"  ? "provider"
                 : user?.role === "admin"     ? "admin"
                 : "all";
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("published", true)
        .in("target_role", [role, "all"])
        .order("order_index", { ascending: true });
      setCourses((data ?? []) as Course[]);
      setLoading(false);
    })();
  }, [user?.role]);

  return { courses, loading };
}

/** Enrollments for the current user, keyed by course_id. */
export function useEnrollments() {
  const { user } = useAuth();
  const [byCourseId, setByCourseId] = useState<Record<string, Enrollment>>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user?.profileId) { setLoading(false); return; }
    const { data } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", user.profileId);
    const byId: Record<string, Enrollment> = {};
    (data ?? []).forEach((e: unknown) => {
      const en = e as Enrollment & { lessons_completed?: unknown; assessment_answers?: unknown };
      byId[en.course_id] = {
        ...en,
        lessons_completed: Array.isArray(en.lessons_completed) ? (en.lessons_completed as string[]) : [],
        assessment_answers: (en.assessment_answers as Record<string, string> | null) ?? null,
      };
    });
    setByCourseId(byId);
    setLoading(false);
  }, [user?.profileId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { byCourseId, loading, refresh: fetchAll };
}

/** One course + its lessons + its questions (admin/view). */
export function useCourseDetail(courseCode: string | null) {
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(!!courseCode);

  useEffect(() => {
    if (!courseCode) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data: c } = await supabase
        .from("courses").select("*").eq("course_code", courseCode).maybeSingle();
      if (!c) { setLoading(false); return; }
      setCourse(c as Course);
      const [{ data: ls }, { data: qs }] = await Promise.all([
        supabase.from("lessons").select("*").eq("course_id", c.id).order("lesson_number", { ascending: true }),
        supabase.from("assessment_questions").select("*").eq("course_id", c.id).order("question_number", { ascending: true }),
      ]);
      setLessons(((ls ?? []) as Array<Lesson & { key_takeaways: unknown }>).map(l => ({
        ...l,
        key_takeaways: Array.isArray(l.key_takeaways) ? (l.key_takeaways as string[]) : [],
      })));
      setQuestions(((qs ?? []) as Array<AssessmentQuestion & { options: unknown }>).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? (q.options as AssessmentQuestion["options"]) : [],
      })));
      setLoading(false);
    })();
  }, [courseCode]);

  return { course, lessons, questions, loading };
}

/** Enroll + mark-lesson-done + submit-assessment helpers. */
export function useEnrollmentActions() {
  const { user } = useAuth();

  const ensureEnrolled = useCallback(async (courseId: string) => {
    if (!user?.profileId) throw new Error("Not signed in");
    // Upsert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("enrollments") as any)
      .upsert({ user_id: user.profileId, course_id: courseId }, { onConflict: "user_id,course_id" })
      .select().single();
    if (error) throw error;
    return data as Enrollment;
  }, [user?.profileId]);

  const markLessonComplete = useCallback(async (courseId: string, lessonId: string) => {
    if (!user?.profileId) throw new Error("Not signed in");
    const enrollment = await ensureEnrolled(courseId);
    const done = new Set([...(enrollment.lessons_completed ?? []), lessonId]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("enrollments") as any)
      .update({ lessons_completed: Array.from(done), last_lesson_id: lessonId })
      .eq("id", enrollment.id);
    if (error) throw error;
    return Array.from(done);
  }, [ensureEnrolled, user?.profileId]);

  const submitAssessment = useCallback(async (
    courseId: string,
    answers: Record<string, string>,
    questions: AssessmentQuestion[]
  ): Promise<{ score: number; passed: boolean; total: number; correct: number }> => {
    if (!user?.profileId) throw new Error("Not signed in");

    // Score client-side (it's not graded server-side in MVP — RLS allows user to see their own)
    const totalPoints = questions.reduce((sum, q) => sum + (q.points ?? 1), 0);
    let earned = 0;
    for (const q of questions) {
      const correctOpt = q.options.find(o => o.isCorrect);
      if (correctOpt && answers[q.id] === correctOpt.id) earned += q.points ?? 1;
    }
    const score = Math.round((earned / totalPoints) * 100);

    // Get course's passing threshold
    const { data: course } = await supabase
      .from("courses").select("passing_score").eq("id", courseId).maybeSingle();
    const passingScore = (course as { passing_score?: number } | null)?.passing_score ?? 80;
    const passed = score >= passingScore;

    const enrollment = await ensureEnrolled(courseId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("enrollments") as any)
      .update({
        assessment_score: score,
        assessment_passed: passed,
        assessment_attempts: (enrollment.assessment_attempts ?? 0) + 1,
        assessment_answers: answers,
        completed_at: passed ? new Date().toISOString() : null,
      })
      .eq("id", enrollment.id);
    if (error) throw error;

    // Trigger accreditation check
    if (passed) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)("check_and_award_ranger_status", { p_user_id: user.profileId });
    }

    return { score, passed, total: totalPoints, correct: earned };
  }, [ensureEnrolled, user?.profileId]);

  return { ensureEnrolled, markLessonComplete, submitAssessment };
}

/** Current user's ranger accreditation (null if not yet accredited). */
export function useRangerAccreditation() {
  const { user } = useAuth();
  const [accreditation, setAccreditation] = useState<RangerAccreditation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.profileId) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("ranger_accreditations")
        .select("*")
        .eq("user_id", user.profileId)
        .maybeSingle();
      setAccreditation((data as RangerAccreditation | null) ?? null);
      setLoading(false);
    })();
  }, [user?.profileId]);

  return { accreditation, loading };
}
