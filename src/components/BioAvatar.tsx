import { cn } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
type VerticalColor = "indigo" | "teal" | "coral" | "amber" | "violet";
type BadgeType = "verified" | "premium" | "elite" | "complete" | "accredited";

interface BioAvatarProps {
  src: string;
  alt: string;
  size?: AvatarSize;
  verticalColor?: VerticalColor;
  verified?: boolean;
  online?: boolean;
  badge?: BadgeType;
  className?: string;
}

const sizeMap: Record<AvatarSize, { container: string; ring: number; badge: string; badgeIcon: string }> = {
  xs: { container: "w-6 h-6", ring: 0, badge: "", badgeIcon: "" },
  sm: { container: "w-9 h-9", ring: 2, badge: "w-4 h-4", badgeIcon: "w-2.5 h-2.5" },
  md: { container: "w-12 h-12", ring: 3, badge: "w-5 h-5", badgeIcon: "w-3 h-3" },
  lg: { container: "w-[72px] h-[72px]", ring: 4, badge: "w-6 h-6", badgeIcon: "w-3.5 h-3.5" },
  xl: { container: "w-24 h-24", ring: 5, badge: "w-7 h-7", badgeIcon: "w-4 h-4" },
};

const BADGE_CONFIG: Record<BadgeType, { bg: string; icon: string; title: string }> = {
  verified: {
    bg: "bg-indigo",
    icon: "check",
    title: "Verified — 100% onboarding complete",
  },
  premium: {
    bg: "bg-amber-500",
    icon: "star",
    title: "Premium Subscriber",
  },
  elite: {
    bg: "bg-gradient-to-br from-indigo to-teal",
    icon: "crown",
    title: "Elite Provider",
  },
  complete: {
    bg: "bg-teal",
    icon: "check",
    title: "Onboarding 100% Complete",
  },
  accredited: {
    bg: "bg-emerald-500",
    icon: "shield",
    title: "Accredited — Qualifications verified",
  },
};

function BadgeIcon({ type, className }: { type: BadgeType; className: string }) {
  if (type === ("star" as any) || type === "premium") {
    return (
      <svg className={className} viewBox="0 0 12 12" fill="white">
        <path d="M6 1l1.5 3.1L11 4.5 8.5 7l.6 3.5L6 8.8 2.9 10.5l.6-3.5L1 4.5l3.5-.4z" />
      </svg>
    );
  }
  if (type === "accredited") {
    return (
      <svg className={className} viewBox="0 0 12 12" fill="white">
        <path d="M6 1L2 3v3c0 2.5 1.7 4.4 4 5 2.3-.6 4-2.5 4-5V3L6 1z" />
        <path d="M4.5 6l1 1 2-2" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }
  if (type === ("crown" as any) || type === "elite") {
    return (
      <svg className={className} viewBox="0 0 12 12" fill="white">
        <path d="M2 9h8L9 4l-2 2-1-3-1 3-2-2z" />
        <rect x="2" y="9" width="8" height="1.5" rx="0.5" />
      </svg>
    );
  }
  // check (verified, complete)
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none">
      <path d="M3 6l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const BioAvatar = ({ src, alt, size = "md", verticalColor = "indigo", verified, online, badge, className }: BioAvatarProps) => {
  const s = sizeMap[size];

  // Determine which badge to show (explicit badge prop takes priority over verified boolean)
  const activeBadge = badge ?? (verified ? "verified" : undefined);
  const showBadge = activeBadge && size !== "xs";
  const badgeConfig = activeBadge ? BADGE_CONFIG[activeBadge] : null;

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          s.container,
          "rounded-full object-cover",
          s.ring > 0 && `ring-${s.ring}`,
        )}
        style={s.ring > 0 ? {
          boxShadow: `0 0 0 ${s.ring}px var(--ring-color, #6366F1)`,
          ['--ring-color' as string]: verticalColor === 'teal' ? '#2DD4BF' : verticalColor === 'coral' ? '#FB7185' : verticalColor === 'amber' ? '#FBBF24' : verticalColor === 'violet' ? '#A78BFA' : '#6366F1'
        } : undefined}
      />
      {online && size !== "xs" && (
        <span className={cn("absolute bottom-0 right-0 rounded-full bg-emerald-400 ring-2 ring-obsidian", s.badge || "w-2.5 h-2.5")} />
      )}
      {showBadge && badgeConfig && !online && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full ring-2 ring-obsidian",
            badgeConfig.bg,
            s.badge,
          )}
          title={badgeConfig.title}
        >
          <BadgeIcon type={activeBadge!} className={s.badgeIcon} />
        </span>
      )}
    </div>
  );
};

export default BioAvatar;
