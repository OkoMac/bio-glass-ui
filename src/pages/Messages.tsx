import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import { Send, Mic, Paperclip, Phone, Info, ChevronLeft, Check, CheckCheck } from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";

const conversations = [
  {
    id: "lisa",
    name: "Lisa Dlamini",
    specialty: "Personal Trainer",
    image: provider1,
    vertical: "teal" as const,
    lastMessage: "Great progress today! Remember to stretch before our session tomorrow 💪",
    time: "2m ago",
    unread: 2,
    online: true,
  },
  {
    id: "kagiso",
    name: "Dr. Kagiso Sithole",
    specialty: "Biokineticist",
    image: provider2,
    vertical: "indigo" as const,
    lastMessage: "Your rehab plan has been updated. Check your routines tab.",
    time: "1h ago",
    unread: 0,
    online: false,
  },
  {
    id: "sarah",
    name: "Sarah Chen",
    specialty: "Skincare Specialist",
    image: provider3,
    vertical: "coral" as const,
    lastMessage: "Looking forward to your facial on Tuesday! Please avoid retinol 48h before.",
    time: "3h ago",
    unread: 1,
    online: true,
  },
  {
    id: "amir",
    name: "Amir Patel",
    specialty: "Yoga Instructor",
    image: provider4,
    vertical: "amber" as const,
    lastMessage: "Namaste 🙏 Your meditation recording is ready.",
    time: "Yesterday",
    unread: 0,
    online: false,
  },
];

const chatMessages = [
  { id: 1, from: "provider", text: "Hey! How are you feeling after yesterday's session?", time: "9:15am", status: "read" },
  { id: 2, from: "client", text: "Feeling good! A little sore in the shoulders but nothing bad 😊", time: "9:22am", status: "read" },
  { id: 3, from: "provider", text: "That's normal after those overhead presses. Make sure to do the stretches I showed you.", time: "9:24am", status: "read" },
  { id: 4, from: "provider", text: "I've added a new warm-up routine to your plan for tomorrow. Check it out!", time: "9:25am", status: "read" },
  { id: 5, from: "provider", type: "routine", title: "Pre-Session Warm-Up", exercises: 6, time: "9:25am", status: "read" },
  { id: 6, from: "client", text: "Awesome, just reviewed it. Looks great 🔥", time: "10:01am", status: "delivered" },
  { id: 7, from: "provider", text: "Great progress today! Remember to stretch before our session tomorrow 💪", time: "2:30pm", status: "sent" },
];

const Messages = () => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const activeConversation = conversations.find((c) => c.id === activeChat);

  if (activeChat && activeConversation) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col">
        {/* Chat Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-2 px-4 py-3 flex items-center gap-3 pt-12"
        >
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveChat(null)}>
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <BioAvatar src={activeConversation.image} alt={activeConversation.name} size="sm" verticalColor={activeConversation.vertical} online={activeConversation.online} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{activeConversation.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {activeConversation.online ? "Online" : activeConversation.specialty}
            </p>
          </div>
          <Phone className="w-4 h-4 text-muted-foreground" />
          <Info className="w-4 h-4 text-muted-foreground ml-2" />
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {chatMessages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex ${msg.from === "client" ? "justify-end" : "justify-start"}`}
            >
              {(msg as any).type === "routine" ? (
                <GlassCard variant="accent-teal" className="p-3 max-w-[75%]">
                  <p className="text-xs text-teal font-medium">📋 Routine Shared</p>
                  <p className="text-sm text-foreground font-medium mt-1">{(msg as any).title}</p>
                  <p className="text-xs text-muted-foreground">{(msg as any).exercises} exercises</p>
                  <button className="text-xs text-teal font-medium mt-2">View Routine →</button>
                </GlassCard>
              ) : (
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                    msg.from === "client"
                      ? "gradient-indigo rounded-br-md"
                      : "glass-1 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm text-foreground leading-relaxed">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[9px] text-foreground/40">{msg.time}</span>
                    {msg.from === "client" && (
                      msg.status === "read" ? (
                        <CheckCheck className="w-3 h-3 text-teal" />
                      ) : msg.status === "delivered" ? (
                        <CheckCheck className="w-3 h-3 text-foreground/40" />
                      ) : (
                        <Check className="w-3 h-3 text-foreground/40" />
                      )
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="px-4 pb-6 pt-2">
          <div className="glass-1 rounded-pill flex items-center gap-2 px-4 py-2.5">
            <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Message..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <Mic className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="mx-auto max-w-lg lg:max-w-none px-4 lg:px-8 xl:px-12 pt-12 space-y-5">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>

        <div className="space-y-1">
          {conversations.map((convo, i) => (
            <motion.div
              key={convo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard
                hover
                className="p-3.5 cursor-pointer"
                onClick={() => setActiveChat(convo.id)}
              >
                <div className="flex items-center gap-3">
                  <BioAvatar
                    src={convo.image}
                    alt={convo.name}
                    size="md"
                    verticalColor={convo.vertical}
                    online={convo.online}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{convo.name}</p>
                      <span className="text-[10px] text-muted-foreground">{convo.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{convo.lastMessage}</p>
                  </div>
                  {convo.unread > 0 && (
                    <span className="w-5 h-5 rounded-full gradient-indigo flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                      {convo.unread}
                    </span>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Messages;
