import type { CrawlResult, ServiceRecommendation, PriceHint } from "@/types/onboarding";

// ─── Business Type Taxonomy ───────────────────────────────────────────────────

const BUSINESS_PATTERNS: Record<string, { vertical: string; keywords: string[]; defaultServices: string[] }> = {
  gym: {
    vertical: "fitness",
    keywords: ["gym", "fitness", "training", "workout", "strength", "cardio", "crossfit", "boxing"],
    defaultServices: ["Personal Training", "Group Fitness Class", "Nutrition Assessment", "Body Composition Analysis"],
  },
  yoga: {
    vertical: "fitness",
    keywords: ["yoga", "pilates", "mindfulness", "meditation", "breathwork", "vinyasa", "hatha"],
    defaultServices: ["Yoga Class (Group)", "Private Yoga Session", "Meditation Session", "Breathwork Class"],
  },
  medical: {
    vertical: "medical",
    keywords: ["doctor", "clinic", "physician", "gp", "general practice", "medical", "health centre"],
    defaultServices: ["GP Consultation", "Annual Health Screening", "Script Renewal", "Sick Note Consultation"],
  },
  physio: {
    vertical: "medical",
    keywords: ["physiotherapy", "physio", "rehabilitation", "sport injury", "manual therapy", "biokineticist"],
    defaultServices: ["Initial Assessment", "Physiotherapy Session", "Biokinetics Session", "Sports Massage"],
  },
  beauty: {
    vertical: "beauty",
    keywords: ["salon", "hair", "nails", "beauty", "lashes", "brows", "waxing", "threading", "makeup"],
    defaultServices: ["Haircut & Style", "Colour Treatment", "Manicure & Pedicure", "Lash Extensions", "Facial Treatment"],
  },
  spa: {
    vertical: "beauty",
    keywords: ["spa", "massage", "relaxation", "wellness", "aromatherapy", "hot stone", "reflexology"],
    defaultServices: ["Swedish Massage (60 min)", "Deep Tissue Massage", "Couples Massage", "Hot Stone Therapy", "Body Wrap"],
  },
  nutrition: {
    vertical: "medical",
    keywords: ["dietitian", "nutritionist", "diet", "nutrition", "eating", "meal plan", "weight management"],
    defaultServices: ["Initial Nutrition Consult", "Follow-up Consultation", "Personalised Meal Plan", "Gut Health Assessment"],
  },
  mental: {
    vertical: "medical",
    keywords: ["psychologist", "therapist", "counsellor", "mental health", "therapy", "counselling", "anxiety", "depression"],
    defaultServices: ["Therapy Session (60 min)", "Initial Assessment", "Couples Therapy", "Group Therapy Session"],
  },
  dental: {
    vertical: "medical",
    keywords: ["dentist", "dental", "teeth", "orthodontics", "oral health", "smile"],
    defaultServices: ["Routine Check-up & Clean", "Scale & Polish", "Tooth Extraction", "Whitening Treatment"],
  },
  corporate: {
    vertical: "professional",
    keywords: ["corporate", "company", "enterprise", "business", "consulting", "hr", "employee", "staff"],
    defaultServices: ["Corporate Wellness Programme", "Team Health Screening", "Employee Assistance Programme", "Wellness Day"],
  },
  professional: {
    vertical: "professional",
    keywords: ["coaching", "life coach", "executive", "career", "leadership", "business coach"],
    defaultServices: ["1-on-1 Coaching Session", "Leadership Workshop", "Career Strategy Session", "Group Coaching"],
  },
};

// SA market pricing data (ZAR)
const SA_PRICING: Record<string, { min: number; max: number; unit: string }> = {
  "Personal Training":            { min: 350, max: 800, unit: "session" },
  "Group Fitness Class":          { min: 120, max: 280, unit: "class" },
  "Yoga Class (Group)":           { min: 120, max: 250, unit: "class" },
  "Private Yoga Session":         { min: 300, max: 600, unit: "session" },
  "Meditation Session":           { min: 150, max: 300, unit: "session" },
  "GP Consultation":              { min: 600, max: 1200, unit: "consult" },
  "Annual Health Screening":      { min: 900, max: 2500, unit: "package" },
  "Physiotherapy Session":        { min: 500, max: 900, unit: "session" },
  "Initial Assessment":           { min: 600, max: 1200, unit: "session" },
  "Biokinetics Session":          { min: 400, max: 750, unit: "session" },
  "Sports Massage":               { min: 350, max: 650, unit: "60 min" },
  "Haircut & Style":              { min: 150, max: 600, unit: "service" },
  "Colour Treatment":             { min: 450, max: 2500, unit: "service" },
  "Manicure & Pedicure":          { min: 200, max: 550, unit: "service" },
  "Lash Extensions":              { min: 350, max: 900, unit: "set" },
  "Swedish Massage (60 min)":     { min: 350, max: 650, unit: "session" },
  "Deep Tissue Massage":          { min: 400, max: 750, unit: "session" },
  "Therapy Session (60 min)":     { min: 800, max: 1600, unit: "session" },
  "Couples Therapy":              { min: 1000, max: 2000, unit: "session" },
  "Initial Nutrition Consult":    { min: 500, max: 900, unit: "consult" },
  "Routine Check-up & Clean":     { min: 450, max: 900, unit: "visit" },
  "1-on-1 Coaching Session":      { min: 800, max: 2500, unit: "session" },
  "Corporate Wellness Programme": { min: 3000, max: 15000, unit: "month" },
  "Nutrition Assessment":         { min: 400, max: 750, unit: "session" },
  "Body Composition Analysis":    { min: 250, max: 500, unit: "session" },
};

const DEFAULT_PRICING = { min: 300, max: 600, unit: "session" };

// ─── URL Analyser (no-crawl fallback) ────────────────────────────────────────

function detectBusinessTypeFromUrl(url: string, text = ""): string {
  const combined = (url + " " + text).toLowerCase();
  for (const [key, meta] of Object.entries(BUSINESS_PATTERNS)) {
    if (meta.keywords.some((k) => combined.includes(k))) return key;
  }
  return "professional";
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const freq: Record<string, number> = {};
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([w]) => w);
}

function extractPriceHints(text: string): PriceHint[] {
  const matches = text.match(/(?:R|ZAR)\s*[\d\s,]+(?:\.\d{2})?(?:\s*(?:per|\/)\s*\w+)?/gi) ?? [];
  return matches.slice(0, 8).map((m) => ({ service: "Detected price", hint: m.trim() }));
}

// ─── HTML Parser ─────────────────────────────────────────────────────────────

function parseHtmlToCrawlResult(html: string, url: string): CrawlResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const title = doc.querySelector("title")?.textContent?.trim() ?? "";
  const metaDesc =
    doc.querySelector("meta[name='description']")?.getAttribute("content") ??
    doc.querySelector("meta[property='og:description']")?.getAttribute("content") ??
    "";

  const h1s = Array.from(doc.querySelectorAll("h1")).map((h) => h.textContent?.trim()).filter(Boolean) as string[];
  const h2s = Array.from(doc.querySelectorAll("h2")).map((h) => h.textContent?.trim()).filter(Boolean) as string[];
  const listItems = Array.from(doc.querySelectorAll("li"))
    .map((li) => li.textContent?.trim())
    .filter((t): t is string => Boolean(t) && t.length > 3 && t.length < 120)
    .slice(0, 25);

  const bodyText = doc.body?.textContent ?? "";

  const phoneMatch = bodyText.match(/(?:\+27|0)[6-8]\d{8}/)?.[0];
  const emailMatch = bodyText.match(/[\w.+-]+@[\w.-]+\.\w{2,}/)?.[0];

  const allLinks = Array.from(doc.querySelectorAll("a[href]")).map((a) => a.getAttribute("href") ?? "");
  const socialLinks = allLinks
    .filter((l) => /facebook\.com|instagram\.com|twitter\.com|linkedin\.com|tiktok\.com/i.test(l))
    .slice(0, 5);

  const rawExcerpts = [...h1s, ...h2s, ...listItems].slice(0, 20);
  const combined = [title, metaDesc, ...rawExcerpts].join(" ");
  const businessType = detectBusinessTypeFromUrl(url, combined);
  const meta = BUSINESS_PATTERNS[businessType] ?? BUSINESS_PATTERNS.professional;

  const services = rawExcerpts
    .filter((e) => meta.keywords.some((k) => e.toLowerCase().includes(k)) || e.length > 10)
    .slice(0, 8);

  if (services.length < 3) services.push(...meta.defaultServices.slice(0, 4 - services.length));

  return {
    url,
    businessName: h1s[0] || title.split("|")[0].split("–")[0].split("-")[0].trim(),
    description: metaDesc || h2s[0] || rawExcerpts[1],
    services,
    priceHints: extractPriceHints(bodyText),
    location: undefined,
    phone: phoneMatch,
    email: emailMatch,
    socialLinks,
    keywords: extractKeywords(combined),
    businessType,
    vertical: meta.vertical,
    rawExcerpts,
    crawledAt: new Date().toISOString(),
    success: true,
  };
}

// ─── URL-only Fallback ────────────────────────────────────────────────────────

function analyseFallback(url: string): CrawlResult {
  const businessType = detectBusinessTypeFromUrl(url);
  const meta = BUSINESS_PATTERNS[businessType] ?? BUSINESS_PATTERNS.professional;

  const domainParts = url
    .replace(/https?:\/\//, "")
    .replace(/www\./, "")
    .split(/[./]/);
  const businessName = domainParts[0]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    url,
    businessName,
    description: `A ${businessType} business based in South Africa.`,
    services: meta.defaultServices,
    priceHints: [],
    socialLinks: [],
    keywords: meta.keywords.slice(0, 6),
    businessType,
    vertical: meta.vertical,
    rawExcerpts: [],
    crawledAt: new Date().toISOString(),
    success: false,
  };
}

// ─── Main Crawler ─────────────────────────────────────────────────────────────

export async function crawlWebsite(rawUrl: string): Promise<CrawlResult> {
  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, {
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error("Proxy error");
    const data = (await response.json()) as { contents: string; status: { url: string } };
    if (!data.contents) throw new Error("Empty response");
    return parseHtmlToCrawlResult(data.contents, url);
  } catch {
    return analyseFallback(url);
  }
}

// ─── Service Recommendations ─────────────────────────────────────────────────

export function generateServiceRecommendations(crawl: CrawlResult): ServiceRecommendation[] {
  const meta = BUSINESS_PATTERNS[crawl.businessType ?? "professional"] ?? BUSINESS_PATTERNS.professional;
  const servicePool = crawl.services.length >= 3 ? crawl.services : meta.defaultServices;

  return servicePool.slice(0, 6).map((name, i) => {
    const pricing = SA_PRICING[name] ?? DEFAULT_PRICING;
    const confidence: ServiceRecommendation["confidence"] =
      i < 2 ? "high" : i < 4 ? "medium" : "low";

    return {
      name,
      description: `Professional ${name.toLowerCase()} service offered by ${crawl.businessName ?? "your practice"}.`,
      category: meta.vertical,
      duration: name.toLowerCase().includes("consult") || name.toLowerCase().includes("assessment") ? 60 : 45,
      suggestedPrice: {
        min: pricing.min,
        max: pricing.max,
        currency: "ZAR",
      },
      rationale: `Based on your ${crawl.businessType} business profile and current SA market rates — similar providers charge R${pricing.min}–R${pricing.max} per ${pricing.unit}.`,
      confidence,
    };
  });
}

// ─── Corporate Wellness Recommendations ──────────────────────────────────────

export function generateCorporateRecommendations(crawl: CrawlResult): {
  suggestedBudget: number;
  categories: string[];
  programName: string;
  rationale: string;
} {
  const isCorporate = crawl.businessType === "corporate";
  const budget = isCorporate ? 1200 : 800;

  return {
    suggestedBudget: budget,
    programName: `${crawl.businessName ?? "Company"} Wellness Programme`,
    categories: ["Fitness & Movement", "Mental Health", "Nutrition", "Preventive Medical"],
    rationale: `Based on your company profile and SA corporate wellness benchmarks, a budget of R${budget}/employee/month delivers measurable ROI through reduced absenteeism and improved productivity.`,
  };
}
