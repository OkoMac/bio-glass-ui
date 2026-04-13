import { Search, Mic, SlidersHorizontal, X, Square, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

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
  const { user } = useAuth();
  const [internalValue, setInternalValue] = useState("");
  const value = externalValue ?? internalValue;
  const setValue = (v: string) => {
    if (onChange) onChange(v);
    else setInternalValue(v);
  };

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const stored = localStorage.getItem("bion_search_filters");
      return stored ? JSON.parse(stored) : DEFAULT_FILTERS;
    } catch { return DEFAULT_FILTERS; }
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Voice search via OpenAI Whisper (works on ALL browsers).
   * Records audio with MediaRecorder, sends to backend, populates field with transcript.
   */
  const handleMicClick = async () => {
    // HTTPS check
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      alert("Voice search requires a secure HTTPS connection.");
      return;
    }

    // Stop recording mode → send audio to backend
    if (recording) {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state === "recording") {
        recorder.stop(); // triggers onstop → uploads audio
      }
      return;
    }

    // Check MediaRecorder support
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert("Your browser doesn't support audio recording. Please use Chrome, Edge, Safari, or Firefox.");
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick a supported MIME type
      const preferredTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
      const mimeType = preferredTypes.find(t => MediaRecorder.isTypeSupported(t)) ?? "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all tracks to release the mic
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        // Skip if too short (< 200ms = ~6KB)
        if (audioBlob.size < 1000) {
          setRecording(false);
          return;
        }

        setTranscribing(true);
        try {
          // Convert blob to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });

          const res = await fetch(`${API_URL}/api/voice/transcribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audio: base64,
              userId: user?.id,
              language: "en",
            }),
          });

          const data = await res.json();
          if (res.ok && data.text) {
            setValue(data.text);
            if (import.meta.env.DEV) console.log(`[voice] transcribed: "${data.text}", ${data.remaining ?? "?"} searches left today`);
          } else if (res.status === 429) {
            alert(data.error ?? "Daily voice search limit reached.");
          } else {
            alert(data.error ?? "Couldn't transcribe your voice. Please try typing instead.");
          }
        } catch (err: any) {
          if (import.meta.env.DEV) console.error("[voice] transcribe error:", err);
          alert("Voice transcription failed. Please check your connection and try again.");
        } finally {
          setTranscribing(false);
          setRecording(false);
        }
      };

      recorder.start();
      setRecording(true);

      // Auto-stop after 15 seconds (max useful length)
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 15000);
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("[voice] permission error:", err);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        alert("Microphone permission denied. Please allow microphone access in your browser settings and try again.");
      } else if (err.name === "NotFoundError") {
        alert("No microphone found. Please connect a microphone and try again.");
      } else {
        alert(`Could not access microphone: ${err.message}`);
      }
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
            disabled={transcribing}
            className={`transition-colors ${
              transcribing ? "text-teal" :
              recording ? "text-coral animate-pulse" :
              "text-muted-foreground hover:text-foreground"
            }`}
            aria-label={transcribing ? "Transcribing..." : recording ? "Stop recording" : "Voice search"}>
            {transcribing ? <Loader2 className="w-4 h-4 animate-spin" /> :
              recording ? <Square className="w-4 h-4 fill-current" /> :
              <Mic className="w-4 h-4" />}
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
