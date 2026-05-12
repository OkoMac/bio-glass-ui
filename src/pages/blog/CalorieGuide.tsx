import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AdBanner from "@/components/AdBanner";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";

export default function CalorieGuide() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "How Many Calories Should I Eat Per Day? | South African Guide | BION";
  }, []);

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How Many Calories Should I Eat Per Day? South African Guide",
      description:
        "Learn how to calculate your daily calorie needs using BMR and TDEE, with South African food examples and practical tips.",
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
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded…" aria-label="navigate(-1)} className='absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded…">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-3xl px-4 pt-16 space-y-6">
        <AdBanner slot="blog-top" format="horizontal" />

        <article className="prose prose-invert max-w-none">
          <h1>How Many Calories Should I Eat Per Day?</h1>
          <p className="text-lg text-muted-foreground">
            A practical South African guide to understanding your daily energy
            needs — whether you want to lose weight, gain muscle, or simply eat
            healthier.
          </p>

          <h2>What Are Calories?</h2>
          <p>
            A calorie is a unit of energy your body uses to breathe, move,
            digest food, and keep your heart beating. Every food and drink you
            consume provides calories — from a cup of rooibos tea (roughly 2 kcal
            without milk) to a generous plate of pap and wors (easily 700+ kcal).
          </p>
          <p>
            Eating the right number of calories for your body keeps your weight
            stable. Eat too many and the excess is stored as fat; eat too few and
            you lose weight — but also risk losing muscle and feeling fatigued.
          </p>

          <h2>Step 1: Calculate Your BMR</h2>
          <p>
            Your <strong>Basal Metabolic Rate (BMR)</strong> is the number of
            calories your body burns at complete rest — just to keep you alive.
            The most widely used formula is the Mifflin-St Jeor equation:
          </p>
          <ul>
            <li>
              <strong>Men:</strong> BMR = (10 &times; weight in kg) + (6.25
              &times; height in cm) &minus; (5 &times; age) + 5
            </li>
            <li>
              <strong>Women:</strong> BMR = (10 &times; weight in kg) + (6.25
              &times; height in cm) &minus; (5 &times; age) &minus; 161
            </li>
          </ul>
          <p>
            For example, a 30-year-old woman weighing 70 kg and standing 165 cm
            tall has a BMR of roughly 1&thinsp;399 kcal/day.
          </p>

          <h2>Step 2: Apply Your Activity Multiplier (TDEE)</h2>
          <p>
            Your <strong>Total Daily Energy Expenditure (TDEE)</strong> accounts
            for how active you are. Multiply your BMR by the factor that best
            matches your lifestyle:
          </p>
          <ul>
            <li><strong>Sedentary</strong> (desk job, little exercise): BMR &times; 1.2</li>
            <li><strong>Lightly active</strong> (1-3 days/week): BMR &times; 1.375</li>
            <li><strong>Moderately active</strong> (3-5 days/week): BMR &times; 1.55</li>
            <li><strong>Very active</strong> (6-7 days/week): BMR &times; 1.725</li>
            <li><strong>Extremely active</strong> (athlete/physical job): BMR &times; 1.9</li>
          </ul>
          <p>
            Using the example above, if our 30-year-old woman walks 30 minutes
            most days, her TDEE is approximately 1&thinsp;399 &times; 1.55 =
            <strong> 2&thinsp;169 kcal/day</strong>.
          </p>

          <h2>Calorie Counts for Popular South African Foods</h2>
          <p>
            Knowing what is in your favourite meals helps you make informed
            choices without giving up the foods you love:
          </p>
          <ul>
            <li>1 cup stiff pap (maize meal): ~370 kcal</li>
            <li>1 boerewors roll with sauce: ~550 kcal</li>
            <li>Quarter bunny chow (mutton): ~680 kcal</li>
            <li>Chakalaka (1 cup): ~150 kcal</li>
            <li>Biltong (50 g): ~130 kcal</li>
            <li>Rooibos with full-cream milk &amp; sugar: ~45 kcal</li>
            <li>Braai chicken quarter (skin on): ~290 kcal</li>
            <li>Vetkoek with mince: ~450 kcal</li>
          </ul>

          <h2>How to Adjust Calories for Your Goal</h2>
          <p>
            Once you know your TDEE, adjusting is straightforward:
          </p>
          <ul>
            <li>
              <strong>Lose weight:</strong> eat 300-500 kcal below your TDEE. A
              moderate deficit preserves muscle and is sustainable.
            </li>
            <li>
              <strong>Maintain weight:</strong> eat at your TDEE.
            </li>
            <li>
              <strong>Gain muscle:</strong> eat 200-400 kcal above your TDEE
              while resistance training.
            </li>
          </ul>

          <h2>Tips for South Africans</h2>
          <ul>
            <li>
              If you are on <strong>Discovery Vitality</strong>, logging meals
              can earn you Vitality points — pair it with BION's food tracker for
              accurate logging.
            </li>
            <li>
              Braai season does not have to wreck your goals. Choose lean cuts,
              load up on salads, and track what you eat.
            </li>
            <li>
              Portion size matters more than avoiding specific foods. A smaller
              serving of pap with extra veg and lean protein is a balanced meal.
            </li>
            <li>
              Drink water before meals — it helps with satiety and most South
              Africans are mildly dehydrated without realising it.
            </li>
          </ul>

          <h2>The Bottom Line</h2>
          <p>
            Calculating your calories does not need to be complicated. Work out
            your BMR, multiply by your activity level, and adjust based on your
            goal. Track consistently for a few weeks and you will build an
            intuitive sense of what portions work for you.
          </p>
        </article>

        <GlassCard variant="accent-indigo" className="p-5 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">
            Try it now — free, no sign-up
          </h3>
          <Link
            to="/food-tracker"
            className="inline-block rounded-pill px-6 py-2.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Open Calorie Calculator &rarr;
          </Link>
        </GlassCard>

        <AdBanner slot="blog-bottom" format="rectangle" />
      </div>
      {user && <BottomNav />}
    </div>
  );
}
