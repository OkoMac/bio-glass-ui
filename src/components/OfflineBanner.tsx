import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export default function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const goOffline = () => setOnline(false);
    const goOnline = () => {
      setOnline(true);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 2500);
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  const visible = !online || showBackOnline;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className={`fixed top-0 inset-x-0 z-[9999] glass-2 rounded-b-2xl px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium ${
            !online
              ? "text-amber border-b border-amber/20"
              : "text-emerald-400 border-b border-emerald-400/20"
          }`}
        >
          {!online ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span>You're offline — some features may be unavailable</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              <span>Back online</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
