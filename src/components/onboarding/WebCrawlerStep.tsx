import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import type { CrawlResult, ServiceRecommendation } from "@/types/onboarding";
import { crawlWebsite, generateServiceRecommendations, generateCorporateRecommendations } from "@/lib/webcrawler";

interface Props {
  title: string;
  subtitle?: string;
  mode?: "provider" | "corporate";
  onCrawlComplete: (result: CrawlResult, recommendations: ServiceRecommendation[]) => void;
  existingCrawl?: CrawlResult;
}

type CrawlPhase = "idle" | "fetching" | "parsing" | "analysing" | "done" | "error";

const PHASE_MESSAGES: Record<CrawlPhase, string> = {
  idle: "",
  fetching: "Fetching your website…",
  parsing: "Reading page content…",
  analysing: "Analysing with AI…",
  done: "Analysis complete!",
  error: "Couldn't reach the site — using URL analysis instead.",
};

export function WebCrawlerStep({ title, subtitle, mode = "provider", onCrawlComplete, existingCrawl }: Props) {
  const [url, setUrl] = useState(existingCrawl?.url ?? "");
  const [phase, setPhase] = useState<CrawlPhase>(existingCrawl ? "done" : "idle");
  const [crawl, setCrawl] = useState<CrawlResult | null>(existingCrawl ?? null);
  const [recommendations, setRecommendations] = useState<ServiceRecommendation[]>([]);
  const [editingService, setEditingService] = useState<number | null>(null);
  const [editedRecs, setEditedRecs] = useState<ServiceRecommendation[]>([]);
  const [corporateRec, setCorporateRec] = useState<ReturnType<typeof generateCorporateRecommendations> | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const runCrawl = async () => {
    if (!url.trim()) return;
    setPhase("fetching");

    await delay(600);
    setPhase("parsing");

    const result = await crawlWebsite(url.trim());
    setPhase("analysing");

    await delay(800);

    const recs = generateServiceRecommendations(result);
    const corpRec = mode === "corporate" ? generateCorporateRecommendations(result) : null;

    setCrawl(result);
    setRecommendations(recs);
    setEditedRecs(recs);
    setCorporateRec(corpRec);
    setPhase("done");
    onCrawlComplete(result, recs);
  };

  const updateRec = (index: number, field: keyof ServiceRecommendation, value: unknown) => {
    setEditedRecs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updatePrice = (index: number, minOrMax: "min" | "max", value: string) => {
    setEditedRecs((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        suggestedPrice: {
          ...updated[index].suggestedPrice,
          [minOrMax]: parseInt(value) || 0,
        },
      };
      return updated;
    });
  };

  const confirmEdits = () => {
    setEditingService(null);
    if (crawl) onCrawlComplete(crawl, editedRecs);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Your business website URL</label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center glass-1 rounded-xl border border-white/5 px-4 py-3 gap-2">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runCrawl()}
              placeholder="e.g. yourpractice.co.za"
              type="url"
              className="flex-1 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={runCrawl}
            disabled={!url.trim() || phase === "fetching" || phase === "parsing" || phase === "analysing"}
            className="px-4 py-3 rounded-xl gradient-indigo text-primary-foreground text-sm font-semibold disabled:opacity-40 shrink-0"
          >
            {phase === "fetching" || phase === "parsing" || phase === "analysing" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Analyse"
            )}
          </motion.button>
        </div>
      </div>

      {/* Progress phases */}
      <AnimatePresence>
        {(phase === "fetching" || phase === "parsing" || phase === "analysing") && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 glass-1 rounded-xl p-4 border border-indigo/20"
          >
            <Loader2 className="w-5 h-5 text-indigo animate-spin shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{PHASE_MESSAGES[phase]}</p>
              <p className="text-xs text-muted-foreground">Please wait…</p>
            </div>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 glass-1 rounded-xl p-4 border border-coral/30"
          >
            <AlertCircle className="w-5 h-5 text-coral shrink-0" />
            <p className="text-sm text-muted-foreground">{PHASE_MESSAGES.error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {phase === "done" && crawl && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Business summary */}
          <div className="glass-1 rounded-xl p-4 border border-teal/20 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-teal" />
              <span className="text-sm font-semibold text-foreground">
                {crawl.success ? "Website analysed" : "URL analysis complete"}
              </span>
            </div>
            {crawl.businessName && (
              <p className="text-sm text-foreground font-medium">{crawl.businessName}</p>
            )}
            {crawl.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{crawl.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {crawl.keywords.slice(0, 6).map((k) => (
                <span key={k} className="text-[10px] px-2 py-0.5 glass-1 rounded-pill border border-white/5 text-muted-foreground capitalize">
                  {k}
                </span>
              ))}
            </div>
          </div>

          {/* Corporate recommendations */}
          {mode === "corporate" && corporateRec && (
            <div className="glass-1 rounded-xl p-4 border border-amber-400/20 space-y-3">
              <p className="text-sm font-semibold text-foreground">💼 Programme Recommendation</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{corporateRec.rationale}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="glass-1 rounded-lg p-2 border border-white/5">
                  <p className="text-xs text-muted-foreground">Suggested Budget</p>
                  <p className="text-sm font-semibold text-foreground">R{corporateRec.suggestedBudget}/employee/mo</p>
                </div>
                <div className="glass-1 rounded-lg p-2 border border-white/5">
                  <p className="text-xs text-muted-foreground">Programme Name</p>
                  <p className="text-sm font-semibold text-foreground truncate">{corporateRec.programName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Recommended categories:</p>
                <div className="flex flex-wrap gap-1">
                  {corporateRec.categories.map((c) => (
                    <span key={c} className="text-[10px] px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 rounded-pill text-amber-300">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Service recommendations */}
          {mode === "provider" && editedRecs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">📋 Recommended Services</p>
                <span className="text-[10px] text-muted-foreground">Tap any service to edit</span>
              </div>
              {editedRecs.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="glass-1 rounded-xl border border-white/5 overflow-hidden"
                >
                  <button
                    onClick={() => setEditingService(editingService === i ? null : i)}
                    className="w-full flex items-start gap-3 p-3 text-left"
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: rec.confidence === "high" ? "#0D9488" : rec.confidence === "medium" ? "#F59E0B" : "#6B7280" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{rec.name}</p>
                      <p className="text-xs text-muted-foreground">
                        R{rec.suggestedPrice.min}–R{rec.suggestedPrice.max} · {rec.duration} min
                      </p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-pill glass-1 text-muted-foreground capitalize shrink-0">{rec.confidence}</span>
                    {editingService === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {editingService === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      className="border-t border-white/5 p-3 space-y-3"
                    >
                      <div>
                        <label className="text-[10px] text-muted-foreground">Service Name</label>
                        <input
                          value={rec.name}
                          onChange={(e) => updateRec(i, "name", e.target.value)}
                          className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/5 outline-none mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Description</label>
                        <textarea
                          value={rec.description}
                          onChange={(e) => updateRec(i, "description", e.target.value)}
                          rows={2}
                          className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/5 outline-none mt-1 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">Min Price (R)</label>
                          <input
                            type="number"
                            value={rec.suggestedPrice.min}
                            onChange={(e) => updatePrice(i, "min", e.target.value)}
                            className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/5 outline-none mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Max Price (R)</label>
                          <input
                            type="number"
                            value={rec.suggestedPrice.max}
                            onChange={(e) => updatePrice(i, "max", e.target.value)}
                            className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/5 outline-none mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Duration (min)</label>
                          <input
                            type="number"
                            value={rec.duration}
                            onChange={(e) => updateRec(i, "duration", parseInt(e.target.value) || 60)}
                            className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/5 outline-none mt-1"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">💡 {rec.rationale}</p>
                      <button
                        onClick={confirmEdits}
                        className="flex items-center gap-1.5 text-xs text-indigo font-medium"
                      >
                        <Pencil className="w-3 h-3" />
                        Save changes
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Raw excerpts (collapsible) */}
          {crawl.rawExcerpts.length > 0 && (
            <div>
              <button
                onClick={() => setShowRaw((v) => !v)}
                className="text-xs text-muted-foreground flex items-center gap-1"
              >
                {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showRaw ? "Hide" : "Show"} raw page content
              </button>
              {showRaw && (
                <div className="mt-2 glass-1 rounded-xl p-3 border border-white/5 space-y-1">
                  {crawl.rawExcerpts.map((ex, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground">{ex}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skip option */}
          <p className="text-[11px] text-muted-foreground text-center">
            Not happy with the results? You can edit any service manually on the next step.
          </p>
        </motion.div>
      )}

      {/* No website? */}
      {phase === "idle" && (
        <p className="text-xs text-muted-foreground text-center">
          Don't have a website?{" "}
          <button
            onClick={() => {
              const fakeCrawl: CrawlResult = {
                url: "manual",
                businessName: "",
                services: [],
                priceHints: [],
                socialLinks: [],
                keywords: [],
                businessType: "professional",
                rawExcerpts: [],
                crawledAt: new Date().toISOString(),
                success: false,
              };
              setCrawl(fakeCrawl);
              setRecommendations([]);
              setEditedRecs([]);
              setPhase("done");
              onCrawlComplete(fakeCrawl, []);
            }}
            className="text-indigo underline"
          >
            Skip — I'll fill in manually
          </button>
        </p>
      )}
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
