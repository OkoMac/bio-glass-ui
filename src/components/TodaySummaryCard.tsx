import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { Droplets, Utensils, Moon, Dumbbell } from "lucide-react";
import { useTodaySummary } from "@/hooks/useTodaySummary";

// "Today" rollup card on the dashboard. Reads the unified summary from
// useTodaySummary and shows a 2x2 grid of water / food / sleep / sessions.
// Each tile taps through to its tracker so the user can drill in.
export default function TodaySummaryCard() {
  const navigate = useNavigate();
  const { water, food, sleep, sessions, loading } = useTodaySummary();

  const tiles = [
    {
      icon: <Droplets className="w-4 h-4 text-blue-400" />,
      label: "Water",
      value: `${water.glasses}/${water.goal}`,
      sub: "glasses",
      done: water.glasses >= water.goal,
      onTap: () => navigate("/water-tracker"),
    },
    {
      icon: <Utensils className="w-4 h-4 text-teal" />,
      label: "Food",
      value: food.kcal > 0 ? food.kcal.toString() : "—",
      sub: food.entries > 0 ? `kcal · ${food.entries} item${food.entries === 1 ? "" : "s"}` : "kcal",
      done: food.entries > 0,
      onTap: () => navigate("/food-tracker"),
    },
    {
      icon: <Moon className="w-4 h-4 text-violet" />,
      label: "Sleep",
      value: sleep.logged ? sleep.hours.toFixed(1) : "—",
      sub: "hours",
      done: sleep.logged,
      onTap: () => navigate("/sleep-tracker"),
    },
    {
      icon: <Dumbbell className="w-4 h-4 text-amber" />,
      label: "Sessions",
      value: sessions.count > 0 ? sessions.minutes.toString() : "—",
      sub: sessions.count > 0 ? `min · ${sessions.count} session${sessions.count === 1 ? "" : "s"}` : "min",
      done: sessions.count > 0,
      onTap: () => navigate("/routines"),
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Today</p>
        {loading && <span className="text-[10px] text-muted-foreground">syncing…</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t, i) => (
          <motion.button
            key={t.label}
            whileTap={{ scale: 0.97 }}
            onClick={t.onTap}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="text-left"
          >
            <GlassCard className={`p-3 border transition-colors ${t.done ? "border-teal/30" : "border-white/[0.06]"}`}>
              <div className="flex items-center gap-2 mb-1.5">
                {t.icon}
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.label}</span>
              </div>
              <p className={`text-xl font-bold ${t.done ? "text-foreground" : "text-muted-foreground/60"}`}>
                {t.value}
              </p>
              <p className="text-[10px] text-muted-foreground">{t.sub}</p>
            </GlassCard>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
