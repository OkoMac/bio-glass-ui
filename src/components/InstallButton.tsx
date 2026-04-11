import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Smartphone, Share, X, Check, RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";

const APP_VERSION = "1.0.0";

// Detect device type
function getDeviceType(): "android" | "ios" | "desktop" | "other" {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows|mac|linux/.test(ua)) return "desktop";
  return "other";
}

// Detect if app is already installed (running standalone)
function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Floating install button + version display
 * - Pre-install: shows "Install BION" with platform-specific instructions
 * - Post-install: shows "v1.0.0" badge with "Update" button when SW has new version
 */
export default function InstallButton() {
  const location = useLocation();
  const [installed, setInstalled] = useState(isInstalled);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [device] = useState(getDeviceType);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("bion_install_dismissed") === "1"; }
    catch { return false; }
  });

  // Hide on auth/onboarding/legal pages
  const hidden = ["/welcome", "/onboarding", "/legal"].some(p => location.pathname.startsWith(p));

  // Listen for beforeinstallprompt (Chrome, Edge)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setDeferredPrompt(null);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Listen for service worker updates
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then(reg => {
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
      // Check for updates every 30 minutes
      setInterval(() => reg.update(), 30 * 60 * 1000);
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // No native prompt — show platform-specific instructions
      setShowInstructions(true);
    }
  };

  const handleUpdate = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => reg?.update());
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("bion_install_dismissed", "1");
  };

  if (hidden) return null;

  // ── Installed: show version badge ──
  if (installed) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={updateAvailable ? handleUpdate : undefined}
        className={`fixed top-4 right-16 z-[45] h-10 px-3 rounded-full glass-2 flex items-center gap-1.5 shadow-card ${
          updateAvailable ? "border border-teal/40" : ""
        }`}
        aria-label={updateAvailable ? "Update available" : `BION version ${APP_VERSION}`}
      >
        {updateAvailable ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-teal animate-spin" style={{ animationDuration: "3s" }} />
            <span className="text-[10px] font-bold text-teal">Update</span>
          </>
        ) : (
          <>
            <Check className="w-3 h-3 text-teal" />
            <span className="text-[10px] font-data text-muted-foreground">v{APP_VERSION}</span>
          </>
        )}
      </motion.button>
    );
  }

  // ── Not installed + dismissed: don't show ──
  if (dismissed) return null;

  // ── Not installed: show install button ──
  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleInstall}
        className="fixed top-4 right-16 z-[45] h-10 px-3 rounded-full bg-gradient-to-r from-indigo to-violet flex items-center gap-1.5 shadow-cta"
        aria-label="Install BION app"
      >
        <Download className="w-3.5 h-3.5 text-white" />
        <span className="text-[10px] font-bold text-white">Install</span>
      </motion.button>

      {/* Platform-specific instructions modal */}
      <AnimatePresence>
        {showInstructions && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowInstructions(false)}
              className="fixed inset-0 bg-obsidian/70 z-[80]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[90] max-w-sm mx-auto rounded-3xl p-6"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-teal" />
                  <h3 className="text-base font-bold text-foreground">Install BION</h3>
                </div>
                <button onClick={() => setShowInstructions(false)}
                  className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {device === "ios" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Add BION to your iPhone home screen for the full app experience:</p>
                  <ol className="space-y-2.5 text-xs text-foreground">
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal/20 text-teal flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                      <span>Make sure you're using <strong>Safari</strong> (not Chrome)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal/20 text-teal flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                      <span>Tap the Share button <Share className="w-3.5 h-3.5 inline" /> at the bottom</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal/20 text-teal flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                      <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal/20 text-teal flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                      <span>Tap <strong>"Add"</strong> in the top right</span>
                    </li>
                  </ol>
                </div>
              )}

              {device === "android" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Install BION as an app on your Android device:</p>
                  <ol className="space-y-2.5 text-xs text-foreground">
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal/20 text-teal flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                      <span>Tap the menu (⋮) in the top right of Chrome</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal/20 text-teal flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                      <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal/20 text-teal flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                      <span>Tap <strong>"Install"</strong></span>
                    </li>
                  </ol>
                  <p className="text-[10px] text-muted-foreground italic mt-2">BION will appear in your app drawer like any other app.</p>
                </div>
              )}

              {device === "desktop" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Install BION as a desktop app:</p>
                  <ol className="space-y-2.5 text-xs text-foreground">
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal/20 text-teal flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                      <span>Look for the <Download className="w-3.5 h-3.5 inline" /> install icon in your address bar</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal/20 text-teal flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                      <span>Click it and confirm <strong>"Install"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal/20 text-teal flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                      <span>BION opens in its own window — find it in your Start menu / Applications folder</span>
                    </li>
                  </ol>
                  <p className="text-[10px] text-muted-foreground italic">Works in Chrome, Edge, and Brave.</p>
                </div>
              )}

              <div className="flex gap-2 mt-5">
                <button onClick={handleDismiss}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-medium border border-white/[0.08] bg-white/[0.02] text-muted-foreground">
                  Don't show again
                </button>
                <button onClick={() => setShowInstructions(false)}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-indigo to-violet">
                  Got it
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
