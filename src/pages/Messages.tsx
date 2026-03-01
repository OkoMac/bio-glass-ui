import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import CoachAI from "@/components/CoachAI";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { Send, Mic, Paperclip, Phone, Info, ChevronLeft, Check, CheckCheck } from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";

// ── Mock fallback data ──────────────────────────────────────────────
interface MockMsg {
  id: number; from: "client" | "provider";
  text?: string; type?: string; title?: string; exercises?: number;
  time: string; status: "sent" | "delivered" | "read";
}

const MOCK_THREADS: Record<string, MockMsg[]> = {
  lisa: [
    { id: 1, from: "provider", text: "Hey! How are you feeling after yesterday's session?",            time: "9:15am",  status: "read" },
    { id: 2, from: "client",   text: "Feeling good! A little sore in the shoulders but nothing bad 😊", time: "9:22am",  status: "read" },
    { id: 3, from: "provider", text: "That's normal after those overhead presses. Make sure to do the stretches I showed you.", time: "9:24am", status: "read" },
    { id: 4, from: "provider", text: "I've added a new warm-up routine to your plan for tomorrow. Check it out!", time: "9:25am", status: "read" },
    { id: 5, from: "provider", type: "routine", title: "Pre-Session Warm-Up", exercises: 6,            time: "9:25am",  status: "read" },
    { id: 6, from: "client",   text: "Awesome, just reviewed it. Looks great 🔥",                      time: "10:01am", status: "read" },
    { id: 7, from: "provider", text: "Great progress today! Remember to stretch before our session tomorrow 💪", time: "2:30pm", status: "read" },
  ],
  kagiso: [
    { id: 1, from: "provider", text: "Your rehab assessment is looking great. Keep up the consistency!", time: "Mon", status: "read" },
    { id: 2, from: "client",   text: "Thanks doc! The knee feels much better already.",                  time: "Mon", status: "read" },
    { id: 3, from: "provider", text: "Your rehab plan has been updated. Check your routines tab.",       time: "Tue", status: "read" },
  ],
  sarah: [
    { id: 1, from: "provider", text: "Hi! Just checking in — how has your skin been responding to the new routine?", time: "Yesterday", status: "read" },
    { id: 2, from: "client",   text: "It's been amazing! The redness is almost gone.",                              time: "Yesterday", status: "read" },
    { id: 3, from: "provider", text: "Looking forward to your facial on Tuesday! Please avoid retinol 48h before.",  time: "3h ago",    status: "read" },
  ],
  amir: [
    { id: 1, from: "provider", text: "Namaste 🙏 Your meditation recording is ready.", time: "Yesterday", status: "read" },
    { id: 2, from: "client",   text: "Perfect timing! Will listen tonight.",            time: "Yesterday", status: "read" },
  ],
};

const CONVERSATIONS = [
  { id: "lisa",   supabaseId: null, name: "Lisa Dlamini",      specialty: "Personal Trainer",    image: provider1, vertical: "teal"   as const, time: "2m ago",   unread: 2, online: true  },
  { id: "kagiso", supabaseId: null, name: "Dr. Kagiso Sithole", specialty: "Biokineticist",       image: provider2, vertical: "indigo" as const, time: "1h ago",   unread: 0, online: false },
  { id: "sarah",  supabaseId: null, name: "Sarah Chen",         specialty: "Skincare Specialist", image: provider3, vertical: "coral"  as const, time: "3h ago",   unread: 1, online: true  },
  { id: "amir",   supabaseId: null, name: "Amir Patel",         specialty: "Yoga Instructor",     image: provider4, vertical: "amber"  as const, time: "Yesterday", unread: 0, online: false },
];

function getTime() {
  return new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ── Active chat view (handles both real-time and mock) ──────────────
function ChatView({
  conversation,
  onClose,
}: {
  conversation: typeof CONVERSATIONS[0];
  onClose: () => void;
}) {
  const { user } = useAuth();
  // Real-time hook — only active when supabaseId exists
  const { messages: rtMessages, sendMessage: rtSend, sending } = useMessages(conversation.supabaseId);

  // Mock state for demo mode
  const [mockMsgs, setMockMsgs] = useState<MockMsg[]>(MOCK_THREADS[conversation.id] ?? []);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const isRealtime = !!conversation.supabaseId && !!user?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rtMessages.length, mockMsgs.length]);

  const sendMessage = () => {
    if (!draft.trim()) return;
    if (isRealtime) {
      rtSend(draft.trim());
    } else {
      setMockMsgs(prev => [...prev, {
        id: Date.now(), from: "client", text: draft.trim(), time: getTime(), status: "sent",
      }]);
    }
    setDraft("");
  };

  // Unified message list for rendering
  const renderMessages = isRealtime
    ? rtMessages.map(m => ({
        id: Number(m.id.replace(/-/g, "").slice(0, 9)),
        from: m.senderId === user?.id ? "client" : "provider",
        text: m.content,
        time: new Date(m.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false }),
        status: m.isRead ? "read" : "sent",
      } as MockMsg))
    : mockMsgs;

  return (
    <div className="fixed inset-0 bg-obsidian flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="glass-2 px-4 py-3 flex items-center gap-3 pt-12 shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}>
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <BioAvatar src={conversation.image} alt={conversation.name} size="sm"
          verticalColor={conversation.vertical} online={conversation.online} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{conversation.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {conversation.online ? "Online" : conversation.specialty}
            {isRealtime && " · Live"}
          </p>
        </div>
        <Phone className="w-4 h-4 text-muted-foreground" />
        <Info className="w-4 h-4 text-muted-foreground ml-2" />
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {renderMessages.map((msg, i) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i < 5 ? i * 0.03 : 0 }}
            className={`flex ${msg.from === "client" ? "justify-end" : "justify-start"}`}>
            {msg.type === "routine" ? (
              <GlassCard variant="accent-teal" className="p-3 max-w-[75%]">
                <p className="text-xs text-teal font-medium">📋 Routine Shared</p>
                <p className="text-sm text-foreground font-medium mt-1">{msg.title}</p>
                <p className="text-xs text-muted-foreground">{msg.exercises} exercises</p>
                <button className="text-xs text-teal font-medium mt-2">View Routine →</button>
              </GlassCard>
            ) : (
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                msg.from === "client" ? "gradient-indigo rounded-br-md" : "glass-1 rounded-bl-md"
              }`}>
                <p className="text-sm text-foreground leading-relaxed">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[9px] text-foreground/40">{msg.time}</span>
                  {msg.from === "client" && (
                    msg.status === "read"      ? <CheckCheck className="w-3 h-3 text-teal" /> :
                    msg.status === "delivered" ? <CheckCheck className="w-3 h-3 text-foreground/40" /> :
                                                 <Check className="w-3 h-3 text-foreground/40" />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-8 pt-2 shrink-0 glass-2">
        <div className="glass-1 rounded-pill flex items-center gap-2 px-4 py-2.5">
          <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
          <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Message..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          {draft.trim() ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={sendMessage} disabled={sending}
              className="w-7 h-7 gradient-indigo rounded-full flex items-center justify-center shrink-0">
              <Send className="w-3.5 h-3.5 text-white" />
            </motion.button>
          ) : (
            <Mic className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Messages page ──────────────────────────────────────────────
const Messages = () => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [unread, setUnread]         = useState<Record<string, number>>({ lisa: 2, sarah: 1 });

  const activeConversation = CONVERSATIONS.find(c => c.id === activeChat);

  if (activeChat && activeConversation) {
    return <ChatView conversation={activeConversation} onClose={() => setActiveChat(null)} />;
  }

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-12 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          {totalUnread > 0 && (
            <span className="w-5 h-5 rounded-full gradient-indigo flex items-center justify-center text-[10px] font-bold text-white">
              {totalUnread}
            </span>
          )}
        </div>

        <div className="space-y-1">
          {CONVERSATIONS.map((convo, i) => {
            const lastMsg = MOCK_THREADS[convo.id]?.at(-1);
            const hasUnread = (unread[convo.id] ?? 0) > 0;
            return (
              <motion.div key={convo.id} initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard hover className="p-3.5 cursor-pointer"
                  onClick={() => { setActiveChat(convo.id); setUnread(prev => ({ ...prev, [convo.id]: 0 })); }}>
                  <div className="flex items-center gap-3">
                    <BioAvatar src={convo.image} alt={convo.name} size="md"
                      verticalColor={convo.vertical} online={convo.online} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm text-foreground ${hasUnread ? "font-bold" : "font-semibold"}`}>
                          {convo.name}
                        </p>
                        <span className="text-[10px] text-muted-foreground">{convo.time}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${hasUnread ? "text-foreground" : "text-muted-foreground"}`}>
                        {lastMsg?.text ?? convo.specialty}
                      </p>
                    </div>
                    {hasUnread && (
                      <span className="w-5 h-5 rounded-full gradient-indigo flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {unread[convo.id]}
                      </span>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      <BottomNav />
      <CoachAI />
    </div>
  );
};

export default Messages;
