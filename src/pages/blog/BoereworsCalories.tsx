import { useEffect } from "react";
import { Link } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdBanner from "@/components/AdBanner";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";

export default function BoereworsCalories() {
  const { user } = useAuth();

  useEffect(() => {
    document.title =
      "How Many Calories in Boerewors? A South African Nutrition Guide | BION";
  }, []);

  /* JSON-LD Article schema */
  useEffect(() => {
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline:
        "How Many Calories in Boerewors? A South African Nutrition Guide",
      description:
        "How many calories in boerewors? A South African guide — calories per kg, per sausage, and per braai portion. Track it free on BION.",
      author: { "@type": "Organization", name: "BION Health" },
      publisher: {
        "@type": "Organization",
        name: "BION Health",
        url: "https://bionhealth.co.za",
      },
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify(article);
    document.head.appendChild(s);
    return () => {
      document.head.removeChild(s);
    };
  }, []);

  /* JSON-LD FAQPage schema */
  useEffect(() => {
    const faq = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How many calories are in 100g of boerewors?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A typical 100g serving of cooked beef boerewors contains 290-320 kcal, with about 24g of fat and 18g of protein.",
          },
        },
        {
          "@type": "Question",
          name: "How many calories in a boerewors roll?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A standard boerewors roll with sauce contains roughly 500-600 calories.",
          },
        },
        {
          "@type": "Question",
          name: "Is boerewors healthy?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Boerewors is high in protein but also high in fat. It can fit into a balanced diet when eaten in controlled portions and paired with vegetables rather than heavy sides.",
          },
        },
        {
          "@type": "Question",
          name: "How many calories in a full braai meal?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A full braai plate with boerewors, a broodjie, pap, and a beer can total 1,400-1,700 calories.",
          },
        },
      ],
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify(faq);
    document.head.appendChild(s);
    return () => {
      document.head.removeChild(s);
    };
  }, []);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-20">
      <div className="mx-auto max-w-3xl px-4 pt-16 space-y-6">
        <AdBanner slot="blog-top" format="horizontal" />

        <article className="prose prose-invert max-w-none">
          <h1>How Many Calories in Boerewors?</h1>
          <p className="text-lg text-muted-foreground">
            A typical 100&thinsp;g serving of cooked boerewors has roughly
            290-340&nbsp;calories, with about 24&thinsp;g of fat and
            18&thinsp;g of protein.
          </p>

          <h2>The Standard Answer (And Why It Varies)</h2>
          <p>
            Not all boerewors is created equal. The calorie count depends on the
            meat blend, fat ratio, and whether the casing is natural or
            collagen. Here is a quick breakdown per 100&thinsp;g cooked:
          </p>
          <ul>
            <li><strong>Beef boerewors:</strong> 290-320 kcal per 100&thinsp;g cooked</li>
            <li><strong>Beef + pork mix:</strong> 310-340 kcal</li>
            <li><strong>Lamb:</strong> 320-360 kcal</li>
            <li><strong>Chicken / lean:</strong> 180-220 kcal</li>
          </ul>
          <p>
            The legal minimum fat content for boerewors in South Africa is
            30&thinsp;%, which is why even "lean" varieties are calorie-dense
            compared to plain grilled chicken breast.
          </p>

          <h2>What Does a Real Braai Portion Look Like?</h2>
          <p>
            Forget the 100&thinsp;g lab serving &mdash; here is what South
            Africans actually eat at a braai:
          </p>
          <ul>
            <li>
              <strong>One braai coil (per person):</strong> 180-220&thinsp;g ={" "}
              <strong>520-750 calories</strong>
            </li>
            <li>
              <strong>One sausage from a pack of 6:</strong> ~80&thinsp;g ={" "}
              <strong>230-280 calories</strong>
            </li>
            <li>
              <strong>Boerewors roll (standard):</strong>{" "}
              <strong>~500-600 calories</strong>
            </li>
            <li>
              <strong>Full braai (wors + broodjie + pap + beer):</strong>{" "}
              <strong>1,400-1,700 calories</strong>
            </li>
          </ul>

          <h2>Boerewors vs Other Braai Proteins</h2>
          <p>
            How does boerewors stack up against other popular braai proteins?
            All values per 100&thinsp;g cooked:
          </p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Protein</th>
                  <th className="text-right">Calories</th>
                  <th className="text-right">Protein (g)</th>
                  <th className="text-right">Fat (g)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Boerewors (beef)</td>
                  <td className="text-right">~310</td>
                  <td className="text-right">18</td>
                  <td className="text-right">24</td>
                </tr>
                <tr>
                  <td>Lamb chops</td>
                  <td className="text-right">~290</td>
                  <td className="text-right">25</td>
                  <td className="text-right">20</td>
                </tr>
                <tr>
                  <td>Chicken thighs (skin on)</td>
                  <td className="text-right">~210</td>
                  <td className="text-right">26</td>
                  <td className="text-right">11</td>
                </tr>
                <tr>
                  <td>Sosaties (lamb)</td>
                  <td className="text-right">~250</td>
                  <td className="text-right">22</td>
                  <td className="text-right">16</td>
                </tr>
                <tr>
                  <td>Rump steak</td>
                  <td className="text-right">~200</td>
                  <td className="text-right">29</td>
                  <td className="text-right">9</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>How to Fit Boerewors Into Your Weekly Calories</h2>
          <p>
            You do not have to give up boerewors &mdash; just be strategic
            about it:
          </p>
          <ol>
            <li>
              <strong>Log the portion, not the sausage</strong> &mdash; use the{" "}
              <Link to="/food-tracker" className="text-indigo-400 underline">
                BION food tracker
              </Link>{" "}
              to weigh and log what you actually eat.
            </li>
            <li>
              <strong>Trim the roll or skip the bread</strong> &mdash; the roll
              alone adds 150-200&nbsp;kcal.
            </li>
            <li>
              <strong>Watch the sides</strong> &mdash; pap + sauce ={" "}
              300&nbsp;extra calories you might not be counting.
            </li>
            <li>
              <strong>Drink water between beers</strong> &mdash; a 500&thinsp;ml
              lager is 200+&nbsp;kcal, and they add up fast.
            </li>
          </ol>

          <h2>Frequently Asked Questions</h2>

          <h3>How many calories are in 100g of boerewors?</h3>
          <p>
            A typical 100&thinsp;g serving of cooked beef boerewors contains
            290-320&nbsp;kcal, with about 24&thinsp;g of fat and 18&thinsp;g
            of protein.
          </p>

          <h3>How many calories in a boerewors roll?</h3>
          <p>
            A standard boerewors roll with sauce contains roughly 500-600
            calories.
          </p>

          <h3>Is boerewors healthy?</h3>
          <p>
            Boerewors is high in protein but also high in fat. It can fit into
            a balanced diet when eaten in controlled portions and paired with
            vegetables rather than heavy sides.
          </p>

          <h3>How many calories in a full braai meal?</h3>
          <p>
            A full braai plate with boerewors, a broodjie, pap, and a beer can
            total 1,400-1,700 calories.
          </p>
        </article>

        <GlassCard variant="accent-indigo" className="p-5 text-center space-y-3">
          <h3 className="text-lg font-bold text-foreground">
            Track your braai &mdash; free, no sign-up
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/food-tracker"
              className="inline-block rounded-pill px-6 py-2.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
            >
              Open Food Tracker &rarr;
            </Link>
            <Link
              to="/tools/bmi-calculator"
              className="inline-block rounded-pill px-6 py-2.5 text-sm font-semibold border border-white/10 text-foreground hover:bg-white/5 transition"
            >
              BMI Calculator
            </Link>
          </div>
        </GlassCard>

        <AdBanner slot="blog-bottom" format="rectangle" />

        {!user && (
          <GlassCard className="p-5 text-center">
            <p className="text-muted-foreground text-sm mb-3">
              Join BION to track your nutrition, water, sleep, and workouts
              &mdash; all in one place.
            </p>
            <Link
              to="/welcome"
              className="inline-block rounded-pill px-6 py-2.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
            >
              Sign Up Free &rarr;
            </Link>
          </GlassCard>
        )}
      </div>
      {user && <BottomNav />}
    </div>
  );
}
