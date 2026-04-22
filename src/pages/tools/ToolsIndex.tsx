import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdBanner from "@/components/AdBanner";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { usePageView } from "@/hooks/usePageView";
import {
  Calculator, UtensilsCrossed, Droplets, Moon, CreditCard, Brain, Sparkles, ArrowLeft,
} from "lucide-react";

const TOOLS = [
  { title: "BMI Calculator", desc: "Check your Body Mass Index instantly", href: "/tools/bmi-calculator", icon: Calculator },
  { title: "Calorie & Meal Tracker", desc: "Log meals and track daily calories", href: "/food-tracker", icon: UtensilsCrossed },
  { title: "Water Intake Tracker", desc: "Stay hydrated with daily glass tracking", href: "/water-tracker", icon: Droplets },
  { title: "Sleep Quality Tracker", desc: "Monitor your sleep patterns and quality", href: "/sleep-tracker", icon: Moon },
  { title: "Digital Medical Card", desc: "Your health info in one portable card", href: "/medical-card", icon: CreditCard },
  { title: "Health Insights", desc: "AI-powered trends from your wellness data", href: "/health-insights", icon: Brain },
  { title: "AI Wellness Coach", desc: "Chat with B_ for personalised guidance", href: "/life-coach", icon: Sparkles },
];

export default function ToolsIndex() {
  const navigate = useNavigate();
  const { user } = useAuth();
  usePageView();

  useEffect(() => {
    document.title = "Free Health & Wellness Tools | BION";
  }, []);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24 relative">
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 pt-12 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Free Health & Wellness Tools</h1>
          <p className="text-sm text-muted-foreground mt-1">No sign-up required. Use any tool instantly.</p>
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} to={tool.href}>
                <GlassCard hover className="p-4 h-full flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl glass-2 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tool.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{tool.desc}</p>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>

        {/* Sign-up banner */}
        {!user && (
          <div className="p-3 rounded-2xl glass-1 border border-indigo/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Sign up free to save your progress and unlock full features</p>
            <a href="/welcome" className="rounded-pill px-3 py-1.5 text-xs font-semibold gradient-indigo text-primary-foreground shrink-0">Sign up free</a>
          </div>
        )}

        <AdBanner slot="tools-index-bottom" format="rectangle" />
      </div>
      {user && <BottomNav />}
    </div>
  );
}
