import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import CoachAI from "@/components/CoachAI";
import { ArrowLeft, Heart, Send, Sparkles, Brain, Dumbbell, Apple, Moon, Smile } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "coach";
  text: string;
  time: string;
}

const RESPONSES: Record<string, string[]> = {
  stressed: [
    "Take a deep breath in for 4 counts, hold for 7, exhale for 8. This activates your parasympathetic nervous system and calms your mind. You've got this!",
    "When you're feeling overwhelmed, try the 5-4-3-2-1 technique: notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.",
    "Stress is your body's way of saying it cares. Acknowledge it, then ask: 'What's one small thing I can do right now?' Progress beats perfection.",
    "Step outside for just 5 minutes. Fresh air and a change of scenery can reset your nervous system more effectively than you'd think.",
    "Write down three things that are going well right now. Gratitude journaling has been scientifically proven to reduce cortisol levels by up to 23%.",
    "Try progressive muscle relaxation: tense each muscle group for 5 seconds, then release. Start from your toes and work up to your head. You'll feel the difference.",
  ],
  sleep: [
    "Try a wind-down routine: dim the lights 1 hour before bed, avoid screens, and do some gentle stretching. Your body will learn to associate these cues with sleep.",
    "A warm shower 90 minutes before bed can improve sleep quality. As your body cools down afterward, it naturally triggers sleepiness.",
    "Avoid caffeine after 2pm — it has a half-life of 5-6 hours. That afternoon coffee might be what's keeping you up at night!",
    "Keep your bedroom cool (18-20°C), dark, and quiet. Consider earplugs or a white noise machine if noise is an issue.",
    "If racing thoughts keep you awake, try a 'brain dump' — write everything on your mind in a notebook before bed. Getting it out of your head and onto paper helps.",
    "The 4-7-8 breathing technique works wonders for sleep: breathe in for 4 seconds, hold for 7, exhale slowly for 8. Repeat 3-4 times.",
  ],
  motivation: [
    "Remember: you don't have to be great to start, but you have to start to be great. Every expert was once a beginner. What's one step you can take today?",
    "Your future self will thank you for what you do today. Think about who you want to be in 6 months — every small action compounds.",
    "Motivation follows action, not the other way around. Start with just 5 minutes. Once you begin, momentum will carry you forward.",
    "Celebrate your progress, not just your goals. Look how far you've already come! Every step forward counts.",
    "You are capable of more than you know. The fact that you're here, seeking growth, proves your strength. Keep going!",
    "Set one micro-goal for today — something so small it feels almost too easy. Stack wins, build confidence, and watch yourself transform.",
  ],
  workout: [
    "Try this quick no-equipment workout: 20 squats, 15 push-ups, 30-second plank, 20 lunges, 15 mountain climbers. Rest 60 seconds, repeat 3 times!",
    "Walking is underrated! A brisk 30-minute walk burns roughly 150 calories and boosts your mood for hours. It's the most accessible exercise there is.",
    "Mix up your routine with a HIIT session: 30 seconds work, 15 seconds rest. Try burpees, jump squats, high knees, and push-ups. 15 minutes is all you need!",
    "Feeling low energy? Start with 10 minutes of stretching and mobility work. Loosen up your hips, shoulders, and spine. Movement creates energy.",
    "Try the 'exercise snack' approach: do 5 minutes of movement every hour. Squats while the kettle boils, push-ups between meetings. It adds up!",
    "Don't forget recovery! Active recovery like swimming, yoga, or a light walk helps your muscles repair faster than sitting still.",
  ],
  nutrition: [
    "Eat the rainbow! Aim for at least 5 different coloured fruits and vegetables daily. Each colour provides unique antioxidants and nutrients.",
    "Stay hydrated — aim for 2 litres of water daily. Add lemon, cucumber, or mint for flavour. Often when we think we're hungry, we're actually thirsty!",
    "Prep your meals on Sunday. Having healthy food ready means you're less likely to reach for fast food during a busy week. Planning is half the battle.",
    "Protein at every meal helps you stay fuller for longer and supports muscle recovery. Think eggs, chicken, fish, beans, lentils, or Greek yoghurt.",
    "The 80/20 rule works wonders: eat whole, nutritious foods 80% of the time and enjoy treats guilt-free 20% of the time. Balance, not restriction!",
    "Try adding one extra serving of vegetables to your meals. It's a small change that makes a huge nutritional difference over time.",
  ],
  mental: [
    "It's okay not to be okay. Acknowledging your feelings is the first step to healing. Be kind to yourself — you deserve the same compassion you give others.",
    "Try journaling for 10 minutes daily. Write freely without judging. It helps process emotions and can be as effective as therapy for mild stress.",
    "Set boundaries without guilt. Saying 'no' to things that drain you is saying 'yes' to your mental health. You can't pour from an empty cup.",
    "Connection matters: reach out to someone you trust today. A simple conversation can lighten emotional weight more than you'd expect.",
    "Practice self-compassion: when you catch your inner critic, ask 'Would I say this to a friend?' If not, rephrase it with kindness.",
    "If you're struggling, remember: seeking professional help is a sign of strength, not weakness. BION connects you with qualified wellness professionals who can help.",
  ],
};

const QUICK_PROMPTS = [
  { label: "I'm stressed", key: "stressed", icon: Brain, color: "text-purple-400" },
  { label: "Help me sleep", key: "sleep", icon: Moon, color: "text-indigo-400" },
  { label: "Motivation", key: "motivation", icon: Sparkles, color: "text-amber-400" },
  { label: "Workout ideas", key: "workout", icon: Dumbbell, color: "text-teal-400" },
  { label: "Nutrition tips", key: "nutrition", icon: Apple, color: "text-green-400" },
  { label: "Mental health", key: "mental", icon: Smile, color: "text-pink-400" },
];

const KEYWORD_MAP: Record<string, string> = {
  stress: "stressed", anxious: "stressed", overwhelm: "stressed", panic: "stressed", worry: "stressed", nervous: "stressed",
  sleep: "sleep", insomnia: "sleep", tired: "sleep", rest: "sleep", bedtime: "sleep", awake: "sleep", exhausted: "sleep",
  motivat: "motivation", inspir: "motivation", goal: "motivation", lazy: "motivation", procrastinat: "motivation", stuck: "motivation",
  workout: "workout", exercise: "workout", gym: "workout", train: "workout", fitness: "workout", run: "workout", muscle: "workout",
  eat: "nutrition", food: "nutrition", diet: "nutrition", nutri: "nutrition", meal: "nutrition", healthy: "nutrition", protein: "nutrition",
  mental: "mental", depress: "mental", sad: "mental", lonely: "mental", anxiet: "mental", therapy: "mental", feeling: "mental",
};

function matchCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return "motivation"; // default fallback
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

let msgId = 0;
function nextId() { return `msg_${++msgId}_${Date.now()}`; }

export default function LifeCoach() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "coach",
      text: "Hi there! I'm your BION Life Coach. I'm here to support your wellness journey with tips on stress, sleep, fitness, nutrition, and mental health. How can I help you today?",
      time: timeNow(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text: string, category?: string) => {
    const userMsg: Message = { id: nextId(), role: "user", text, time: timeNow() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    const cat = category || matchCategory(text);
    const response = pickRandom(RESPONSES[cat] || RESPONSES.motivation);

    // Simulate typing delay
    setTimeout(() => {
      setTyping(false);
      const coachMsg: Message = { id: nextId(), role: "coach", text: response, time: timeNow() };
      setMessages((prev) => [...prev, coachMsg]);
    }, 1200 + Math.random() * 800);
  };

  const handleQuickPrompt = (prompt: typeof QUICK_PROMPTS[0]) => {
    sendMessage(prompt.label, prompt.key);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow flex flex-col">
      {/* Header */}
      <div className="mx-auto max-w-lg w-full px-4 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">BION Life Coach</h1>
              <p className="text-[10px] text-teal-400 font-medium">Online · Ready to help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-4 mx-auto max-w-lg w-full space-y-3"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] ${
                msg.role === "user"
                  ? "gradient-teal rounded-2xl rounded-br-md"
                  : "glass-2 rounded-2xl rounded-bl-md"
              } px-4 py-3`}>
                <p className={`text-sm leading-relaxed ${
                  msg.role === "user" ? "text-white" : "text-foreground"
                }`}>{msg.text}</p>
                <p className={`text-[10px] mt-1 ${
                  msg.role === "user" ? "text-white/60" : "text-muted-foreground"
                }`}>{msg.time}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="glass-2 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-indigo-400"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick prompts — show when few messages */}
        {messages.length <= 2 && !typing && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">Quick topics:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p) => (
                <motion.button
                  key={p.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickPrompt(p)}
                  className="glass-1 rounded-pill px-3 py-2 flex items-center gap-1.5 text-xs font-medium text-foreground"
                >
                  <p.icon className={`w-3.5 h-3.5 ${p.color}`} />
                  {p.label}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="mx-auto max-w-lg w-full px-4 pb-28 pt-2">
        {/* Quick prompt chips always available */}
        {messages.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {QUICK_PROMPTS.map((p) => (
              <motion.button
                key={p.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickPrompt(p)}
                className="glass-1 rounded-pill px-2.5 py-1.5 flex items-center gap-1 text-[10px] font-medium text-foreground whitespace-nowrap flex-shrink-0"
              >
                <p.icon className={`w-3 h-3 ${p.color}`} />
                {p.label}
              </motion.button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 glass-2 rounded-2xl px-4 py-3 text-sm text-foreground bg-transparent outline-none placeholder:text-white/30"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={!input.trim() || typing}
            className="w-12 h-12 rounded-full gradient-teal flex items-center justify-center disabled:opacity-40"
          >
            <Send className="w-5 h-5 text-white" />
          </motion.button>
        </form>
      </div>

      <BottomNav />
      <CoachAI />
    </div>
  );
}
