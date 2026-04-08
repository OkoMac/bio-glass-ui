/**
 * SCORM-style onboarding state management.
 * Progress is persisted to localStorage keyed by userId + role.
 * SCORM fields: lessonStatus, score, location, suspendData, sessionTime.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { OnboardingProgress, OnboardingStep, SCORMState, CrawlResult, BatchEmployee } from "@/types/onboarding";

const STORAGE_PREFIX = "bion_onboarding_";

function storageKey(userId: string, role: string) {
  return `${STORAGE_PREFIX}${userId}_${role}`;
}

function buildInitialScorm(): SCORMState {
  return {
    lessonStatus: "not_attempted",
    score: { raw: 0, min: 0, max: 100, scaled: 0 },
    location: "",
    startedAt: new Date().toISOString(),
    sessionSeconds: 0,
  };
}

function buildInitialProgress(userId: string, role: string): OnboardingProgress {
  return {
    userId,
    role,
    currentStep: 0,
    completedSteps: [],
    answers: {},
    formData: {},
    scorm: buildInitialScorm(),
  };
}

function loadProgress(userId: string, role: string): OnboardingProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(userId, role));
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingProgress;
  } catch {
    return null;
  }
}

function saveProgress(progress: OnboardingProgress) {
  try {
    localStorage.setItem(storageKey(progress.userId, progress.role), JSON.stringify(progress));
  } catch {
    // Storage quota — fail silently
  }
}

// ─── Score Calculator ─────────────────────────────────────────────────────────

function calculateScore(answers: Record<string, unknown>, steps: OnboardingStep[]): number {
  let total = 0;
  let correct = 0;

  for (const step of steps) {
    if (step.type !== "quiz" || !step.questions) continue;
    for (const q of step.questions) {
      if (!q.isKnowledgeCheck || !q.options) continue;
      const correctOptions = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      if (!correctOptions.length) {
        if (import.meta.env.DEV) console.warn(`[useOnboarding] Quiz question "${q.id}" has no correct option marked — skipped from score.`);
        continue;
      }
      total++;
      const userAnswer = answers[q.id];
      if (Array.isArray(userAnswer)) {
        if (
          userAnswer.length === correctOptions.length &&
          correctOptions.every((id) => userAnswer.includes(id))
        ) correct++;
      } else if (typeof userAnswer === "string" && correctOptions.includes(userAnswer)) {
        correct++;
      }
    }
  }

  return total === 0 ? 100 : Math.round((correct / total) * 100);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOnboarding(userId: string, role: string, steps: OnboardingStep[]) {
  const [progress, setProgress] = useState<OnboardingProgress>(() => {
    return loadProgress(userId, role) ?? buildInitialProgress(userId, role);
  });

  // Session timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setProgress((p) => ({
        ...p,
        scorm: { ...p.scorm, sessionSeconds: p.scorm.sessionSeconds + 1 },
      }));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Persist on change
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const currentStepData = steps[progress.currentStep] ?? steps[0];

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goToStep = useCallback((index: number) => {
    setProgress((p) => ({
      ...p,
      currentStep: Math.max(0, Math.min(index, steps.length - 1)),
      scorm: { ...p.scorm, location: steps[index]?.id ?? "" },
    }));
  }, [steps]);

  const nextStep = useCallback(() => {
    setProgress((p) => {
      // Derive current step id from state (not closure) to avoid stale-capture bugs
      const currentId = steps[p.currentStep]?.id;
      const nextIndex = Math.min(p.currentStep + 1, steps.length - 1);
      const completedSteps =
        currentId && !p.completedSteps.includes(currentId)
          ? [...p.completedSteps, currentId]
          : p.completedSteps;

      const newStatus: SCORMState["lessonStatus"] =
        nextIndex === steps.length - 1 ? "completed" : "incomplete";

      return {
        ...p,
        currentStep: nextIndex,
        completedSteps,
        scorm: {
          ...p.scorm,
          lessonStatus: newStatus,
          location: steps[nextIndex]?.id ?? "",
        },
      };
    });
  }, [steps]);

  const prevStep = useCallback(() => {
    setProgress((p) => ({
      ...p,
      currentStep: Math.max(p.currentStep - 1, 0),
    }));
  }, []);

  // ── Answers ─────────────────────────────────────────────────────────────────

  const setAnswer = useCallback((questionId: string, value: unknown) => {
    setProgress((p) => {
      const answers = { ...p.answers, [questionId]: value };
      const score = calculateScore(answers, steps);
      return {
        ...p,
        answers,
        scorm: {
          ...p.scorm,
          score: { raw: score, min: 0, max: 100, scaled: score / 100 },
        },
      };
    });
  }, [steps]);

  // ── Form Data ────────────────────────────────────────────────────────────────

  const setFormField = useCallback((fieldId: string, value: string) => {
    setProgress((p) => ({
      ...p,
      formData: { ...p.formData, [fieldId]: value },
    }));
  }, []);

  const setFormData = useCallback((data: Record<string, string>) => {
    setProgress((p) => ({
      ...p,
      formData: { ...p.formData, ...data },
    }));
  }, []);

  // ── Crawl Data ───────────────────────────────────────────────────────────────

  const setCrawlData = useCallback((crawl: CrawlResult) => {
    setProgress((p) => ({ ...p, crawlData: crawl }));
  }, []);

  // ── Batch Employees ──────────────────────────────────────────────────────────

  const setBatchEmployees = useCallback((employees: BatchEmployee[]) => {
    setProgress((p) => ({ ...p, batchEmployees: employees }));
  }, []);

  // ── Complete Onboarding ──────────────────────────────────────────────────────

  const complete = useCallback(() => {
    setProgress((p) => ({
      ...p,
      completedSteps: steps.map((s) => s.id),
      scorm: {
        ...p.scorm,
        lessonStatus: "passed",
        completedAt: new Date().toISOString(),
      },
    }));
  }, [steps]);

  // ── Reset ────────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    const fresh = buildInitialProgress(userId, role);
    setProgress(fresh);
    saveProgress(fresh);
  }, [userId, role]);

  // ── Derived State ────────────────────────────────────────────────────────────

  const progressPercent = steps.length > 1
    ? Math.round((progress.completedSteps.length / (steps.length - 1)) * 100)
    : 0;

  const isStepComplete = (stepId: string) => progress.completedSteps.includes(stepId);

  const isOnboarded = progress.scorm.lessonStatus === "passed";

  const canProceed = (stepId: string): boolean => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return true;
    if (step.canSkip) return true;
    if (step.type === "quiz") {
      // For knowledge-check quizzes, just need to answer all required questions
      if (!step.questions) return true;
      const required = step.questions.filter((q) => q.required);
      const answered = required.filter((q) => progress.answers[q.id] !== undefined);
      return answered.length >= required.length;
    }
    if (step.type === "form" && step.fields) {
      const required = step.fields.filter((f) => f.required);
      return required.every((f) => Boolean(progress.formData[f.id]?.trim()));
    }
    return true;
  };

  return {
    progress,
    currentStep: progress.currentStep,
    currentStepData,
    progressPercent,
    isStepComplete,
    isOnboarded,
    canProceed,
    goToStep,
    nextStep,
    prevStep,
    setAnswer,
    setFormField,
    setFormData,
    setCrawlData,
    setBatchEmployees,
    complete,
    reset,
  };
}
