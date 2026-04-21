import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, User, GraduationCap, Target } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/rep/dashboard" },
  { icon: Target,          label: "CRM",        path: "/rep/crm" },
  { icon: GraduationCap,   label: "Bicademy",   path: "/bicademy" },
  { icon: User,            label: "Profile",    path: "/rep/settings" },
];

const RepNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      className="fixed bottom-3 left-4 right-4 lg:left-8 lg:right-8 xl:left-12 xl:right-12 z-50 glass-2 rounded-pill px-2 py-2 shadow-card"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + "/");
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1 py-1 px-3"
            >
              <motion.div
                animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-emerald-400" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </motion.div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-emerald-400" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default RepNav;
