/**
 * Notification Settings — 3-tab preference panel.
 *
 * Tab 1: Channels (push, email, WhatsApp toggles)
 * Tab 2: Categories (critical locked on, others toggleable)
 * Tab 3: Quiet Hours + frequency cap
 *
 * Reads/writes via useNotificationPreferences hook → backend API.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationPreferences, type NotificationPreferences } from "@/hooks/useNotificationPreferences";
import {
  Bell, Mail, MessageSquare, Smartphone,
  Shield, CreditCard, Heart, TrendingUp, Briefcase, Megaphone,
  Moon, Clock, Loader2, Check,
} from "lucide-react";

type Tab = "channels" | "categories" | "quiet";

interface ToggleProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, description, icon, checked, disabled, onChange }: ToggleProps) {
  return (
    <div className={`flex items-center justify-between py-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3">
        {icon && <div className="w-8 h-8 rounded-lg glass-1 flex items-center justify-center text-muted-foreground">{icon}</div>}
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <button
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-indigo" : "bg-white/10"}`}
       title="onChange(!checked)} className= `} >" aria-label="onChange(!checked)} className= `} >">
        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export default function NotificationSettings() {
  const { user } = useAuth();
  const { prefs, loading, saving, updatePrefs } = useNotificationPreferences();
  const [tab, setTab] = useState<Tab>("channels");

  const isProvider = user?.role === "provider";

  const update = async (key: keyof NotificationPreferences, value: boolean | number | string) => {
    const ok = await updatePrefs({ [key]: value });
    if (ok) toast.success("Preference saved");
    else toast.error("Could not save preference");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 glass-1 rounded-xl p-1">
        {(["channels", "categories", "quiet"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              tab === t ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
            }`}
           title="setTab(t)} className= `} >" aria-label="setTab(t)} className= `} >">
            {t === "channels" ? "Channels" : t === "categories" ? "Categories" : "Quiet Hours"}
          </button>
        ))}
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Saving...
        </div>
      )}

      {/* Tab 1: Channels */}
      {tab === "channels" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
          <Toggle
            label="In-App"
            description="Always on — notifications appear in the app"
            icon={<Bell className="w-4 h-4" />}
            checked={true}
            disabled={true}
            onChange={() => {}}
          />
          <Toggle
            label="Push Notifications"
            description="Browser/device notifications"
            icon={<Smartphone className="w-4 h-4" />}
            checked={prefs.channel_push}
            onChange={v => update("channel_push", v)}
          />
          <Toggle
            label="Email"
            description="Booking confirmations, receipts, digests"
            icon={<Mail className="w-4 h-4" />}
            checked={prefs.channel_email}
            onChange={v => update("channel_email", v)}
          />
          <Toggle
            label="WhatsApp"
            description="Reminders and booking updates"
            icon={<MessageSquare className="w-4 h-4" />}
            checked={prefs.channel_whatsapp}
            onChange={v => update("channel_whatsapp", v)}
          />
        </motion.div>
      )}

      {/* Tab 2: Categories */}
      {tab === "categories" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
          <Toggle
            label="Critical"
            description="Booking cancellations, payment alerts, security. Cannot be disabled."
            icon={<Shield className="w-4 h-4 text-coral" />}
            checked={true}
            disabled={true}
            onChange={() => {}}
          />
          <Toggle
            label="Transactional"
            description="Booking confirmations, receipts, review requests"
            icon={<CreditCard className="w-4 h-4" />}
            checked={prefs.cat_transactional}
            onChange={v => update("cat_transactional", v)}
          />
          <Toggle
            label="Wellness"
            description="Medication reminders, water tracking, workout nudges"
            icon={<Heart className="w-4 h-4" />}
            checked={prefs.cat_wellness}
            onChange={v => update("cat_wellness", v)}
          />
          {prefs.cat_wellness && (
            <div className="ml-11 mt-1 mb-2 pl-4 border-l border-white/10 space-y-0">
              <Toggle
                label="Food / calorie nudges"
                description="9am morning prompt — ‘log your breakfast’"
                checked={(prefs as any).wellness_food ?? true}
                onChange={v => update("wellness_food" as keyof NotificationPreferences, v)}
              />
              <Toggle
                label="Water reminders"
                description="1pm hydration check-in"
                checked={(prefs as any).wellness_water ?? true}
                onChange={v => update("wellness_water" as keyof NotificationPreferences, v)}
              />
              <Toggle
                label="Sleep prompts"
                description="9pm wind-down + sleep logging"
                checked={(prefs as any).wellness_sleep ?? true}
                onChange={v => update("wellness_sleep" as keyof NotificationPreferences, v)}
              />
              <Toggle
                label="Mood check-in"
                description="Daily emoji mood (when shipped)"
                checked={(prefs as any).wellness_mood ?? true}
                onChange={v => update("wellness_mood" as keyof NotificationPreferences, v)}
              />
            </div>
          )}
          <Toggle
            label="Engagement"
            description="Streaks, points earned, weekly digests, tips"
            icon={<TrendingUp className="w-4 h-4" />}
            checked={prefs.cat_engagement}
            onChange={v => update("cat_engagement", v)}
          />
          {isProvider && (
            <Toggle
              label="Business"
              description="Morning briefings, gap-filling offers, earnings digests"
              icon={<Briefcase className="w-4 h-4" />}
              checked={prefs.cat_business}
              onChange={v => update("cat_business", v)}
            />
          )}
          <Toggle
            label="Marketing"
            description="Promotional offers and partner deals (POPIA opt-in)"
            icon={<Megaphone className="w-4 h-4" />}
            checked={prefs.cat_marketing}
            onChange={v => update("cat_marketing", v)}
          />
        </motion.div>
      )}

      {/* Tab 3: Quiet Hours */}
      {tab === "quiet" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Toggle
            label="Quiet Hours"
            description="No push, email, or WhatsApp during this window. Critical alerts still get through."
            icon={<Moon className="w-4 h-4" />}
            checked={prefs.quiet_enabled}
            onChange={v => update("quiet_enabled", v)}
          />

          {prefs.quiet_enabled && (
            <div className="flex items-center gap-3 pl-11">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Start</label>
                <input
                  type="time"
                  value={prefs.quiet_start}
                  onChange={e => update("quiet_start", e.target.value)}
                  className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-white/5 mt-1"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">End</label>
                <input
                  type="time"
                  value={prefs.quiet_end}
                  onChange={e => update("quiet_end", e.target.value)}
                  className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-white/5 mt-1"
                />
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg glass-1 flex items-center justify-center text-muted-foreground">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Daily notification limit</p>
                <p className="text-[11px] text-muted-foreground">Max external notifications per day (push + email + WhatsApp)</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pl-11">
              {[3, 5, 10].map(n => (
                <button
                  key={n}
                  onClick={() => update("daily_cap", n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    prefs.daily_cap === n ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                  }`}
                 title="update('daily_cap', n)} className= `} >" aria-label="update('daily_cap', n)} className= `} >">
                  {n}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center pt-2">
            Timezone: Africa/Johannesburg (SAST)
          </p>
        </motion.div>
      )}
    </div>
  );
}
