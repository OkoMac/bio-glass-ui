import { CheckCircle, Crown, Star, Shield, BadgeCheck } from "lucide-react";

type BadgeType = "verified" | "premium" | "elite" | "complete" | "pro" | "accredited";

interface UserBadgeProps {
  type: BadgeType;
  size?: "sm" | "md";
  className?: string;
}

const BADGE_CONFIG: Record<BadgeType, {
  label: string;
  icon: typeof CheckCircle;
  bg: string;
  text: string;
}> = {
  verified: {
    label: "Verified",
    icon: CheckCircle,
    bg: "bg-indigo/10 border-indigo/20",
    text: "text-indigo",
  },
  complete: {
    label: "100% Complete",
    icon: Shield,
    bg: "bg-teal/10 border-teal/20",
    text: "text-teal",
  },
  premium: {
    label: "Premium",
    icon: Star,
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-500",
  },
  pro: {
    label: "Pro",
    icon: Star,
    bg: "bg-indigo/10 border-indigo/20",
    text: "text-indigo",
  },
  elite: {
    label: "Elite",
    icon: Crown,
    bg: "bg-violet/10 border-violet/20",
    text: "text-violet",
  },
  accredited: {
    label: "Accredited",
    icon: BadgeCheck,
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-500",
  },
};

export default function UserBadge({ type, size = "sm", className = "" }: UserBadgeProps) {
  const config = BADGE_CONFIG[type];
  const Icon = config.icon;
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill border ${config.bg} ${config.text} ${
        isSmall ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"
      } font-medium ${className}`}
    >
      <Icon className={isSmall ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {config.label}
    </span>
  );
}
