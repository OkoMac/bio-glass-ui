import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, Briefcase, BarChart2,
  Settings, ShieldCheck, LogOut, UserCog, FileCheck,
  AlertTriangle, Sparkles, BookOpen, MessageSquare, Shield, ShieldAlert, UserCheck,
  DollarSign, RotateCcw, LifeBuoy, Target, Megaphone, Radio, Send,
  Menu, Mailbox,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import RoleSwitcher from "@/components/RoleSwitcher";

const navItems = [
  { icon: Sparkles,        label: "Ops Inbox",    path: "/admin/b-inbox"        },
  { icon: LayoutDashboard, label: "Overview",     path: "/admin/dashboard"      },
  { icon: Briefcase,       label: "Providers",    path: "/admin/providers"      },
  { icon: FileCheck,       label: "Verification", path: "/admin/verification"   },
  { icon: UserCheck,       label: "Claims",       path: "/admin/provider-claims" },
  { icon: Shield,          label: "Compliance",   path: "/admin/compliance"     },
  { icon: ShieldAlert,     label: "POPIA Reviews",path: "/admin/popia"          },
  { icon: Users,           label: "Clients",      path: "/admin/clients"        },
  { icon: UserCog,         label: "Users",        path: "/admin/users"          },
  { icon: AlertTriangle,   label: "Disputes",     path: "/admin/disputes"       },
  { icon: RotateCcw,       label: "Refunds",      path: "/admin/refunds"        },
  { icon: LifeBuoy,        label: "Tickets",      path: "/admin/tickets"        },
  { icon: Sparkles,        label: "Review Queue", path: "/admin/b-queue"        },
  { icon: MessageSquare,   label: "WhatsApp",     path: "/admin/whatsapp"       },
  { icon: BookOpen,        label: "Catalogs",     path: "/admin/catalogs"       },
  { icon: Target,          label: "Rangers CRM",  path: "/admin/rangers"        },
  { icon: Send,            label: "Outreach",     path: "/admin/outreach"       },
  { icon: Megaphone,       label: "Campaigns",    path: "/admin/campaigns"      },
  { icon: Radio,           label: "Broadcasts",   path: "/admin/broadcasts"     },
  { icon: Mailbox,         label: "Comms Console",path: "/admin/comms"          },
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
        role="navigation"
        aria-label="Admin navigation"
        style={{ background: "rgba(10,10,18,0.95)", backdropFilter: "blur(40px)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F05A28,#FBBF24)" }}>
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <img src="/bion-wordmark.png" alt="BION" className="h-7 w-auto" /><span className="text-[10px] text-muted-foreground ml-1">Admin</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} aria-label={item.label}>
              {({ isActive }) => (
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive ? "bg-orange-500/15 text-coral" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`} aria-current={isActive ? "page" : undefined}>
                  <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
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
          {/* Shared dropdown — gated to Oko + Lee inside RoleSwitcher. */}
          <RoleSwitcher inline />
          <button onClick={logout}
            aria-label="Sign out"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-coral hover:bg-white/5 transition-all text-sm">
            <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      {/* Logo h-16 (64px) + py-3 (24px) made the bar ~88px tall; page content
          only reserved pt-16 (64px), so admin pages were sliding UNDER the
          bar (cf. screenshot from 2026-04-27). Shrunk the logo to h-7 so the
          bar is ~52px tall and pt-16 actually clears it. */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-2.5 flex items-center justify-between"
        role="navigation"
        aria-label="Admin mobile navigation"
        style={{ background: "rgba(10,10,18,0.95)", backdropFilter: "blur(40px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-coral" />
          <img src="/bion-wordmark.png" alt="BION" className="h-7 w-auto" /><span className="text-[10px] text-muted-foreground ml-1">Admin</span>
        </div>
        <div className="flex gap-1">
          {navItems.slice(0,4).map(item => (
            <NavLink key={item.path} to={item.path} aria-label={item.label}>
              {({ isActive }) => (
                <div className={`p-2 rounded-lg ${isActive ? "text-coral" : "text-muted-foreground"}`} aria-current={isActive ? "page" : undefined}>
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                </div>
              )}
            </NavLink>
          ))}
          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label="Open navigation menu"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <Menu className="w-4 h-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 border-r border-white/5"
              style={{ background: "rgba(10,10,18,0.95)", backdropFilter: "blur(40px)" }}>
              <div className="flex items-center gap-2 px-5 py-6 border-b border-white/5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F05A28,#FBBF24)" }}>
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <img src="/bion-wordmark.png" alt="BION" className="h-7 w-auto" />
                <span className="text-[10px] text-muted-foreground ml-1">Admin</span>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto max-h-[calc(100vh-80px)]">
                {navItems.map(item => (
                  <SheetClose key={item.path} asChild>
                    <NavLink to={item.path} aria-label={item.label}>
                      {({ isActive }) => (
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                          isActive ? "bg-orange-500/15 text-coral" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        }`} aria-current={isActive ? "page" : undefined}>
                          <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                      )}
                    </NavLink>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
