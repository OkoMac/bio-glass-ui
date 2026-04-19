import { useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Star, Check } from "lucide-react";
import realData from "@/data/bion_pretoria_data.json";
import { findCity, findCategory, SEO_CITIES, SEO_CATEGORIES } from "@/data/seoCombinations";
import { getProviderImage } from "@/lib/providerImages";
import AdBanner from "@/components/AdBanner";

const APP_URL = "https://bionhealth.co.za";

/**
 * Programmatic SEO landing page. Covers "<Category> in <City>" style
 * long-tail Google queries. Renders the top N matching providers plus a
 * rich JSON-LD ItemList + meta tags so Google's crawler (which executes
 * JS) can index the page cleanly even without an SSR layer.
 */
export default function SeoCategoryCity() {
  const { citySlug = "", categorySlug = "" } = useParams();
  const navigate = useNavigate();

  const city = findCity(citySlug);
  const category = findCategory(categorySlug);

  // Invalid combo → bounce to directory with a soft 404 vibe
  useEffect(() => {
    if (!city || !category) {
      navigate("/directory", { replace: true });
    }
  }, [city, category, navigate]);

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

  // Inject SEO metadata on mount
  useEffect(() => {
    if (!city || !category) return;
    const title = `Top ${category.label} in ${city.label} — BION`;
    const description = `Book ${category.indefinite} in ${city.label} instantly on BION. ${providers.length} verified professionals with prices, availability, and reviews. No booking fees for clients.`;
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

    // canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonical);

    // JSON-LD ItemList
    const ldId = "seo-jsonld";
    const existing = document.getElementById(ldId);
    if (existing) existing.remove();
    const ld = document.createElement("script");
    ld.id = ldId;
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: title,
      description,
      numberOfItems: providers.length,
      itemListElement: providers.map((p: any, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "LocalBusiness",
          name: p.name,
          description: `${p.service} in ${city.label}`,
          url: `${APP_URL}/provider/${p.id}`,
          address: { "@type": "PostalAddress", addressLocality: city.label, addressCountry: "ZA" },
          ...(p.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, ratingCount: p.reviewCount ?? 1, bestRating: 5 } } : {}),
        },
      })),
    });
    document.head.appendChild(ld);

    return () => {
      document.getElementById(ldId)?.remove();
    };
  }, [city, category, providers]);

  if (!city || !category) return null;

  // Related searches — 6 cross-links for internal link juice
  const relatedSearches = useMemo(() => {
    const other = SEO_CATEGORIES.filter(c => c.slug !== category.slug).slice(0, 3);
    const otherCities = SEO_CITIES.filter(c => c.slug !== city.slug).slice(0, 3);
    return [
      ...other.map(c => ({ label: `${c.label} in ${city.label}`, to: `/s/${city.slug}/${c.slug}` })),
      ...otherCities.map(cc => ({ label: `${category.label} in ${cc.label}`, to: `/s/${cc.slug}/${category.slug}` })),
    ];
  }, [city, category]);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow">
      <div className="mx-auto max-w-4xl px-4 pt-16 pb-24 space-y-8">

        {/* Hero */}
        <header className="space-y-3">
          <p className="text-xs text-indigo uppercase tracking-widest">BION · {city.label}</p>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
            Top {category.label} in {city.label}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Looking for {category.indefinite} in {city.label}? BION has <strong className="text-foreground">{providers.length} verified {category.label} providers</strong> in the area.
            See availability, prices and book instantly — no booking fees for clients.
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

        {/* Provider list */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            {providers.length} {category.label} providers in {city.label}
          </h2>
          {providers.length === 0 ? (
            <div className="rounded-2xl glass-1 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No {category.label} providers listed in {city.label} yet. Browse the full directory or message B_ on WhatsApp for recommendations.
              </p>
              <Link to="/directory" className="inline-flex items-center gap-1 mt-3 text-xs text-indigo font-medium">
                Full directory <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
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
          )}
        </section>

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
                Pick a provider from the list above, choose a service + available slot, and pay via Paystack. No booking fees for clients. Providers keep 90% of every booking.
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
                Every provider bookable on BION has completed identity verification, a regulator-body check (HPCSA / SANC / SAPC / AHPCSA where applicable), and professional indemnity confirmation. Directory-only listings show an "unclaimed" badge until the owner verifies.
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
              Sign up free. Book from 897+ verified providers. Earn rewards on every session.
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
