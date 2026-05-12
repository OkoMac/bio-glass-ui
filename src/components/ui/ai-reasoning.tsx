import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * AI Reasoning — collapsible "thinking" block like Claude's reasoning display.
 *
 * Follows shadcn.io AI Reasoning component pattern: shows the AI's
 * step-by-step thinking process in a compact, collapsible block.
 *
 * Usage:
 *   <AiReasoning steps={["Analyzing vitals...", "Cross-referencing goals..."]} />
 *
 *   <AiReasoning>
 *     Full custom content inside the reasoning block
 *   </AiReasoning>
 */

interface AiReasoningProps {
  /** Label shown in the collapsible header */
  label?: string;
  /** Optional array of reasoning steps (renders as tick list) */
  steps?: string[];
  /** Custom content — overrides steps if provided */
  children?: React.ReactNode;
  /** Default open state */
  defaultOpen?: boolean;
  className?: string;
}

export function AiReasoning({
  label = "Thinking...",
  steps,
  children,
  defaultOpen = true,
  className,
}: AiReasoningProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all duration-200",
        className,
      )}
    >
      {/* Header — clickable to toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-white/[0.03] transition-colors"
       title="setOpen(!open)} className='flex items-center gap-2 w-full px-3 py-2 text-left…" aria-label="setOpen(!open)} className='flex items-center gap-2 w-full px-3 py-2 text-left…">
        {/* Spinning brain icon while open, idle otherwise */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "w-3.5 h-3.5 text-violet",
            open && "animate-pulse",
          )}
        >
          <path d="M12 2a4 4 0 0 1 4 4c0 2-2 3-2 5v3h-4V11c0-2-2-3-2-5a4 4 0 0 1 4-4z" />
          <path d="M8 19h8" />
          <path d="M9 22h6" />
        </svg>

        <span className="text-[11px] font-medium text-violet uppercase tracking-wider flex-1">
          {label}
        </span>

        {/* Step count when available */}
        {steps && steps.length > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {steps.length} step{steps.length !== 1 ? "s" : ""}
          </span>
        )}

        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "w-3 h-3 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Content */}
      {open && (
        <div className="px-3 pb-3 space-y-1">
          {children
            ? children
            : steps?.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3 mt-0.5 shrink-0 text-teal"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>{step}</span>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
