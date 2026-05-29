import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdBanner from "@/components/AdBanner";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { usePageView } from "@/hooks/usePageView";
import { useHealthLogs, useHealthProfile } from "@/hooks/useHealth";
import { authFetchJson } from "@/lib/authFetch";
import { ArrowLeft, Calculator, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import HelpVideo from "@/components/HelpVideo";

const STORAGE_KEY = "bion_bmi_last";

interface BmiResult {
  bmi: number;
  category: string;
  color: string;
  variant: "accent-teal" | "accent-amber" | "accent-coral" | "glass-1";
}

function classify(bmi: number): BmiResult {
  if (bmi < 18.5) return { bmi, category: "Underweight", color: "text-muted-foreground", variant: "glass-1" };
  if (bmi < 25) return { bmi, category: "Normal", color: "text-teal", variant: "accent-teal" };
  if (bmi < 30) return { bmi, category: "Overweight", color: "text-amber", variant: "accent-amber" };
  return { bmi, category: "Obese", color: "text-coral", variant: "accent-coral" };
}

const FAQ_DATA = [
  {
    q: "What is BMI?",
    a: "BMI (Body Mass Index) is a simple measure that uses your height and weight to estimate whether you are underweight, normal weight, overweight, or obese. It is calculated by dividing your weight in kilograms by the square of your height in metres.",
  },
  {
    q: "What is a healthy BMI for South Africans?",
    a: "A healthy BMI range is generally 18.5 to 24.9, regardless of nationality. However, South Africa has high rates of obesity-related conditions like hypertension and diabetes, so maintaining a BMI within the normal range is especially important for long-term health.",
  },
  {
    q: "How accurate is BMI?",
    a: "BMI is a useful screening tool but has limitations. It does not distinguish between muscle and fat, so athletes may register as overweight despite being healthy. For a complete picture, consult a healthcare professional who can assess body composition, waist circumference, and other risk factors.",
  },
  {
    q: "When should I see a dietitian?",
    a: "You should consider seeing a dietitian if your BMI falls outside the normal range, if you have diet-related health conditions, or if you need help creating a sustainable eating plan. BION connects you with verified dietitians and nutritionists across South Africa.",
  },
];

export default function BmiCalculator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logToday } = useHealthLogs(1);
  const { save: saveHealthProfile } = useHealthProfile();
  usePageView();

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<BmiResult | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [history, setHistory] = useState<Array<{ created_at: string; bmi: number }>>([]);

  useEffect(() => {
    document.title = "Free BMI Calculator | BION";
  }, []);

  // Load BMI history (signed-in users only)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetchJson<{ ok: boolean; data: Array<{ created_at: string; bmi: number }> }>(
          "/api/health-profile/bmi/history",
        );
        if (!cancelled && res?.data) setHistory(res.data);
      } catch {
        /* not signed in or no history yet */
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_DATA.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const calculate = async () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return;
    const bmi = Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
    const res = classify(bmi);
    setResult(res);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(res));

    // Auto-save for signed-in users so they get a trend chart over time.
    // Non-blocking: a failed save still gives the user their result.
    if (user) {
      try {
        await authFetchJson<{ ok: boolean; data: any }>("/api/health-profile/bmi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ height_cm: h, weight_kg: w }),
        });
        // Refresh history after a successful save
        const refreshed = await authFetchJson<{ ok: boolean; data: Array<{ created_at: string; bmi: number }> }>(
          "/api/health-profile/bmi/history",
        );
        if (refreshed?.data) setHistory(refreshed.data);
      } catch (err) {
        console.warn("[BmiCalculator] save failed:", err);
      }
      // Mirror the values into the canonical health stores so the WEIGHT
      // tile on /me (HealthProfile Metrics tab) and any other consumers
      // see them. Without this, the BMI tool wrote to its own table and
      // the WEIGHT tile read from health_logs — same user, different
      // sources, "— kg" displayed despite a fresh BMI entry.
      try { await logToday({ weight_kg: w }); } catch (err) { console.warn("[BmiCalculator] health_logs mirror failed:", err); }
      try { await saveHealthProfile({ height_cm: h }); } catch (err) { console.warn("[BmiCalculator] health_profile mirror failed:", err); }
    }
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 pt-20 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-foreground">Free BMI Calculator</h1>
              <HelpVideo lessonRef="TOOLS:1" />
            </div>
            <p className="text-xs text-muted-foreground">
              Check your Body Mass Index — metric (kg/cm). Sign up free to save trends.
            </p>
          </div>
        </div>

        <AdBanner slot="tools-bmi-top" format="horizontal" />

        {/* Calculator card */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-foreground">Calculate Your BMI</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 175"
                className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 72"
                className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors"
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={calculate}
            disabled={!height || !weight}
            className="w-full py-3 rounded-pill text-sm font-semibold text-primary-foreground gradient-indigo disabled:opacity-40 shadow-cta"
          >
            Calculate BMI
          </motion.button>
        </GlassCard>

        {/* Result card */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard variant={result.variant} className="p-5 text-center space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Your BMI</p>
              <p className={`text-4xl font-bold ${result.color}`}>{result.bmi}</p>
              <p className={`text-lg font-semibold ${result.color}`}>{result.category}</p>
              <div className="flex justify-center gap-6 pt-2 text-[10px] text-muted-foreground">
                <span>&lt;18.5 Underweight</span>
                <span>18.5-24.9 Normal</span>
                <span>25-29.9 Overweight</span>
                <span>30+ Obese</span>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Trend chart — signed-in users with at least 2 data points */}
        {user && history.length >= 2 && (
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-semibold text-foreground">Your BMI Trend</h3>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {history.length} {history.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            <BmiTrendChart data={history} />
            <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
              Calculated values are saved automatically. Each new measurement is added to your trend.
            </p>
          </GlassCard>
        )}

        {/* CTA bridge */}
        <GlassCard variant="accent-indigo" className="p-4">
          <p className="text-sm text-foreground font-medium mb-2">
            Need professional guidance?
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Browse verified dietitians and nutritionists near you.
          </p>
          <Link
            to="/directory"
            className="inline-block rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Browse Directory
          </Link>
        </GlassCard>

        {/* FAQ Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-foreground mb-3">Frequently Asked Questions</h2>
          {FAQ_DATA.map((faq, i) => (
            <GlassCard key={i} className="overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-medium text-foreground">{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </GlassCard>
          ))}
        </div>

        {/* Sign-up banner */}
        {!user && (
          <div className="p-3 rounded-2xl glass-1 border border-indigo/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Sign up free to save your progress and unlock full features</p>
            <a href="/welcome" className="rounded-pill px-3 py-1.5 text-xs font-semibold gradient-indigo text-primary-foreground shrink-0">Sign up free</a>
          </div>
        )}

        <AdBanner slot="tools-bmi-bottom" format="rectangle" />
      </div>
      {user && <BottomNav />}
    </div>
  );
}

/** Lightweight inline SVG sparkline of BMI over time. No chart library. */
function BmiTrendChart({ data }: { data: Array<{ created_at: string; bmi: number }> }) {
  const w = 320;
  const h = 80;
  const padX = 8;
  const padY = 14;
  const minBmi = Math.min(...data.map(d => d.bmi));
  const maxBmi = Math.max(...data.map(d => d.bmi));
  const span = Math.max(0.5, maxBmi - minBmi);
  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * (w - 2 * padX);
    const y = padY + (1 - (d.bmi - minBmi) / span) * (h - 2 * padY);
    return { x, y, bmi: d.bmi };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const latest = points[points.length - 1];
  const trendUp = points.length >= 2 && points[points.length - 1].bmi > points[0].bmi;
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
        <path d={path} fill="none" stroke={trendUp ? "rgb(248, 113, 113)" : "rgb(45, 212, 191)"} strokeWidth="2" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2}
            fill={i === points.length - 1 ? "rgb(99, 102, 241)" : "rgba(255,255,255,0.5)"} />
        ))}
        <text x={latest.x + 6} y={latest.y - 4} className="text-[10px]" fill="rgb(99, 102, 241)">
          {latest.bmi.toFixed(1)}
        </text>
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{new Date(data[0].created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span>
        <span>{new Date(data[data.length - 1].created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span>
      </div>
    </div>
  );
}
