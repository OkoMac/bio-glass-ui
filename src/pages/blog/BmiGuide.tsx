import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AdBanner from "@/components/AdBanner";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";

export default function BmiGuide() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "What is BMI? Calculator & Guide for South Africans | BION";
  }, []);

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "What is BMI? Calculator & Guide for South Africans",
      description:
        "Understand Body Mass Index, how to calculate it, what the ranges mean, and why it matters for South African adults.",
      author: { "@type": "Organization", name: "BION Health" },
      publisher: {
        "@type": "Organization",
        name: "BION Health",
        url: "https://bionhealth.co.za",
      },
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify(schema);
    document.head.appendChild(s);
    return () => {
      document.head.removeChild(s);
    };
  }, []);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-20 relative">
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-3xl px-4 pt-16 space-y-6">
        <AdBanner slot="blog-top" format="horizontal" />

        <article className="prose prose-invert max-w-none">
          <h1>What is BMI? Calculator &amp; Guide for South Africans</h1>
          <p className="text-lg text-muted-foreground">
            Body Mass Index (BMI) is one of the quickest ways to screen whether
            your weight falls in a healthy range. Here is everything you need to
            know — and how to calculate yours in seconds.
          </p>

          <h2>How BMI is Calculated</h2>
          <p>
            BMI uses a simple formula: <strong>weight (kg) &divide; height (m)&sup2;</strong>.
            For example, if you weigh 80 kg and are 1.75 m tall:
          </p>
          <p className="text-center text-lg font-semibold">
            80 &divide; (1.75 &times; 1.75) = 80 &divide; 3.0625 = <strong>26.1</strong>
          </p>

          <h2>BMI Categories</h2>
          <p>
            The World Health Organisation classifies adult BMI into four main
            brackets:
          </p>
          <ul>
            <li><strong>Below 18.5</strong> — Underweight</li>
            <li><strong>18.5 – 24.9</strong> — Normal weight</li>
            <li><strong>25.0 – 29.9</strong> — Overweight</li>
            <li><strong>30.0 and above</strong> — Obese</li>
          </ul>
          <p>
            South Africa has one of the highest obesity rates on the continent.
            According to the South African Demographic and Health Survey, over
            68% of women and 31% of men are overweight or obese. Understanding
            your BMI is a practical first step toward addressing this.
          </p>

          <h2>What BMI Does Not Tell You</h2>
          <p>
            BMI is a screening tool, not a diagnosis. It has important
            limitations:
          </p>
          <ul>
            <li>
              <strong>Muscle vs fat:</strong> Athletes and gym-goers may have a
              high BMI because muscle is denser than fat. A rugby player weighing
              100 kg at 1.80 m (BMI 30.9) is not necessarily unhealthy.
            </li>
            <li>
              <strong>Body fat distribution:</strong> BMI does not distinguish
              between visceral fat (around organs, higher risk) and subcutaneous
              fat (under skin, lower risk). Waist circumference is a useful
              complement — above 94 cm for men or 80 cm for women signals
              increased metabolic risk.
            </li>
            <li>
              <strong>Age and ethnicity:</strong> BMI thresholds were developed
              on predominantly European populations and may not perfectly apply
              to all groups.
            </li>
          </ul>

          <h2>Why BMI Still Matters</h2>
          <p>
            Despite its limitations, BMI remains valuable because it is free,
            instant, and correlates with health outcomes at a population level. A
            BMI above 30 is associated with higher rates of type 2 diabetes,
            cardiovascular disease, and certain cancers — conditions that are
            rising fast in South Africa.
          </p>
          <p>
            Medical aid schemes like <strong>Discovery Health</strong> use BMI as
            part of their Vitality Health Check. Knowing your number helps you
            track progress over time and have informed conversations with your
            healthcare provider.
          </p>

          <h2>How to Lower Your BMI Safely</h2>
          <ul>
            <li>
              <strong>Eat balanced meals:</strong> Focus on whole grains, lean
              protein, vegetables, and healthy fats. Swap white bread for
              whole-wheat, and choose grilled over fried.
            </li>
            <li>
              <strong>Move more:</strong> The South African Physical Activity
              Guidelines recommend 150 minutes of moderate activity per week —
              that is a 30-minute walk five days a week.
            </li>
            <li>
              <strong>Track your food:</strong> Awareness is half the battle.
              Use BION's <Link to="/food-tracker">food tracker</Link> to log
              meals and spot patterns.
            </li>
            <li>
              <strong>Get professional help:</strong> A registered dietitian or
              biokineticist can create a personalised plan. Find one on the{" "}
              <Link to="/directory">BION directory</Link>.
            </li>
          </ul>

          <h2>Healthy BMI for Children</h2>
          <p>
            For children and teenagers, BMI is calculated the same way but
            interpreted using age- and sex-specific percentile charts. A
            paediatrician or clinic sister can plot your child's BMI on the
            appropriate growth chart. South Africa's Road to Health booklet
            includes these charts for children under five.
          </p>

          <h2>Check Yours Now</h2>
          <p>
            Use BION's free BMI calculator below — no sign-up required. Enter
            your weight and height, and get your result with personalised
            guidance instantly.
          </p>
        </article>

        <GlassCard variant="accent-indigo" className="p-5 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">
            Try it now — free, no sign-up
          </h3>
          <Link
            to="/tools/bmi-calculator"
            className="inline-block rounded-pill px-6 py-2.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Open BMI Calculator &rarr;
          </Link>
        </GlassCard>

        <AdBanner slot="blog-bottom" format="rectangle" />
      </div>
      {user && <BottomNav />}
    </div>
  );
}
