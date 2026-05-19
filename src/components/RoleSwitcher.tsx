import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDown } from "lucide-react";

/**
 * One-click role switcher for multi-role users.
 *
 * Two render modes:
 *  - `inline` (default false): dropdown anchored in a sidebar footer
 *    (AdminNav / ProviderNav / CorporateNav).
 *  - `inline={false}`: floating top-right chip with a dropdown of other roles.
 *    Drop into client-side pages where there's no sidebar to put it in.
 *
 * Opened to all multi-role users on 2026-05-19. Anyone with more than one
 * role in user_roles sees the switcher and can move between their roles.
 *
 * Admin role stays gated to ADMIN_ALLOWED — even if a user somehow ends
 * up with 'admin' in their user_roles, the switcher won't expose admin
 * as a target unless their email is on the allowlist. Backend / DB
 * management should never assign admin to anyone outside this set
 * anyway; this is defence-in-depth.
 */
const ADMIN_ALLOWED = new Set<string>([
  "omacanda@gmail.com",       // Oko
  "investable123@gmail.com",  // Lee
]);

const ROLE_CONFIG: Record<string, { label: string; icon: string; path: string }> = {
  client:    { label: "Client",    icon: "👤", path: "/home" },
  provider:  { label: "Provider",  icon: "🏥", path: "/pro/dashboard" },
  admin:     { label: "Admin",     icon: "🛡️", path: "/admin/dashboard" },
  corporate: { label: "Corporate", icon: "🏢", path: "/corporate/dashboard" },
  sales_rep: { label: "Ranger",    icon: "⚡", path: "/rep/dashboard" },
};

export default function RoleSwitcher({ inline = false }: { inline?: boolean }) {
  const { user, availableRoles, switchRole } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Open to all multi-role users. Admin role is filtered out of the
  // switch targets below unless the user is on the admin allowlist.
  if (!availableRoles || availableRoles.length <= 1) return null;
  const currentRole = (user?.role ?? "client") as string;
  const isAdminAllowed = !!user?.email && ADMIN_ALLOWED.has(user.email.toLowerCase());
  const others = availableRoles.filter((r) => {
    if (r === currentRole) return false;
    // Admin can only be switched into by the admin allowlist. This is
    // a UI guard; the real defence is that user_roles shouldn't have
    // 'admin' for anyone outside the allowlist in the first place.
    if (r === "admin" && !isAdminAllowed) return false;
    return true;
  });
  if (others.length === 0) return null;

  const handleSwitch = (r: string) => {
    const c = ROLE_CONFIG[r];
    if (!c) return;
    // switchRole writes to bio_user + DB; window.location.href forces a fresh
    // shell so role-conditional layouts (sidebars, nav, theme) re-mount cleanly.
    switchRole(r as any);
    window.location.href = c.path;
  };

  const current = ROLE_CONFIG[currentRole];

  // Shared dropdown menu (used by both inline and floating variants)
  const menu = open && (
    <div
      className={`absolute glass-3 rounded-2xl p-2 min-w-[200px] border border-white/[0.08] shadow-card z-50 ${
        inline ? "bottom-full mb-2 left-0 right-0" : "top-full right-0 mt-2"
      }`}
    >
      {others.map((r) => {
        const c = ROLE_CONFIG[r];
        if (!c) return null;
        return (
          <button
            key={r}
            onClick={() => handleSwitch(r)}
            className="w-full flex items-center gap-2 text-xs text-foreground px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors"
          >
            <span className="text-sm">{c.icon}</span>
            <span>Switch to {c.label}</span>
          </button>
        );
      })}
    </div>
  );

  if (inline) {
    // Sidebar variant — fits the sidebar column with a button that opens
    // upward (since sidebar footer sits at the bottom of the viewport).
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Switch role"
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        >
          <span className="flex items-center gap-2">
            <span className="text-sm">{current?.icon ?? "👤"}</span>
            <span>Switch role</span>
          </span>
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {menu}
      </div>
    );
  }

  // Floating chip — for pages without a sidebar (client / ranger mode).
  return (
    <div ref={ref} className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch role"
        className="glass-2 rounded-pill px-3 py-1.5 text-xs font-medium text-foreground flex items-center gap-1.5 shadow-card"
      >
        <span>{current?.icon ?? "👤"}</span>
        <span>{current?.label ?? currentRole}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {menu}
    </div>
  );
}
