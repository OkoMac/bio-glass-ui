import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2, CheckCircle, Pencil, ChevronDown, ChevronUp, Zap } from "lucide-react";
import type { CrawlResult, AIGeneratedProfile, ServiceRecommendation } from "@/types/onboarding";
import { generateServiceRecommendations } from "@/lib/webcrawler";

interface Props {
  title: string;
  subtitle?: string;
  crawlData?: CrawlResult;
  existingFormData?: Record<string, string>;
  onProfileGenerated: (profile: AIGeneratedProfile) => void;
}

type Phase = "idle" | "generating" | "done";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─── Profile Generator ─────────────────────────────────────────────────────────

function generateProfile(crawl: CrawlResult | undefined, formData: Record<string, string>): AIGeneratedProfile {
  const recs: ServiceRecommendation[] = crawl ? generateServiceRecommendations(crawl) : [];

  const businessName = formData.businessName || crawl?.businessName || "Your Practice";
  const vertical = crawl?.vertical ?? "wellness";
  const businessType = crawl?.businessType ?? "professional";

  const taglines: Record<string, string> = {
    gym: "Strength, cardio and personal training — built around you.",
    yoga: "Find your balance. Mind, body and breath — in harmony.",
    medical: "Evidence-based care, delivered with compassion.",
    physio: "Restore movement. Reduce pain. Live fully.",
    beauty: "Look and feel your best, every visit.",
    spa: "Relax, restore and rejuvenate — you deserve it.",
    nutrition: "Food as medicine. Personalised plans for lasting results.",
    mental: "A safe space to grow, heal and thrive.",
    dental: "Healthy smiles for life.",
    corporate: "Employee wellness that drives business performance.",
    professional: "Expert guidance, measurable results.",
  };

  const descriptions: Record<string, string> = {
    gym: `${businessName} offers world-class fitness facilities and expert personal training for all fitness levels. Whether you're starting your journey or training for peak performance, we're here to help you achieve your goals.`,
    yoga: `At ${businessName}, we create a welcoming space for your yoga and mindfulness practice. From beginners to advanced practitioners, every class is designed to nurture your body, calm your mind and lift your spirit.`,
    medical: `${businessName} provides comprehensive primary healthcare services. Our experienced practitioners deliver evidence-based care with a focus on preventive health and long-term wellness.`,
    physio: `${businessName} specialises in physiotherapy and rehabilitation. We help you recover from injury, manage pain and optimise physical performance through expert manual therapy and personalised exercise programmes.`,
    beauty: `${businessName} is your destination for premium hair and beauty services. Our skilled stylists and therapists use the finest products to help you look and feel your absolute best.`,
    spa: `${businessName} offers a sanctuary for relaxation and renewal. Experience our signature treatments, therapeutic massages and holistic therapies in a tranquil environment designed for total wellbeing.`,
    nutrition: `${businessName} provides expert nutrition and dietetic services tailored to your unique health goals. Whether you're managing a health condition or optimising performance, our approach is scientific, practical and sustainable.`,
    mental: `${businessName} offers compassionate psychological support in a safe, non-judgmental environment. Our qualified therapists help individuals navigate life's challenges and build lasting mental wellbeing.`,
    dental: `${businessName} provides comprehensive dental care for the whole family. From routine check-ups to advanced procedures, we deliver gentle, high-quality dentistry in a comfortable setting.`,
    professional: `${businessName} delivers expert ${vertical} services tailored to your unique needs. Our qualified practitioners are dedicated to helping you achieve meaningful, lasting results.`,
  };

  const services: AIGeneratedProfile["services"] = recs.slice(0, 5).map((r) => ({
    name: r.name,
    description: r.description,
    duration: r.duration,
    price: Math.round((r.suggestedPrice.min + r.suggestedPrice.max) / 2 / 50) * 50,
    category: r.category,
  }));

  if (!services.length) {
    services.push({
      name: "Initial Consultation",
      description: "A comprehensive first session to assess your needs and create a personalised plan.",
      duration: 60,
      price: 550,
      category: vertical,
    });
  }

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const weekend = businessType === "beauty" || businessType === "spa" || businessType === "gym"
    ? ["Saturday"] : [];

  return {
    businessName,
    tagline: taglines[businessType] ?? taglines.professional,
    description: descriptions[businessType] ?? descriptions.professional,
    services,
    availability: {
      days: [...weekdays, ...weekend],
      startTime: "08:00",
      endTime: "17:00",
      bufferMinutes: 15,
    },
    cancellationPolicy: "Cancellations must be made at least 24 hours before the appointment to receive a full refund. Late cancellations may incur a 50% fee.",
  };
}

// ─── Editable Service Row ──────────────────────────────────────────────────────

function EditableService({
  service,
  onChange,
}: {
  service: AIGeneratedProfile["services"][number];
  onChange: (s: AIGeneratedProfile["services"][number]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-1 rounded-xl border border-white/5 overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-3 text-left">
        <div className="w-8 h-8 rounded-lg bg-indigo/15 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-indigo">R</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{service.name}</p>
          <p className="text-xs text-muted-foreground">R{service.price} · {service.duration} min</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-white/5 p-3 space-y-2">
          <input value={service.name} onChange={(e) => onChange({ ...service, name: e.target.value })}
            className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/5 outline-none" placeholder="Service name" />
          <textarea value={service.description} onChange={(e) => onChange({ ...service, description: e.target.value })}
            rows={2} className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/5 outline-none resize-none" placeholder="Description" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Price (R)</label>
              <input type="number" value={service.price} onChange={(e) => onChange({ ...service, price: parseFloat(e.target.value) || 0 })}
                className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/5 outline-none mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Duration (min)</label>
              <input type="number" value={service.duration} onChange={(e) => onChange({ ...service, duration: parseInt(e.target.value) || 60 })}
                className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/5 outline-none mt-0.5" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AISetupStep({ title, subtitle, crawlData, existingFormData = {}, onProfileGenerated }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [profile, setProfile] = useState<AIGeneratedProfile | null>(null);
  const [editSection, setEditSection] = useState<string | null>(null);

  const runSetup = async () => {
    setPhase("generating");
    await new Promise((r) => setTimeout(r, 2200));
    const generated = generateProfile(crawlData, existingFormData);
    setProfile(generated);
    setPhase("done");
    onProfileGenerated(generated);
  };

  const updateService = (index: number, service: AIGeneratedProfile["services"][number]) => {
    if (!profile) return;
    const services = [...profile.services];
    services[index] = service;
    const updated = { ...profile, services };
    setProfile(updated);
    onProfileGenerated(updated);
  };

  const toggleDay = (day: string) => {
    if (!profile) return;
    const days = profile.availability.days.includes(day)
      ? profile.availability.days.filter((d) => d !== day)
      : [...profile.availability.days, day];
    const updated = { ...profile, availability: { ...profile.availability, days } };
    setProfile(updated);
    onProfileGenerated(updated);
  };

  const updateAvailability = (field: string, value: string | number) => {
    if (!profile) return;
    const updated = { ...profile, availability: { ...profile.availability, [field]: value } };
    setProfile(updated);
    onProfileGenerated(updated);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      {phase === "idle" && (
        <div className="space-y-4">
          <div className="glass-1 rounded-xl p-5 border border-indigo/20 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-indigo/15 flex items-center justify-center">
              <Bot className="w-7 h-7 text-indigo" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AI Account Setup</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Let me set up your full provider profile — business bio, services with pricing, and availability — based on your website analysis. You review and adjust before going live.
              </p>
            </div>
            {crawlData?.businessName && (
              <div className="text-xs text-muted-foreground glass-1 rounded-lg p-2 border border-white/5">
                Using data from: <span className="text-foreground font-medium">{crawlData.businessName}</span>
              </div>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={runSetup}
              className="w-full py-3 rounded-pill gradient-indigo text-primary-foreground text-sm font-semibold shadow-cta flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Set Up My Account with AI
            </motion.button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            Or skip this step and fill in your profile manually after onboarding.
          </p>
        </div>
      )}

      {phase === "generating" && (
        <div className="space-y-4">
          {["Analysing your business profile…", "Generating service descriptions…", "Setting market-rate pricing…", "Configuring availability…"].map((msg, i) => (
            <motion.div
              key={msg}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.5 }}
              className="flex items-center gap-3 glass-1 rounded-xl p-3 border border-white/5"
            >
              <Loader2 className="w-4 h-4 text-indigo animate-spin shrink-0" />
              <p className="text-sm text-muted-foreground">{msg}</p>
            </motion.div>
          ))}
        </div>
      )}

      {phase === "done" && profile && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Success banner */}
            <div className="flex items-center gap-2 glass-1 rounded-xl p-3 border border-teal/20">
              <CheckCircle className="w-5 h-5 text-teal shrink-0" />
              <p className="text-sm text-foreground font-medium">Profile generated! Review and adjust below.</p>
            </div>

            {/* Business bio */}
            <div className="glass-1 rounded-xl p-4 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Business Profile</p>
                <button onClick={() => setEditSection(editSection === "bio" ? null : "bio")} className="text-xs text-indigo flex items-center gap-1">
                  <Pencil className="w-3 h-3" />Edit
                </button>
              </div>
              {editSection === "bio" ? (
                <div className="space-y-2">
                  <input value={profile.businessName} onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                    className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/5 outline-none" placeholder="Business name" />
                  <input value={profile.tagline} onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                    className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/5 outline-none" placeholder="Tagline" />
                  <textarea value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    rows={4} className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/5 outline-none resize-none" />
                </div>
              ) : (
                <>
                  <p className="text-base font-bold text-foreground">{profile.businessName}</p>
                  <p className="text-xs text-indigo italic">{profile.tagline}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{profile.description}</p>
                </>
              )}
            </div>

            {/* Services */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Services ({profile.services.length})</p>
              {profile.services.map((svc, i) => (
                <EditableService key={i} service={svc} onChange={(s) => updateService(i, s)} />
              ))}
            </div>

            {/* Availability */}
            <div className="glass-1 rounded-xl p-4 border border-white/5 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Availability</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      profile.availability.days.includes(day)
                        ? "bg-indigo/20 border border-indigo/40 text-foreground"
                        : "glass-1 border border-white/5 text-muted-foreground"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Start</label>
                  <input type="time" value={profile.availability.startTime}
                    onChange={(e) => updateAvailability("startTime", e.target.value)}
                    className="w-full glass-1 rounded-lg px-2 py-1.5 text-xs text-foreground border border-white/5 outline-none mt-0.5" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">End</label>
                  <input type="time" value={profile.availability.endTime}
                    onChange={(e) => updateAvailability("endTime", e.target.value)}
                    className="w-full glass-1 rounded-lg px-2 py-1.5 text-xs text-foreground border border-white/5 outline-none mt-0.5" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Buffer (min)</label>
                  <input type="number" value={profile.availability.bufferMinutes}
                    onChange={(e) => updateAvailability("bufferMinutes", parseInt(e.target.value) || 0)}
                    className="w-full glass-1 rounded-lg px-2 py-1.5 text-xs text-foreground border border-white/5 outline-none mt-0.5" />
                </div>
              </div>
            </div>

            {/* Cancellation policy */}
            <div className="glass-1 rounded-xl p-4 border border-white/5 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cancellation Policy</p>
              <textarea value={profile.cancellationPolicy}
                onChange={(e) => setProfile({ ...profile, cancellationPolicy: e.target.value })}
                rows={2} className="w-full glass-1 rounded-lg px-3 py-2 text-xs text-foreground border border-white/5 outline-none resize-none" />
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
