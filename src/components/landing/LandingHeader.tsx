import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

/**
 * Shared top-nav for public marketing landing pages
 * (/for-providers, /for-corporate, /for-rangers).
 *
 * Shows the BION logo on the left and audience-specific nav links on the right.
 * Collapses to a hamburger drawer on mobile.
 */
const NAV_LINKS = [
  { label: "Providers",  href: "/for-providers" },
  { label: "Corporates", href: "/for-corporate" },
  { label: "Rangers",    href: "/for-rangers"   },
  { label: "Free Tools", href: "/tools"          },
  { label: "Blog",       href: "/blog"          },
  { label: "Help",       href: "/help"          },
];

export default function LandingHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-obsidian/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/bion-logo-white-sm.png" alt="BION" className="h-10 md:h-12 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => {
            const active = location.pathname === l.href;
            return (
              <Link
                key={l.href}
                to={l.href}
                className={`px-3 py-1.5 rounded-pill text-sm font-medium transition-colors ${
                  active ? "text-foreground bg-white/[0.06]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            to="/welcome"
            className="ml-3 px-4 py-2 rounded-pill text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Sign in
          </Link>
        </nav>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden w-10 h-10 rounded-xl glass-1 flex items-center justify-center text-foreground"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden border-t border-white/[0.06] px-4 py-4 space-y-2"
          >
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                onClick={() => setOpen(false)}
                className="block w-full text-left px-4 py-3 rounded-2xl glass-1 text-sm font-medium text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/welcome"
              onClick={() => setOpen(false)}
              className="block w-full text-center px-4 py-3 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
            >
              Sign in
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
