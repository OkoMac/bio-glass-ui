import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdBanner from "@/components/AdBanner";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Calculator, ChevronDown, ChevronUp } from "lucide-react";

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

  useEffect(() => {
    document.title = "Free BMI Calculator | BION";
  }, []);

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

  const calculate = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return;
    const bmi = Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
    const res = classify(bmi);
    setResult(res);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 pt-12 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Free BMI Calculator</h1>
            <p className="text-xs text-muted-foreground">
              Check your Body Mass Index — metric (kg/cm), no sign-up required
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
    </div>
  );
}
