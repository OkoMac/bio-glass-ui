import { cn } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
type VerticalColor = "indigo" | "teal" | "coral" | "amber" | "violet";

interface BioAvatarProps {
  src: string;
  alt: string;
  size?: AvatarSize;
  verticalColor?: VerticalColor;
  verified?: boolean;
  online?: boolean;
  className?: string;
}

const sizeMap: Record<AvatarSize, { container: string; ring: number; badge: string }> = {
  xs: { container: "w-6 h-6", ring: 0, badge: "" },
  sm: { container: "w-9 h-9", ring: 2, badge: "" },
  md: { container: "w-12 h-12", ring: 3, badge: "w-2.5 h-2.5" },
  lg: { container: "w-[72px] h-[72px]", ring: 4, badge: "w-[18px] h-[18px]" },
  xl: { container: "w-24 h-24", ring: 5, badge: "w-6 h-6" },
};

const colorMap: Record<VerticalColor, string> = {
  indigo: "ring-indigo",
  teal: "ring-teal",
  coral: "ring-coral",
  amber: "ring-amber",
  violet: "ring-violet",
};

const BioAvatar = ({ src, alt, size = "md", verticalColor = "indigo", verified, online, className }: BioAvatarProps) => {
  const s = sizeMap[size];

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          s.container,
          "rounded-full object-cover",
          s.ring > 0 && `ring-${s.ring}`,
          s.ring > 0 && colorMap[verticalColor]
        )}
        style={s.ring > 0 ? { 
          boxShadow: `0 0 0 ${s.ring}px var(--ring-color, #6366F1)`,
          ['--ring-color' as string]: verticalColor === 'teal' ? '#2DD4BF' : verticalColor === 'coral' ? '#FB7185' : verticalColor === 'amber' ? '#FBBF24' : verticalColor === 'violet' ? '#A78BFA' : '#6366F1'
        } : undefined}
      />
      {online && size !== "xs" && size !== "sm" && (
        <span className={cn("absolute bottom-0 right-0 rounded-full bg-emerald-400 ring-2 ring-obsidian", s.badge || "w-2.5 h-2.5")} />
      )}
      {verified && (size === "lg" || size === "xl") && (
        <span className={cn("absolute bottom-0 right-0 flex items-center justify-center rounded-full gradient-indigo", s.badge)}>
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M3 6l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  );
};

export default BioAvatar;
