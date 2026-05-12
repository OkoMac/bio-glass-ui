import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { useRoutinesSync } from "@/hooks/useRoutinesSync";
import { useMyPrograms } from "@/hooks/useMyPrograms";
import { getProviderImage } from "@/lib/providerImages";
import realData from "@/data/bion_pretoria_data.json";
import {
  ArrowLeft, ChevronRight, CheckCircle, Circle, Plus, X,
  Dumbbell, Apple, Stethoscope, Play, Eye, EyeOff, Shield, Pill, Heart, Activity,
  Clock, Calendar, Flame, ChevronDown, Trash2, Share2, Camera, Sparkles, Loader2,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────── */
interface Exercise {
  name: string;
  sets: string;
  done: boolean;
}

interface Routine {
  id: string;
  title: string;
  type: "workout" | "cardio" | "rehab" | "meal" | "skincare" | "medication" | "wellness" | "beauty" | "custom";
  provider?: string;         // undefined = self-created
  providerId?: string;
  providerImage?: string;
  vertical: "teal" | "indigo" | "coral" | "amber";
  daysCompleted: number;
  totalDays: number;
  exercises: Exercise[];
  createdBy: "self" | "provider";
  sharedWith: string[];      // provider IDs who can see this routine
  schedule?: string;         // e.g. "Mon, Wed, Fri"
}

/* ── Real provider data for assignment & self-creation ──── */
const FITNESS_PROVIDERS = realData.providers
  .filter(p => /gym|fitness|train|yoga|pilates|crossfit/i.test(p.category ?? ""))
  .slice(0, 12)
  .map(p => ({
    id: p.id,
    name: p.name,
    image: getProviderImage(p.id, p.name),
    services: p.servicesOffered ?? [],
    availability: typeof p.availability === "string" ? p.availability : (Array.isArray(p.availability) ? p.availability.join(", ") : "Available"),
    category: p.category ?? "",
  }));

const MEDICAL_PROVIDERS = realData.providers
  .filter(p => /physio|chiro|rehab|doctor|medical|dental/i.test(p.category ?? ""))
  .slice(0, 6)
  .map(p => ({
    id: p.id,
    name: p.name,
    image: getProviderImage(p.id, p.name),
    services: p.servicesOffered ?? [],
    availability: typeof p.availability === "string" ? p.availability : (Array.isArray(p.availability) ? p.availability.join(", ") : "Available"),
    category: p.category ?? "",
  }));

const BEAUTY_PROVIDERS = realData.providers
  .filter(p => /beauty|salon|spa|hair|nail|skin|aesthetic/i.test(p.category ?? ""))
  .slice(0, 6)
  .map(p => ({
    id: p.id,
    name: p.name,
    image: getProviderImage(p.id, p.name),
    services: p.servicesOffered ?? [],
    availability: typeof p.availability === "string" ? p.availability : (Array.isArray(p.availability) ? p.availability.join(", ") : "Available"),
    category: p.category ?? "",
  }));

const ALL_PROVIDERS = [...FITNESS_PROVIDERS, ...MEDICAL_PROVIDERS, ...BEAUTY_PROVIDERS];

/* ── Template exercises by type ──── */
const EXERCISE_TEMPLATES: Record<string, Exercise[]> = {
  workout: [
    { name: "Warm-up (5 min jog)", sets: "1×5min", done: false },
    { name: "Squats", sets: "4×12", done: false },
    { name: "Bench Press", sets: "4×10", done: false },
    { name: "Deadlifts", sets: "3×8", done: false },
    { name: "Pull-ups", sets: "3×max", done: false },
    { name: "Plank", sets: "3×45s", done: false },
    { name: "Cool-down stretch", sets: "5 min", done: false },
  ],
  cardio: [
    { name: "Running", sets: "30 min", done: false },
    { name: "Swimming", sets: "30 min", done: false },
    { name: "Hiking", sets: "60 min", done: false },
    { name: "Cycling", sets: "45 min", done: false },
    { name: "Rowing", sets: "20 min", done: false },
  ],
  rehab: [
    { name: "Foam rolling", sets: "5 min", done: false },
    { name: "Resistance band walks", sets: "3×15", done: false },
    { name: "Single leg balance", sets: "3×30s", done: false },
    { name: "Wall slides", sets: "3×12", done: false },
    { name: "Hip flexor stretch", sets: "2×30s", done: false },
  ],
  meal: [
    { name: "Breakfast: Oats + berries + protein", sets: "350 kcal", done: false },
    { name: "Snack: Greek yoghurt + almonds", sets: "200 kcal", done: false },
    { name: "Lunch: Grilled chicken + brown rice + veg", sets: "500 kcal", done: false },
    { name: "Snack: Protein shake + banana", sets: "250 kcal", done: false },
    { name: "Dinner: Salmon + sweet potato + greens", sets: "450 kcal", done: false },
  ],
  skincare: [
    { name: "Cleanse", sets: "AM + PM", done: false },
    { name: "Tone", sets: "AM + PM", done: false },
    { name: "Serum (Vitamin C)", sets: "AM", done: false },
    { name: "Moisturise (SPF)", sets: "AM", done: false },
    { name: "Retinol", sets: "PM only", done: false },
  ],
  medication: [
    { name: "Morning medication (with breakfast)", sets: "AM", done: false },
    { name: "Midday supplement", sets: "12:00", done: false },
    { name: "Evening medication (after dinner)", sets: "PM", done: false },
    { name: "Before bed supplement", sets: "Before sleep", done: false },
  ],
  wellness: [
    { name: "Morning gratitude journaling", sets: "5 min", done: false },
    { name: "Box breathing (4-4-4-4)", sets: "3 rounds", done: false },
    { name: "Body scan meditation", sets: "10 min", done: false },
    { name: "Mindful walking", sets: "15 min", done: false },
    { name: "Progressive muscle relaxation", sets: "10 min", done: false },
    { name: "Evening reflection + mood log", sets: "5 min", done: false },
  ],
  beauty: [
    { name: "Hair treatment / mask", sets: "1× per week", done: false },
    { name: "Nail care (file, buff, cuticles)", sets: "15 min", done: false },
    { name: "Face mask (clay/sheet/peel)", sets: "20 min", done: false },
    { name: "Body exfoliation", sets: "1× per week", done: false },
    { name: "Moisturise full body", sets: "After shower", done: false },
    { name: "Lip scrub + balm", sets: "PM", done: false },
  ],
  custom: [],
};

/* ── Sample assigned routines (simulating provider assignments) ──── */
function buildSampleRoutines(): Routine[] {
  const fp = FITNESS_PROVIDERS[0];
  const mp = MEDICAL_PROVIDERS[0];
  const bp = BEAUTY_PROVIDERS[0];

  const routines: Routine[] = [];

  // Fitness provider: Strength programme
  if (fp) {
    routines.push({
      id: "assigned_1",
      title: "Strength & Conditioning",
      type: "workout",
      provider: fp.name,
      providerId: fp.id,
      providerImage: fp.image,
      vertical: "teal",
      daysCompleted: 8,
      totalDays: 28,
      exercises: [
        { name: "Warm-up (Dynamic stretches)", sets: "5 min", done: false },
        { name: "Barbell Squats", sets: "4×10", done: false },
        { name: "Dumbbell Bench Press", sets: "4×12", done: false },
        { name: "Romanian Deadlifts", sets: "3×10", done: false },
        { name: "Lat Pulldown", sets: "3×12", done: false },
        { name: "Plank hold", sets: "3×60s", done: false },
        { name: "Cool-down stretch", sets: "5 min", done: false },
      ],
      createdBy: "provider",
      sharedWith: [fp.id],
      schedule: "Mon, Wed, Fri",
    });
  }

  // Medical provider: Rehab programme
  if (mp) {
    routines.push({
      id: "assigned_2",
      title: "Post-Session Recovery",
      type: "rehab",
      provider: mp.name,
      providerId: mp.id,
      providerImage: mp.image,
      vertical: "indigo",
      daysCompleted: 3,
      totalDays: 14,
      exercises: [
        { name: "Foam rolling (full body)", sets: "10 min", done: false },
        { name: "Cat-cow stretch", sets: "3×10", done: false },
        { name: "Glute bridges", sets: "3×15", done: false },
        { name: "Scapular retractions", sets: "3×12", done: false },
        { name: "Ice pack on affected area", sets: "15 min", done: false },
        { name: "Deep breathing + meditation", sets: "5 min", done: false },
      ],
      createdBy: "provider",
      sharedWith: [mp.id],
      schedule: "Tue, Thu, Sat",
    });
  }

  // Beauty provider: Skincare routine
  if (bp) {
    routines.push({
      id: "assigned_3",
      title: "Weekly Skincare Routine",
      type: "skincare",
      provider: bp.name,
      providerId: bp.id,
      providerImage: bp.image,
      vertical: "coral",
      daysCompleted: 5,
      totalDays: 30,
      exercises: [
        { name: "Gentle cleanser (double cleanse PM)", sets: "AM + PM", done: false },
        { name: "Exfoliate (gentle scrub)", sets: "2× per week", done: false },
        { name: "Hydrating toner", sets: "AM + PM", done: false },
        { name: "Vitamin C serum", sets: "AM only", done: false },
        { name: "Hyaluronic acid moisturiser", sets: "AM + PM", done: false },
        { name: "SPF 50+ sunscreen", sets: "AM only", done: false },
        { name: "Retinol serum", sets: "PM only, 3×/week", done: false },
        { name: "Sheet mask (hydrating)", sets: "1× per week", done: false },
      ],
      createdBy: "provider",
      sharedWith: [bp.id],
      schedule: "Daily",
    });
  }

  // Self-created: Meal plan
  routines.push({
    id: "self_meal_1",
    title: "Clean Eating Plan",
    type: "meal",
    vertical: "amber",
    daysCompleted: 10,
    totalDays: 28,
    exercises: [
      { name: "Breakfast: Oats + berries + whey protein", sets: "350 kcal", done: false },
      { name: "Mid-morning: Greek yoghurt + mixed nuts", sets: "200 kcal", done: false },
      { name: "Lunch: Grilled chicken + brown rice + steamed veg", sets: "500 kcal", done: false },
      { name: "Afternoon: Protein shake + banana", sets: "250 kcal", done: false },
      { name: "Dinner: Grilled fish + sweet potato + salad", sets: "450 kcal", done: false },
      { name: "Water intake: 2.5 litres minimum", sets: "all day", done: false },
    ],
    createdBy: "self",
    sharedWith: [],
    schedule: "Daily",
  });

  // Wellness: Mindfulness routine (self-created)
  routines.push({
    id: "self_wellness_1",
    title: "Daily Mindfulness",
    type: "wellness",
    vertical: "indigo",
    daysCompleted: 7,
    totalDays: 30,
    exercises: [
      { name: "Morning gratitude journaling", sets: "5 min", done: false },
      { name: "Box breathing (4-4-4-4)", sets: "3 rounds", done: false },
      { name: "Guided meditation", sets: "10 min", done: false },
      { name: "Mindful walk (no phone)", sets: "15 min", done: false },
      { name: "Evening mood log + reflection", sets: "5 min", done: false },
    ],
    createdBy: "self",
    sharedWith: [],
    schedule: "Daily",
  });

  // Beauty: Full beauty routine
  if (bp) {
    routines.push({
      id: "assigned_beauty_2",
      title: "Weekly Beauty Routine",
      type: "beauty",
      provider: bp.name,
      providerId: bp.id,
      providerImage: bp.image,
      vertical: "coral",
      daysCompleted: 2,
      totalDays: 30,
      exercises: [
        { name: "Deep cleansing facial wash", sets: "AM + PM", done: false },
        { name: "Clay mask (detox)", sets: "1× per week", done: false },
        { name: "Hair mask / deep conditioning", sets: "1× per week", done: false },
        { name: "Body scrub (exfoliate)", sets: "2× per week", done: false },
        { name: "Manicure maintenance", sets: "1× per week", done: false },
        { name: "Full body moisturiser", sets: "After shower", done: false },
      ],
      createdBy: "provider",
      sharedWith: [bp.id],
      schedule: "Weekly",
    });
  }

  // Medical: Medication routine
  if (mp) {
    routines.push({
      id: "assigned_4",
      title: "Medication & Supplement Schedule",
      type: "medication",
      provider: mp.name,
      providerId: mp.id,
      providerImage: mp.image,
      vertical: "indigo",
      daysCompleted: 12,
      totalDays: 90,
      exercises: [
        { name: "Multivitamin", sets: "1 tab, AM with food", done: false },
        { name: "Omega-3 fish oil", sets: "1 cap, AM", done: false },
        { name: "Vitamin D3 (1000 IU)", sets: "1 tab, AM", done: false },
        { name: "Magnesium glycinate", sets: "1 tab, PM", done: false },
        { name: "Probiotic", sets: "1 cap, before bed", done: false },
      ],
      createdBy: "provider",
      sharedWith: [mp.id],
      schedule: "Daily",
    });
  }

  return routines;
}

const typeIcon: Record<string, React.ReactNode> = {
  workout:    <Dumbbell className="w-4 h-4" />,
  cardio:     <Activity className="w-4 h-4" />,
  rehab:      <Stethoscope className="w-4 h-4" />,
  meal:       <Apple className="w-4 h-4" />,
  skincare:   <span className="text-sm">✨</span>,
  medication: <Pill className="w-4 h-4" />,
  wellness:   <Heart className="w-4 h-4" />,
  beauty:     <span className="text-sm">💅</span>,
  custom:     <Flame className="w-4 h-4" />,
};

const typeLabel: Record<string, string> = {
  workout: "Workout", cardio: "Cardio", rehab: "Rehab", meal: "Meal Plan", skincare: "Skincare", medication: "Medication", wellness: "Wellness", beauty: "Beauty", custom: "Custom",
};

// Per-type vocabulary so the Create Routine form copy matches the
// selected type. Without this, a Meal Plan was shown next to "Customise
// exercises →" and the placeholder said "e.g. Morning Strength, Evening
// Yoga" — both wrong context (reported 2026-05-04 by Lee).
const typeVocab: Record<string, { placeholder: string; itemNoun: string }> = {
  workout:    { placeholder: "e.g. Morning Strength, Evening Yoga, Parkrun, 5km Run, Cycling Plan",
                itemNoun: "exercises" },
  cardio:     { placeholder: "e.g. Half-Marathon Training, Trail Hikes, Open-Water Swim",
                itemNoun: "sessions" },
  rehab:      { placeholder: "e.g. Knee Recovery, Post-op Shoulder, Lower Back Programme",
                itemNoun: "movements" },
  meal:       { placeholder: "e.g. High-Protein Week, Mediterranean Plan, Vegan 28-Day",
                itemNoun: "meals" },
  skincare:   { placeholder: "e.g. AM Routine, Evening Glow, Acne Care",
                itemNoun: "steps" },
  medication: { placeholder: "e.g. Morning Pills, Antibiotic Course, Vitamin Stack",
                itemNoun: "medications" },
  wellness:   { placeholder: "e.g. 21-Day Mindfulness, Breathwork, Meditation",
                itemNoun: "practices" },
  beauty:     { placeholder: "e.g. Hair Care, Spa Routine, Self-Care Sunday",
                itemNoun: "rituals" },
  custom:     { placeholder: "e.g. My Routine — anything you do regularly",
                itemNoun: "items" },
};

const STORAGE_KEY = "bion_routines";

/* ── Component ──────────────────────────────────────── */
export default function Routines() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings } = useBookings();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  // Providers the user has actually booked with — the only providers it
  // makes sense to share routine data with. Pre-fix this dropdown was
  // dumping the first 6 entries of the global directory, which surfaced
  // random gyms and salons the user had never interacted with as
  // share targets — confusing and a privacy footgun.
  const myProviders = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; image: string }>();
    for (const b of bookings) {
      if (!b.providerId || seen.has(b.providerId)) continue;
      seen.set(b.providerId, {
        id: b.providerId,
        name: b.providerName ?? "Provider",
        image: b.providerImage ?? getProviderImage(b.providerId, b.providerName ?? "Provider"),
      });
    }
    return Array.from(seen.values());
  }, [bookings]);

  const isDemo = user?.id?.startsWith("demo_") ?? false;

  // Sync routines with Supabase (authenticated users) or localStorage (demo)
  const { routines: ownRoutines, setRoutines, addRoutine: syncAddRoutine, deleteRoutine: syncDeleteRoutine, loading: routinesLoading } = useRoutinesSync();
  // Provider-assigned programmes (from client_programs join programs)
  const { programs: assignedPrograms } = useMyPrograms();

  // Merge provider-assigned programs in front of own/self-created routines
  const routines = useMemo(() => {
    const fromAssigned: Routine[] = assignedPrograms.map((p): Routine => ({
      id: `assigned_${p.id}`,
      title: p.title,
      type: p.type,
      provider: p.provider_name ?? undefined,
      providerId: p.provider_id ?? undefined,
      providerImage: p.provider_avatar ?? undefined,
      vertical: p.vertical,
      daysCompleted: p.days_completed,
      totalDays: p.total_days,
      exercises: p.exercises.map(e => ({
        name: e.name,
        sets: e.sets ?? e.duration ?? "",
        done: false,
      })),
      createdBy: "provider",
      sharedWith: p.provider_id ? [p.provider_id] : [],
      schedule: p.schedule ?? "Daily",
    }));
    return [...fromAssigned, ...ownRoutines];
  }, [assignedPrograms, ownRoutines]);

  // Seed demo accounts with sample data if no real or assigned routines
  useEffect(() => {
    if (isDemo && ownRoutines.length === 0 && assignedPrograms.length === 0) {
      setRoutines(buildSampleRoutines());
    }
  }, [isDemo, ownRoutines.length, assignedPrograms.length]);

  const [expanded, setExpanded] = useState<string | null>(routines[0]?.id ?? null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  // Active workout session — `startedAt` is the unix-ms when the user
  // tapped Start Session. The button below shows live elapsed time and
  // toggles to "End" until the user taps again. Persisted to localStorage
  // so a refresh mid-session doesn't lose the timer.
  type ActiveSession = { routineId: string; startedAt: number };
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(() => {
    try {
      const raw = localStorage.getItem("bion_routine_active_session");
      return raw ? JSON.parse(raw) as ActiveSession : null;
    } catch { return null; }
  });
  // Force re-render once a second while a session is running, so the
  // elapsed clock on the button ticks. We don't put elapsed in state
  // because that thrashes the whole component tree — cheaper to nudge.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!activeSession) return;
    const id = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [activeSession]);
  useEffect(() => {
    try {
      if (activeSession) localStorage.setItem("bion_routine_active_session", JSON.stringify(activeSession));
      else localStorage.removeItem("bion_routine_active_session");
    } catch { /* */ }
  }, [activeSession]);
  const [showCreate, setShowCreate] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "self" | "provider">("all");
  // Import-routine state — paste text or upload a photo of an existing
  // programme; B_ extracts items into customExercises so the user
  // doesn't have to type every line. Reported 2026-04-28: 'Should you
  // be able to upload routine.'
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  // Honour ?create=<type> from the URL so deep-links from other tiles
  // (e.g. Hub → Medication tile points at /routines?create=medication)
  // arrive on the Create modal pre-set to the right type instead of
  // dumping the user on the Workout default. Reported 2026-05-04 — Lee
  // tapped Medication and ended up filling out a fitness routine form.
  const [searchParams, setSearchParams] = useSearchParams();
  const createIntent = searchParams.get("create") as Routine["type"] | null;
  const VALID_TYPES: Routine["type"][] = ["workout","cardio","rehab","meal","skincare","medication","wellness","beauty","custom"];
  const initialType: Routine["type"] = createIntent && VALID_TYPES.includes(createIntent) ? createIntent : "workout";

  // New routine form
  const [newRoutine, setNewRoutine] = useState({
    title: "",
    type: initialType,
    schedule: "",
    totalDays: 28,
  });

  // Auto-open the Create modal when arriving with ?create=… , then strip
  // the param so a back-navigation doesn't re-open it.
  useEffect(() => {
    if (createIntent && VALID_TYPES.includes(createIntent)) {
      setShowCreate(true);
      const next = new URLSearchParams(searchParams);
      next.delete("create");
      setSearchParams(next, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Start empty so the user builds their own routine. The template
  // shows up as tappable suggestion chips below — Oko was rightly
  // angry 2026-05-12 about me pre-selecting all 5 cardio activities
  // and forcing him to delete the ones he didn't want.
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [newExName, setNewExName] = useState("");
  const [newExSets, setNewExSets] = useState("");
  // Validation flags painted onto inputs after a failed Create attempt.
  // Cleared the moment the user starts typing in the offending field.
  const [createErrors, setCreateErrors] = useState<{ title?: boolean; schedule?: boolean }>({});

  const toggle = (routineId: string, idx: number) => {
    const key = `${routineId}-${idx}`;
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const deleteRoutine = (id: string) => {
    syncDeleteRoutine(id);
    if (expanded === id) setExpanded(null);
  };

  const toggleShare = (routineId: string, providerId: string) => {
    setRoutines(prev => prev.map(r => {
      if (r.id !== routineId) return r;
      const shared = r.sharedWith.includes(providerId)
        ? r.sharedWith.filter(id => id !== providerId)
        : [...r.sharedWith, providerId];
      return { ...r, sharedWith: shared };
    }));
  };

  const formatElapsed = (ms: number): string => {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const toggleSession = (routineId: string) => {
    if (activeSession?.routineId === routineId) {
      // End: log the session locally so the user has a history. Backend
      // sync can layer in later via a routine_sessions table; for now
      // localStorage is enough to prove time was tracked.
      const endedAt = Date.now();
      const durationSec = Math.round((endedAt - activeSession.startedAt) / 1000);
      try {
        const raw = localStorage.getItem("bion_routine_sessions");
        const log = raw ? JSON.parse(raw) as Array<any> : [];
        log.push({
          routineId,
          startedAt: activeSession.startedAt,
          endedAt,
          durationSec,
          date: new Date(activeSession.startedAt).toISOString().slice(0, 10),
        });
        localStorage.setItem("bion_routine_sessions", JSON.stringify(log.slice(-500)));
      } catch { /* */ }
      setActiveSession(null);
    } else if (activeSession) {
      // Another session already running — refuse rather than silently
      // dropping its time. User has to end it first.
      const elapsed = formatElapsed(Date.now() - activeSession.startedAt);
      alert(`Another routine session is running (${elapsed}). End it before starting a new one.`);
    } else {
      setActiveSession({ routineId, startedAt: Date.now() });
    }
  };

  const handleCreateRoutine = () => {
    // Inline validation. Button is always tappable now — pressing it with
    // missing fields highlights them in red instead of silently no-op'ing
    // (which read as "the button is broken").
    const errs: { title?: boolean; schedule?: boolean } = {};
    if (!newRoutine.title.trim())    errs.title = true;
    if (!newRoutine.schedule.trim()) errs.schedule = true;
    if (errs.title || errs.schedule) {
      setCreateErrors(errs);
      return;
    }
    const exercises = customExercises.length > 0
      ? customExercises
      : EXERCISE_TEMPLATES[newRoutine.type] ?? [];
    const routine: Routine = {
      id: `self_${Date.now()}`,
      title: newRoutine.title.trim(),
      type: newRoutine.type,
      vertical: newRoutine.type === "workout" || newRoutine.type === "cardio" ? "teal" : newRoutine.type === "rehab" || newRoutine.type === "medication" ? "indigo" : newRoutine.type === "meal" ? "amber" : newRoutine.type === "wellness" ? "indigo" : "coral",
      daysCompleted: 0,
      totalDays: newRoutine.totalDays,
      exercises,
      createdBy: "self",
      sharedWith: [],
      schedule: newRoutine.schedule || undefined,
    };
    syncAddRoutine(routine);
    setNewRoutine({ title: "", type: "workout", schedule: "", totalDays: 28 });
    setCustomExercises([]);
    setCreateErrors({});
    setShowCreate(false);
    setExpanded(routine.id);
  };

  const addCustomExercise = () => {
    if (!newExName.trim()) return;
    setCustomExercises(prev => [...prev, { name: newExName.trim(), sets: newExSets.trim() || "—", done: false }]);
    setNewExName("");
    setNewExSets("");
  };

  // Send pasted text or a photo to /api/routines/extract; on success
  // append the extracted items into customExercises so the user can
  // review + edit before saving the routine. Best-effort; failures
  // don't break the dialog.
  // AbortController so the user can Cancel mid-extraction. Without
  // this the user was locked in the modal indefinitely if the backend
  // (or its OpenAI upstream) hung — Cancel was also disabled while
  // importing=true. Reported 2026-05-04 — a "Parkrun every Saturday
  // 5km" import got stuck on "Reading… / Extracting…" forever.
  const importAbortRef = useRef<AbortController | null>(null);
  const runImport = async (opts: { text?: string; imageDataUrl?: string; documentDataUrl?: string; documentFilename?: string }) => {
    setImporting(true);
    importAbortRef.current = new AbortController();
    // Hard 60-second cap — if the backend hasn't responded by then the
    // call is dead. Better to fail fast than nag the user with a
    // never-ending spinner.
    const timeoutId = setTimeout(() => importAbortRef.current?.abort(), 60_000);
    try {
      const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { toast } = await import("sonner");
        toast.error("Sign in to import a routine");
        return;
      }
      const res = await fetch(`${API}/api/routines/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ ...opts, routineType: newRoutine.type }),
        signal: importAbortRef.current.signal,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Extraction failed");
      const items: Array<{ name: string; sets: string }> = json.data?.items ?? [];
      if (items.length === 0) {
        const { toast } = await import("sonner");
        toast.error("Couldn't find any items to import. Try cleaner text or a sharper photo.");
        return;
      }
      setCustomExercises(prev => [
        ...prev,
        ...items.map(i => ({ name: i.name, sets: i.sets, done: false })),
      ]);
      // Auto-fill the create-routine form fields from inferred metadata
      // so the user doesn't have to retype what's already on the photo
      // they just snapped. They can still edit any field before saving.
      const inferredTitle = String(json.data?.title ?? "").trim();
      const inferredType  = String(json.data?.type ?? "").trim();
      const inferredSched = String(json.data?.schedule ?? "").trim();
      const inferredDays  = Number(json.data?.totalDays);
      setNewRoutine(prev => ({
        title:     prev.title.trim() ? prev.title : inferredTitle,
        type:      (["workout","cardio","rehab","meal","skincare","medication","wellness","beauty","custom"].includes(inferredType) ? inferredType : prev.type) as Routine["type"],
        schedule:  prev.schedule.trim() ? prev.schedule : inferredSched,
        totalDays: Number.isFinite(inferredDays) && inferredDays >= 7 && inferredDays <= 365 ? inferredDays : prev.totalDays,
      }));
      const { toast } = await import("sonner");
      toast.success(`Imported ${items.length} item${items.length === 1 ? "" : "s"}${inferredTitle ? ` for "${inferredTitle}"` : ""}. Review before saving.`);
      setShowImport(false);
      setImportText("");
    } catch (err: any) {
      const { toast } = await import("sonner");
      if (err?.name === "AbortError") {
        toast.error("Import cancelled");
      } else {
        toast.error(err?.message ?? "Import failed");
      }
    } finally {
      clearTimeout(timeoutId);
      importAbortRef.current = null;
      setImporting(false);
    }
  };

  /** Abort an in-flight import — wired to the Cancel button so the
   *  user is never locked in a hung extraction. */
  const cancelImport = useCallback(() => {
    importAbortRef.current?.abort();
    setImporting(false);
    setShowImport(false);
  }, []);

  const importFile = async (file: File) => {
    const MAX_BYTES = 20 * 1024 * 1024; // 20 MB upper bound
    if (file.size > MAX_BYTES) {
      const { toast } = await import("sonner");
      toast.error("File too large (max 20 MB)");
      return;
    }
    const name = file.name.toLowerCase();
    const isText = file.type.startsWith("text/")
      || /\.(txt|md|markdown|csv|log)$/i.test(name);
    const isPdf  = file.type === "application/pdf" || /\.pdf$/i.test(name);
    const isImage = file.type.startsWith("image/");

    if (isText) {
      const text = await file.text();
      await runImport({ text: text.slice(0, 10_000) });
      return;
    }
    if (isImage) {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(file);
      });
      await runImport({ imageDataUrl: dataUrl });
      return;
    }
    if (isPdf) {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read PDF"));
        reader.readAsDataURL(file);
      });
      await runImport({ documentDataUrl: dataUrl, documentFilename: file.name });
      return;
    }
    const { toast } = await import("sonner");
    toast.error("Unsupported file. Use a photo, PDF, or text file.");
  };
  // Back-compat alias
  const importPhoto = importFile;

  const filtered = routines.filter(r =>
    filter === "all" ? true : filter === "self" ? r.createdBy === "self" : r.createdBy === "provider"
  );

  const assignedCount = routines.filter(r => r.createdBy === "provider").length;
  const selfCount = routines.filter(r => r.createdBy === "self").length;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 pt-20 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{firstName}'s Routines</h1>
            <p className="text-xs text-muted-foreground">
              {routines.length === 0 ? "No active routines" : `${assignedCount} assigned · ${selfCount} personal`}
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal to-emerald-400 flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </motion.button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {([
            { key: "all", label: "All" },
            { key: "provider", label: "From Providers" },
            { key: "self", label: "My Routines" },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-pill text-xs font-medium border transition-all ${
                filter === f.key
                  ? "border-teal/40 bg-teal/10 text-teal"
                  : "border-white/08 text-muted-foreground"
              }`} title="setFilter(f.key)} className= `}>" aria-label="setFilter(f.key)} className= `}>">
              {f.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <GlassCard className="p-8 text-center">
            <Dumbbell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              {filter === "provider" ? "No routines from providers yet" : filter === "self" ? "No personal routines yet" : "No routines yet"}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {filter === "provider"
                ? "Routines assigned by your providers will appear here."
                : "Create your own routine or get one assigned by a provider."}
            </p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-pill text-xs font-semibold bg-gradient-to-r from-teal to-emerald-400 text-white">
              <Plus className="w-3 h-3 inline mr-1" /> Create Routine
            </motion.button>
          </GlassCard>
        )}

        {/* Routine cards */}
        {filtered.map((r, ri) => {
          const isOpen = expanded === r.id;
          const completedCount = r.exercises.filter((_, ei) =>
            checked[`${r.id}-${ei}`]
          ).length;
          const pct = r.exercises.length > 0 ? Math.round((completedCount / r.exercises.length) * 100) : 0;

          return (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ri * 0.05 }}>
              <GlassCard className="overflow-hidden">
                {/* Card header */}
                <button onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full p-4 flex items-center gap-3 text-left" title="setExpanded(isOpen ? null : r.id)} className='w-full p-4 flex items-center ga…" aria-label="setExpanded(isOpen ? null : r.id)} className='w-full p-4 flex items-center ga…">
                  {r.providerImage ? (
                    <img src={r.providerImage} alt={r.provider} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10 shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      r.vertical === "teal" ? "bg-teal/20" : r.vertical === "indigo" ? "bg-indigo/20" : r.vertical === "coral" ? "bg-coral/20" : "bg-amber/20"
                    }`}>
                      {typeIcon[r.type]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-${r.vertical}`}>{typeIcon[r.type]}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{typeLabel[r.type]}</span>
                      {r.createdBy === "self" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber/10 text-amber border border-amber/20 ml-1">Personal</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.provider && <p className="text-[10px] text-muted-foreground">{r.provider}</p>}
                      {r.schedule && (
                        <span className="flex items-center gap-0.5 text-[10px] text-teal">
                          <Calendar className="w-2.5 h-2.5" /> {r.schedule}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-data text-foreground">{pct}%</p>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform mt-0.5 ${isOpen ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {/* Progress bar */}
                <div className="px-4 pb-3">
                  <div className="w-full h-1 rounded-full bg-white/5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        r.vertical === "teal" ? "gradient-teal" : r.vertical === "indigo" ? "gradient-indigo" :
                        r.vertical === "coral" ? "gradient-coral" : "gradient-amber"
                      }`} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-muted-foreground">{completedCount}/{r.exercises.length} done</span>
                    <span className="text-[9px] text-muted-foreground">Day {r.daysCompleted}/{r.totalDays}</span>
                  </div>
                </div>

                {/* Expanded section */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="border-t border-white/5 px-4 py-3 space-y-2">
                        {r.exercises.map((ex, ei) => {
                          const key = `${r.id}-${ei}`;
                          const isDone = !!checked[key];
                          return (
                            <motion.button key={ei} whileTap={{ scale: 0.98 }}
                              onClick={() => toggle(r.id, ei)}
                              className="w-full flex items-center gap-3 py-1.5 text-left">
                              {isDone
                                ? <CheckCircle className={`w-4 h-4 shrink-0 text-${r.vertical}`} />
                                : <Circle className="w-4 h-4 shrink-0 text-muted-foreground" />}
                              <span className={`flex-1 text-xs ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {ex.name}
                              </span>
                              {ex.sets && <span className="text-[10px] font-data text-muted-foreground shrink-0">{ex.sets}</span>}
                            </motion.button>
                          );
                        })}

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-3 pt-2 border-t border-white/5">
                          {r.type === "workout" && (() => {
                            const isThisActive  = activeSession?.routineId === r.id;
                            const isOtherActive = activeSession && !isThisActive;
                            const elapsedMs     = isThisActive ? Date.now() - activeSession.startedAt : 0;
                            return (
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={() => toggleSession(r.id)}
                                disabled={isOtherActive ?? false}
                                className={`flex-1 rounded-pill py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                                  isThisActive
                                    ? "glass-accent-teal text-teal border border-teal/40"
                                    : isOtherActive
                                      ? "glass-1 text-muted-foreground opacity-60"
                                      : "gradient-teal text-obsidian"
                                }`}>
                                {isThisActive
                                  ? <><span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" /> End · {formatElapsed(elapsedMs)}</>
                                  : isOtherActive
                                    ? <>Another session running</>
                                    : <><Play className="w-3.5 h-3.5" /> Start Session</>}
                              </motion.button>
                            );
                          })()}
                          <button onClick={() => setShowPrivacy(showPrivacy === r.id ? null : r.id)}
                            className="px-3 py-2 rounded-pill text-xs glass-1 text-muted-foreground flex items-center gap-1.5 hover:text-foreground transition-colors" title="setShowPrivacy(showPrivacy === r.id ? null : r.id)} className='px-3 py-2 roun…" aria-label="setShowPrivacy(showPrivacy === r.id ? null : r.id)} className='px-3 py-2 roun…">
                            <Shield className="w-3 h-3" /> Privacy
                          </button>
                          {r.createdBy === "self" && (
                            <button onClick={() => deleteRoutine(r.id)}
                              className="px-3 py-2 rounded-pill text-xs glass-1 text-coral/70 flex items-center gap-1.5 hover:text-coral transition-colors" title="deleteRoutine(r.id)} className='px-3 py-2 rounded-pill text-xs glass-1 text-c…" aria-label="deleteRoutine(r.id)} className='px-3 py-2 rounded-pill text-xs glass-1 text-c…">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Privacy controls */}
                        <AnimatePresence>
                          {showPrivacy === r.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="mt-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                                  <Shield className="w-3 h-3 inline mr-1" /> Who can see this routine
                                </p>
                                {myProviders.length === 0 ? (
                                  <div className="text-xs text-muted-foreground py-2">
                                    No providers yet. Book a session and that provider will appear here so you can share routine progress with them.
                                    <button onClick={() => navigate("/directory")} className="block mt-2 text-teal underline-offset-2 hover:underline" title="navigate('/directory')} className='block mt-2 text-teal underline-offset-2 ho…" aria-label="navigate('/directory')} className='block mt-2 text-teal underline-offset-2 ho…">
                                      Browse the directory →
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {myProviders.map(prov => {
                                      const isShared = r.sharedWith.includes(prov.id);
                                      return (
                                        <button key={prov.id} onClick={() => toggleShare(r.id, prov.id)}
                                          className="w-full flex items-center gap-2.5 py-1.5 text-left" title="toggleShare(r.id, prov.id)} className='w-full flex items-center gap-2.5 py-1.…" aria-label="toggleShare(r.id, prov.id)} className='w-full flex items-center gap-2.5 py-1.…">
                                          <img src={prov.image} alt={prov.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                                          <span className="flex-1 text-xs text-foreground truncate">{prov.name}</span>
                                          {isShared
                                            ? <Eye className="w-3.5 h-3.5 text-teal shrink-0" />
                                            : <EyeOff className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                                        </button>
                                      );
                                    })}
                                    <p className="text-[9px] text-muted-foreground mt-1">
                                      Only providers you've booked with appear here. Tap to toggle sharing.
                                    </p>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          );
        })}

        {/* B_ nudge */}
        {routines.length > 0 && (
          <GlassCard variant="accent-indigo" className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✦</span>
              <div>
                <p className="text-sm font-medium text-foreground">Coach Tip</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Consistency beats intensity. Complete today's routine and you'll be one step closer to your goals. 💪
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* ── Create Routine Sheet ──────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div key="create-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowCreate(false); setCreateErrors({}); }} className="fixed inset-0 bg-obsidian/60 z-[60]" />
            <motion.div key="create-sheet"
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] p-5 max-h-[85vh] overflow-y-auto"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Create Routine</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowImport(true)}
                    className="text-[10px] px-2.5 py-1 bg-indigo/15 text-indigo rounded-pill border border-indigo/30 flex items-center gap-1.5 hover:bg-indigo/25 transition-colors"
                   title="setShowImport(true)} className='text-[10px] px-2.5 py-1 bg-indigo/15 text-ind…" aria-label="setShowImport(true)} className='text-[10px] px-2.5 py-1 bg-indigo/15 text-ind…">
                    <Sparkles className="w-3 h-3" /> Import
                  </button>
                  <button onClick={() => { setShowCreate(false); setCreateErrors({}); }}
                    className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground" title="); }} className='w-8 h-8 glass-1 rounded-full flex items-center justify-cente…" aria-label="); }} className='w-8 h-8 glass-1 rounded-full flex items-center justify-cente…">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className={`text-[10px] uppercase tracking-wider mb-1 block ${createErrors.title ? "text-coral" : "text-muted-foreground"}`}>
                    Routine Name *{createErrors.title && <span className="ml-1 normal-case tracking-normal">— required</span>}
                  </label>
                  <input value={newRoutine.title}
                    onChange={e => {
                      setNewRoutine(prev => ({ ...prev, title: e.target.value }));
                      if (createErrors.title) setCreateErrors(prev => ({ ...prev, title: undefined }));
                    }}
                    placeholder={typeVocab[newRoutine.type]?.placeholder ?? "e.g. Morning Strength, Evening Yoga, 5km Run, Parkrun, Cycling Plan, Hike"}
                    className={`w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border transition-colors ${
                      createErrors.title ? "border-coral/60 focus:border-coral" : "border-white/08 focus:border-teal/40"
                    }`} />
                </div>

                {/* Type */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Type</label>
                  <div className="flex gap-2 flex-wrap">
                    {(["workout", "cardio", "rehab", "meal", "skincare", "medication", "wellness", "beauty", "custom"] as const).map(t => (
                      <button key={t} onClick={() => {
                        // Type chip = category hint only. Clears the
                        // user's selections so suggestions for the
                        // new type show fresh; the user builds their
                        // own routine by tapping suggestion chips.
                        if (t !== newRoutine.type) setCustomExercises([]);
                        setNewRoutine(prev => ({ ...prev, type: t }));
                      }}
                        className={`px-3 py-1.5 rounded-pill text-xs font-medium border flex items-center gap-1.5 transition-all ${
                          newRoutine.type === t
                            ? "border-teal/40 bg-teal/10 text-teal"
                            : "border-white/08 text-muted-foreground"
                        }`} title=")); }} className= `}>" aria-label=")); }} className= `}>">
                        {typeIcon[t]} {typeLabel[t]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider mb-1 block ${createErrors.schedule ? "text-coral" : "text-muted-foreground"}`}>
                      Schedule *{createErrors.schedule && <span className="ml-1 normal-case tracking-normal">— required</span>}
                    </label>
                    <input value={newRoutine.schedule}
                      onChange={e => {
                        setNewRoutine(prev => ({ ...prev, schedule: e.target.value }));
                        if (createErrors.schedule) setCreateErrors(prev => ({ ...prev, schedule: undefined }));
                      }}
                      placeholder="e.g. Mon, Wed, Fri"
                      className={`w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border transition-colors ${
                        createErrors.schedule ? "border-coral/60 focus:border-coral" : "border-white/08 focus:border-teal/40"
                      }`} />
                    {/* Quick-pick chips for common cadences. Chronic-med
                        users (Lee, 2026-05-11) wanted a one-tap "Daily"
                        instead of typing "Mon, Tue, Wed, Thu, Fri, Sat, Sun". */}
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {["Daily", "Weekdays", "Mon, Wed, Fri", "Weekends"].map(s => (
                        <button key={s} type="button"
                          onClick={() => {
                            setNewRoutine(prev => ({ ...prev, schedule: s }));
                            if (createErrors.schedule) setCreateErrors(prev => ({ ...prev, schedule: undefined }));
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] border transition-colors ${
                            newRoutine.schedule === s
                              ? "border-teal/40 bg-teal/10 text-teal"
                              : "border-white/08 text-muted-foreground hover:text-foreground"
                          }`} title=")); if (createErrors.schedule) setCreateErrors(prev => ( )); }} className= `}>" aria-label=")); if (createErrors.schedule) setCreateErrors(prev => ( )); }} className= `}>">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Duration</label>
                    {/* totalDays = 9999 is the sentinel for "Ongoing" —
                        used by chronic medications, lifelong wellness
                        programmes, etc. The display layer renders it as
                        "Ongoing" instead of "9999 days". */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { d: 28,   label: "28d" },
                        { d: 90,   label: "90d" },
                        { d: 180,  label: "6 mo" },
                        { d: 365,  label: "1 yr" },
                        { d: 730,  label: "2 yr" },
                        { d: 9999, label: "Ongoing" },
                      ].map(({ d, label }) => (
                        <button key={d} onClick={() => setNewRoutine(prev => ({ ...prev, totalDays: d }))}
                          className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                            newRoutine.totalDays === d ? "border-teal/40 bg-teal/10 text-teal" : "border-white/08 text-muted-foreground"
                          }`} title="setNewRoutine(prev => ( ))} className= `}>" aria-label="setNewRoutine(prev => ( ))} className= `}>">
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* User-built list. Starts empty. Suggestion chips below
                    are TAPPABLE — tap once to add, tap × on the activity
                    to remove. The user controls what's in their routine.
                    Reported 2026-05-12 by Oko: "the whole fucking point
                    is to be able to determine my own schedule". */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Your {typeVocab[newRoutine.type]?.itemNoun ?? "activities"}
                  </label>

                  <div className="space-y-2">
                    {customExercises.length === 0 ? (
                      <div className="p-3 rounded-xl border border-dashed border-white/[0.08] text-center">
                        <p className="text-[11px] text-muted-foreground">Nothing added yet. Tap a suggestion below or type your own.</p>
                      </div>
                    ) : (
                      customExercises.map((ex, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-white/[0.03]">
                          <CheckCircle className="w-3 h-3 text-teal shrink-0" />
                          <span className="flex-1 text-foreground">{ex.name}</span>
                          <span className="text-[10px] text-muted-foreground">{ex.sets}</span>
                          <button onClick={() => setCustomExercises(prev => prev.filter((_, j) => j !== i))}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-coral/60 hover:text-coral hover:bg-coral/10"
                            aria-label={`Remove ${ex.name}`} title="setCustomExercises(prev => prev.filter((_, j) => j !== i))} className='w-6 h-…">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}

                    {/* Suggestion chips — tap to add. Greyed out once
                        already in the list so the user doesn't double-add
                        by accident. Hidden for `custom` because there are
                        no preset suggestions for that type. */}
                    {newRoutine.type !== "custom" && (EXERCISE_TEMPLATES[newRoutine.type]?.length ?? 0) > 0 && (
                      <div className="pt-1">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">Suggestions — tap to add</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {(EXERCISE_TEMPLATES[newRoutine.type] ?? []).map(sug => {
                            const already = customExercises.some(ex => ex.name.toLowerCase() === sug.name.toLowerCase());
                            return (
                              <button key={sug.name} type="button"
                                disabled={already}
                                onClick={() => setCustomExercises(prev => [...prev, { ...sug }])}
                                className={`px-2.5 py-1.5 rounded-full text-[11px] border transition-colors ${
                                  already
                                    ? "border-white/04 text-muted-foreground/40 cursor-not-allowed"
                                    : "border-white/08 text-foreground hover:border-teal/40 hover:bg-teal/10 hover:text-teal"
                                }`} title="setCustomExercises(prev => [...prev, ])} className= `}> ·" aria-label="setCustomExercises(prev => [...prev, ])} className= `}> ·">
                                {already ? "✓ " : "+ "}{sug.name} <span className="opacity-50">· {sug.sets}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Custom add */}
                    <div className="flex gap-2 pt-1">
                      <input value={newExName} onChange={e => setNewExName(e.target.value)}
                        placeholder={
                          newRoutine.type === "meal" ? "Or type a meal name…"
                          : newRoutine.type === "medication" ? "Or type a medication…"
                          : newRoutine.type === "skincare" ? "Or type a step…"
                          : newRoutine.type === "wellness" ? "Or type a practice…"
                          : newRoutine.type === "beauty" ? "Or type a ritual…"
                          : newRoutine.type === "rehab" ? "Or type a movement…"
                          : newRoutine.type === "cardio" ? "Or type an activity…"
                          : newRoutine.type === "custom" ? "Item name"
                          : "Or type an exercise…"
                        }
                        onKeyDown={e => e.key === "Enter" && addCustomExercise()}
                        className="flex-1 px-3 py-2 glass-1 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/08" />
                      <input value={newExSets} onChange={e => setNewExSets(e.target.value)}
                        placeholder={
                          newRoutine.type === "meal" ? "kcal"
                          : newRoutine.type === "medication" ? "Dose"
                          : newRoutine.type === "skincare" || newRoutine.type === "beauty" ? "Freq"
                          : newRoutine.type === "wellness" ? "Min"
                          : newRoutine.type === "workout" ? "Sets"
                          : newRoutine.type === "cardio" ? "Time"
                          : "Reps"
                        }
                        onKeyDown={e => e.key === "Enter" && addCustomExercise()}
                        className="w-20 px-3 py-2 glass-1 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/08" />
                      <button onClick={addCustomExercise}
                        disabled={!newExName.trim()}
                        aria-label={newExName.trim() ? "Add" : "Type a name first"}
                        title={newExName.trim() ? "Add" : "Type a name first"}
                        className="w-9 h-9 rounded-xl bg-teal/20 text-teal flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer actions — Cancel beside Create so the user has a
                  clear exit even if they overlook the X at the top.
                  Reported 2026-05-12 by Oko: "I need to be able to exit
                  routine edit mode". */}
              <div className="flex gap-2 mt-5">
                <button onClick={() => { setShowCreate(false); setCreateErrors({}); }}
                  className="px-5 py-3 rounded-2xl text-sm font-semibold text-muted-foreground bg-white/[0.03] border border-white/[0.08] hover:text-foreground hover:bg-white/[0.06] transition-colors" title="); }} className='px-5 py-3 rounded-2xl text-sm font-semibold text-muted-foreg…" aria-label="); }} className='px-5 py-3 rounded-2xl text-sm font-semibold text-muted-foreg…">
                  Cancel
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateRoutine}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-teal to-emerald-400 transition-opacity">
                  Create Routine
                </motion.button>
              </div>
              {(createErrors.title || createErrors.schedule) && (
                <p className="text-[11px] text-coral text-center mt-2">
                  Fill in the highlighted field{createErrors.title && createErrors.schedule ? "s" : ""} to continue.
                </p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Import-routine sub-sheet — paste text or scan a photo of an
          existing programme and let B_ extract the items into the
          customExercises list of the parent Create Routine modal.
          Reported 2026-04-28: typing every line was the friction. */}
      <AnimatePresence>
        {showImport && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => importing ? cancelImport() : setShowImport(false)}
              className="fixed inset-0 bg-obsidian/70 z-[80]" />
            <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="glass-popover fixed bottom-0 left-0 right-0 z-[90] rounded-t-[2rem] p-5 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo" />
                  <h3 className="text-lg font-bold text-foreground">Import routine</h3>
                </div>
                <button onClick={() => importing ? cancelImport() : setShowImport(false)}
                  className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground" title="importing ? cancelImport() : setShowImport(false)} className='w-8 h-8 glass-1…" aria-label="importing ? cancelImport() : setShowImport(false)} className='w-8 h-8 glass-1…">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Paste your programme — or snap a photo, or upload a document (PDF, TXT, MD, CSV). B_ extracts the items and fills the form. You can edit each row before saving.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <label className="cursor-pointer rounded-pill px-3 py-2.5 text-xs font-semibold gradient-indigo text-primary-foreground flex items-center justify-center gap-1.5 shadow-cta">
                  {importing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Reading…</>
                  ) : (
                    <><Camera className="w-4 h-4" /> Scan / photo</>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={importing}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) importFile(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                <label className="cursor-pointer rounded-pill px-3 py-2.5 text-xs font-semibold glass-1 text-foreground flex items-center justify-center gap-1.5 border border-white/[0.08]">
                  <Sparkles className="w-4 h-4 text-indigo" /> Upload file
                  <input
                    type="file"
                    accept="application/pdf,.pdf,text/plain,.txt,text/markdown,.md,.markdown,text/csv,.csv,image/*"
                    disabled={importing}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) importFile(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={8}
                disabled={importing}
                placeholder={`Paste your programme. Examples:\n\nWarm-up 5 min\nSquats 4×12\nBench Press 4×10\n…\n\nor for meals:\nBreakfast: oats + berries — 350 kcal\nLunch: chicken + rice — 500 kcal`}
                className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] resize-none disabled:opacity-50"
              />

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => importing ? cancelImport() : setShowImport(false)}
                  className="flex-1 rounded-pill py-2.5 text-xs font-semibold glass-1 text-muted-foreground"
                 title="importing ? cancelImport() : setShowImport(false)} className='flex-1 rounded-…" aria-label="importing ? cancelImport() : setShowImport(false)} className='flex-1 rounded-…">
                  Cancel
                </button>
                <button
                  onClick={() => runImport({ text: importText.trim() })}
                  disabled={importing || !importText.trim()}
                  className="flex-[2] rounded-pill py-2.5 text-xs font-semibold gradient-indigo text-primary-foreground disabled:opacity-40"
                 title="runImport( )} disabled= className='flex-[2] rounded-pill py-2.5 text-xs font-…" aria-label="runImport( )} disabled= className='flex-[2] rounded-pill py-2.5 text-xs font-…">
                  {importing ? "Extracting…" : "Extract from text"}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                B_ runs gpt-4o-mini · stays inside your account
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BionAssistant />
      <BottomNav />
    </div>
  );
}
