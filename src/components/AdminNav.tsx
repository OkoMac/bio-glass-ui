import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, Briefcase, BarChart2,
  Settings, ShieldCheck, LogOut, UserCog, FileCheck,
  AlertTriangle, Sparkles, BookOpen, MessageSquare, Shield, UserCheck,
  DollarSign, RotateCcw,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Overview",     path: "/admin/dashboard"      },
  { icon: Briefcase,       label: "Providers",    path: "/admin/providers"      },
  { icon: FileCheck,       label: "Verification", path: "/admin/verification"   },
  { icon: UserCheck,       label: "Claims",       path: "/admin/provider-claims" },
  { icon: Shield,          label: "Compliance",   path: "/admin/compliance"     },
  { icon: Users,           label: "Clients",      path: "/admin/clients"        },
  { icon: UserCog,         label: "Users",        path: "/admin/users"          },
  { icon: AlertTriangle,   label: "Disputes",     path: "/admin/disputes"       },
  { icon: RotateCcw,       label: "Refunds",      path: "/admin/refunds"        },
  { icon: Sparkles,        label: "B_ Queue",     path: "/admin/b-queue"        },
  { icon: MessageSquare,   label: "WhatsApp",     path: "/admin/whatsapp"       },
  { icon: BookOpen,        label: "Catalogs",     path: "/admin/catalogs"       },
  { icon: BarChart2,       label: "Analytics",    path: "/admin/analytics"      },
  { icon: DollarSign,      label: "Subscriptions", path: "/admin/subscriptions" },
  { icon: Settings,        label: "Settings",     path: "/admin/settings"       },
];

export default function AdminNav() {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 flex-col z-40"
        style={{ background: "rgba(10,10,18,0.95)", backdropFilter: "blur(40px)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F05A28,#FBBF24)" }}>
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <img src="/bion-logo-white-sm.png" alt="BION" className="h-16 w-auto" /><span className="text-[10px] text-muted-foreground ml-1">Admin</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => (
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive ? "bg-orange-500/15 text-coral" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}>
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Admin identity + logout */}
        <div className="px-3 py-4 border-t border-white/5 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg,#F05A28,#FBBF24)" }}>
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-coral">Administrator</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-coral hover:bg-white/5 transition-all text-sm">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(10,10,18,0.95)", backdropFilter: "blur(40px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-coral" />
          <img src="/bion-logo-white-sm.png" alt="BION" className="h-16 w-auto" /><span className="text-[10px] text-muted-foreground ml-1">Admin</span>
        </div>
        <div className="flex gap-1">
          {navItems.slice(0,4).map(item => (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => (
                <div className={`p-2 rounded-lg ${isActive ? "text-coral" : "text-muted-foreground"}`}>
                  <item.icon className="w-4 h-4" />
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}
