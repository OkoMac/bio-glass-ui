import { cn } from "@/lib/utils";

/**
 * AI Loader — animated loading indicator for AI streaming responses.
 *
 * Follows shadcn.io AI Loader pattern: smooth spinning indicator
 * that shows users AI is thinking. Three visual modes:
 *
 * - "dots" (default): bouncing dots in BION's brand gradient
 * - "spinner": smooth circular spinner
 * - "pulse": gentle pulsing ring
 *
 * Usage:
 *   <AiLoader />                     → default dots
 *   <AiLoader variant="spinner" />   → spinner
 *   <AiLoader className="[&>div]:bg-teal" /> → custom color
 */

const dotVariants = {
  dots: "h-2 w-2 rounded-full",
  spinner: "h-8 w-8 rounded-full border-2 border-t-transparent animate-spin",
  pulse: "h-8 w-8 rounded-full",
} as const;

const variantStyles = {
  dots: {
    container: "flex items-center gap-1.5",
    items: [
      "animate-bounce [animation-delay:0ms]",
      "animate-bounce [animation-delay:150ms]",
      "animate-bounce [animation-delay:300ms]",
    ],
  },
  spinner: {
    container: "flex items-center justify-center",
    items: ["animate-spin"],
  },
  pulse: {
    container: "flex items-center justify-center",
    items: ["animate-pulse"],
  },
};

interface AiLoaderProps {
  variant?: keyof typeof dotVariants;
  className?: string;
  dotClassName?: string;
}

export function AiLoader({ variant = "dots", className, dotClassName }: AiLoaderProps) {
  const style = variantStyles[variant];

  return (
    <div className={cn(style.container, className)} role="status" aria-label="AI is thinking">
      {style.items.map((anim, i) => (
        <div
          key={i}
          className={cn(
            dotVariants[variant],
            anim,
            variant === "dots" && "bg-gradient-to-br from-violet to-indigo",
            variant === "spinner" && "border-violet border-r-transparent",
            variant === "pulse" && "bg-gradient-to-br from-violet/40 to-indigo/40",
            dotClassName,
          )}
        />
      ))}
      <span className="sr-only">Thinking...</span>
    </div>
  );
}
