import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Stethoscope, Dumbbell, Scissors, Heart, Brain, Salad,
  Eye, Smile, Bone, Sparkles, HandMetal, Baby, Leaf, Pill,
  type LucideIcon,
} from "lucide-react";

export interface ServiceCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  glowColor: string;
  count?: number;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: "medical",       name: "Medical Specialists",  icon: Stethoscope, color: "text-teal",   glowColor: "rgba(45,212,191,0.15)" },
  { id: "fitness",       name: "Personal Trainers",    icon: Dumbbell,    color: "text-indigo",  glowColor: "rgba(99,102,241,0.15)" },
  { id: "beauty",        name: "Beauticians",          icon: Sparkles,    color: "text-coral",   glowColor: "rgba(251,113,133,0.15)" },
  { id: "hair",          name: "Hair Stylists",         icon: Scissors,    color: "text-amber",   glowColor: "rgba(251,191,36,0.15)" },
  { id: "mental-health", name: "Mental Health",         icon: Brain,       color: "text-violet",  glowColor: "rgba(167,139,250,0.15)" },
  { id: "nutrition",     name: "Nutritionists",         icon: Salad,       color: "text-teal",    glowColor: "rgba(45,212,191,0.15)" },
  { id: "physio",        name: "Physiotherapy",         icon: Bone,        color: "text-indigo",  glowColor: "rgba(99,102,241,0.15)" },
  { id: "dental",        name: "Dental Care",           icon: Smile,       color: "text-coral",   glowColor: "rgba(251,113,133,0.15)" },
  { id: "optometry",     name: "Optometry",             icon: Eye,         color: "text-amber",   glowColor: "rgba(251,191,36,0.15)" },
  { id: "massage",       name: "Massage Therapy",       icon: HandMetal,   color: "text-violet",  glowColor: "rgba(167,139,250,0.15)" },
  { id: "yoga",          name: "Yoga & Pilates",        icon: Leaf,        color: "text-teal",    glowColor: "rgba(45,212,191,0.15)" },
  { id: "maternity",     name: "Maternity & Fertility", icon: Baby,        color: "text-coral",   glowColor: "rgba(251,113,133,0.15)" },
  { id: "pharmacy",      name: "Pharmacy",              icon: Pill,        color: "text-indigo",  glowColor: "rgba(99,102,241,0.15)" },
  { id: "wellness",      name: "General Wellness",      icon: Heart,       color: "text-amber",   glowColor: "rgba(251,191,36,0.15)" },
  { id: "veterinary",    name: "Veterinary Care",       icon: Leaf,        color: "text-teal",    glowColor: "rgba(45,212,191,0.15)" },
  { id: "rehabilitation",name: "Rehabilitation",        icon: Bone,        color: "text-violet",  glowColor: "rgba(167,139,250,0.15)" },
];

interface Props {
  category: ServiceCategory;
  index: number;
  onClick: (cat: ServiceCategory) => void;
}

const ServiceCategoryBlock = ({ category, index, onClick }: Props) => {
  const Icon = category.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, type: "spring", stiffness: 200, damping: 22 }}
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onClick(category)}
      className={cn(
        "relative group flex flex-col items-center justify-center gap-2 p-4 md:p-5",
        "rounded-2xl border border-white/[0.08] overflow-hidden cursor-pointer",
        "transition-all duration-300",
        "hover:border-white/[0.16] hover:shadow-hover"
      )}
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
        backdropFilter: "blur(60px) saturate(180%)",
        WebkitBackdropFilter: "blur(60px) saturate(180%)",
      }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${category.glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* Liquid glass inner highlight */}
      <div className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10">
        <Icon className={cn("w-8 h-8 md:w-10 md:h-10", category.color)} strokeWidth={1.5} />
      </div>
      <span className="relative z-10 text-xs md:text-sm font-medium text-foreground/90 text-center leading-tight">
        {category.name}
      </span>
      {category.count !== undefined && (
        <span className="relative z-10 text-[10px] font-data text-muted-foreground">
          {category.count} providers
        </span>
      )}
    </motion.button>
  );
};

export default ServiceCategoryBlock;
