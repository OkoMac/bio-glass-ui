// Per-provider SSR endpoint for SEO. The marketing site is a Vite SPA,
// which means /provider/:slug returns an empty React shell to crawlers
// — Googlebot saw 13k URLs that all looked identical and parked them
// in "Discovered – currently not indexed".
//
// This function intercepts /provider/:slug (via vercel.json rewrite),
// looks the provider up in the bundled directory data, and returns the
// SPA shell with provider-specific <title>, <meta description>,
// og:* tags, structured data, and a <noscript>-equivalent <h1>+bio
// block inside #root that the React app cleanly hydrates over.
//
// On cache miss / unknown slug we still return the SPA shell so the
// app's own 404 view renders.

import ptaData from "../../src/data/bion_pretoria_data.json" with { type: "json" };
import jhbData from "../../src/data/bion_johannesburg_data.json" with { type: "json" };

interface RawProvider {
  id: string;
  name: string;
  service: string;
  category?: string;
  suburb?: string;
  city?: string;
  location?: string;
  rating?: number | string;
  reviewCount?: number;
  review_count?: number;
  description?: string;
  phone?: string;
  website?: string;
  imageUrl?: string;
  servicesOffered?: string[];
}

const ALL_PROVIDERS: RawProvider[] = [
  ...((ptaData as { providers?: RawProvider[] }).providers ?? []),
  ...((jhbData as { providers?: RawProvider[] }).providers ?? []),
];
const BY_ID = new Map<string, RawProvider>(
  ALL_PROVIDERS.map((p) => [p.id, p]),
);

const SITE_ORIGIN = "https://www.bionhealth.co.za";

let shellPromise: Promise<string> | null = null;
function loadShell(): Promise<string> {
  if (!shellPromise) {
    shellPromise = fetch(`${SITE_ORIGIN}/index.html`, {
      // Vercel CDN cache for the shell; 5 min is enough — fresh deploys
      // restart the function anyway so this only matters within a
      // single deploy lifetime.
      headers: { "Cache-Control": "public, max-age=300" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`shell fetch ${r.status}`);
        return r.text();
      })
      .catch((err) => {
        // If the shell can't be fetched we want the next request to
        // try again instead of permanently caching a failure.
        shellPromise = null;
        throw err;
      });
  }
  return shellPromise;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSeoHead(p: RawProvider): string {
  const title = `${p.name} — ${p.service}${p.location ? `, ${p.location}` : ""} | BION`;
  const descRaw =
    (p.description && p.description.trim()) ||
    `${p.name} offers ${p.service}${p.location ? ` in ${p.location}` : ""}. Book on BION — Africa's health & wellness platform.`;
  const desc = descRaw.replace(/\s+/g, " ").slice(0, 300);
  const url = `${SITE_ORIGIN}/provider/${p.id}`;
  const image = p.imageUrl || `${SITE_ORIGIN}/og-image.png`;
  const ratingRaw = typeof p.rating === "string" ? parseFloat(p.rating) : p.rating;
  const reviewCount = p.reviewCount ?? p.review_count ?? 0;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: p.name,
    description: desc,
    url,
    image,
    address: p.location || p.suburb || p.city || undefined,
    telephone: p.phone || undefined,
  };
  if (ratingRaw && reviewCount > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingRaw,
      reviewCount,
    };
  }
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(desc)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(desc)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`,
  ].join("\n    ");
}

function buildSeoBody(p: RawProvider): string {
  const desc =
    (p.description && p.description.trim()) ||
    `${p.name} offers ${p.service}${p.location ? ` in ${p.location}` : ""}.`;
  const services = (p.servicesOffered ?? [p.service]).filter(Boolean).slice(0, 8);
  return [
    `<div id="seo-content" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;">`,
    `  <h1>${escapeHtml(p.name)}</h1>`,
    `  <p><strong>${escapeHtml(p.service)}</strong>${p.location ? ` — ${escapeHtml(p.location)}` : ""}</p>`,
    `  <p>${escapeHtml(desc)}</p>`,
    services.length > 0
      ? `  <h2>Services</h2><ul>${services.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
      : ``,
    `  <p>Book ${escapeHtml(p.name)} on BION — Africa's health and wellness platform.</p>`,
    `</div>`,
  ].join("\n");
}

function rewriteShell(shell: string, p: RawProvider): string {
  const head = buildSeoHead(p);
  const body = buildSeoBody(p);

  // 1. Replace the <title> + drop our SEO head block right after it.
  let out = shell.replace(
    /<title>[^<]*<\/title>/i,
    `${head}`,
  );
  // 1a. If for some reason there was no <title>, inject before </head>.
  if (out === shell) {
    out = out.replace(/<\/head>/i, `    ${head}\n  </head>`);
  }
  // 2. Strip the existing generic <meta name="description"> so we don't
  //    end up with two competing descriptions.
  out = out.replace(
    /<meta\s+name=["']description["'][^>]*>\s*/gi,
    "",
  );
  // 3. Inject the crawler-readable body block as the first child of #root.
  out = out.replace(
    /(<div id="root"[^>]*>)/i,
    `$1\n    ${body}`,
  );
  return out;
}

export default async function handler(req: any, res: any): Promise<void> {
  const slug = String(req.query?.slug ?? "").trim();
  let shell: string;
  try {
    shell = await loadShell();
  } catch {
    res.status(502).setHeader("Content-Type", "text/html");
    res.send("<!doctype html><title>BION</title><p>Service starting up — refresh in a moment.</p>");
    return;
  }

  const provider = slug ? BY_ID.get(slug) : undefined;
  if (!provider) {
    // Unknown slug: return the SPA shell unmodified so the app's own
    // 404 view renders. Mark as 404 to be honest with crawlers.
    res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
    res.send(shell);
    return;
  }

  const html = rewriteShell(shell, provider);
  res.status(200).setHeader("Content-Type", "text/html; charset=utf-8");
  // Edge cache for 1h, allow stale-while-revalidate so a cold-start fetch
  // doesn't block users behind it. Provider data is bundled into the
  // function so changes ride redeploys, not invalidations.
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
  res.send(html);
}
