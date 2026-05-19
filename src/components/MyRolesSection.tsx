import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import GlassCard from "@/components/GlassCard";
import { Check, Loader2, Plus, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

type AddableRole = "client" | "provider" | "corporate" | "sales_rep";

const ROLE_CATALOG: { role: AddableRole; label: string; icon: string; desc: string; dest: string }[] = [
  { role: "client",    label: "Client",    icon: "👤", desc: "Book sessions, track wellness, use B_ and all utilities.", dest: "/home" },
  { role: "provider",  label: "Provider",  icon: "🏥", desc: "Take bookings, sell services, build a clientele.",        dest: "/pro/dashboard" },
  { role: "corporate", label: "Corporate", icon: "🏢", desc: "Manage employee wellness budgets and benefits.",          dest: "/corporate/dashboard" },
  { role: "sales_rep", label: "Ranger",    icon: "⚡", desc: "Earn commissions referring providers. Admin approval required.", dest: "/rep/dashboard" },
];

const API = (import.meta as any).env?.VITE_API_URL ?? "https://bion-backend.onrender.com";

/**
 * "My roles" — settings section that lets a user add additional roles
 * to their existing account so they can switch between profiles via
 * the RoleSwitcher dropdown.
 *
 * Behaviour by role:
 *   • client / provider / corporate — instant grant. Backend upserts
 *     user_roles + the role-specific extension table row in the same
 *     state a fresh signup would.
 *   • sales_rep (Ranger) — request goes into rep_profiles with
 *     approval_status="pending". An admin approves from /admin/rangers
 *     before user_roles is granted. So Ranger never appears in the
 *     RoleSwitcher until approved.
 *   • admin — not exposed here. Assigned by ops only.
 */
export default function MyRolesSection() {
  const { user, availableRoles, refetchUser } = useAuth();
  const navigate = useNavigate();
  const [busyRole, setBusyRole] = useState<AddableRole | null>(null);
  const [rangerStatus, setRangerStatus] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const loadStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setLoadingStatus(false);
        return;
      }
      const res = await fetch(`${API}/api/profiles/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok && json.data) {
        setRangerStatus(json.data.ranger_status ?? null);
      }
    } catch { /* fail open — UI just won't know the pending state */ }
    setLoadingStatus(false);
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const addRole = async (role: AddableRole) => {
    setBusyRole(role);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error("Please sign in again.");
        return;
      }
      const res = await fetch(`${API}/api/profiles/me/add-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? `Could not add ${role}. Try again.`);
        return;
      }

      const status = json.data?.status as string | undefined;
      if (status === "pending_approval" || status === "already_active") {
        // Ranger flow — surface state, no refetch needed (no new user_roles row).
        setRangerStatus("pending");
        toast.success(
          status === "already_active"
            ? "Your Ranger request is already active."
            : "Ranger request submitted. An admin will review it.",
        );
      } else {
        // Granted — refresh availableRoles so RoleSwitcher picks up the new role.
        await refetchUser();
        const cfg = ROLE_CATALOG.find((c) => c.role === role);
        toast.success(`${cfg?.label ?? role} role added to your account.`);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Network error — try again.");
    } finally {
      setBusyRole(null);
    }
  };

  if (!user) return null;

  return (
    <GlassCard className="p-5 space-y-4">
      <div>
        <h3 className="text-base font-bold text-foreground">My roles</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Add another role to your account and switch between them with one tap.
        </p>
      </div>

      <div className="space-y-2">
        {ROLE_CATALOG.map((cfg) => {
          const isActive = availableRoles.includes(cfg.role as any);
          const isRangerPending = cfg.role === "sales_rep" && rangerStatus === "pending" && !isActive;
          const busy = busyRole === cfg.role;
          return (
            <div key={cfg.role}
              className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <span className="text-xl shrink-0">{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{cfg.label}</p>
                  {isActive && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal bg-teal/10 rounded-full px-2 py-0.5">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                  {isRangerPending && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber bg-amber/10 rounded-full px-2 py-0.5">
                      <Clock className="w-3 h-3" /> Pending approval
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{cfg.desc}</p>
              </div>
              <div className="shrink-0">
                {isActive ? (
                  <button
                    onClick={() => navigate(cfg.dest)}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                    aria-label={`Open ${cfg.label}`}>
                    Open <ArrowRight className="w-3 h-3" />
                  </button>
                ) : isRangerPending ? (
                  <span className="text-[11px] text-muted-foreground px-2 py-1.5">Submitted</span>
                ) : (
                  <button
                    onClick={() => addRole(cfg.role)}
                    disabled={busy || loadingStatus}
                    className="text-[11px] font-semibold text-indigo flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo/10 hover:bg-indigo/15 transition-colors disabled:opacity-50"
                    aria-label={`Add ${cfg.label}`}>
                    {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    {cfg.role === "sales_rep" ? "Request" : "Add"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
