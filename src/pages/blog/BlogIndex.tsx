import { useEffect } from "react";
import { Link } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";

const ARTICLES = [
  {
    title: "How Many Calories Should I Eat Per Day?",
    description:
      "Learn about BMR, TDEE, and SA food examples to find your ideal calorie intake.",
    href: "/blog/how-many-calories-should-i-eat",
    gradient: "from-indigo-500 to-violet-600",
  },
  {
    title: "What is BMI? Calculator & Guide",
    description:
      "Understand Body Mass Index, what the ranges mean, and calculate yours instantly.",
    href: "/blog/what-is-bmi",
    gradient: "from-teal-500 to-cyan-600",
  },
  {
    title: "How Much Water Should You Drink Per Day?",
    description:
      "Daily water intake guidelines tailored for South Africa's hot climate.",
    href: "/blog/how-much-water-should-i-drink",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    title: "How to Improve Your Sleep Quality",
    description:
      "Evidence-based tips to fall asleep faster and wake up refreshed.",
    href: "/blog/how-to-improve-sleep",
    gradient: "from-purple-500 to-fuchsia-600",
  },
  {
    title: "Find a Verified Health Provider Near You",
    description:
      "How to find trusted physiotherapists, trainers, and wellness pros in SA.",
    href: "/blog/find-health-provider-near-me",
    gradient: "from-amber-500 to-orange-600",
  },
];

export default function BlogIndex() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Health & Wellness Blog | BION";
  }, []);

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "BION Health & Wellness Blog",
      description:
        "Free health guides, calculators, and wellness tips for South Africans.",
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
      <div className="mx-auto max-w-4xl px-4 pt-16 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Health &amp; Wellness Blog
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Free guides, calculators, and evidence-based tips — written for
            South Africans.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((a) => (
            <Link key={a.href} to={a.href} className="block group">
              <GlassCard hover className="overflow-hidden h-full flex flex-col">
                {/* Gradient thumbnail placeholder */}
                <div
                  className={`h-36 w-full bg-gradient-to-br ${a.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}
                />
                <div className="p-4 flex-1 flex flex-col">
                  <h2 className="text-base font-semibold text-foreground mb-1 group-hover:text-indigo transition-colors">
                    {a.title}
                  </h2>
                  <p className="text-sm text-muted-foreground flex-1">
                    {a.description}
                  </p>
                  <span className="mt-3 text-xs font-medium text-indigo">
                    Read more &rarr;
                  </span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
      {user && <BottomNav />}
    </div>
  );
}
