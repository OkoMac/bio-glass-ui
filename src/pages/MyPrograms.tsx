import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getAuthHeaders } from "@/lib/authFetch";
import { ArrowLeft, CheckCircle, Loader2, Play, Calendar } from "lucide-react";

interface ProgramMeta {
  id: string;
  title: string;
  description: string | null;
  vertical: string;
  duration_days: number;
  price_rand: number;
  cover_image_url: string | null;
  provider_id: string;
}

interface Enrollment {
  id: string;
  program_id: string;
  client_id: string;
  provider_id: string;
  start_date: string;
  status: "awaiting_payment" | "active" | "completed" | "cancelled" | "refunded";
  days_completed: number;
  total_days: number;
  program: ProgramMeta;
}

interface ProgramDay {
  id: string;
  day_number: number;
  title: string;
  body_markdown: string;
  media_urls: string[];
}

interface ProgramDetail extends ProgramMeta {
  days: ProgramDay[];
}

const API = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://bion-backend.onrender.com";

async function authHeaders(): Promise<Record<string, string>> {
  try {
    return await getAuthHeaders();
  } catch {
    window.location.href = "/welcome?login=true";
    return { "Content-Type": "application/json" };
  }
}

// ── Progress ring ─────────────────────────────────────
function ProgressRing({ done, total, size = 56 }: { done: number; total: number; size?: number }) {
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="url(#ringGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${c * pct} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="11" fontWeight={600}>
        {done}/{total}
      </text>
    </svg>
  );
}

// ── Main list page at /my-programs ───────────────────
export default function MyPrograms() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enrollmentId } = useParams<{ enrollmentId?: string }>();

  // QA bug-mining 2026-04-28: hooks were declared AFTER the early-return
  // for enrollmentId, violating React's rules-of-hooks (different number
  // of hooks called depending on the route param). React would warn
  // loudly in dev and produce subtle wrong-state bugs in prod. Hoisted
  // above the early return — they're harmless to call on the detail
  // path because the component returns before the effects fire useful
  // work.
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Skip the fetch on the detail-mode path — the page early-returns
    // <MyProgramDay /> below and doesn't render the list view, so this
    // effect's setState would be a no-op anyway. Guard kept here so
    // the hook itself runs unconditionally (rules-of-hooks).
    if (enrollmentId) return;
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/programs/enrollments/me`, {
          headers: await authHeaders(),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to load");
        if (!cancelled) setRows(json.data as Enrollment[]);
      } catch (e: any) {
        // Demo users don't have real auth — suppress API errors silently
        if (!cancelled && !user?.id?.startsWith("demo_")) setErr(e.message ?? "Could not load your programs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, enrollmentId]);

  useEffect(() => {
    document.title = "My Programs — BION";
    return () => { document.title = "BION — Commit to Yourself"; };
  }, []);

  // Single-enrollment detail mode — early-returns AFTER all hooks have
  // been declared so the hook call order stays stable across renders.
  if (enrollmentId) {
    return <MyProgramDay enrollmentId={enrollmentId} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center text-foreground gap-3">
        <p className="text-sm font-semibold">Sign in to see your programs</p>
        <button onClick={() => navigate("/welcome?login=true")} className="rounded-pill px-4 py-2 gradient-indigo text-xs font-semibold text-white" title="navigate('/welcome?login=true')} className='rounded-pill px-4 py-2 gradient-i…" aria-label="navigate('/welcome?login=true')} className='rounded-pill px-4 py-2 gradient-i…">
          Sign up / Log in
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
      <div className="mx-auto max-w-2xl xl:max-w-3xl px-4 pt-20 space-y-5">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Programs</h1>
            <p className="text-xs text-muted-foreground">Day-by-day plans from your providers</p>
          </div>
        </div>

        {err && (
          <div className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
            {err}
          </div>
        )}

        {loading ? (
          <GlassCard className="p-8 text-center">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading your programs…</p>
          </GlassCard>
        ) : rows.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No programs yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Enroll in a provider's program to see it here.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {rows.map(r => (
              <EnrollmentCard key={r.id} enrollment={r} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const navigate = useNavigate();
  const nextDay = Math.min(enrollment.days_completed + 1, enrollment.total_days);
  const done = enrollment.status === "completed";
  const awaiting = enrollment.status === "awaiting_payment";

  return (
    <GlassCard hover className="p-4">
      <div className="flex items-center gap-4">
        <ProgressRing done={enrollment.days_completed} total={enrollment.total_days} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{enrollment.program.title}</p>
          <p className="text-[11px] text-muted-foreground capitalize">
            {enrollment.program.vertical} · {enrollment.program.duration_days}d
            {awaiting && " · awaiting payment"}
          </p>
          {!done && !awaiting && (
            <p className="text-xs text-foreground mt-1">
              Next: Day {nextDay}
            </p>
          )}
          {done && (
            <p className="text-xs text-teal mt-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Completed
            </p>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/my-programs/${enrollment.id}`)}
          disabled={awaiting}
          className="rounded-pill px-3 py-2 gradient-indigo text-[11px] font-semibold text-white flex items-center gap-1.5 disabled:opacity-50"
        >
          <Play className="w-3 h-3" />
          {done ? "Review" : awaiting ? "Waiting" : "Open"}
        </motion.button>
      </div>
    </GlassCard>
  );
}

// ── Single-enrollment view at /my-programs/:enrollmentId ─────────
function MyProgramDay({ enrollmentId }: { enrollmentId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [checkinBusy, setCheckinBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const myRes = await fetch(`${API}/api/programs/enrollments/me`, { headers: await authHeaders() });
      const myJson = await myRes.json();
      if (!myRes.ok || !myJson.ok) throw new Error(myJson.error ?? "Failed");
      const match = ((myJson.data ?? []) as Enrollment[]).find(e => e.id === enrollmentId);
      if (!match) throw new Error("Enrollment not found");
      setEnrollment(match);

      const pRes = await fetch(`${API}/api/programs/${match.program_id}`);
      const pJson = await pRes.json();
      if (!pRes.ok || !pJson.ok) throw new Error(pJson.error ?? "Program failed");
      setProgram(pJson.data as ProgramDetail);
    } catch (e: any) {
      setErr(e.message ?? "Could not load this program");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [enrollmentId, user?.id]);

  const currentDayNumber = useMemo(() => {
    if (!enrollment) return 1;
    return Math.min(enrollment.days_completed + 1, enrollment.total_days);
  }, [enrollment]);

  const currentDay = useMemo(
    () => (program?.days ?? []).find(d => d.day_number === currentDayNumber) ?? null,
    [program?.days, currentDayNumber],
  );

  const markComplete = async () => {
    if (!enrollment || !currentDay) return;
    setCheckinBusy(true);
    try {
      const res = await fetch(`${API}/api/programs/enrollments/${enrollment.id}/checkin`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ day_number: currentDay.day_number }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Check-in failed");
      await load();
    } catch (e: any) {
      setErr(e.message ?? "Could not save your check-in");
    } finally {
      setCheckinBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (err || !enrollment || !program) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center gap-3 text-foreground">
        <p className="text-sm font-semibold">Program unavailable</p>
        <p className="text-xs text-muted-foreground">{err ?? "Try again shortly."}</p>
        <button onClick={() => navigate("/my-programs")} className="text-xs text-indigo" title="navigate('/my-programs')} className='text-xs text-indigo'>Back to my programs" aria-label="navigate('/my-programs')} className='text-xs text-indigo'>Back to my programs">Back to my programs</button>
      </div>
    );
  }

  const done = enrollment.status === "completed";

  return (
    <div className="min-h-screen bg-obsidian pb-28">
      <div className="mx-auto max-w-2xl xl:max-w-3xl px-4 pt-20 space-y-5">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/my-programs")}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{program.title}</h1>
            <p className="text-[11px] text-muted-foreground">
              Day {enrollment.days_completed} of {enrollment.total_days} complete
            </p>
          </div>
          <ProgressRing done={enrollment.days_completed} total={enrollment.total_days} />
        </div>

        {done ? (
          <GlassCard variant="accent-indigo" className="p-5 text-center">
            <CheckCircle className="w-10 h-10 text-teal mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">You finished this program</p>
            <p className="text-xs text-muted-foreground mt-1">
              All {enrollment.total_days} days done. Revisit any day below.
            </p>
          </GlassCard>
        ) : currentDay ? (
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
                Day {currentDay.day_number} / {enrollment.total_days}
              </p>
              <span className="text-[10px] rounded-pill glass-accent-indigo text-indigo px-2 py-0.5">Today</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">{currentDay.title}</h2>
            <div className="prose prose-invert prose-sm max-w-none text-sm text-foreground/90 leading-relaxed">
              <ReactMarkdown>{currentDay.body_markdown || "_No content for this day yet._"}</ReactMarkdown>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={markComplete}
              disabled={checkinBusy}
              className="w-full rounded-pill py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {checkinBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Mark day {currentDay.day_number} complete
            </motion.button>
          </GlassCard>
        ) : (
          <GlassCard className="p-5 text-center">
            <p className="text-sm text-muted-foreground">
              Your provider hasn't added this day yet — check back soon.
            </p>
          </GlassCard>
        )}

        {/* Past days — quick review */}
        {enrollment.days_completed > 0 && !done && (
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">Already done</h3>
            <div className="space-y-1.5">
              {(program.days ?? [])
                .filter(d => d.day_number <= enrollment.days_completed)
                .slice(-5)
                .reverse()
                .map(d => (
                  <GlassCard key={d.id} className="p-3 flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        Day {d.day_number} · {d.title}
                      </p>
                    </div>
                  </GlassCard>
                ))}
            </div>
          </section>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
