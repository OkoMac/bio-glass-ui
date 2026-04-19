import { useEffect } from "react";
import { Link } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdBanner from "@/components/AdBanner";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";

export default function FindProvider() {
  const { user } = useAuth();

  useEffect(() => {
    document.title =
      "How to Find a Verified Health & Wellness Provider Near You | BION";
  }, []);

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline:
        "How to Find a Verified Health & Wellness Provider Near You",
      description:
        "A guide to finding trusted physiotherapists, personal trainers, dietitians, beauty salons, and more across South Africa.",
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
          <h1>How to Find a Verified Health &amp; Wellness Provider Near You</h1>
          <p className="text-lg text-muted-foreground">
            Whether you need a physiotherapist in Pretoria, a personal trainer
            in Johannesburg, or a beauty salon in Cape Town — here is how to
            find someone you can trust.
          </p>

          <h2>The Challenge of Finding Good Providers in South Africa</h2>
          <p>
            South Africa has a wealth of talented health and wellness
            professionals, but finding them can be frustrating. Google results
            are cluttered with outdated listings, unverified profiles, and
            businesses that have closed. Social media recommendations are
            helpful but limited to your personal network.
          </p>
          <p>
            The result? People often settle for whoever is closest or cheapest,
            rather than who is best suited to their needs. That is a problem
            when your health is on the line.
          </p>

          <h2>What to Look for in a Health Provider</h2>
          <p>
            Whether you are booking a physiotherapy session or a facial, these
            criteria apply:
          </p>
          <ul>
            <li>
              <strong>Verified qualifications:</strong> For regulated
              professions (physiotherapy, dietetics, psychology, nursing), check
              that the provider is registered with the relevant statutory body —
              HPCSA, AHPCSA, or the South African Nursing Council.
            </li>
            <li>
              <strong>Reviews from real clients:</strong> Look for detailed,
              specific reviews rather than generic five-star ratings.
            </li>
            <li>
              <strong>Transparent pricing:</strong> A reputable provider will
              share their rates upfront. In South Africa, session prices
              typically range from R350-R800 for allied health consultations and
              R150-R600 for beauty and wellness treatments.
            </li>
            <li>
              <strong>Professional insurance:</strong> This protects both you
              and the provider in case something goes wrong.
            </li>
            <li>
              <strong>Easy booking:</strong> If you have to phone three times to
              make an appointment, that is a red flag for how the practice is
              managed.
            </li>
          </ul>

          <h2>Types of Providers You Can Find on BION</h2>
          <p>
            BION's directory covers the full spectrum of health and wellness:
          </p>
          <ul>
            <li>
              <strong>Medical:</strong> Physiotherapists, biokineticists,
              dietitians, occupational therapists, psychologists, chiropractors
            </li>
            <li>
              <strong>Fitness:</strong> Personal trainers, group fitness
              instructors, yoga teachers, CrossFit coaches, running clubs
            </li>
            <li>
              <strong>Beauty &amp; grooming:</strong> Hair salons, nail
              technicians, skincare therapists, barbers, makeup artists
            </li>
            <li>
              <strong>Wellness:</strong> Life coaches, massage therapists,
              meditation instructors, traditional healers
            </li>
            <li>
              <strong>Veterinary:</strong> Vets, pet groomers, animal
              behaviourists
            </li>
          </ul>

          <h2>How BION Verifies Providers</h2>
          <p>
            Every provider on BION goes through a verification process:
          </p>
          <ul>
            <li>
              <strong>Identity verification:</strong> We confirm the provider is
              who they say they are.
            </li>
            <li>
              <strong>Qualification check:</strong> For regulated professions,
              we verify registration with the appropriate council.
            </li>
            <li>
              <strong>Client reviews:</strong> Only clients who have completed a
              booking can leave a review — no fake ratings.
            </li>
            <li>
              <strong>Verified badge:</strong> Providers who complete all
              checks receive a verification badge on their profile.
            </li>
          </ul>

          <h2>Finding a Provider by Location</h2>
          <p>
            BION's directory lets you search by city, suburb, or even by
            proximity to your current location. Popular searches include:
          </p>
          <ul>
            <li>Physiotherapist in Sandton</li>
            <li>Personal trainer in Menlyn, Pretoria</li>
            <li>Dietitian in Umhlanga, Durban</li>
            <li>Hair salon in Stellenbosch</li>
            <li>Biokineticist in Centurion</li>
            <li>Psychologist in Rosebank, Johannesburg</li>
          </ul>
          <p>
            You can filter by price range, rating, availability, and whether
            the provider accepts medical aid.
          </p>

          <h2>Booking Through BION</h2>
          <p>
            Once you find a provider, booking is straightforward:
          </p>
          <ul>
            <li>View their available time slots in real time</li>
            <li>Book instantly — no phone calls needed</li>
            <li>Receive confirmation via WhatsApp or email</li>
            <li>Pay securely through BION (card, EFT, or SnapScan)</li>
            <li>Get automated reminders before your appointment</li>
          </ul>
          <p>
            After your session, you can rate the provider and leave a review to
            help others make informed choices.
          </p>

          <h2>Start Your Search</h2>
          <p>
            Finding the right health and wellness provider should not be a
            gamble. Browse BION's verified directory and book with confidence.
          </p>
        </article>

        <GlassCard variant="accent-indigo" className="p-5 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">
            Find a provider near you
          </h3>
          <Link
            to="/directory"
            className="inline-block rounded-pill px-6 py-2.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Browse Directory &rarr;
          </Link>
        </GlassCard>

        <AdBanner slot="blog-bottom" format="rectangle" />
      </div>
      {user && <BottomNav />}
    </div>
  );
}
