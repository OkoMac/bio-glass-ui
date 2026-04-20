import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
}

/**
 * Only renders the ad when AdSense actually delivers a filled ad.
 * When AdSense is pending approval or the slot is unfilled, renders NOTHING —
 * no empty container, no black space, no layout shift.
 */
export default function AdBanner({ slot, format = "auto", className = "" }: AdBannerProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [adFilled, setAdFilled] = useState(false);
  const pushed = useRef(false);

  const subscription = user?.subscription;
  const isPremium = subscription?.tier && subscription.tier !== "free";
  const isProvider = user?.role === "provider" || user?.role === "admin";

  useEffect(() => {
    if (isPremium || isProvider || pushed.current) return;
    pushed.current = true;

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}

    // Poll: check if the ad iframe has actual content (height > 0 with real ad)
    // AdSense sets data-ad-status="filled" when a real ad loads
    let attempts = 0;
    const check = setInterval(() => {
      attempts++;
      const ins = containerRef.current?.querySelector("ins");
      if (ins) {
        const status = ins.getAttribute("data-ad-status");
        if (status === "filled") {
          setAdFilled(true);
          clearInterval(check);
        } else if (status === "unfilled" || attempts > 15) {
          // Unfilled or timed out (7.5s) — ad won't show
          clearInterval(check);
        }
      }
      if (attempts > 15) clearInterval(check);
    }, 500);

    return () => clearInterval(check);
  }, [isPremium, isProvider]);

  if (isPremium || isProvider) return null;

  return (
    <div
      ref={containerRef}
      className={adFilled ? `ad-container my-4 ${className}` : ""}
      style={adFilled ? undefined : { position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7532216743551384"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      {adFilled && (
        <p className="text-[9px] text-muted-foreground/40 text-center mt-1">
          <a href="/welcome" className="hover:text-indigo">Go Premium</a> to remove ads
        </p>
      )}
    </div>
  );
}
