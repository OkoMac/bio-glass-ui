import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
}

export default function AdBanner({ slot, format = "auto", className = "" }: AdBannerProps) {
  const { user } = useAuth();
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  const subscription = user?.subscription;
  const isPremium = subscription?.tier && subscription.tier !== "free";
  const isProvider = user?.role === "provider" || user?.role === "admin";

  useEffect(() => {
    if (isPremium || isProvider) return;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}

    // Check if ad actually rendered (has height) after 2 seconds
    const timer = setTimeout(() => {
      const ins = adRef.current?.querySelector("ins");
      if (ins && ins.offsetHeight > 10) {
        setAdLoaded(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isPremium, isProvider]);

  if (isPremium || isProvider) return null;

  // Don't take up space until ad actually loads
  // This prevents the blank black block on mobile
  return (
    <div
      className={`ad-container ${adLoaded ? "my-4" : ""} ${className}`}
      ref={adRef}
      style={adLoaded ? undefined : { maxHeight: 0, overflow: "hidden" }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7532216743551384"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      {adLoaded && (
        <p className="text-[9px] text-muted-foreground/40 text-center mt-1">
          <a href="/welcome" className="hover:text-indigo">Go Premium</a> to remove ads
        </p>
      )}
    </div>
  );
}
