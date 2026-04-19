import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AdBannerProps {
  slot: string;           // AdSense ad slot ID
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
}

export default function AdBanner({ slot, format = "auto", className = "" }: AdBannerProps) {
  const { user } = useAuth();
  const adRef = useRef<HTMLDivElement>(null);

  // Don't show ads to Premium subscribers or signed-in providers
  const subscription = user?.subscription;
  const isPremium = subscription?.tier && subscription.tier !== "free";
  const isProvider = user?.role === "provider" || user?.role === "admin";

  useEffect(() => {
    if (isPremium || isProvider) return;
    try {
      // @ts-ignore — adsbygoogle is injected by the script tag
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [isPremium, isProvider]);

  if (isPremium || isProvider) return null;

  return (
    <div className={`ad-container my-4 ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-PLACEHOLDER"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      <p className="text-[9px] text-muted-foreground/40 text-center mt-1">
        <a href="/welcome" className="hover:text-indigo">Go Premium</a> to remove ads
      </p>
    </div>
  );
}
