import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import { trackEvent } from "@/lib/habits";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { useMessages } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useMessaging";
import { supabase } from "@/integrations/supabase/client";
import { getProviderImage } from "@/lib/providerImages";
import { useProviderData } from "@/data/useProviderData";
import { Send, Paperclip, Info, ChevronLeft, Check, CheckCheck, MessageSquare, Loader2, ArrowLeft } from "lucide-react";
import { useImageUpload } from "@/hooks/useUpload";
import { toast } from "sonner";

// ── Message types ────────────────────────────────────────────────
interface MockMsg {
  id: number; from: "client" | "provider";
  text?: string; type?: string; title?: string; exercises?: number;
  time: string; status: "sent" | "delivered" | "read";
  providerId?: string;
}

interface Conversation {
  id: string;
  supabaseId: string | null;  // partner's profile ID for real-time messaging
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
  lastMessage?: string;
}

const VERTICAL_PALETTE: Array<"teal" | "indigo" | "coral" | "amber"> = ["teal", "indigo", "coral", "amber"];

// Seed threads for demo accounts — real users get rtMessages from Supabase.
// Key = first word of provider name lowercased (matches conversation.id derivation).
const REAL_THREADS: Record<string, MockMsg[]> = {
  default: [
    { id: 1, from: "provider", text: "Hey! Saw you booked for Tuesday. Any specific goals for the session?", time: "Mon 10:02", status: "read" },
    { id: 2, from: "client",   text: "Just looking to work on mobility, my back's been tight lately.", time: "Mon 10:08", status: "read" },
    { id: 3, from: "provider", text: "Perfect — I'll build the session around that. See you Tuesday 9am!", time: "Mon 10:10", status: "read" },
  ],
};

function categorizeVertical(category: string): "teal" | "indigo" | "coral" | "amber" {
  const lower = category.toLowerCase();
  if (/gym|fitness|yoga|pilates|train|crossfit/i.test(lower)) return "teal";
  if (/medical|doctor|clinic|dental|physio|chiro/i.test(lower)) return "indigo";
  if (/beauty|salon|spa|hair|nail/i.test(lower)) return "coral";
  return "amber";
}

function getTime() {
  return new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ── Active chat view (handles both real-time and mock) ──────────────
function ChatView({
  conversation,
  onClose,
}: {
  conversation: Conversation;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Real-time hook — only active when supabaseId exists
  const { messages: rtMessages, sendMessage: rtSend, sending } = useMessages(conversation.supabaseId);
  const { upload, uploading } = useImageUpload({ folder: "messages" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock state for demo mode
  const threadKey = conversation.id;
  const [mockMsgs, setMockMsgs] = useState<MockMsg[]>(
    REAL_THREADS[threadKey] ?? REAL_THREADS.default ?? []
  );
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const isRealtime = !!conversation.supabaseId && !!user?.profileId;

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
    trackEvent("message_sent", { category: "messaging", metadata: { conversation_id: conversation?.id, chars: draft.trim().length } });
    setDraft("");
  };

  const handleAttach = async (file: File) => {
    try {
      const url = await upload(file);
      const imgMessage = `📎 ${url}`;
      if (isRealtime) {
        rtSend(imgMessage);
      } else {
        setMockMsgs(prev => [...prev, {
          id: Date.now(), from: "client", text: imgMessage, time: getTime(), status: "sent",
        }]);
      }
      toast.success("Image sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  // Unified message list for rendering
  const renderMessages = isRealtime
    ? rtMessages.map(m => ({
        id: Number(m.id.replace(/-/g, "").slice(0, 9)),
        from: m.senderId === user?.profileId ? "client" : "provider",
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
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10" aria-label="Previous" title="Previous">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <BioAvatar {...{
            src: conversation.image,
            size: "md",
            vertical: conversation.vertical,
            online: conversation.online
          } as any} />
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
          <button className="p-2 rounded-full hover:bg-white/10" onClick={() => navigate(`/provider/${conversation.providerId}`)}>
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
              {'type' in msg && msg.type === "routine" ? (
                <div className="space-y-2">
                  <div className="font-medium">{msg.title}</div>
                  <div className="text-sm opacity-80">{msg.exercises} exercises</div>
                  <button className="text-sm font-medium underline" onClick={() => navigate('/routines')} title="View Routine" aria-label="View Routine">View Routine</button>
                </div>
              ) : msg.text?.startsWith("📎 ") && /https?:\/\/.+\.(jpg|jpeg|png|webp|gif|avif)/i.test(msg.text) ? (
                <a href={msg.text.slice(2).trim()} target="_blank" rel="noopener noreferrer">
                  <img src={msg.text.slice(2).trim()} alt="Shared photo" className="rounded-xl max-w-full max-h-80 object-cover" />
                </a>
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
          <button
            className="p-2 rounded-full hover:bg-white/10 disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Send a photo"
          >
            {uploading
              ? <Loader2 className="w-5 h-5 text-foreground animate-spin" />
              : <Paperclip className="w-5 h-5 text-foreground" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleAttach(e.target.files[0]); }}
          />
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
           aria-label="Send" title="Send">
            <Send className={`w-5 h-5 ${draft.trim() ? "text-primary-foreground" : "text-foreground"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings } = useBookings();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const isDemo = user?.id?.startsWith("demo_") ?? false;

  // Realtime conversations from the new server-side threads table. We fold
  // these into the booking-derived list so partners with no booking but an
  // active chat still appear, and unread counts stay accurate.
  const { conversations: liveConvs } = useConversations();

  // Was: realData.providers from a 547KB static JSON import. Now via API.
  const { providers: ptaProviders } = useProviderData("pta", { all: true });

  /* ── Build conversations list from booking history ────────────── */
  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);

      // Build provider map from bookings (unique providers user has interacted with)
      const providerMap = new Map<string, Conversation>();

      bookings.forEach((b, i) => {
        const providerName = b.providerName ?? b.clientName ?? "Unknown";
        const providerId = (b as any).providerId ?? providerName.replace(/\s/g, "_").toLowerCase();
        if (providerMap.has(providerId)) return;

        // Try to find provider in real Pretoria data
        const realProvider = ptaProviders.find(
          p => p.id === providerId || p.name === providerName
        );

        providerMap.set(providerId, {
          id: providerId,
          supabaseId: null,    // Updated below if Supabase profile exists
          name: providerName,
          specialty: realProvider?.service ?? realProvider?.category ?? "Provider",
          specialization: realProvider?.service ?? "",
          image: realProvider ? getProviderImage(realProvider.id, realProvider.name) : getProviderImage(providerId, providerName),
          vertical: categorizeVertical(realProvider?.category ?? ""),
          time: b.date ?? "Recently",
          unread: 0,
          online: false,
          location: realProvider?.suburb ?? realProvider?.location ?? "",
          providerId,
          lastMessage: `${b.service ?? "Booking"} on ${b.date}`,
        });
      });

      const list = Array.from(providerMap.values());

      // For real users (not demo), try to fetch profile IDs and last messages from Supabase
      if (!isDemo && user?.id && list.length > 0) {
        try {
          // Look up provider profile IDs by name (best-effort match)
          const names = list.map(c => c.name);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("full_name", names);

          const profileMap = new Map<string, { id: string; avatar: string | null }>();
          (profiles as any[] ?? []).forEach(p => {
            profileMap.set(p.full_name, { id: p.id, avatar: p.avatar_url });
          });

          // Update conversations with real profile IDs
          list.forEach(conv => {
            const profile = profileMap.get(conv.name);
            if (profile) {
              conv.supabaseId = profile.id;
              if (profile.avatar) conv.image = profile.avatar;
            }
          });

          // Fetch the most recent message for each conversation that has a profile ID.
          // Bug fix 2026-04-29: previous filter `sender_id.in.(...)|receiver_id.in.(...)`
          // matched ANY message touching ANY partner — including messages
          // between two partners that don't involve the current user, which
          // could show a stranger's text as your conversation's last message.
          // Tightened to "(I sent → them) OR (they sent → me)".
          const conversationsWithProfiles = list.filter(c => c.supabaseId);
          if (conversationsWithProfiles.length > 0 && user.profileId) {
            const partnerIds = conversationsWithProfiles.map(c => c.supabaseId!);
            const partners = partnerIds.join(",");
            const me = user.profileId;
            const { data: recentMsgs } = await supabase
              .from("messages")
              .select("sender_id, receiver_id, content, created_at, is_read")
              .or(
                `and(sender_id.eq.${me},receiver_id.in.(${partners})),` +
                `and(sender_id.in.(${partners}),receiver_id.eq.${me})`,
              )
              .order("created_at", { ascending: false })
              .limit(100);

            (recentMsgs as any[] ?? []).forEach(msg => {
              const partnerId = msg.sender_id === user.profileId ? msg.receiver_id : msg.sender_id;
              const conv = list.find(c => c.supabaseId === partnerId);
              if (conv && !conv.lastMessage?.startsWith(msg.content)) {
                conv.lastMessage = msg.content;
                conv.time = new Date(msg.created_at).toLocaleString("en-ZA", { hour: "2-digit", minute: "2-digit" });
                if (msg.receiver_id === user.profileId && !msg.is_read) {
                  conv.unread = (conv.unread ?? 0) + 1;
                }
              }
            });
          }
        } catch (err) {
          console.error("[messages] Supabase enrichment failed:", err);
        }
      }

      setConversations(list);
      setLoading(false);
    };

    loadConversations();
  }, [bookings, user?.id, isDemo, ptaProviders]);

  // Merge server-side realtime conversations (unread counts + lastMessage).
  // Booking-derived rows stay, but live data wins where it exists. New
  // partners that only exist as chat (no booking yet) are appended.
  useEffect(() => {
    if (!liveConvs?.length) return;
    setConversations(prev => {
      const byPartner = new Map(prev.filter(c => c.supabaseId).map(c => [c.supabaseId!, c]));
      const next = [...prev];

      liveConvs.forEach(lc => {
        const existing = byPartner.get(lc.partnerId);
        if (existing) {
          existing.unread = lc.unread;
          if (lc.lastMessagePreview) existing.lastMessage = lc.lastMessagePreview;
          if (lc.lastMessageAt) {
            existing.time = new Date(lc.lastMessageAt).toLocaleString("en-ZA", {
              hour: "2-digit", minute: "2-digit",
            });
          }
        } else {
          next.push({
            id: `live_${lc.partnerId}`,
            supabaseId: lc.partnerId,
            name: lc.partnerName,
            specialty: lc.partnerSpecialty ?? "Provider",
            specialization: lc.partnerSpecialty ?? "",
            image: lc.partnerAvatar ?? getProviderImage(lc.partnerId, lc.partnerName),
            vertical: categorizeVertical(lc.partnerSpecialty ?? ""),
            time: lc.lastMessageAt
              ? new Date(lc.lastMessageAt).toLocaleString("en-ZA", { hour: "2-digit", minute: "2-digit" })
              : "",
            unread: lc.unread,
            online: false,
            location: "",
            providerId: lc.partnerId,
            lastMessage: lc.lastMessagePreview ?? "",
          });
        }
      });

      // Sort — any row with unread at the top, then by time present.
      next.sort((a, b) => (b.unread ?? 0) - (a.unread ?? 0));
      return next;
    });
  }, [liveConvs]);

  const selectedConv = conversations.find(c => c.id === selected);

  const filtered = useMemo(() => conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.specialty.toLowerCase().includes(search.toLowerCase()) ||
    (c.location && c.location.toLowerCase().includes(search.toLowerCase()))
  ), [conversations, search]);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="max-w-3xl xl:max-w-7xl mx-auto px-4 md:px-8 pt-20 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="shrink-0 w-9 h-9 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="Go back" aria-label="Go back">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Messages</h1>
              <p className="text-sm text-muted-foreground">
                Connect with your service providers
              </p>
            </div>
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
          {loading ? (
            <GlassCard className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Loading conversations...</p>
            </GlassCard>
          ) : filtered.length === 0 && conversations.length === 0 ? (
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
                  <BioAvatar {...{
                    src: conv.image,
                    size: "lg",
                    vertical: conv.vertical,
                    online: conv.online
                  } as any} />
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
      <BionAssistant {...{
        context: `Messages page. ${filtered.length} conversations.`,
        suggestions: [
          "How should I communicate my fitness goals to a new provider?",
          "What information should I share during my initial consultation?",
          "How often should I check in with my provider between sessions?",
          "What's the best way to provide feedback to my provider?"
        ]
      } as any} />
    </div>
  );
}