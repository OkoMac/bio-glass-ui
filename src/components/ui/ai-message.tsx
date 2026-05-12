import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * AI Message — chat message with avatar, role distinction, and markdown body.
 *
 * Follows shadcn.io AI Message pattern: clean conversation display
 * that distinguishes user from AI with avatar badges.
 *
 * Usage:
 *   <AiMessage role="assistant">
 *     <ReactMarkdown>{text}</ReactMarkdown>
 *   </AiMessage>
 *
 *   <AiMessage role="user">
 *     What should I focus on today?
 *   </AiMessage>
 */

interface AiMessageProps {
  role: "assistant" | "user";
  children: React.ReactNode;
  /** Custom avatar label (default: "B_" for assistant, initials for user) */
  avatar?: string;
  /** Avatar gradient class */
  avatarClass?: string;
  className?: string;
  /** Timestamp shown optionally */
  timestamp?: Date;
  /** Optional actions footer (e.g. copy, regenerate buttons) */
  actions?: React.ReactNode;
}

export function AiMessage({
  role,
  children,
  avatar,
  avatarClass,
  className,
  timestamp,
  actions,
}: AiMessageProps) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-2.5",
        isAssistant ? "justify-start" : "justify-end",
        className,
      )}
    >
      {/* Avatar — only for assistant */}
      {isAssistant && (
        <div
          className={cn(
            "w-6 h-6 rounded-lg bg-gradient-to-br from-violet to-indigo flex items-center justify-center shrink-0 mt-0.5",
            avatarClass,
          )}
        >
          <span className="text-[8px] font-bold text-white">
            {avatar ?? "B_"}
          </span>
        </div>
      )}

      <div className={cn("max-w-[80%]", isAssistant ? "" : "items-end flex flex-col")}>
        {/* Bubble */}
        <div
          className={cn(
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
            isAssistant
              ? "bg-white/[0.04] border border-white/[0.06] text-foreground rounded-bl-sm"
              : "bg-gradient-to-br from-violet to-indigo text-white rounded-br-sm",
          )}
        >
          {children}
        </div>

        {/* Optional footer */}
        {(actions || timestamp) && (
          <div className={cn(
            "flex items-center gap-2 mt-1",
            isAssistant ? "" : "flex-row-reverse",
          )}>
            {timestamp && (
              <span className="text-[10px] text-muted-foreground">
                {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {actions}
          </div>
        )}
      </div>

      {/* Spacer for user alignment */}
      {!isAssistant && <div className="w-1" />}
    </div>
  );
}
