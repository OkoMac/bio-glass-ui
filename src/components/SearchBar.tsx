import { Search, Mic, SlidersHorizontal, X, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onFilterClick?: () => void;
  onFiltersChange?: () => void;
  placeholder?: string;
}

interface FilterState {
  category: string;
  freeOnly: boolean;
  availableNow: boolean;
  maxDistance: number;
  minRating: number;
}

const DEFAULT_FILTERS: FilterState = {
  category: "All",
  freeOnly: false,
  availableNow: false,
  maxDistance: 50,
  minRating: 0,
};

const CATEGORIES = ["All", "Fitness", "Medical", "Beauty", "Wellness", "Professional"];

const SearchBar = ({ value: externalValue, onChange, onFilterClick, onFiltersChange, placeholder = "Find a service or provider..." }: SearchBarProps) => {
  const navigate = useNavigate();
  const [internalValue, setInternalValue] = useState("");
  const value = externalValue ?? internalValue;
  const setValue = (v: string) => {
    if (onChange) onChange(v);
    else setInternalValue(v);
  };

  const [listening, setListening] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const stored = localStorage.getItem("bion_search_filters");
      return stored ? JSON.parse(stored) : DEFAULT_FILTERS;
    } catch { return DEFAULT_FILTERS; }
  });

  const recognitionRef = useRef<any>(null);

  // Voice recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-ZA";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setValue(transcript);
      setListening(false);
    };
    recognition.onerror = (event: any) => {
      console.error("[voice search] error:", event.error);
      setListening(false);
      const errorMessages: Record<string, string> = {
        "not-allowed": "Microphone permission denied. Please enable microphone access in your browser settings and try again.",
        "no-speech": "I didn't hear anything. Please try again and speak clearly.",
        "audio-capture": "No microphone detected. Please connect a microphone and try again.",
        "network": "Network error. Voice recognition requires an internet connection.",
        "aborted": "",  // user cancelled — no message needed
      };
      const msg = errorMessages[event.error] ?? `Voice search error: ${event.error}`;
      if (msg) alert(msg);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  const handleMicClick = async () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert("Voice search is not supported in your browser. Try Chrome on Android/Desktop or Safari on iOS.");
      return;
    }

    // Check HTTPS requirement
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      alert("Voice search requires HTTPS. This site must be accessed over a secure connection.");
      return;
    }

    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }

    // Request mic permission explicitly first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted — close the test stream and start recognition
      stream.getTracks().forEach(t => t.stop());
      try {
        recognition.start();
        setListening(true);
      } catch (err: any) {
        console.error("[voice search] start error:", err);
        setListening(false);
        alert(`Could not start voice recognition: ${err.message}`);
      }
    } catch (err: any) {
      console.error("[voice search] permission error:", err);
      alert("Microphone permission is required for voice search. Please allow microphone access in your browser and try again.");
    }
  };

  const handleFilterClick = () => {
    if (onFilterClick) onFilterClick();
    else setShowFilters(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      navigate(`/directory?q=${encodeURIComponent(value.trim())}`);
    }
  };

  const saveFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    localStorage.setItem("bion_search_filters", JSON.stringify(newFilters));
    if (onFiltersChange) onFiltersChange();
  };

  const resetFilters = () => saveFilters(DEFAULT_FILTERS);

  return (
    <>
      <motion.form
        onSubmit={handleSearch}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-1 rounded-pill flex items-center gap-3 px-4 py-3 border border-white/[0.06] focus-within:border-white/[0.16] transition-colors"
      >
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
        />
        {value && (
          <button type="button" onClick={() => setValue("")}
            className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={handleMicClick}
            className={`transition-colors ${listening ? "text-coral animate-pulse" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Voice search">
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <div className="w-px h-4 bg-foreground/10" />
          <button type="button" onClick={handleFilterClick}
            className="text-muted-foreground hover:text-foreground transition-colors relative"
            aria-label="Filters">
            <SlidersHorizontal className="w-4 h-4" />
            {(filters.category !== "All" || filters.freeOnly || filters.availableNow || filters.minRating > 0) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal" />
            )}
          </button>
        </div>
      </motion.form>

      {/* Filter modal */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-obsidian/60 z-[60]"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] p-5 max-h-[80vh] overflow-y-auto"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Filters</h3>
                <button onClick={() => setShowFilters(false)}
                  className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Category */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Category</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat}
                        onClick={() => saveFilters({ ...filters, category: cat })}
                        className={`px-3 py-1.5 rounded-pill text-xs font-medium border transition-all ${
                          filters.category === cat
                            ? "border-teal/40 bg-teal/10 text-teal"
                            : "border-white/[0.08] bg-white/[0.02] text-muted-foreground"
                        }`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick toggles */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Quick Filters</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => saveFilters({ ...filters, freeOnly: !filters.freeOnly })}
                      className="w-full flex items-center justify-between p-3 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                      <span className="text-sm text-foreground">Free sessions only</span>
                      <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${filters.freeOnly ? "bg-teal/30" : "bg-white/[0.08]"}`}>
                        <div className={`w-5 h-5 rounded-full transition-all ${filters.freeOnly ? "bg-teal translate-x-4" : "bg-muted-foreground/40"}`} />
                      </div>
                    </button>
                    <button
                      onClick={() => saveFilters({ ...filters, availableNow: !filters.availableNow })}
                      className="w-full flex items-center justify-between p-3 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                      <span className="text-sm text-foreground">Available now</span>
                      <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${filters.availableNow ? "bg-teal/30" : "bg-white/[0.08]"}`}>
                        <div className={`w-5 h-5 rounded-full transition-all ${filters.availableNow ? "bg-teal translate-x-4" : "bg-muted-foreground/40"}`} />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Distance */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Max Distance</p>
                    <span className="text-xs font-data text-teal">{filters.maxDistance} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={filters.maxDistance}
                    onChange={e => saveFilters({ ...filters, maxDistance: parseInt(e.target.value) })}
                    className="w-full accent-teal"
                  />
                </div>

                {/* Min rating */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Min Rating</p>
                    <span className="text-xs font-data text-amber">{filters.minRating > 0 ? `${filters.minRating}+ ⭐` : "Any"}</span>
                  </div>
                  <div className="flex gap-2">
                    {[0, 3, 4, 4.5].map(r => (
                      <button key={r}
                        onClick={() => saveFilters({ ...filters, minRating: r })}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                          filters.minRating === r
                            ? "border-amber/40 bg-amber/10 text-amber"
                            : "border-white/[0.08] bg-white/[0.02] text-muted-foreground"
                        }`}>
                        {r === 0 ? "Any" : `${r}+`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={resetFilters}
                  className="flex-1 py-3 rounded-2xl text-sm font-medium border border-white/[0.08] bg-white/[0.02] text-muted-foreground">
                  Reset
                </button>
                <button onClick={() => setShowFilters(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-teal to-emerald-400">
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SearchBar;
