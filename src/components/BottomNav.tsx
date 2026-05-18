import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Compass, MessageCircle, Dumbbell, Zap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConversations } from "@/hooks/useMessaging";
import RoleSwitcher from "@/components/RoleSwitcher";

const tabs = [
  { icon: Compass,       label: "Discover",  path: "/home" },
  { icon: Dumbbell,      label: "Routines",  path: "/routines" },
  { label: "BION",       path: "/profile",   isFab: true },
  { icon: MessageCircle, label: "Messages",  path: "/messages" },
  { icon: Zap,           label: "Hub",       path: "/quick-book" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnread } = useConversations();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      role="navigation"
      aria-label="Main navigation"
      className="fixed bottom-3 left-4 right-4 lg:left-8 lg:right-8 xl:left-12 xl:right-12 z-50 glass-2 rounded-pill px-2 py-2 shadow-card"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path ||
            (tab.path === "/routines" && location.pathname === "/progress");

          if (tab.isFab) {
            return (
              <motion.button
                key="fab"
                onClick={() => navigate(tab.path)}
                whileTap={{ scale: 0.92 }}
                aria-label="My profile"
                aria-current={isActive ? "page" : undefined}
                className="flex flex-col items-center gap-1 py-1 px-3"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-full gradient-indigo shadow-cta">
                  <span className="text-[10px] font-bold tracking-wider text-primary-foreground">B_</span>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">Me</span>
              </motion.button>
            );
          }

          const Icon = tab.icon!;

          const showUnread = tab.path === "/messages" && totalUnread > 0;

          return (
            <motion.button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.9 }}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center gap-1 py-1 px-3"
            >
              <motion.div
                animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="relative"
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-indigo" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {showUnread && (
                  <span
                    aria-label={`${totalUnread} unread messages`}
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-coral text-[9px] font-bold text-white flex items-center justify-center shadow-cta"
                  >
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </motion.div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-indigo" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
      {/* One-click role switcher for multi-role users (admin/provider/ranger/corporate).
          Lives top-right since there's no sidebar in client mode. 2026-05-18. */}
      <RoleSwitcher />
    </motion.nav>
  );
};

export default BottomNav;
