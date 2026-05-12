import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Loader2 } from "lucide-react";
import type { ChatMessage, CrawlResult } from "@/types/onboarding";
import { getAIResponse, buildInitialMessages } from "@/lib/onboardingAI";

interface Props {
  role: string;
  stepTitle?: string;
  crawlData?: CrawlResult;
  formData?: Record<string, string>;
  onClose: () => void;
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isAssistant = msg.role === "assistant";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isAssistant ? "" : "flex-row-reverse"}`}
    >
      {isAssistant && (
        <div className="w-7 h-7 rounded-full bg-indigo/20 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-indigo" />
        </div>
      )}
      <div
        className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isAssistant
            ? "bg-white/5 border border-white/8 text-foreground rounded-tl-sm"
            : "gradient-indigo text-primary-foreground rounded-tr-sm whitespace-pre-line"
        }`}
      >
        {isAssistant ? (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc pl-4 my-1.5 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="leading-snug">{children}</li>,
              a: ({ href, children }) => <a href={href} className="text-indigo underline" target="_blank" rel="noopener noreferrer">{children}</a>,
              code: ({ children }) => <code className="px-1 py-0.5 rounded bg-white/[0.06] text-[0.85em]">{children}</code>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        ) : (
          msg.content
        )}
      </div>
    </motion.div>
  );
}

// Quick-start prompts per role — also used as step-specific suggestions
const QUICK_PROMPTS: Record<string, string[]> = {
  client: ["How do I book a session?", "What is BIONWallet?", "Why add my Instagram?", "Who can see my data?"],
  provider: ["How do I get paid?", "What is the BION fee?", "Why add my social links?", "Can AI set up my account?"],
  corporate: ["How do I add employees?", "Why add our LinkedIn?", "Can I restrict categories?", "What's the ROI of wellness?"],
  admin: ["How does provider verification work?", "How do I set commission rates?", "What data can I access?", "How do I handle disputes?"],
};

// Step-specific quick prompts shown when user is on the social step
const SOCIAL_PROMPTS = ["Why add my Instagram?", "What is my LinkedIn used for?", "What is a BION mini-site?", "Who can see my social links?"];

export function OnboardingChat({ role, stepTitle, crawlData, formData, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    buildInitialMessages(role, stepTitle)
  );
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate AI "thinking" latency
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));

    const response = getAIResponse(trimmed, role, { crawlData, stepTitle, formData });

    const assistantMsg: ChatMessage = {
      id: `a_${Date.now()}`,
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, assistantMsg]);
    setTyping(false);
  };

  const isSocialStep = /social|presence|instagram|linkedin|facebook/i.test(stepTitle ?? "");
  const quickPrompts = isSocialStep ? SOCIAL_PROMPTS : (QUICK_PROMPTS[role] ?? QUICK_PROMPTS.client);
  const showPrompts = messages.length <= 1;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[97] bg-black/50"
        onClick={onClose}
      />

      {/* Chat drawer */}
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-[98] max-w-lg mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass-frosted rounded-t-3xl border-t border-white/5 flex flex-col"
          style={{ maxHeight: "75dvh", minHeight: "55dvh" }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-indigo/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">BION Assistant</p>
              <p className="text-[10px] text-muted-foreground">Onboarding help · Privacy-aware</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}

            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-indigo" />
                </div>
                <div className="px-3 py-2 bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick prompts */}
            {showPrompts && !typing && (
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="text-[11px] px-3 py-1.5 glass-1 rounded-pill border border-white/5 text-muted-foreground hover:text-foreground hover:border-indigo/30 transition-colors"
                     title="send(p)} className='text-[11px] px-3 py-1.5 glass-1 rounded-pill border borde…" aria-label="send(p)} className='text-[11px] px-3 py-1.5 glass-1 rounded-pill border borde…">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/5 shrink-0">
            <div className="flex items-center gap-2 glass-1 rounded-pill border border-white/5 px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
                placeholder="Ask anything about BION…"
                className="flex-1 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || typing}
                className="w-7 h-7 rounded-full gradient-indigo flex items-center justify-center disabled:opacity-40 shrink-0"
               title="send(input)} disabled= className='w-7 h-7 rounded-full gradient-indigo flex i…" aria-label="send(input)} disabled= className='w-7 h-7 rounded-full gradient-indigo flex i…">
                {typing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Send className="w-3.5 h-3.5 text-white" />}
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground text-center mt-1.5">
              POPIA-compliant · Never shares other users' data
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}
