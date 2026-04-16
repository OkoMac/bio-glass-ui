import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Clock, CreditCard, Loader2, Shield, X } from "lucide-react";

interface ProgramDay {
  id: string;
  day_number: number;
  title: string;
  body_markdown: string;
  media_urls: string[];
}

interface Provider {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  specialty: string | null;
}

interface ProgramDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  vertical: string;
  duration_days: number;
  price_rand: number;
  cover_image_url: string | null;
  active: boolean;
  published_at: string | null;
  provider_id: string;
  provider?: Provider;
  days: ProgramDay[];
}

const API = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://bion-backend.onrender.com";

export default function ProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showEnroll, setShowEnroll] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [enrollBusy, setEnrollBusy] = useState(false);
  const [enrollErr, setEnrollErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    fetch(`${API}/api/programs/${id}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        if (!json.ok) throw new Error(json.error ?? "Not found");
        setProgram(json.data as ProgramDetail);
      })
      .catch(e => { if (!cancelled) setErr(e.message ?? "Could not load program"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  // SEO: document title + meta description
  useEffect(() => {
    if (!program) return;
    document.title = `${program.title} — BION program`;
    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) { tag = document.createElement("meta"); tag.setAttribute("name", name); document.head.appendChild(tag); }
      tag.content = content;
    };
    const desc = `${program.duration_days}-day ${program.vertical} program${program.provider?.full_name ? ` by ${program.provider.full_name}` : ""}. ${program.description ?? ""}`.trim();
    setMeta("description", desc.slice(0, 180));
    return () => { document.title = "BION — Commit to Yourself"; };
  }, [program]);

  const preview = useMemo(
    () => (program?.days ?? []).slice(0, 3),
    [program?.days],
  );

  const enroll = async () => {
    if (!program) return;
    if (!user) {
      navigate("/welcome");
      return;
    }
    setEnrollBusy(true);
    setEnrollErr(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch(`${API}/api/programs/${program.id}/enroll`, {
        method: "POST",
        headers,
        body: JSON.stringify({ start_date: startDate }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not start checkout");
      window.location.href = json.checkoutUrl;
    } catch (e: any) {
      setEnrollErr(e.message ?? "Something went wrong");
    } finally {
      setEnrollBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (err || !program) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center gap-3 text-foreground">
        <p className="text-sm font-semibold">Program not found</p>
        <p className="text-xs text-muted-foreground">{err ?? "It may have been unpublished."}</p>
        <button onClick={() => navigate(-1)} className="text-xs text-indigo">Go back</button>
      </div>
    );
  }

  const clientFee = Math.round(program.price_rand * 0.05);
  const totalRand = program.price_rand + clientFee;

  return (
    <div className="min-h-screen bg-obsidian pb-40">
      {/* Hero */}
      <div className="relative h-[240px] md:h-[320px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: program.cover_image_url
              ? `url(${program.cover_image_url}) center/cover`
              : "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(20,184,166,0.25))",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/20" />

        <div className="absolute top-8 md:top-12 left-4 right-4 flex justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="glass-2 rounded-full w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
        </div>

        <div className="absolute bottom-6 left-4 right-4">
          <span className="inline-block rounded-pill px-2.5 py-1 text-[10px] font-medium glass-accent-indigo text-indigo capitalize">
            {program.vertical}
          </span>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-foreground">{program.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {program.duration_days} day{program.duration_days === 1 ? "" : "s"}
            {program.provider?.full_name ? ` · by ${program.provider.full_name}` : ""}
          </p>
        </div>
      </div>

      <div className="px-4 md:px-8 space-y-5 mt-5 max-w-2xl mx-auto">
        <GlassCard className="flex divide-x divide-foreground/10">
          <div className="flex-1 py-3 text-center">
            <p className="font-data text-sm text-foreground">{program.duration_days}d</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Duration</p>
          </div>
          <div className="flex-1 py-3 text-center">
            <p className="font-data text-sm text-foreground">
              {program.price_rand === 0 ? "Free" : `R${program.price_rand}`}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Price</p>
          </div>
          <div className="flex-1 py-3 text-center">
            <p className="font-data text-sm text-foreground">{program.days.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Days ready</p>
          </div>
        </GlassCard>

        {program.description && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">About this program</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {program.description}
            </p>
          </section>
        )}

        {preview.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Sample days</h2>
            <div className="space-y-2">
              {preview.map(d => (
                <GlassCard key={d.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Day {d.day_number}</p>
                    {d.day_number > 1 && <span className="text-[10px] text-indigo">Preview</span>}
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1">{d.title}</p>
                </GlassCard>
              ))}
              {program.days.length > preview.length && (
                <p className="text-[11px] text-muted-foreground text-center">
                  + {program.days.length - preview.length} more day{program.days.length - preview.length === 1 ? "" : "s"} unlock after enrolling
                </p>
              )}
            </div>
          </section>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => (user ? setShowEnroll(true) : navigate("/welcome"))}
          className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta"
        >
          {user
            ? program.price_rand === 0
              ? "Enroll for free"
              : `Enroll now — R${program.price_rand}`
            : "Sign up to enroll"}
        </motion.button>

        <GlassCard variant="accent-indigo" className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Secure checkout</h3>
              <p className="text-xs text-muted-foreground">
                You pay via Paystack. 90% goes to your provider, 10% keeps BION running.
                Access unlocks instantly after payment.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <BottomNav />

      {/* Enrollment sheet */}
      {showEnroll && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !enrollBusy && setShowEnroll(false)}
            className="fixed inset-0 bg-obsidian/70 z-[80]"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 space-y-5"
            style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo" />
                <h3 className="text-base font-bold text-foreground">Start your program</h3>
              </div>
              <button onClick={() => setShowEnroll(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Start date</p>
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-3 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08] focus:border-indigo/40"
              />
            </div>

            <div className="glass-1 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Program</span>
                <span className="text-foreground font-medium truncate max-w-[60%]">{program.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="text-foreground font-medium">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {program.duration_days} days
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.06] space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Program price</span>
                  <span className="text-muted-foreground font-data">R{program.price_rand}</span>
                </div>
                {program.price_rand > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">BION service fee (5%)</span>
                    <span className="text-muted-foreground font-data">R{clientFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-1 border-t border-white/[0.04]">
                  <span className="text-foreground font-semibold">You pay</span>
                  <span className="text-foreground font-bold font-data">
                    {program.price_rand === 0 ? "R0" : `R${totalRand}`}
                  </span>
                </div>
              </div>
            </div>

            {enrollErr && (
              <div className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
                {enrollErr}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={enroll}
              disabled={enrollBusy}
              className="w-full rounded-pill py-4 text-base font-semibold text-primary-foreground shadow-cta gradient-indigo disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {enrollBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {program.price_rand === 0 ? "Start now" : "Continue to payment"}
            </motion.button>
          </motion.div>
        </>
      )}

    </div>
  );
}
