import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import AdBanner from "@/components/AdBanner";
import { useFoodSync } from "@/hooks/useFoodSync";
import { useActivityPoints } from "@/hooks/useActivityPoints";
import { trackEvent } from "@/lib/habits";
import {
  ArrowLeft, Camera, Plus, X, Flame, TrendingUp, TrendingDown,
  Utensils, Droplets, Apple, Coffee, Moon, Sun, ChevronRight,
  Target, Trash2, Image, Zap, Clock, AlertTriangle
} from "lucide-react";

/* ── Types ──────────────────────────────────────────── */
interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  time: string;
  photo?: string; // base64 data URL
  date: string;
}

interface DailyGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number; // glasses
}

interface BurnActivity {
  name: string;
  calories: number;
  duration: string;
}

/* ── Calorie database (common SA foods) ──────────── */
const FOOD_DATABASE: Record<string, { cal: number; protein: number; carbs: number; fat: number }> = {
  "oats porridge": { cal: 150, protein: 5, carbs: 27, fat: 3 },
  "eggs (2)": { cal: 155, protein: 13, carbs: 1, fat: 11 },
  "toast (white)": { cal: 75, protein: 2, carbs: 14, fat: 1 },
  "toast (brown)": { cal: 65, protein: 3, carbs: 12, fat: 1 },
  "banana": { cal: 105, protein: 1, carbs: 27, fat: 0 },
  "apple": { cal: 95, protein: 0, carbs: 25, fat: 0 },
  "chicken breast": { cal: 165, protein: 31, carbs: 0, fat: 4 },
  "grilled chicken": { cal: 200, protein: 35, carbs: 0, fat: 6 },
  "rice (1 cup)": { cal: 206, protein: 4, carbs: 45, fat: 0 },
  "brown rice": { cal: 216, protein: 5, carbs: 45, fat: 2 },
  "pasta (1 cup)": { cal: 220, protein: 8, carbs: 43, fat: 1 },
  "steak (200g)": { cal: 400, protein: 46, carbs: 0, fat: 22 },
  "salmon fillet": { cal: 280, protein: 34, carbs: 0, fat: 16 },
  "boerewors": { cal: 350, protein: 18, carbs: 4, fat: 28 },
  "biltong (50g)": { cal: 125, protein: 25, carbs: 1, fat: 2 },
  "avocado": { cal: 240, protein: 3, carbs: 13, fat: 22 },
  "sweet potato": { cal: 112, protein: 2, carbs: 26, fat: 0 },
  "salad (mixed)": { cal: 35, protein: 2, carbs: 7, fat: 0 },
  "protein shake": { cal: 200, protein: 30, carbs: 8, fat: 4 },
  "yoghurt (greek)": { cal: 130, protein: 17, carbs: 6, fat: 4 },
  "almonds (30g)": { cal: 170, protein: 6, carbs: 6, fat: 15 },
  "pap (maize)": { cal: 180, protein: 4, carbs: 40, fat: 1 },
  "chakalaka": { cal: 80, protein: 2, carbs: 14, fat: 2 },
  "vetkoek": { cal: 350, protein: 6, carbs: 40, fat: 18 },
  "bunny chow": { cal: 650, protein: 25, carbs: 70, fat: 28 },
  "roti": { cal: 200, protein: 5, carbs: 30, fat: 7 },
  "milk (glass)": { cal: 120, protein: 8, carbs: 12, fat: 5 },
  "coffee (black)": { cal: 5, protein: 0, carbs: 1, fat: 0 },
  "coffee (latte)": { cal: 150, protein: 8, carbs: 15, fat: 6 },
  "orange juice": { cal: 110, protein: 2, carbs: 26, fat: 0 },
  "chips (small)": { cal: 270, protein: 3, carbs: 35, fat: 14 },
  "pizza (slice)": { cal: 285, protein: 12, carbs: 36, fat: 10 },
  "burger": { cal: 500, protein: 25, carbs: 40, fat: 26 },
  "wrap (chicken)": { cal: 380, protein: 28, carbs: 35, fat: 14 },
  "sushi (6 pcs)": { cal: 250, protein: 12, carbs: 38, fat: 4 },
  "smoothie bowl": { cal: 350, protein: 10, carbs: 55, fat: 8 },
};

/* ── Burn suggestions ──────────────────────────────── */
function getBurnSuggestions(caloriesToBurn: number): BurnActivity[] {
  const activities: { name: string; calPerMin: number }[] = [
    { name: "Running (moderate)", calPerMin: 10 },
    { name: "Walking (brisk)", calPerMin: 5 },
    { name: "Cycling", calPerMin: 8 },
    { name: "Swimming", calPerMin: 9 },
    { name: "HIIT workout", calPerMin: 12 },
    { name: "Yoga", calPerMin: 4 },
    { name: "Weight training", calPerMin: 6 },
    { name: "Skipping rope", calPerMin: 11 },
    { name: "Dance class", calPerMin: 7 },
    { name: "Stair climbing", calPerMin: 9 },
  ];
  return activities.map(a => ({
    name: a.name,
    calories: caloriesToBurn,
    duration: `${Math.ceil(caloriesToBurn / a.calPerMin)} min`,
  }));
}

const MEAL_ICONS: Record<string, typeof Sun> = {
  breakfast: Sun,
  lunch: Coffee,
  dinner: Moon,
  snack: Apple,
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const STORAGE_KEY = "bion_food_tracker";
const GOALS_KEY = "bion_food_goals";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/* ── Component ──────────────────────────────────────── */
export default function FoodTracker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with Supabase for authenticated users
  const { entries, todayEntries, goals, addEntry: syncAddEntry, deleteEntry: syncDeleteEntry, saveGoals: syncSaveGoals } = useFoodSync();
  const { awardPoints } = useActivityPoints();

  const [showAdd, setShowAdd] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showBurn, setShowBurn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeal, setSelectedMeal] = useState<FoodEntry["meal"]>("breakfast");
  const [manualEntry, setManualEntry] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [waterCount, setWaterCount] = useState(() => {
    try { const s = localStorage.getItem(`bion_water_${getToday()}`); return s ? parseInt(s) : 0; }
    catch { return 0; }
  });

  // Persist water count locally (also synced via water_log table)
  useEffect(() => { localStorage.setItem(`bion_water_${getToday()}`, String(waterCount)); }, [waterCount]);
  const totalCal = todayEntries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = todayEntries.reduce((s, e) => s + (e.protein ?? 0), 0);
  const totalCarbs = todayEntries.reduce((s, e) => s + (e.carbs ?? 0), 0);
  const totalFat = todayEntries.reduce((s, e) => s + (e.fat ?? 0), 0);
  const calRemaining = goals.calories - totalCal;
  const calPct = Math.min(100, Math.round((totalCal / goals.calories) * 100));
  const isOver = totalCal > goals.calories;

  // Food search
  const searchResults = searchQuery.trim()
    ? Object.entries(FOOD_DATABASE).filter(([name]) => name.includes(searchQuery.toLowerCase())).slice(0, 8)
    : [];

  const addFromDatabase = (name: string, info: typeof FOOD_DATABASE[string]) => {
    const entry: FoodEntry = {
      id: `food_${Date.now()}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      calories: info.cal,
      protein: info.protein,
      carbs: info.carbs,
      fat: info.fat,
      meal: selectedMeal,
      time: new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
      date: getToday(),
    };
    syncAddEntry(entry);
    awardPoints("log_food", entry.id).catch(() => {});
    trackEvent("tool_use", { category: "wellness_tracking", metadata: { tool: "food", meal: selectedMeal, calories: entry.calories } });
    setSearchQuery("");
  };

  const addManual = () => {
    if (!manualEntry.name.trim() || !manualEntry.calories) return;
    const entry: FoodEntry = {
      id: `food_${Date.now()}`,
      name: manualEntry.name.trim(),
      calories: parseInt(manualEntry.calories) || 0,
      protein: parseInt(manualEntry.protein) || 0,
      carbs: parseInt(manualEntry.carbs) || 0,
      fat: parseInt(manualEntry.fat) || 0,
      meal: selectedMeal,
      time: new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
      photo: photoPreview ?? undefined,
      date: getToday(),
    };
    syncAddEntry(entry);
    awardPoints("log_food", entry.id).catch(() => {});
    trackEvent("tool_use", { category: "wellness_tracking", metadata: { tool: "food", meal: selectedMeal, calories: entry.calories } });
    setManualEntry({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    setPhotoPreview(null);
    setShowAdd(false);
  };

  const API_URL = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
  const PHOTO_LIMIT = 6;
  const PHOTO_COUNT_KEY = `bion_photo_count_${getToday()}`;

  const getPhotoCount = () => {
    try { return parseInt(localStorage.getItem(PHOTO_COUNT_KEY) ?? "0"); }
    catch { return 0; }
  };
  const [photoCount, setPhotoCount] = useState(getPhotoCount);
  const photosRemaining = PHOTO_LIMIT - photoCount;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Rate limit: 6 photos per day
    if (photoCount >= PHOTO_LIMIT) {
      alert(`You've used all ${PHOTO_LIMIT} photo scans for today. You can still log meals manually using the text search or manual entry below.`);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setPhotoPreview(result);

      // Increment photo count
      const newCount = photoCount + 1;
      setPhotoCount(newCount);
      localStorage.setItem(PHOTO_COUNT_KEY, String(newCount));

      // Call AI calorie estimation API. If it fails or returns an obvious
      // no-confidence result, leave the macros BLANK so the user enters them
      // honestly rather than us inventing numbers.
      try {
        const res = await fetch(`${API_URL}/api/ai/estimate-calories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: result, description: manualEntry.name || undefined }),
        });
        const data = await res.json();
        const ok = res.ok && data && typeof data.calories === "number" && data.calories > 0;
        setManualEntry(prev => ({
          ...prev,
          name: prev.name || data?.name || "Meal (photo)",
          calories: ok ? String(data.calories) : "",
          protein:  ok && typeof data.protein === "number" ? String(data.protein) : "",
          carbs:    ok && typeof data.carbs   === "number" ? String(data.carbs)   : "",
          fat:      ok && typeof data.fat     === "number" ? String(data.fat)     : "",
        }));
        if (!ok) {
          // Surface that we couldn't estimate, instead of pretending
          window.alert("Couldn't estimate macros from the photo. Please enter them manually.");
        }
      } catch {
        setManualEntry(prev => ({
          ...prev,
          name: prev.name || "Meal (photo)",
          calories: "",
          protein: "",
          carbs: "",
          fat: "",
        }));
        window.alert("Couldn't reach the food estimator. Please enter macros manually.");
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteEntry = (id: string) => syncDeleteEntry(id);

  const burnActivities = getBurnSuggestions(Math.max(0, totalCal > goals.calories ? totalCal - goals.calories : 500));

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 pt-12 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Food Tracker</h1>
            <p className="text-xs text-muted-foreground">Track meals, calories & nutrition</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowGoals(true)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <Target className="w-4 h-4 text-teal" />
          </motion.button>
        </div>

        {!user && (
          <div className="mx-4 mb-3 p-3 rounded-2xl glass-1 border border-indigo/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Sign up free to save your progress and unlock full features</p>
            <a href="/welcome" className="rounded-pill px-3 py-1.5 text-xs font-semibold gradient-indigo text-primary-foreground shrink-0">Sign up free</a>
          </div>
        )}

        <AdBanner slot="utilities-top" format="horizontal" />

        {/* Daily summary ring */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke={isOver ? "#F05A28" : "#0D9488"} strokeWidth="8"
                  strokeDasharray={`${calPct * 2.64} 264`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-bold ${isOver ? "text-coral" : "text-foreground"}`}>{totalCal}</span>
                <span className="text-[9px] text-muted-foreground">/ {goals.calories}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Remaining</span>
                <span className={`text-sm font-bold ${isOver ? "text-coral" : "text-teal"}`}>
                  {isOver ? `+${Math.abs(calRemaining)}` : calRemaining} kcal
                </span>
              </div>
              {/* Macros */}
              {[
                { label: "Protein", val: totalProtein, goal: goals.protein, color: "bg-teal" },
                { label: "Carbs", val: totalCarbs, goal: goals.carbs, color: "bg-amber" },
                { label: "Fat", val: totalFat, goal: goals.fat, color: "bg-coral" },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="text-foreground font-data">{m.val}g / {m.goal}g</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5">
                    <div className={`h-full rounded-full ${m.color} transition-all`}
                      style={{ width: `${Math.min(100, (m.val / m.goal) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Water tracker row */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-foreground">Water: {waterCount}/{goals.water} glasses</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setWaterCount(prev => Math.max(0, prev - 1))}
                className="w-7 h-7 rounded-lg glass-1 text-muted-foreground text-xs font-bold">−</button>
              <button onClick={() => setWaterCount(prev => prev + 1)}
                className="w-7 h-7 rounded-lg bg-blue-400/20 text-blue-400 text-xs font-bold">+</button>
            </div>
          </div>
        </GlassCard>

        {/* Quick add buttons */}
        <div className="flex gap-2">
          {(["breakfast", "lunch", "dinner", "snack"] as const).map(meal => {
            const Icon = MEAL_ICONS[meal];
            const count = todayEntries.filter(e => e.meal === meal).length;
            return (
              <button key={meal} onClick={() => { setSelectedMeal(meal); setShowAdd(true); }}
                className="flex-1 py-3 glass-1 rounded-2xl flex flex-col items-center gap-1 border border-white/08 hover:border-white/16 transition-colors">
                <Icon className="w-4 h-4 text-teal" />
                <span className="text-[10px] text-foreground font-medium">{MEAL_LABELS[meal]}</span>
                {count > 0 && <span className="text-[9px] text-muted-foreground">{count} items</span>}
              </button>
            );
          })}
        </div>

        {/* Burn button */}
        {totalCal > 0 && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowBurn(true)}
            className="w-full py-3 glass-1 rounded-2xl flex items-center justify-center gap-2 border border-white/08 hover:border-coral/30 transition-colors">
            <Flame className={`w-4 h-4 ${isOver ? "text-coral" : "text-amber"}`} />
            <span className="text-sm text-foreground">
              {isOver ? `Burn ${Math.abs(calRemaining)} excess calories` : "View burn suggestions"}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        )}

        {/* Today's meals */}
        {(["breakfast", "lunch", "dinner", "snack"] as const).map(meal => {
          const mealEntries = todayEntries.filter(e => e.meal === meal);
          if (mealEntries.length === 0) return null;
          const Icon = MEAL_ICONS[meal];
          const mealCal = mealEntries.reduce((s, e) => s + e.calories, 0);
          return (
            <div key={meal}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-teal" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{MEAL_LABELS[meal]}</span>
                </div>
                <span className="text-xs font-data text-foreground">{mealCal} kcal</span>
              </div>
              <div className="space-y-1.5">
                {mealEntries.map(entry => (
                  <GlassCard key={entry.id} className="p-3 flex items-center gap-3">
                    {entry.photo ? (
                      <img src={entry.photo} alt={entry.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                        <Utensils className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{entry.calories} kcal</span>
                        {entry.protein ? <span className="text-[10px] text-teal">P:{entry.protein}g</span> : null}
                        {entry.carbs ? <span className="text-[10px] text-amber">C:{entry.carbs}g</span> : null}
                        {entry.fat ? <span className="text-[10px] text-coral">F:{entry.fat}g</span> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{entry.time}</span>
                      <button onClick={() => deleteEntry(entry.id)} className="text-muted-foreground hover:text-coral transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          );
        })}

        {todayEntries.length === 0 && (
          <GlassCard className="p-8 text-center">
            <Utensils className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No meals logged today</p>
            <p className="text-xs text-muted-foreground mb-3">Tap a meal above or take a photo of your food</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-pill text-xs font-semibold bg-gradient-to-r from-teal to-emerald-400 text-white">
              <Plus className="w-3 h-3 inline mr-1" /> Log a Meal
            </motion.button>
          </GlassCard>
        )}

        {/* B_ insight */}
        {totalCal > 0 && (
          <GlassCard variant="accent-indigo" className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet to-indigo flex items-center justify-center text-sm shrink-0">B_</div>
              <div>
                <p className="text-sm font-medium text-foreground">B_ Analysis</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {isOver
                    ? `You're ${Math.abs(calRemaining)} kcal over today's goal. A ${Math.ceil(Math.abs(calRemaining) / 10)}-minute run would balance it out. Consider a lighter dinner.`
                    : totalProtein < goals.protein * 0.5
                    ? `Good calorie tracking! Your protein is low — you've had ${totalProtein}g of ${goals.protein}g. Add chicken, fish, or a shake to hit your target.`
                    : `You're on track with ${calRemaining} kcal remaining. Keep it up! Your macros are well balanced today.`}
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* ── Add Food Sheet ──────────────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div key="add-ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)} className="fixed inset-0 bg-obsidian/60 z-[60]" />
            <motion.div key="add-sheet"
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] p-5 max-h-[85vh] overflow-y-auto"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Log {MEAL_LABELS[selectedMeal]}</h3>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Photo capture */}
              <div className="flex gap-3 mb-4">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-4 glass-1 rounded-2xl flex flex-col items-center gap-2 border border-dashed border-white/10 hover:border-teal/30 transition-colors">
                  <Camera className="w-6 h-6 text-teal" />
                  <span className="text-xs text-muted-foreground">Take Photo</span>
                  <span className={`text-[9px] ${photosRemaining > 0 ? "text-teal" : "text-coral"}`}>
                    {photosRemaining > 0 ? `${photosRemaining} scans left today` : "Limit reached — use text"}
                  </span>
                </motion.button>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />

                {photoPreview && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
                    <img src={photoPreview} alt="Food" className="w-full h-full object-cover" />
                    <button onClick={() => setPhotoPreview(null)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-obsidian/80 flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Search food database */}
              <div className="mb-4">
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search foods (e.g. chicken, oats, biltong)..."
                  className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-teal/40 transition-colors" />
                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {searchResults.map(([name, info]) => (
                      <button key={name} onClick={() => addFromDatabase(name, info)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl glass-1 text-left hover:bg-white/[0.03] transition-colors">
                        <span className="text-sm text-foreground capitalize">{name}</span>
                        <span className="text-xs text-muted-foreground">{info.cal} kcal</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual entry */}
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Or enter manually</p>
                <input value={manualEntry.name} onChange={e => setManualEntry(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Food name"
                  className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08" />
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] text-muted-foreground mb-0.5 block">Calories *</label>
                    <input type="number" value={manualEntry.calories} onChange={e => setManualEntry(prev => ({ ...prev, calories: e.target.value }))}
                      placeholder="kcal" className="w-full px-2 py-2 glass-1 rounded-lg text-xs text-foreground outline-none border border-white/08" />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground mb-0.5 block">Protein</label>
                    <input type="number" value={manualEntry.protein} onChange={e => setManualEntry(prev => ({ ...prev, protein: e.target.value }))}
                      placeholder="g" className="w-full px-2 py-2 glass-1 rounded-lg text-xs text-foreground outline-none border border-white/08" />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground mb-0.5 block">Carbs</label>
                    <input type="number" value={manualEntry.carbs} onChange={e => setManualEntry(prev => ({ ...prev, carbs: e.target.value }))}
                      placeholder="g" className="w-full px-2 py-2 glass-1 rounded-lg text-xs text-foreground outline-none border border-white/08" />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground mb-0.5 block">Fat</label>
                    <input type="number" value={manualEntry.fat} onChange={e => setManualEntry(prev => ({ ...prev, fat: e.target.value }))}
                      placeholder="g" className="w-full px-2 py-2 glass-1 rounded-lg text-xs text-foreground outline-none border border-white/08" />
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={addManual}
                  disabled={!manualEntry.name.trim() || !manualEntry.calories}
                  className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-teal to-emerald-400 disabled:opacity-40">
                  Add to {MEAL_LABELS[selectedMeal]}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Burn Suggestions Sheet ──────────────────── */}
      <AnimatePresence>
        {showBurn && (
          <>
            <motion.div key="burn-ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBurn(false)} className="fixed inset-0 bg-obsidian/60 z-[60]" />
            <motion.div key="burn-sheet"
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] p-5 max-h-[75vh] overflow-y-auto"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Burn Suggestions</h3>
                  <p className="text-xs text-muted-foreground">
                    {isOver ? `Burn ${Math.abs(calRemaining)} excess calories` : "Activities to maintain your deficit"}
                  </p>
                </div>
                <button onClick={() => setShowBurn(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {burnActivities.map((act, i) => (
                  <GlassCard key={i} className="p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4 text-coral" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{act.name}</p>
                      <p className="text-[10px] text-muted-foreground">Burns ~{act.calories} kcal</p>
                    </div>
                    <span className="text-xs font-data text-teal shrink-0">{act.duration}</span>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Goals Sheet ────────────────────────────── */}
      <AnimatePresence>
        {showGoals && (
          <>
            <motion.div key="goals-ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowGoals(false)} className="fixed inset-0 bg-obsidian/60 z-[60]" />
            <motion.div key="goals-sheet"
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] p-5"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Daily Goals</h3>
                <button onClick={() => setShowGoals(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "calories", label: "Calories (kcal)", val: goals.calories },
                  { key: "protein", label: "Protein (g)", val: goals.protein },
                  { key: "carbs", label: "Carbs (g)", val: goals.carbs },
                  { key: "fat", label: "Fat (g)", val: goals.fat },
                  { key: "water", label: "Water (glasses)", val: goals.water },
                ].map(g => (
                  <div key={g.key}>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">{g.label}</label>
                    <input type="number" value={g.val}
                      onChange={e => syncSaveGoals({ ...goals, [g.key]: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/08 focus:border-teal/40 transition-colors" />
                  </div>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowGoals(false)}
                className="w-full mt-4 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-teal to-emerald-400">
                Save Goals
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4">
        <AdBanner slot="utilities-bottom" format="rectangle" />
      </div>

      <BionAssistant />
      <BottomNav />
    </div>
  );
}
