import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useConversations, useConversation } from "@/hooks/useMessaging";
import { Search, Send, ChevronLeft, Mic, Paperclip, CheckCheck, MessageSquare, Lock, CreditCard, Zap, X, ArrowLeft } from "lucide-react";
import { QUICK_REPLIES, fillTemplate } from "@/lib/quickReplies";

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

export default function ProviderMessages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canAccess: _canAccess, requiresUpgrade, getUpgradeUrl, tierDisplayName } = useSubscription();
  const [query, setQuery]           = useState("");
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [input, setInput]           = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef               = useRef<HTMLDivElement>(null);

  // Check if user can access messaging feature
  const needsUpgrade = requiresUpgrade('messaging');

  // ── Live conversations + active thread messages ──
  const { conversations: liveConvs } = useConversations();
  const { messages: liveMessages, sendMessage: liveSend } = useConversation(activeId);

  const profileId = user?.profileId;

  // Project live conversations into the Thread shape the existing UI expects.
  const threadData: Thread[] = useMemo(
    () => liveConvs.map(c => ({
      id: c.id,
      name: c.partnerName,
      image: c.partnerAvatar ?? "",
      lastMsg: c.lastMessagePreview ?? "",
      time: c.lastMessageAt
        ? new Date(c.lastMessageAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })
        : "",
      unread: c.unread,
      online: false,
      // Per-thread history is served by useConversation when the thread is opened.
      messages: [],
    })),
    [liveConvs],
  );

  const filtered = threadData.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  const active = threadData.find(t => t.id === activeId);

  // Messages-for-render: mapped from the realtime hook for the active thread.
  const activeMessages: Msg[] = useMemo(
    () => liveMessages.map(m => ({
      id: m.id,
      from: m.senderId === profileId ? "provider" : "client",
      text: m.content,
      time: new Date(m.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
      read: m.isRead,
    })),
    [liveMessages, profileId],
  );

  const openThread = (id: string) => {
    setActiveId(id);
    // useConversation marks-read automatically on inbound messages.
  };

  const send = () => {
    if (!input.trim() || !activeId) return;
    void liveSend(input.trim());
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  // Show upgrade prompt if messaging feature is not available
  if (needsUpgrade) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
        <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="mx-auto max-w-3xl xl:max-w-7xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
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
                onClick={() => navigate(getUpgradeUrl())}
                className="w-full gradient-indigo rounded-pill py-3.5 text-sm font-semibold text-white flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Upgrade to Pro - R499/month
              </button>
              
              <button
                onClick={() => navigate('/provider/billing')}
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
      <div className="mx-auto max-w-3xl xl:max-w-7xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">

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
                {activeMessages.map(msg => (
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
                <button onClick={() => setShowQuickReplies(true)} title="Quick replies"
                  className="p-2.5 glass-1 rounded-full text-indigo">
                  <Zap className="w-4 h-4" />
                </button>
                <button className="p-2.5 glass-1 rounded-full text-muted-foreground">
                  <Paperclip className="w-4 h-4" />
                </button>
                <div className="flex-1 flex items-center gap-2 glass-1 rounded-pill px-4 py-2.5">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
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

      {/* Quick Replies Sheet */}
      <AnimatePresence>
        {showQuickReplies && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowQuickReplies(false)}
              className="fixed inset-0 bg-obsidian/70 z-[80]"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 max-h-[75vh] overflow-y-auto"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo" />
                  <h3 className="text-base font-bold text-foreground">Quick Replies</h3>
                </div>
                <button onClick={() => setShowQuickReplies(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {(["booking", "followup", "reminder", "general"] as const).map(cat => (
                <div key={cat} className="mb-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{cat}</p>
                  <div className="space-y-2">
                    {QUICK_REPLIES.filter(r => r.category === cat).map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setInput(fillTemplate(r.template));
                          setShowQuickReplies(false);
                        }}
                        className="w-full glass-1 rounded-2xl p-3 flex items-start gap-3 text-left hover:bg-white/[0.04] transition-colors"
                      >
                        <span className="text-xl shrink-0">{r.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{r.label}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.template}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ProviderNav />
    </div>
  );
}
