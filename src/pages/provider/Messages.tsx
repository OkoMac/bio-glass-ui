import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import { Search, Send, ChevronLeft, Mic, Paperclip, CheckCheck, Sparkles } from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";

interface Msg {
  id: string;
  from: "provider" | "client";
  text: string;
  time: string;
  read?: boolean;
}

interface Thread {
  id: string;
  name: string;
  image: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Msg[];
}

const threads: Thread[] = [
  {
    id: "t1", name: "Mpho Sithole", image: provider1, online: true, unread: 2,
    time: "09:41", lastMsg: "Can we move Monday's session to 8am?",
    messages: [
      { id: "m1", from: "client",   text: "Hey James! Quick question about Monday.",        time: "09:30", read: true },
      { id: "m2", from: "provider", text: "Sure, what's up Mpho?",                          time: "09:32", read: true },
      { id: "m3", from: "client",   text: "Can we move Monday's session to 8am?",           time: "09:41", read: false },
      { id: "m4", from: "client",   text: "I have a meeting at 10 I forgot about.",         time: "09:41", read: false },
    ],
  },
  {
    id: "t2", name: "Thandi Khumalo", image: provider2, online: true, unread: 0,
    time: "Yesterday", lastMsg: "Thank you so much! See you Wednesday 🙌",
    messages: [
      { id: "m1", from: "provider", text: "Great session today Thandi! Really strong progress.",  time: "16:00", read: true },
      { id: "m2", from: "client",   text: "I could feel the difference! The mobility work helped.", time: "16:05", read: true },
      { id: "m3", from: "client",   text: "Thank you so much! See you Wednesday 🙌",              time: "16:06", read: true },
    ],
  },
  {
    id: "t3", name: "Kobus Pretorius", image: provider3, online: false, unread: 0,
    time: "Mon", lastMsg: "I'll be there, promise. 7am sharp.",
    messages: [
      { id: "m1", from: "provider", text: "Hey Kobus, just confirming Saturday 7am?",  time: "10:00", read: true },
      { id: "m2", from: "client",   text: "I'll be there, promise. 7am sharp.",        time: "10:15", read: true },
    ],
  },
  {
    id: "t4", name: "Amir K.", image: provider4, online: false, unread: 0,
    time: "7 Feb", lastMsg: "Sent a re-engagement message via ServeAI",
    messages: [
      { id: "m1", from: "provider", text: "Hey Amir! It's been a while. How are you doing?", time: "10:00", read: true },
      { id: "m2", from: "client",   text: "Hey! Been crazy at work. Will book soon.",        time: "14:22", read: true },
    ],
  },
];

const aiSuggestions = [
  "Send a re-engagement nudge to Amir",
  "Remind Kobus about Saturday's session",
  "Check in with Naledi about her goals",
];

export default function ProviderMessages() {
  const [query, setQuery]           = useState("");
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [threadData, setThreadData] = useState(threads);
  const [input, setInput]           = useState("");
  const messagesEndRef               = useRef<HTMLDivElement>(null);

  const filtered = threadData.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  const active = threadData.find(t => t.id === activeId);

  const openThread = (id: string) => {
    setActiveId(id);
    // mark unread as read
    setThreadData(prev =>
      prev.map(t => t.id === id ? { ...t, unread: 0 } : t)
    );
  };

  const send = () => {
    if (!input.trim() || !activeId) return;
    const newMsg: Msg = {
      id: `m${Date.now()}`,
      from: "provider",
      text: input.trim(),
      time: new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    setThreadData(prev =>
      prev.map(t =>
        t.id === activeId
          ? { ...t, messages: [...t.messages, newMsg], lastMsg: input.trim(), time: "Now" }
          : t
      )
    );
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-3xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-xs text-muted-foreground">
            {threadData.reduce((s, t) => s + t.unread, 0)} unread
          </p>
        </div>

        {/* ServeAI suggestions (only on list view) */}
        {!active && (
          <GlassCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo" />
              <p className="text-[11px] font-semibold text-indigo uppercase tracking-wider">ServeAI suggestions</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {aiSuggestions.map(s => (
                <button
                  key={s}
                  className="text-left text-xs text-muted-foreground glass-1 rounded-xl px-3 py-2 hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Search + list OR thread view */}
        <AnimatePresence mode="wait">
          {!active ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full h-10 glass-1 rounded-pill pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
                />
              </div>

              {/* Thread list */}
              <div className="space-y-2">
                {filtered.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <GlassCard hover className="p-3 cursor-pointer" onClick={() => openThread(t.id)}>
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img src={t.image} alt={t.name} className="w-11 h-11 rounded-full object-cover" />
                          {t.online && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-teal border-2 border-obsidian" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">{t.name}</p>
                            <p className="text-[10px] text-muted-foreground">{t.time}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{t.lastMsg}</p>
                        </div>
                        {t.unread > 0 && (
                          <div className="w-5 h-5 rounded-full gradient-indigo flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-white">{t.unread}</span>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="thread" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Thread header */}
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveId(null)} className="p-2 glass-1 rounded-full">
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>
                <div className="relative">
                  <img src={active.image} alt={active.name} className="w-9 h-9 rounded-full object-cover" />
                  {active.online && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-teal border-2 border-obsidian" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{active.name}</p>
                  <p className="text-[11px] text-muted-foreground">{active.online ? "Online" : "Offline"}</p>
                </div>
              </div>

              {/* Messages */}
              <GlassCard className="p-4 min-h-64 max-h-96 overflow-y-auto flex flex-col gap-3">
                {active.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.from === "provider" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        msg.from === "provider"
                          ? "gradient-indigo text-primary-foreground rounded-br-sm"
                          : "glass-1 text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-0.5 ${msg.from === "provider" ? "justify-end" : "justify-start"}`}>
                        <span className="text-[9px] opacity-60">{msg.time}</span>
                        {msg.from === "provider" && (
                          <CheckCheck className="w-2.5 h-2.5 opacity-60" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </GlassCard>

              {/* Input */}
              <div className="flex items-center gap-2">
                <button className="p-2.5 glass-1 rounded-full text-muted-foreground">
                  <Paperclip className="w-4 h-4" />
                </button>
                <div className="flex-1 flex items-center gap-2 glass-1 rounded-pill px-4 py-2.5">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && send()}
                    placeholder="Message…"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
                <button className="p-2.5 glass-1 rounded-full text-muted-foreground">
                  <Mic className="w-4 h-4" />
                </button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={send}
                  className="p-2.5 gradient-indigo rounded-full"
                >
                  <Send className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProviderNav />
    </div>
  );
}
