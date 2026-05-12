import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, User, Calendar, Settings, Heart, MessageSquare, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
  id: string;
  label: string;
  sub: string;
  icon: typeof Search;
  path: string;
  type: "provider" | "page" | "tool";
}

const CLIENT_PAGES: SearchResult[] = [
  { id: "p-discover", label: "Discover", sub: "Browse providers", icon: Search, path: "/home", type: "page" },
  { id: "p-schedule", label: "My Schedule", sub: "View bookings", icon: Calendar, path: "/schedule", type: "page" },
  { id: "p-messages", label: "Messages", sub: "Chat with providers", icon: MessageSquare, path: "/messages", type: "page" },
  { id: "p-profile", label: "My Profile", sub: "Edit your details", icon: User, path: "/profile", type: "page" },
  { id: "p-settings", label: "Settings", sub: "Privacy, notifications, payment", icon: Settings, path: "/settings", type: "page" },
  { id: "p-health", label: "Health Profile", sub: "Medical card, vitals", icon: Heart, path: "/health-profile", type: "page" },
  { id: "p-wallet", label: "BIONWallet", sub: "Balance & transactions", icon: Settings, path: "/wallet", type: "page" },
];

const PROVIDER_PAGES: SearchResult[] = [
  { id: "pp-dash", label: "Dashboard", sub: "Provider overview", icon: Settings, path: "/pro/dashboard", type: "page" },
  { id: "pp-bookings", label: "Bookings", sub: "Manage sessions", icon: Calendar, path: "/pro/bookings", type: "page" },
  { id: "pp-clients", label: "Clients", sub: "CRM & notes", icon: User, path: "/pro/clients", type: "page" },
  { id: "pp-services", label: "Services", sub: "Edit your offerings", icon: Settings, path: "/pro/services", type: "page" },
  { id: "pp-analytics", label: "Analytics", sub: "Revenue & insights", icon: Settings, path: "/pro/analytics", type: "page" },
  { id: "pp-billing", label: "Billing", sub: "Bank details & payouts", icon: Settings, path: "/pro/billing", type: "page" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [providerResults, setProviderResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const pages = user?.role === "provider" ? PROVIDER_PAGES : CLIENT_PAGES;

  // Lazy-load provider search index when palette first opens
  useEffect(() => {
    if (open && providerResults.length === 0) {
      import("@/data/bion_pretoria_data.json").then((mod) => {
        const data = mod.default as any;
        const results: SearchResult[] = (data.providers ?? []).slice(0, 100).map((p: any) => ({
          id: p.id,
          label: p.name,
          sub: `${p.service} · ${p.suburb ?? p.location}`,
          icon: MapPin,
          path: `/provider/${p.id}`,
          type: "provider" as const,
        }));
        setProviderResults(results);
      });
    }
  }, [open, providerResults.length]);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return pages.slice(0, 6);
    const q = query.toLowerCase();
    const matched: SearchResult[] = [];

    // Search pages
    pages.forEach(p => {
      if (p.label.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q)) matched.push(p);
    });

    // Search providers
    providerResults.forEach(p => {
      if (p.label.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q)) matched.push(p);
    });

    return matched.slice(0, 8);
  }, [query, pages]);

  const go = (result: SearchResult) => {
    navigate(result.path);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIdx]) { go(results[selectedIdx]); }
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-obsidian/70 z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="glass-popover fixed top-[15vh] left-1/2 -translate-x-1/2 w-[90vw] max-w-lg z-[101] rounded-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search providers, pages, tools..."
                className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden sm:inline text-[10px] text-muted-foreground px-1.5 py-0.5 rounded border border-white/10 font-mono">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto py-2">
              {results.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No results for "{query}"</p>
              ) : (
                results.map((r, i) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => go(r)}
                      onMouseEnter={() => setSelectedIdx(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        i === selectedIdx ? "bg-white/[0.06]" : ""
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        r.type === "provider" ? "bg-teal/10" : "bg-indigo/10"
                      }`}>
                        <Icon className={`w-4 h-4 ${r.type === "provider" ? "text-teal" : "text-indigo"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{r.sub}</p>
                      </div>
                      {r.type === "provider" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-pill glass-1 text-muted-foreground shrink-0">Provider</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/[0.06] flex items-center gap-4 text-[10px] text-muted-foreground">
              <span><kbd className="font-mono px-1 py-0.5 rounded border border-white/10 mr-1">↑↓</kbd> Navigate</span>
              <span><kbd className="font-mono px-1 py-0.5 rounded border border-white/10 mr-1">↵</kbd> Open</span>
              <span><kbd className="font-mono px-1 py-0.5 rounded border border-white/10 mr-1">esc</kbd> Close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
