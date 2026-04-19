import { useEffect } from "react";
import { Link } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdBanner from "@/components/AdBanner";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";

export default function WaterIntake() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "How Much Water Should You Drink Per Day? SA Guide | BION";
  }, []);

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How Much Water Should You Drink Per Day? SA Guide",
      description:
        "Find out how much water you really need each day, with tips tailored for South Africa's climate and lifestyle.",
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
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-20">
      <div className="mx-auto max-w-3xl px-4 pt-16 space-y-6">
        <AdBanner slot="blog-top" format="horizontal" />

        <article className="prose prose-invert max-w-none">
          <h1>How Much Water Should You Drink Per Day?</h1>
          <p className="text-lg text-muted-foreground">
            A South African guide to staying properly hydrated — especially in
            our hot climate.
          </p>

          <h2>The General Guideline</h2>
          <p>
            The commonly cited "8 glasses a day" (about 2 litres) is a
            reasonable starting point, but the truth is more nuanced. The
            European Food Safety Authority recommends approximately:
          </p>
          <ul>
            <li><strong>Women:</strong> 2.0 litres of total fluids per day</li>
            <li><strong>Men:</strong> 2.5 litres of total fluids per day</li>
          </ul>
          <p>
            This includes water from all sources — drinking water, tea, coffee,
            juice, and the water content in food (fruits, vegetables, soups).
            About 20-30% of your daily water comes from food alone.
          </p>

          <h2>Why South Africans Need to Pay Extra Attention</h2>
          <p>
            South Africa's climate makes hydration particularly important. In
            Gauteng, summer temperatures regularly exceed 30 °C, while the
            Lowveld and Limpopo can hit 40 °C. Even coastal cities like Durban
            combine heat with high humidity, increasing sweat loss.
          </p>
          <p>
            If you commute by taxi or train without air conditioning, spend time
            outdoors, or exercise in the heat, your water needs increase
            significantly — sometimes by 50% or more.
          </p>

          <h2>Signs You Are Not Drinking Enough</h2>
          <ul>
            <li>Dark yellow or amber-coloured urine (aim for pale straw)</li>
            <li>Headaches, especially in the afternoon</li>
            <li>Fatigue and difficulty concentrating</li>
            <li>Dry mouth and lips</li>
            <li>Dizziness when standing up quickly</li>
          </ul>
          <p>
            Chronic mild dehydration is surprisingly common and often mistaken
            for hunger. Before reaching for a snack, try drinking a glass of
            water first.
          </p>

          <h2>How to Calculate Your Personal Water Needs</h2>
          <p>
            A practical rule of thumb: drink <strong>30-35 ml per kilogram of
            body weight</strong> per day. For a 70 kg person, that is
            2.1-2.45 litres.
          </p>
          <p>Increase this amount if you:</p>
          <ul>
            <li>Exercise (add 500-1000 ml per hour of activity)</li>
            <li>Live in a hot or dry area</li>
            <li>Are pregnant or breastfeeding</li>
            <li>Are ill with fever, vomiting, or diarrhoea</li>
            <li>Drink a lot of coffee or alcohol (both are mild diuretics)</li>
          </ul>

          <h2>Practical Tips for Drinking More Water</h2>
          <ul>
            <li>
              <strong>Carry a reusable bottle:</strong> A 750 ml bottle refilled
              3 times gets you to 2.25 litres. Available at any Checkers or
              Pick n Pay for under R100.
            </li>
            <li>
              <strong>Set reminders:</strong> BION's water tracker sends gentle
              nudges throughout the day so you do not forget.
            </li>
            <li>
              <strong>Flavour it naturally:</strong> Add cucumber, lemon, mint,
              or a slice of naartjie. Rooibos iced tea (unsweetened) also counts.
            </li>
            <li>
              <strong>Eat your water:</strong> Watermelon (92% water), cucumber
              (96%), oranges (87%), and tomatoes (95%) are widely available and
              affordable in South Africa.
            </li>
            <li>
              <strong>Drink before meals:</strong> A glass of water 30 minutes
              before eating aids digestion and helps with portion control.
            </li>
          </ul>

          <h2>Can You Drink Too Much Water?</h2>
          <p>
            Yes, but it is rare. Overhydration (hyponatraemia) occurs when you
            drink so much water that sodium levels in your blood become
            dangerously low. It is most common in endurance athletes — for
            example, during Comrades Marathon or Two Oceans. For most people,
            your kidneys can handle up to 0.8-1.0 litres per hour without issue.
          </p>

          <h2>Discovery Vitality and Water Tracking</h2>
          <p>
            If you are on Discovery Vitality, tracking your water intake can
            contribute to your overall health engagement score. Pair BION's
            water tracker with your Vitality goals for a convenient daily
            logging experience.
          </p>

          <h2>Start Tracking Today</h2>
          <p>
            Hydration is the simplest health habit to improve. Use BION's free
            water tracker to log glasses, see your daily progress, and build a
            streak.
          </p>
        </article>

        <GlassCard variant="accent-indigo" className="p-5 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">
            Try it now — free, no sign-up
          </h3>
          <Link
            to="/water-tracker"
            className="inline-block rounded-pill px-6 py-2.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Open Water Tracker &rarr;
          </Link>
        </GlassCard>

        <AdBanner slot="blog-bottom" format="rectangle" />
      </div>
      {user && <BottomNav />}
    </div>
  );
}
