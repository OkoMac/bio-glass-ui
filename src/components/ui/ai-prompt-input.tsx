import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * AI Prompt Input — ChatGPT-style input with auto-resize.
 *
 * Follows shadcn.io AI Prompt Input pattern: auto-resizing textarea
 * with keyboard shortcuts (Enter to send, Shift+Enter for newline).
 *
 * Usage:
 *   <AiPromptInput
 *     value={input}
 *     onChange={setInput}
 *     onSend={() => send(input)}
 *     placeholder="Ask B_ anything..."
 *   />
 */

interface AiPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  maxRows?: number;
  /** Optional ref to the textarea element */
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  /** Optional send button element rendered inside the input bar */
  sendButton?: React.ReactNode;
}

export function AiPromptInput({
  value,
  onChange,
  onSend,
  placeholder = "Ask B_ anything...",
  className,
  inputClassName,
  disabled = false,
  maxRows = 6,
  textareaRef: externalRef,
  sendButton,
}: AiPromptInputProps) {
  const internalRef = React.useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef ?? internalRef;

  // Auto-resize
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 20; // ~text-sm leading
    const maxHeight = lineHeight * maxRows;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxRows]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 focus-within:border-violet/40 focus-within:bg-white/[0.06] transition-all duration-200",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className={cn(
          "flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none scrollbar-none",
          "leading-5 py-0.5",
          inputClassName,
        )}
      />
      {sendButton ?? (
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
            value.trim()
              ? "bg-gradient-to-br from-violet to-indigo text-white shadow-sm hover:shadow-lg hover:shadow-violet/20 cursor-pointer"
              : "bg-white/[0.06] text-muted-foreground cursor-not-allowed",
          )}
          aria-label="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
