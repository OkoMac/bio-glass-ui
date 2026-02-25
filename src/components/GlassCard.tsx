import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type GlassVariant = "glass-1" | "glass-2" | "glass-3" | "accent-indigo" | "accent-teal" | "accent-amber" | "accent-coral";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: GlassVariant;
  hover?: boolean;
}

const variantClasses: Record<GlassVariant, string> = {
  "glass-1": "glass-1",
  "glass-2": "glass-2",
  "glass-3": "glass-3",
  "accent-indigo": "glass-accent-indigo",
  "accent-teal": "glass-accent-teal",
  "accent-amber": "glass-accent-amber",
  "accent-coral": "glass-accent-coral",
};

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = "glass-1", hover = false, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          variantClasses[variant],
          "rounded-2xl shadow-card",
          hover && "transition-shadow duration-300 hover:shadow-hover",
          className
        )}
        whileHover={hover ? { y: -4, transition: { type: "spring", stiffness: 200, damping: 22 } } : undefined}
        whileTap={hover ? { scale: 0.98 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
export default GlassCard;
