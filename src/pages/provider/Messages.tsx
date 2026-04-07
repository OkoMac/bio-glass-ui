import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Search, Send, ChevronLeft, Mic, Paperclip, CheckCheck, MessageSquare, Lock, CreditCard } from "lucide-react";

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

// Real accounts have no threads until actual conversations happen
const generateThreads = (_isDemoAccount: boolean): Thread[] => {
  return [];
};

export default function ProviderMessages() {
  const { user } = useAuth();
  const { canAccess, requiresUpgrade, getUpgradeUrl, tierDisplayName } = useSubscription();
  const [query, setQuery]           = useState("");
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [input, setInput]           = useState("");
  const messagesEndRef               = useRef<HTMLDivElement>(null);
  
  // Check if this is a demo account (simplified check - in real app would check user.role or user.isDemo)
  const isDemoAccount = user?.email?.includes('demo') || user?.name?.includes('Demo') || false;
  
  // Check if user can access messaging feature
  const canMessage = canAccess('messaging');
  const needsUpgrade = requiresUpgrade('messaging');
  
  // Generate threads based on account type and subscription
  const threads = generateThreads(isDemoAccount && canMessage);
  const [threadData, setThreadData] = useState(threads);

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

  // Show upgrade prompt if messaging feature is not available
  if (needsUpgrade) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
        <div className="mx-auto max-w-3xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            <p className="text-xs text-muted-foreground">
              Upgrade required to access messaging
            </p>
          </div>
          
          {/* Upgrade Prompt */}
          <GlassCard className="p-6 text-center">
            <Lock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Messaging Requires Pro Subscription
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your current plan ({tierDisplayName()}) doesn't include client messaging. 
              Upgrade to Pro or Elite to send and receive messages with clients.
            </p>
            <div className="space-y-3 max-w-md mx-auto">
              <div className="glass-1 rounded-xl p-4 text-left">
                <h3 className="text-sm font-semibold text-foreground mb-2">Pro Plan Includes:</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo"></div>
                    Client messaging & notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo"></div>
                    Booking management & calendar sync
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo"></div>
                    Basic analytics & insights
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo"></div>
                    Up to 5 service listings
                  </li>
                </ul>
              </div>
              
              <button
                onClick={() => window.location.href = getUpgradeUrl()}
                className="w-full gradient-indigo rounded-pill py-3.5 text-sm font-semibold text-white flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Upgrade to Pro - R499/month
              </button>
              
              <button
                onClick={() => window.location.href = '/provider/billing'}
                className="w-full glass-1 rounded-pill py-3 text-sm font-medium text-foreground"
              >
                View All Plans
              </button>
            </div>
          </GlassCard>
          
          <ProviderNav />
        </div>
      </div>
    );
  }

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

              {/* Thread list or empty state */}
              <div className="space-y-2">
                {filtered.length > 0 ? (
                  filtered.map((t, i) => (
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
                  ))
                ) : (
                  // Empty state for no messages
                  <GlassCard className="p-6 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-foreground mb-1">No messages yet</h3>
                    <p className="text-xs text-muted-foreground">
                      Messages will appear here when clients contact you.
                    </p>
                  </GlassCard>
                )}
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
