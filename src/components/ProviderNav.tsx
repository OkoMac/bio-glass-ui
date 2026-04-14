import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { motion } from "framer-motion";
import {
  LayoutDashboard, CalendarDays, BookOpen, Users,
  MessageSquare, BarChart3, Clock, Settings, Shield,
  LogOut, Tag, ChevronRight, Banknote, ClipboardList, Store, ShoppingBag,
} from "lucide-react";

const navItems = [
  { to: "/pro/dashboard",     label: "Dashboard",   icon: LayoutDashboard },
  { to: "/pro/bookings",      label: "Bookings",    icon: BookOpen },
  { to: "/pro/schedule",      label: "Schedule",    icon: CalendarDays },
  { to: "/pro/clients",       label: "Clients",     icon: Users },
  { to: "/pro/services",      label: "Services",    icon: Tag },
  { to: "/pro/storefront",    label: "Storefront",  icon: Store },
  { to: "/pro/orders",        label: "Orders",      icon: ShoppingBag },
  { to: "/pro/programs",      label: "Programs",    icon: ClipboardList },
  { to: "/pro/messages",      label: "Messages",    icon: MessageSquare,  badge: 3 },
  { to: "/pro/analytics",     label: "Analytics",   icon: BarChart3  },
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
  { to: "/pro/messages",   label: "Messages", icon: MessageSquare, badge: 3 },
];

export default function ProviderNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { pendingCount } = useBookings();

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-56 flex-col py-8 px-3 border-r border-white/5 z-50"
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
                  <Icon className="w-4 h-4 shrink-0" />
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
              <p className="text-[10px] text-muted-foreground">Pro Plan · Active</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 mb-1"
          >
            <Users className="w-3.5 h-3.5" />
            Switch to Client
          </button>
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
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 glass-2 rounded-[28px] px-2 py-2 flex items-center justify-around">
        {mobileNav.map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} className="flex-1">
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
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full gradient-indigo flex items-center justify-center text-[8px] font-bold text-primary-foreground">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium relative z-10">{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
