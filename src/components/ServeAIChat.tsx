import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, ChevronRight } from "lucide-react";
import GlassCard from "@/components/GlassCard";

const quickPrompts = [
  "Find a free intro session",
  "Book my usual PT with Lisa",
  "What's my next appointment?",
  "Show routines from Kagiso",
];

type ChatMsg = { from: "user" | "ai"; text: string };

const fakeAIReplies: Record<string, string> = {
  "find a free intro session": "I found 3 free intro sessions near you! Lisa Dlamini has a Free Intro PT today at 5pm. Want me to book it?",
  "book my usual pt with lisa": "Lisa Dlamini has slots Tomorrow at 9am and Wed at 7am for Personal Training (60min · R450). Which works for you?",
  "what's my next appointment?": "Your next appointment is a Personal Training session with Lisa Dlamini on Tue, 25 Feb at 9:00am. Shall I send you a reminder?",
  "show routines from kagiso": "Dr. Kagiso Sithole has sent you 2 active routines: 'Knee Rehab Phase 2' and 'Mobility Week 3'. Opening Routines now…",
};

export default function ServeAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: "ai", text: "Hey Oko! 👋 I'm ServeAI. I can book sessions, remind you of appointments, or pull up your routines. What do you need?" },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMsg = { from: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    const key = text.trim().toLowerCase();
    const reply = fakeAIReplies[key] ?? "I'm on it! Let me check that for you… (Demo mode — full AI available at launch)";
    setTimeout(() => {
      setMessages(prev => [...prev, { from: "ai", text: reply }]);
    }, 700);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-28 right-4 z-50 w-14 h-14 rounded-full gradient-indigo shadow-cta flex items-center justify-center"
        style={{ display: open ? "none" : "flex" }}
      >
        <Sparkles className="w-6 h-6 text-primary-foreground" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-teal border-2 border-obsidian animate-pulse-glow" />
      </motion.button>

      {/* Chat sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-obsidian/60 z-50"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] overflow-hidden"
              style={{ background: "rgba(14,14,22,0.97)", backdropFilter: "blur(60px)", maxHeight: "75vh" }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/5">
                <div className="w-9 h-9 rounded-xl gradient-indigo flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">ServeAI</p>
                  <p className="text-[10px] text-teal">Online · Africa's smartest booking assistant</p>
                </div>
                <button onClick={() => setOpen(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Messages */}
              <div className="overflow-y-auto px-4 py-4 space-y-3" style={{ maxHeight: "calc(75vh - 180px)" }}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.from === "user"
                        ? "gradient-indigo text-primary-foreground rounded-br-md"
                        : "glass-1 text-foreground rounded-bl-md"
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}

                {/* Quick prompts — only show at start */}
                {messages.length === 1 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {quickPrompts.map(q => (
                      <motion.button
                        key={q}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => send(q)}
                        className="glass-1 rounded-pill px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        {q}
                        <ChevronRight className="w-3 h-3" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-4 pb-6 pt-2 border-t border-white/5">
                <div className="glass-1 rounded-pill flex items-center gap-2 px-4 py-2.5">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") send(input); }}
                    placeholder="Ask ServeAI anything…"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => send(input)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      input.trim() ? "gradient-indigo" : "glass-1"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 text-primary-foreground" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
