import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ChevronRight } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Campaign {
  id: string;
  title: string;
  description: string;
  type: string;
  cta_text: string;
  cta_url: string;
  banner_image_url: string | null;
  discount_pct: number | null;
  discount_fixed: number | null;
  end_date: string;
}

export default function CampaignBanner() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed this session
    const dismissedId = sessionStorage.getItem("bion_campaign_dismissed");

    fetch(`${API}/api/campaigns/active`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok && res.data?.length > 0) {
          const c = res.data[0];
          if (c.id !== dismissedId) {
            setCampaign(c);
          }
        }
      })
      .catch(() => {});
  }, []);

  if (!campaign || dismissed) return null;

  // Check if campaign has expired client-side
  if (new Date(campaign.end_date) < new Date()) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("bion_campaign_dismissed", campaign.id);
  };

  const discount = campaign.discount_pct
    ? `${campaign.discount_pct}% OFF`
    : campaign.discount_fixed
    ? `R${campaign.discount_fixed} OFF`
    : null;

  const typeColors: Record<string, string> = {
    seasonal: "from-teal/20 to-indigo/20 border-teal/30",
    flash: "from-coral/20 to-amber/20 border-coral/30",
    holiday: "from-amber/20 to-teal/20 border-amber/30",
    custom: "from-indigo/20 to-violet/20 border-indigo/30",
  };

  const bgClass = typeColors[campaign.type] || typeColors.custom;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`relative rounded-2xl border bg-gradient-to-r ${bgClass} p-4 mb-4 overflow-hidden`}
      >
        {campaign.banner_image_url && (
          <img
            src={campaign.banner_image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20 rounded-2xl"
          />
        )}

        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 w-6 h-6 rounded-full glass-2 flex items-center justify-center text-muted-foreground hover:text-foreground z-10"
         aria-label="Close" title="Close">
          <X className="w-3 h-3" />
        </button>

        <div className="relative z-[1] flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles className="w-5 h-5 text-amber" />
            {discount && (
              <span className="px-2 py-0.5 rounded-pill text-[10px] font-bold bg-amber/20 text-amber border border-amber/30">
                {discount}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {campaign.title}
            </h3>
            {campaign.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {campaign.description}
              </p>
            )}
          </div>

          {campaign.cta_url && (
            <a
              href={campaign.cta_url}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-pill text-[11px] font-semibold gradient-indigo text-primary-foreground shadow-cta"
            >
              {campaign.cta_text || "Learn More"}
              <ChevronRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
