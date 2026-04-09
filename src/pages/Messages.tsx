import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { Send, Paperclip, Info, ChevronLeft, Check, CheckCheck, MessageSquare } from "lucide-react";

// ── Message types ────────────────────────────────────────────────
interface MockMsg {
  id: number; from: "client" | "provider";
  text?: string; type?: string; title?: string; exercises?: number;
  time: string; status: "sent" | "delivered" | "read";
  providerId?: string;
}

// Threads loaded from backend -- empty until real conversations exist
const REAL_THREADS: Record<string, MockMsg[]> = {};

// Conversations loaded from backend
const REAL_CONVERSATIONS: {
  id: string;
  supabaseId: string | null;
  name: string;
  specialty: string;
  specialization: string;
  image: string;
  vertical: "teal" | "indigo" | "coral" | "amber";
  time: string;
  unread: number;
  online: boolean;
  location: string;
  providerId: string;
}[] = [];

function getTime() {
  return new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ── Active chat view (handles both real-time and mock) ──────────────
function ChatView({
  conversation,
  onClose,
}: {
  conversation: typeof REAL_CONVERSATIONS[0];
  onClose: () => void;
}) {
  const { user } = useAuth();
  // Real-time hook — only active when supabaseId exists
  const { messages: rtMessages, sendMessage: rtSend, sending } = useMessages(conversation.supabaseId);

  // Mock state for demo mode
  const threadKey = conversation.id;
  const [mockMsgs, setMockMsgs] = useState<MockMsg[]>(REAL_THREADS[threadKey] ?? []);
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
        status: "read" as const,
      }))
    : mockMsgs;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-obsidian z-50 flex flex-col">
      {/* Header */}
      <div className="glass-2 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <BioAvatar
            src={conversation.image}
            size="md"
            vertical={conversation.vertical}
            online={conversation.online}
          />
          <div>
            <h2 className="font-bold text-foreground">{conversation.name}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{conversation.specialty}</span>
              {conversation.location && (
                <span className="text-xs px-1.5 py-0.5 bg-slate-500/10 text-slate-300 rounded-full">
                  {conversation.location}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-white/10">
            <Info className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {renderMessages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.from === "client" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl p-3 ${
                msg.from === "client"
                  ? "gradient-indigo text-primary-foreground rounded-br-none"
                  : "glass-1 text-foreground rounded-bl-none"
              }`}
            >
              {msg.type === "routine" ? (
                <div className="space-y-2">
                  <div className="font-medium">{msg.title}</div>
                  <div className="text-sm opacity-80">{msg.exercises} exercises</div>
                  <button className="text-sm font-medium underline">View Routine</button>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.text}</div>
              )}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-xs opacity-70">{msg.time}</span>
                {msg.from === "client" && (
                  <>
                    {msg.status === "sent" && <Check className="w-3 h-3" />}
                    {msg.status === "delivered" && <Check className="w-3 h-3" />}
                    {msg.status === "read" && <CheckCheck className="w-3 h-3" />}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="glass-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-white/10" onClick={() => window.alert("File sharing coming soon.")}>
            <Paperclip className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 glass-1 rounded-full px-4 py-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${conversation.name}...`}
              className="w-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground"
              rows={1}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={sending || !draft.trim()}
            className={`p-3 rounded-full ${draft.trim() ? "gradient-indigo" : "glass-1 opacity-50"}`}
          >
            <Send className={`w-5 h-5 ${draft.trim() ? "text-primary-foreground" : "text-foreground"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function Messages() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const selectedConv = REAL_CONVERSATIONS.find(c => c.id === selected);

  const filtered = REAL_CONVERSATIONS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.specialty.toLowerCase().includes(search.toLowerCase()) ||
    (c.location && c.location.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="max-w-3xl mx-auto px-4 pt-12 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground">
              Connect with your service providers
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="glass-1 rounded-full px-4 py-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search providers, specialties, or locations..."
            className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Conversations list */}
        <div className="space-y-3">
          {filtered.length === 0 && REAL_CONVERSATIONS.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No conversations yet</p>
              <p className="text-sm text-muted-foreground">
                Book a session with a provider to start a conversation.
              </p>
            </GlassCard>
          ) : filtered.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <div className="text-muted-foreground mb-2">No providers match your search</div>
              <p className="text-sm text-muted-foreground">
                Try searching for a different specialty or location
              </p>
            </GlassCard>
          ) : (
            filtered.map(conv => (
              <motion.div
                key={conv.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(conv.id)}
                className="glass-1 rounded-2xl p-4 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <BioAvatar
                    src={conv.image}
                    size="lg"
                    vertical={conv.vertical}
                    online={conv.online}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground truncate">{conv.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{conv.time}</span>
                        {conv.unread > 0 && (
                          <div className="w-2 h-2 rounded-full bg-indigo" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.specialty}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-slate-500/10 text-slate-300 rounded-full">
                        {conv.location}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-full">
                        {conv.specialization}
                      </span>
                      {conv.online && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded-full">
                          Online
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180 flex-shrink-0" />
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Bottom navigation */}
        <BottomNav />
      </div>

      {/* Chat view */}
      <AnimatePresence>
        {selectedConv && (
          <ChatView
            conversation={selectedConv}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      {/* Coach AI */}
      <CoachAI
        context={`Messages page. ${filtered.length} conversations.`}
        suggestions={[
          "How should I communicate my fitness goals to a new provider?",
          "What information should I share during my initial consultation?",
          "How often should I check in with my provider between sessions?",
          "What's the best way to provide feedback to my provider?"
        ]}
      />
    </div>
  );
}