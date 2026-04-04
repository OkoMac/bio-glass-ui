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

// Import real provider data
import realData from "@/data/bion_pretoria_data.json";

// ── Real messaging data based on Pretoria service providers ────────
interface MockMsg {
  id: number; from: "client" | "provider";
  text?: string; type?: string; title?: string; exercises?: number;
  time: string; status: "sent" | "delivered" | "read";
  providerId?: string;
}

// Get real providers for messaging
const REAL_PROVIDERS = realData.providers || [];

// Helper to get a random provider
const getRandomProvider = (index?: number) => {
  if (REAL_PROVIDERS.length === 0) return { 
    name: "Provider", 
    id: "provider_1",
    service: "Service",
    location: "Pretoria"
  };
  const idx = index !== undefined ? index % REAL_PROVIDERS.length : Math.floor(Math.random() * REAL_PROVIDERS.length);
  const provider = REAL_PROVIDERS[idx];
  return {
    name: provider.name,
    id: provider.id,
    service: provider.service,
    location: provider.location || "Pretoria",
    specialization: provider.specialization || "Fitness"
  };
};

// Generate realistic message threads based on real providers
const generateRealThreads = () => {
  const threads: Record<string, MockMsg[]> = {};
  
  // Create threads for first 4 real providers
  const providers = REAL_PROVIDERS.slice(0, 4);
  
  providers.forEach((provider, index) => {
    const providerKey = provider.id.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    // Generate realistic conversation based on provider service
    let conversation: MockMsg[] = [];
    
    switch (provider.service) {
      case "Personal Training":
        conversation = [
          { id: 1, from: "provider", text: `Hi! How are you feeling after our ${provider.service} session yesterday?`, time: "9:15am", status: "read", providerId: provider.id },
          { id: 2, from: "client", text: "Feeling good! A little sore but that's expected. The form cues really helped!", time: "9:22am", status: "read" },
          { id: 3, from: "provider", text: "Great to hear! Remember to do the dynamic stretches I showed you before your next workout.", time: "9:24am", status: "read", providerId: provider.id },
          { id: 4, from: "provider", text: "I've updated your 4-week strength program. Check the new exercises in your routine.", time: "9:25am", status: "read", providerId: provider.id },
          { id: 5, from: "provider", type: "routine", title: "Week 3: Strength Focus", exercises: 8, time: "9:25am", status: "read", providerId: provider.id },
          { id: 6, from: "client", text: "Just reviewed it. The progressive overload looks perfect! 🔥", time: "10:01am", status: "read" },
          { id: 7, from: "provider", text: "See you tomorrow at 8 AM. Bring your workout log!", time: "2:30pm", status: "read", providerId: provider.id },
        ];
        break;
        
      case "Physiotherapy":
      case "Sports Rehabilitation":
        conversation = [
          { id: 1, from: "provider", text: `Your ${provider.service} assessment shows excellent progress. Keep up the consistency!`, time: "Mon", status: "read", providerId: provider.id },
          { id: 2, from: "client", text: "Thanks! The knee feels much more stable during my runs.", time: "Mon", status: "read" },
          { id: 3, from: "provider", text: "That's great news. I've added new mobility exercises to your rehab plan.", time: "Tue", status: "read", providerId: provider.id },
          { id: 4, from: "client", text: "The foam rolling techniques are really helping with recovery.", time: "Wed", status: "read" },
          { id: 5, from: "provider", text: "Perfect! Remember to ice for 15 minutes after your sessions this week.", time: "Wed", status: "read", providerId: provider.id },
        ];
        break;
        
      case "Nutrition Counseling":
      case "Diet Planning":
        conversation = [
          { id: 1, from: "provider", text: `Hi! How has your ${provider.service.toLowerCase()} plan been working for you?`, time: "Yesterday", status: "read", providerId: provider.id },
          { id: 2, from: "client", text: "Really well! I've noticed more energy throughout the day.", time: "Yesterday", status: "read" },
          { id: 3, from: "provider", text: "Excellent! I've adjusted your meal plan based on your feedback. More protein in the AM.", time: "3h ago", status: "read", providerId: provider.id },
          { id: 4, from: "client", text: "The new recipes look delicious! Trying the quinoa bowl tonight.", time: "1h ago", status: "read" },
        ];
        break;
        
      default:
        conversation = [
          { id: 1, from: "provider", text: `Hope you're enjoying your ${provider.service} sessions! How can I help today?`, time: "Today", status: "read", providerId: provider.id },
          { id: 2, from: "client", text: "Everything's going well! Just wanted to check about my next appointment.", time: "Today", status: "read" },
          { id: 3, from: "provider", text: "Your next session is confirmed for Thursday at 10 AM. See you then!", time: "Today", status: "read", providerId: provider.id },
        ];
    }
    
    threads[providerKey] = conversation;
  });
  
  return threads;
};

const REAL_THREADS = generateRealThreads();

// Generate real conversations list
const generateRealConversations = () => {
  const providers = REAL_PROVIDERS.slice(0, 4);
  const images = [provider1, provider2, provider3, provider4];
  const verticals = ["teal", "indigo", "coral", "amber"] as const;
  const times = ["2m ago", "1h ago", "3h ago", "Yesterday"];
  const onlineStatus = [true, false, true, false];
  
  return providers.map((provider, index) => ({
    id: provider.id.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
    supabaseId: null,
    name: provider.name,
    specialty: provider.service,
    specialization: provider.specialization || "Wellness",
    image: images[index % images.length],
    vertical: verticals[index % verticals.length] as "teal" | "indigo" | "coral" | "amber",
    time: times[index % times.length],
    unread: index === 0 ? 2 : index === 2 ? 1 : 0,
    online: onlineStatus[index % onlineStatus.length],
    location: provider.location || "Pretoria",
    providerId: provider.id
  }));
};

const REAL_CONVERSATIONS = generateRealConversations();

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
            <Phone className="w-5 h-5 text-foreground" />
          </button>
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
          <button className="p-2 rounded-full hover:bg-white/10">
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
          {draft.trim() ? (
            <button
              onClick={sendMessage}
              disabled={sending}
              className="p-3 gradient-indigo rounded-full"
            >
              <Send className="w-5 h-5 text-primary-foreground" />
            </button>
          ) : (
            <button className="p-3 glass-1 rounded-full">
              <Mic className="w-5 h-5 text-foreground" />
            </button>
          )}
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

  // Get provider stats
  const providerStats = {
    total: REAL_CONVERSATIONS.length,
    online: REAL_CONVERSATIONS.filter(c => c.online).length,
    locations: Array.from(new Set(REAL_CONVERSATIONS.map(c => c.location))).length,
    specialties: Array.from(new Set(REAL_CONVERSATIONS.map(c => c.specialty))).length,
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
      <div className="max-w-3xl mx-auto px-4 pt-12 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground">
              Connect with {REAL_PROVIDERS.length} Pretoria service providers
            </p>
          </div>
        </div>

        {/* Stats card */}
        <GlassCard className="p-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{providerStats.total}</div>
              <div className="text-xs text-muted-foreground">Providers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{providerStats.online}</div>
              <div className="text-xs text-muted-foreground">Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{providerStats.locations}</div>
              <div className="text-xs text-muted-foreground">Locations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{providerStats.specialties}</div>
              <div className="text-xs text-muted-foreground">Specialties</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs text-muted-foreground">
              Real conversations with Pretoria providers across {providerStats.locations} locations
            </p>
          </div>
        </GlassCard>

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
          {filtered.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <div className="text-muted-foreground mb-2">No providers match your search</div>
              <p className="text-sm text-muted-foreground">
                Try searching for a different specialty or location in Pretoria
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
        <BottomNav active="messages" />
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
        context={`Messages page. ${filtered.length} Pretoria providers available. ${providerStats.online} currently online.`}
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