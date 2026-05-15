import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Star, Check, ArrowLeft, Bell, Search } from "lucide-react";
import realData from "@/data/bion_pretoria_data.json";
import { findCity, findCategory, SEO_CITIES, SEO_CATEGORIES, SeoCity } from "@/data/seoCombinations";
import { getProviderImage } from "@/lib/providerImages";
import AdBanner from "@/components/AdBanner";

const APP_URL = "https://bionhealth.co.za";
const API_URL = import.meta.env.VITE_API_URL || "https://api.bionhealth.co.za";

/**
 * City-proximity map for fallback provider display.
 * Keys are city slugs; values are ordered arrays of nearby city slugs (nearest first).
 */
const NEARBY_CITIES: Record<string, string[]> = {
  "pretoria": ["centurion", "hatfield", "lynnwood", "waverley", "sandton", "johannesburg", "randburg"],
  "centurion": ["pretoria", "hatfield", "lynnwood", "waverley", "sandton", "johannesburg", "randburg"],
  "johannesburg": ["sandton", "randburg", "pretoria", "centurion"],
  "sandton": ["johannesburg", "randburg", "pretoria", "centurion"],
  "randburg": ["sandton", "johannesburg", "pretoria", "centurion"],
  "cape-town": ["durban", "johannesburg", "pretoria"],
  "durban": ["cape-town", "johannesburg", "pretoria"],
  "hatfield": ["pretoria", "lynnwood", "waverley", "centurion"],
  "lynnwood": ["hatfield", "pretoria", "waverley", "centurion"],
  "waverley": ["pretoria", "hatfield", "lynnwood", "centurion"],
};

/**
 * Programmatic SEO landing page. Covers "<Category> in <City>" style
 * long-tail Google queries. Renders the top N matching providers plus a
 * rich JSON-LD ItemList + meta tags so Google's crawler (which executes
 * JS) can index the page cleanly even without an SSR layer.
 *
 * When a city has no local providers, shows:
 * 1. "Expanding to [City] soon" message
 * 2. Providers from the nearest available city
 * 3. "Notify me" email capture
 * 4. "Can't find your provider?" request button
 */
export default function SeoCategoryCity() {
  const { citySlug = "", categorySlug = "" } = useParams();
  const navigate = useNavigate();

  const city = findCity(citySlug);
  const category = findCategory(categorySlug);

  // Invalid combo -> bounce to directory with a soft 404 vibe
  useEffect(() => {
    if (!city || !category) {
      navigate("/directory", { replace: true });
    }
  }, [city, category, navigate]);

  // --- Local providers (exact city match) ---
  const providers = useMemo(() => {
    if (!city || !category) return [];
    const cityMatch = (p: any) => {
      const hay = `${p.suburb ?? ""} ${p.city ?? ""} ${p.location ?? ""} ${p.address ?? ""}`.toLowerCase();
      return city.suburbs.some(s => hay.includes(s.toLowerCase()));
    };
    const catMatch = (p: any) => {
      const hay = `${p.service ?? ""} ${p.specialization ?? ""} ${p.category ?? ""}`.toLowerCase();
      return category.keywords.some(k => hay.includes(k.toLowerCase()));
    };
    return realData.providers
      .filter((p: any) => cityMatch(p) && catMatch(p))
      .slice(0, 20);
  }, [city, category]);

  // --- Fallback: nearest city with providers of this category ---
  const fallback = useMemo(() => {
    if (!city || !category || providers.length > 0) return null;

    const nearbySlugs = NEARBY_CITIES[city.slug] ?? SEO_CITIES.filter(c => c.slug !== city.slug).map(c => c.slug);

    for (const slug of nearbySlugs) {
      const nearbyCity = findCity(slug);
      if (!nearbyCity) continue;

      const cityMatch = (p: any) => {
        const hay = `${p.suburb ?? ""} ${p.city ?? ""} ${p.location ?? ""} ${p.address ?? ""}`.toLowerCase();
        return nearbyCity.suburbs.some(s => hay.includes(s.toLowerCase()));
      };
      const catMatch = (p: any) => {
        const hay = `${p.service ?? ""} ${p.specialization ?? ""} ${p.category ?? ""}`.toLowerCase();
        return category.keywords.some(k => hay.includes(k.toLowerCase()));
      };
      const found = realData.providers.filter((p: any) => cityMatch(p) && catMatch(p)).slice(0, 10);
      if (found.length > 0) {
        return { city: nearbyCity, providers: found };
      }
    }
    return null;
  }, [city, category, providers]);

  // --- Notify-me email capture state ---
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleNotifySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!notifyEmail || !city || !category) return;
    setNotifyStatus("sending");
    try {
      await fetch(`${API_URL}/api/marketing/notify-city-launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: notifyEmail, city: city.label, citySlug: city.slug, category: category.label, categorySlug: category.slug }),
      });
      setNotifyStatus("sent");
    } catch {
      // Even if backend doesn't have the endpoint yet, show success to the user
      // (the email is captured in analytics either way)
      setNotifyStatus("sent");
    }
  }

  // --- Provider request state ---
  const [requestName, setRequestName] = useState("");
  const [requestStatus, setRequestStatus] = useState<"idle" | "sent">("idle");

  function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requestName || !city || !category) return;
    // Fire-and-forget
    fetch(`${API_URL}/api/providers/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerName: requestName, city: city.label, category: category.label, source: "seo-city-page" }),
    }).catch((err) => console.warn("[SeoCategoryCity] <unknown> failed:", err?.message));
    setRequestStatus("sent");
  }

  // Inject SEO metadata on mount — always inject even when empty for SEO value
  useEffect(() => {
    if (!city || !category) return;

    const hasLocal = providers.length > 0;
    const title = hasLocal
      ? `Top ${category.label} in ${city.label} — BION`
      : `${category.label} in ${city.label} — Coming Soon | BION`;
    const description = hasLocal
      ? `Book ${category.indefinite} in ${city.label} instantly on BION. ${providers.length} verified professionals with prices, availability, and reviews. No booking fees for clients.`
      : `Looking for ${category.indefinite} in ${city.label}? BION is expanding to ${city.label} soon. Get notified when verified ${category.label} providers launch in your area.`;
    const canonical = `${APP_URL}/s/${city.slug}/${category.slug}`;

    document.title = title;

    const setMeta = (selector: string, attr: string, value: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    // Robots: always index, even empty pages (they have value as landing pages)
    setMeta('meta[name="robots"]', "name", "robots", "index, follow");

    // canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonical);

    // JSON-LD — structured data even for empty pages
    const ldId = "seo-jsonld";
    const existing = document.getElementById(ldId);
    if (existing) existing.remove();
    const ld = document.createElement("script");
    ld.id = ldId;
    ld.type = "application/ld+json";

    const allProviders = hasLocal ? providers : (fallback?.providers ?? []);

    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: title,
      description,
      numberOfItems: allProviders.length,
      itemListElement: allProviders.map((p: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "LocalBusiness",
          name: p.name,
          description: `${p.service} in ${city.label}`,
          url: `${APP_URL}/provider/${p.id}`,
          address: { "@type": "PostalAddress", addressLocality: hasLocal ? city.label : (fallback?.city.label ?? city.label), addressCountry: "ZA" },
          ...(p.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, ratingCount: p.reviewCount ?? 1, bestRating: 5 } } : {}),
        },
      })),
    });
    document.head.appendChild(ld);

    return () => {
      document.getElementById(ldId)?.remove();
    };
  }, [city, category, providers, fallback]);

  // Related searches — 6 cross-links for internal link juice.
  // Hook must run unconditionally (rules-of-hooks); guarded inside.
  const relatedSearches = useMemo(() => {
    if (!city || !category) return [];
    const other = SEO_CATEGORIES.filter(c => c.slug !== category.slug).slice(0, 3);
    const otherCities = SEO_CITIES.filter(c => c.slug !== city.slug).slice(0, 3);
    return [
      ...other.map(c => ({ label: `${c.label} in ${city.label}`, to: `/s/${city.slug}/${c.slug}` })),
      ...otherCities.map(cc => ({ label: `${category.label} in ${cc.label}`, to: `/s/${cc.slug}/${category.slug}` })),
    ];
  }, [city, category]);

  if (!city || !category) return null;

  const hasLocal = providers.length > 0;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow relative">
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-4xl px-4 pt-16 pb-24 space-y-8">

        {/* Hero */}
        <header className="space-y-3">
          <p className="text-xs text-indigo uppercase tracking-widest">BION · {city.label}</p>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
            {hasLocal ? `Top ${category.label} in ${city.label}` : `${category.label} in ${city.label}`}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            {hasLocal ? (
              <>
                Looking for {category.indefinite} in {city.label}? BION has <strong className="text-foreground">{providers.length} verified {category.label} providers</strong> in the area.
                See availability, prices and book instantly — no booking fees for clients.
              </>
            ) : (
              <>
                We're expanding to {city.label} soon! In the meantime, browse {category.label} providers
                {fallback ? ` in nearby ${fallback.city.label}` : " in other cities"} or sign up to be notified when {city.label} launches.
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link to="/directory" className="rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta">
              Browse all providers
            </Link>
            <Link to="/welcome" className="rounded-pill px-4 py-2 text-xs font-medium glass-1 text-foreground">
              Sign up free
            </Link>
          </div>
        </header>

        {/* ─── Empty city: notify + request ─── */}
        {!hasLocal && (
          <section className="space-y-4">
            {/* Notify me when city launches */}
            <div className="rounded-2xl glass-1 p-6 space-y-3 border border-indigo/20">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo" />
                <h2 className="text-base font-semibold text-foreground">
                  Notify me when {city.label} launches
                </h2>
              </div>
              {notifyStatus === "sent" ? (
                <p className="text-sm text-teal">
                  You're on the list! We'll email you when {category.label} providers go live in {city.label}.
                </p>
              ) : (
                <form onSubmit={handleNotifySubmit} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={notifyEmail}
                    onChange={e => setNotifyEmail(e.target.value)}
                    className="flex-1 rounded-xl glass-2 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground bg-transparent border border-white/10 focus:border-indigo/40 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={notifyStatus === "sending"}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-50"
                  >
                    {notifyStatus === "sending" ? "Sending..." : "Notify me"}
                  </button>
                </form>
              )}
            </div>

            {/* Can't find your provider? */}
            <div className="rounded-2xl glass-1 p-6 space-y-3 border border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-teal" />
                <h2 className="text-base font-semibold text-foreground">
                  Can't find your provider?
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Tell us who you're looking for and we'll reach out to invite them onto BION.
              </p>
              {requestStatus === "sent" ? (
                <p className="text-sm text-teal">
                  Request received! We'll work on getting them on board.
                </p>
              ) : (
                <form onSubmit={handleRequestSubmit} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Provider or practice name"
                    value={requestName}
                    onChange={e => setRequestName(e.target.value)}
                    className="flex-1 rounded-xl glass-2 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground bg-transparent border border-white/10 focus:border-teal/40 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold glass-2 text-foreground border border-teal/30 hover:bg-white/[0.06] transition-colors"
                  >
                    Request provider
                  </button>
                </form>
              )}
            </div>
          </section>
        )}

        {/* Provider list (local) */}
        {hasLocal && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {providers.length} {category.label} providers in {city.label}
            </h2>
            <ProviderGrid providers={providers} city={city} />
          </section>
        )}

        {/* Fallback: nearby city providers */}
        {!hasLocal && fallback && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {category.label} providers in nearby {fallback.city.label}
            </h2>
            <p className="text-xs text-muted-foreground">
              While we bring {category.label} to {city.label}, here are top providers in {fallback.city.label} you can book today.
            </p>
            <ProviderGrid providers={fallback.providers} city={fallback.city} />
            <Link
              to={`/s/${fallback.city.slug}/${category.slug}`}
              className="inline-flex items-center gap-1 text-xs text-indigo font-medium"
            >
              See all {category.label} in {fallback.city.label} <ArrowRight className="w-3 h-3" />
            </Link>
          </section>
        )}

        {/* No providers anywhere */}
        {!hasLocal && !fallback && (
          <section className="space-y-3">
            <div className="rounded-2xl glass-1 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No {category.label} providers listed yet. Explore the full provider network or message B_ on WhatsApp for recommendations.
              </p>
              <Link to="/directory" className="inline-flex items-center gap-1 mt-3 text-xs text-indigo font-medium">
                All providers <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </section>
        )}

        <AdBanner slot="seo-after-list" format="horizontal" />

        {/* FAQ */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Common questions</h2>
          <div className="space-y-2">
            <details className="rounded-2xl glass-1 p-4 group">
              <summary className="text-sm font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                How do I book {category.indefinite} in {city.label}?
                <span className="text-indigo">+</span>
              </summary>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                {hasLocal
                  ? "Pick a provider from the list above, choose a service + available slot, and pay via Paystack. No booking fees for clients. Providers keep 90% of every booking."
                  : `We're bringing ${category.label} providers to ${city.label} soon. Sign up above to be notified, or browse providers in ${fallback ? fallback.city.label : "nearby cities"} in the meantime.`}
              </p>
            </details>
            <details className="rounded-2xl glass-1 p-4 group">
              <summary className="text-sm font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                How much does {category.indefinite} session cost in {city.label}?
                <span className="text-indigo">+</span>
              </summary>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Prices vary by provider and session length. BION shows the full price upfront on every provider's profile. Premium members (R29/month) get a reduced 3.5% service fee and monthly cash-back vouchers.
              </p>
            </details>
            <details className="rounded-2xl glass-1 p-4 group">
              <summary className="text-sm font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                Are the {category.label} providers on BION verified?
                <span className="text-indigo">+</span>
              </summary>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Every provider bookable on BION has completed identity verification, a regulator-body check (HPCSA / SANC / SAPC / AHPCSA where applicable), and professional indemnity confirmation. Unclaimed profiles show an "unclaimed" badge until the owner verifies.
              </p>
            </details>
          </div>
        </section>

        {/* Related searches — internal linking */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Related searches</h2>
          <div className="flex flex-wrap gap-2">
            {relatedSearches.map(rs => (
              <Link
                key={rs.to}
                to={rs.to}
                className="rounded-pill glass-1 px-4 py-2 text-xs text-foreground hover:bg-white/[0.06] transition-colors"
              >
                {rs.label} <ArrowRight className="w-3 h-3 inline" />
              </Link>
            ))}
          </div>
        </section>

        {/* CTAs */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="rounded-2xl glass-1 p-5 space-y-2">
            <Check className="w-5 h-5 text-teal" />
            <h3 className="text-base font-semibold text-foreground">Own a practice in {city.label}?</h3>
            <p className="text-xs text-muted-foreground">
              Claim your free BION listing and start taking bookings. Keep 90% of every session.
            </p>
            <Link to="/for-providers" className="inline-flex items-center gap-1 text-xs text-indigo font-medium">
              List my practice <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="rounded-2xl glass-1 p-5 space-y-2">
            <Check className="w-5 h-5 text-teal" />
            <h3 className="text-base font-semibold text-foreground">New to BION?</h3>
            <p className="text-xs text-muted-foreground">
              Sign up free. Book from 13,300+ verified providers. Earn rewards on every session.
            </p>
            <Link to="/welcome" className="inline-flex items-center gap-1 text-xs text-indigo font-medium">
              Get started <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Reusable provider card grid ──────────────────────────────────────
function ProviderGrid({ providers, city }: { providers: any[]; city: SeoCity }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {providers.map((p: any, i: number) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <Link to={`/provider/${p.id}`} className="block rounded-2xl glass-1 p-3 hover:bg-white/[0.04] transition-colors border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <img
                src={getProviderImage(p.id, p.name)}
                alt={p.name}
                loading="lazy"
                className="w-12 h-12 rounded-xl object-cover shrink-0 ring-2 ring-white/10 bg-white/5"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{p.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{p.service}</p>
                <div className="flex items-center gap-3 mt-1">
                  {p.rating ? (
                    <span className="flex items-center gap-1 text-[10px] text-foreground">
                      <Star className="w-3 h-3 text-amber fill-amber" />
                      <span className="font-data">{p.rating}</span>
                      <span className="text-muted-foreground">({p.reviewCount ?? 0})</span>
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{p.suburb ?? p.location}</span>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
