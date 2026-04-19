import { useEffect } from "react";
import { Link } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdBanner from "@/components/AdBanner";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";

export default function SleepGuide() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "How to Improve Your Sleep Quality | Evidence-Based Tips | BION";
  }, []);

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How to Improve Your Sleep Quality | Evidence-Based Tips",
      description:
        "Science-backed strategies to fall asleep faster, sleep deeper, and wake up feeling refreshed.",
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
          <h1>How to Improve Your Sleep Quality</h1>
          <p className="text-lg text-muted-foreground">
            Evidence-based tips to help you fall asleep faster, stay asleep
            longer, and wake up feeling genuinely rested.
          </p>

          <h2>How Much Sleep Do You Actually Need?</h2>
          <p>
            The National Sleep Foundation recommends the following hours of
            sleep per night for adults:
          </p>
          <ul>
            <li><strong>Young adults (18-25):</strong> 7-9 hours</li>
            <li><strong>Adults (26-64):</strong> 7-9 hours</li>
            <li><strong>Older adults (65+):</strong> 7-8 hours</li>
          </ul>
          <p>
            Quality matters as much as quantity. Six hours of deep, uninterrupted
            sleep often leaves you feeling better than eight hours of fragmented,
            restless sleep.
          </p>

          <h2>Why Sleep Matters for Your Health</h2>
          <p>
            Sleep is not a passive activity — your body is doing critical work
            while you rest:
          </p>
          <ul>
            <li>
              <strong>Muscle repair and growth:</strong> Growth hormone is
              released primarily during deep sleep. If you train at the gym but
              sleep poorly, you are undermining your gains.
            </li>
            <li>
              <strong>Immune function:</strong> Chronic sleep deprivation
              reduces immune cell activity, making you more susceptible to colds
              and flu.
            </li>
            <li>
              <strong>Weight management:</strong> Poor sleep disrupts hunger
              hormones (ghrelin and leptin), increasing cravings for
              high-calorie foods.
            </li>
            <li>
              <strong>Mental health:</strong> Sleep deprivation is linked to
              anxiety, depression, and impaired decision-making.
            </li>
          </ul>

          <h2>Evidence-Based Sleep Hygiene Tips</h2>

          <h3>1. Keep a Consistent Sleep Schedule</h3>
          <p>
            Go to bed and wake up at the same time every day — including
            weekends. Your circadian rhythm thrives on regularity. Even a 30-minute
            shift can affect sleep quality.
          </p>

          <h3>2. Optimise Your Sleep Environment</h3>
          <ul>
            <li>
              <strong>Temperature:</strong> Keep your bedroom between 16-19 °C.
              South African summers can make this challenging — a fan or cooling
              sheet can help if you do not have aircon.
            </li>
            <li>
              <strong>Darkness:</strong> Use blackout curtains or an eye mask.
              Even small amounts of light from streetlamps or standby LEDs can
              suppress melatonin production.
            </li>
            <li>
              <strong>Noise:</strong> If you live in a noisy area, try a white
              noise app or earplugs.
            </li>
          </ul>

          <h3>3. Manage Screen Time</h3>
          <p>
            Blue light from phones, tablets, and laptops suppresses melatonin.
            Aim to stop screen use 60 minutes before bed. If that is not
            realistic, enable your phone's night mode or blue-light filter.
          </p>

          <h3>4. Watch Your Caffeine and Alcohol</h3>
          <p>
            Caffeine has a half-life of 5-6 hours. That 15:00 coffee is still in
            your system at bedtime. Switch to rooibos or herbal tea after lunch.
            Alcohol might help you fall asleep faster, but it fragments your
            sleep cycles and reduces REM sleep.
          </p>

          <h3>5. Exercise — But Time It Right</h3>
          <p>
            Regular exercise improves sleep quality significantly. However,
            intense workouts within 2-3 hours of bedtime can be stimulating.
            Morning or early-afternoon sessions are ideal. A gentle evening walk
            is fine.
          </p>

          <h3>6. Develop a Wind-Down Routine</h3>
          <p>
            Signal to your body that sleep is coming: read a book, take a warm
            shower, do light stretching, or practise breathing exercises. A
            consistent 20-30 minute routine trains your brain to transition into
            sleep mode.
          </p>

          <h3>7. Do Not Lie in Bed Awake</h3>
          <p>
            If you have not fallen asleep within 20 minutes, get up and do
            something calming in dim light — then return when you feel drowsy.
            Lying awake in bed trains your brain to associate the bed with
            wakefulness.
          </p>

          <h2>When to See a Professional</h2>
          <p>
            If you consistently struggle with sleep despite following good
            habits, you may have an underlying sleep disorder such as insomnia
            or sleep apnoea. Speak to your GP or find a sleep specialist on
            the <Link to="/directory">BION provider directory</Link>.
          </p>

          <h2>Track Your Progress</h2>
          <p>
            Improving sleep starts with awareness. Use BION's sleep tracker to
            log your bedtime, wake time, and sleep quality each day. Over a few
            weeks you will spot patterns and see which changes make the biggest
            difference.
          </p>
        </article>

        <GlassCard variant="accent-indigo" className="p-5 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">
            Try it now — free, no sign-up
          </h3>
          <Link
            to="/sleep-tracker"
            className="inline-block rounded-pill px-6 py-2.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Open Sleep Tracker &rarr;
          </Link>
        </GlassCard>

        <AdBanner slot="blog-bottom" format="rectangle" />
      </div>
      {user && <BottomNav />}
    </div>
  );
}
