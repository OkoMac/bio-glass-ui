import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useUnreadCount } from "@/hooks/useMessages";
import { motion } from "framer-motion";
import {
  LayoutDashboard, CalendarDays, BookOpen, Users,
  MessageSquare, BarChart3, Clock, Settings, Shield,
  LogOut, Tag, ChevronRight, Banknote, ClipboardList, Store, ShoppingBag,
  Book, UserPlus, MapPin, ListOrdered, Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const navItems = [
  { to: "/pro/dashboard",     label: "Dashboard",   icon: LayoutDashboard },
  { to: "/pro/bookings",      label: "Bookings",    icon: BookOpen },
  { to: "/pro/schedule",      label: "Schedule",    icon: CalendarDays },
  { to: "/pro/clients",       label: "Clients",     icon: Users },
  { to: "/pro/services",      label: "Services",    icon: Tag },
  { to: "/pro/storefront",    label: "Storefront",  icon: Store },
  { to: "/pro/orders",        label: "Orders",      icon: ShoppingBag },
  { to: "/pro/catalogs",      label: "Catalogs",    icon: Book },
  { to: "/pro/programs",      label: "Programs",    icon: ClipboardList },
  { to: "/pro/messages",      label: "Messages",    icon: MessageSquare },
  { to: "/pro/analytics",     label: "Analytics",   icon: BarChart3  },
  { to: "/pro/queue",         label: "Queue",       icon: ListOrdered },
  { to: "/pro/referrals",    label: "Referrals",   icon: UserPlus   },
  { to: "/pro/locations",    label: "Locations",   icon: MapPin     },
  { to: "/pro/availability",  label: "Availability",icon: Clock      },
  { to: "/pro/billing",       label: "Billing",     icon: Banknote   },
  { to: "/pro/verification",  label: "Verification",icon: Shield     },
  { to: "/pro/settings",      label: "Settings",    icon: Settings   },
];

const mobileNav = [
  { to: "/pro/dashboard",  label: "Home",     icon: LayoutDashboard },
  { to: "/pro/bookings",   label: "Bookings", icon: BookOpen },
  { to: "/pro/schedule",   label: "Schedule", icon: CalendarDays },
  { to: "/pro/clients",    label: "Clients",  icon: Users },
  { to: "/pro/messages",   label: "Messages", icon: MessageSquare },
];

export default function ProviderNav() {
  const navigate = useNavigate();
  const { user, logout, switchRole, availableRoles } = useAuth();
  const { pendingCount } = useBookings();
  const { tierDisplayName, isActive } = useSubscription();
  // Real unread-message count for the Messages badge — replaces the
  // previously-hardcoded `badge: 3` stub. Uses the realtime hook so the
  // count updates live as messages arrive / are marked read.
  const unreadMessages = useUnreadCount();
  const badgeFor = (to: string): number | undefined =>
    to === "/pro/messages" && unreadMessages > 0 ? unreadMessages : undefined;

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-56 flex-col py-8 px-3 border-r border-white/5 z-50"
        role="navigation"
        aria-label="Provider navigation"
        style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(40px)" }}>
        {/* Logo */}
        <div className="px-3 mb-8">
          <img src="/bion-logo-white-sm.png" alt="BION" className="h-16 w-auto" />
          <span className="ml-1.5 text-[10px] text-muted-foreground uppercase tracking-widest">Provider</span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {navItems.map(({ to, label, icon: Icon, badge }) => (
            <NavLink key={to} to={to}
              aria-label={label}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "glass-accent-indigo text-indigo"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  {to === "/pro/bookings" && pendingCount > 0 && !isActive && (
                    <span className="w-5 h-5 rounded-full gradient-indigo flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                      {pendingCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Provider info */}
        <div className="px-3 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full gradient-indigo flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0) ?? "P"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user?.name ?? "Provider"}</p>
              <p className="text-[10px] text-muted-foreground">{tierDisplayName()} Plan{isActive() ? " · Active" : ""}</p>
            </div>
          </div>
          {availableRoles.filter(r => r !== "provider").map(r => {
            const cfg: Record<string, { label: string; icon: string; path: string }> = {
              client: { label: "Client", icon: "👤", path: "/home" },
              admin: { label: "Admin", icon: "🛡️", path: "/admin/dashboard" },
              corporate: { label: "Corporate", icon: "🏢", path: "/corporate/dashboard" },
              sales_rep: { label: "Ranger", icon: "⚡", path: "/rep/dashboard" },
            };
            const c = cfg[r];
            if (!c) return null;
            return (
              <button key={r}
                onClick={() => { switchRole(r as any); window.location.href = c.path; }}
                className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                <span className="text-sm">{c.icon}</span> Switch to {c.label}
              </button>
            );
          })}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-coral transition-colors py-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ────────────────────────────── */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 glass-2 rounded-[28px] px-2 py-2 flex items-center justify-around"
        role="navigation"
        aria-label="Provider mobile navigation">
        {mobileNav.map(({ to, label, icon: Icon }) => {
          const badge = badgeFor(to) ?? (to === "/pro/bookings" && pendingCount > 0 ? pendingCount : undefined);
          return (
            <NavLink key={to} to={to} className="flex-1" aria-label={label}>
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`relative flex flex-col items-center gap-1 py-1 rounded-2xl transition-all ${
                    isActive ? "text-indigo" : "text-muted-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="pro-nav-bg"
                      className="absolute inset-0 glass-accent-indigo rounded-2xl"
                    />
                  )}
                  <div className="relative">
                    <Icon className="w-5 h-5 relative z-10" />
                    {badge && !isActive && (
                      <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full gradient-indigo flex items-center justify-center text-[8px] font-bold text-primary-foreground">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-medium relative z-10">{label}</span>
                </motion.div>
              )}
            </NavLink>
          );
        })}
        <Sheet>
          <SheetTrigger asChild>
            <button
              aria-label="Open navigation menu"
              className="flex-1 flex flex-col items-center gap-1 py-1 rounded-2xl text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[9px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 border-r border-white/5"
            style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(40px)" }}>
            <div className="flex items-center gap-2 px-5 py-6 border-b border-white/5">
              <img src="/bion-logo-white-sm.png" alt="BION" className="h-16 w-auto" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Provider</span>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto max-h-[calc(100vh-80px)]">
              {navItems.filter(item => !mobileNav.some(m => m.to === item.to)).map(({ to, label, icon: Icon }) => (
                <SheetClose key={to} asChild>
                  <NavLink to={to}
                    aria-label={label}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "glass-accent-indigo text-indigo"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium">{label}</span>
                  </NavLink>
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
