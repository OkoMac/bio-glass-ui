import { useState, useRef, ReactNode, cloneElement, ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  text: string;
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

/**
 * Lightweight glass-morphism tooltip.
 * Wrap any element to show a hover/focus tooltip.
 *
 * Usage:
 *   <Tooltip text="Open notifications">
 *     <button title="..." aria-label="...">...</button>
 *   </Tooltip>
 */
export default function Tooltip({ text, children, side = "bottom", delay = 400 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  const sideClasses = {
    top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left:   "right-full top-1/2 -translate-y-1/2 mr-2",
    right:  "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            initial={{ opacity: 0, scale: 0.92, y: side === "top" ? 4 : side === "bottom" ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className={`absolute ${sideClasses[side]} z-[100] pointer-events-none whitespace-nowrap`}
          >
            <span className="glass-popover block px-2.5 py-1.5 rounded-lg text-[11px] text-foreground font-medium shadow-card">
              {text}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
