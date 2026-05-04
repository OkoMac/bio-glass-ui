import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Smartphone, Share, X, Check, RefreshCw, Plus } from "lucide-react";
import { useLocation } from "react-router-dom";
import { shouldShowFloatingChrome } from "@/lib/floatingChrome";
import Tooltip from "./Tooltip";

// Injected by vite.config.ts as `${pkg.version}-${shortSha}` — every deploy
// produces a different string so the in-app pill visibly changes after an
// update, instead of staying frozen on a hard-coded value.
const APP_VERSION = typeof __BION_BUILD_ID__ !== "undefined" ? __BION_BUILD_ID__ : "2.5.0-dev";

// Detect device type
function getDeviceType(): "android" | "ios" | "desktop" | "other" {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows|mac|linux/.test(ua)) return "desktop";
  return "other";
}

function isSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
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

/** Non-Safari iOS: auto-copy URL + guide to open Safari */
function NonSafariInstall({ onDone }: { onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Auto-copy on mount so user just needs to open Safari and paste
    navigator.clipboard.writeText(window.location.origin).then(() => setCopied(true)).catch(() => {});
  }, []);

  return (
    <div className="space-y-4 text-center">
      <img src="/icon-192.png" alt="BION" className="w-16 h-16 rounded-2xl mx-auto" />
      <div>
        <p className="text-sm font-bold text-foreground">
          {copied ? "Link copied!" : "Almost there"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {copied
            ? "Open Safari, tap the address bar, and paste."
            : "Tap below to copy the link, then open Safari."}
        </p>
      </div>

      {!copied && (
        <button
          onClick={() => { navigator.clipboard.writeText(window.location.origin).then(() => setCopied(true)); }}
          className="w-full py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo to-violet"
        >
          Copy Link
        </button>
      )}

      {copied && (
        <div className="glass-1 rounded-2xl p-4 space-y-3 text-left">
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-xl bg-teal/20 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-teal" />
            </div>
            <p className="text-xs text-foreground"><strong>bionhealth.co.za</strong> copied</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-xl bg-indigo/20 flex items-center justify-center shrink-0">
              <span className="text-sm">🧭</span>
            </div>
            <p className="text-xs text-foreground">Open <strong>Safari</strong> and paste in address bar</p>
          </div>
        </div>
      )}

      <button onClick={onDone} className="text-[10px] text-muted-foreground">
        I'll do it later
      </button>
    </div>
  );
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

  // Auto-show install guide for iOS Safari on first visit
  useEffect(() => {
    if (device !== "ios" || installed || dismissed) return;
    if (!isSafari()) return; // Only works in Safari
    try {
      const seen = localStorage.getItem("bion_ios_install_shown");
      if (!seen) {
        // Show after a short delay so the page loads first
        const t = setTimeout(() => {
          setShowInstructions(true);
          localStorage.setItem("bion_ios_install_shown", "1");
        }, 2000);
        return () => clearTimeout(t);
      }
    } catch { /* */ }
  }, [device, installed, dismissed]);

  // Only show on shell pages — every other page has its own top chrome
  // and the floating Install pill was overlapping page-level Save buttons
  // (cf. screenshot 2026-04-27 on /settings).
  const hidden = !shouldShowFloatingChrome(location.pathname);

  // Listen for beforeinstallprompt (Chrome, Edge)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
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
    // Android: download the native APK directly
    if (device === "android") {
      const a = document.createElement("a");
      a.href = "https://github.com/OkoMac/bio-glass-ui/releases/download/v1.0.0-android/BION-debug.apk";
      a.download = "BION.apk";
      a.click();
      return;
    }
    // Desktop: use browser's native install prompt if available
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }
    // iOS / fallback: show instructions (Safari Add to Home Screen)
    setShowInstructions(true);
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
      <div className="fixed right-16 z-[45]" style={{ top: "max(1rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))" }}>
        <Tooltip text={updateAvailable ? "New version available — tap to update" : `BION app v${APP_VERSION}`} side="bottom">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={updateAvailable ? handleUpdate : undefined}
            className={`h-10 px-3 rounded-full glass-2 flex items-center gap-1.5 shadow-card ${
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
        </Tooltip>
      </div>
    );
  }

  // ── Not installed + dismissed: don't show ──
  if (dismissed) return null;

  // ── Not installed: show install button ──
  return (
    <>
      <div className="fixed right-16 z-[45]" style={{ top: "max(1rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))" }}>
        <Tooltip text="Install BION as an app on your device" side="bottom">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInstall}
            className="h-10 px-3 rounded-full bg-gradient-to-r from-indigo to-violet flex items-center gap-1.5 shadow-cta"
            aria-label="Install BION app"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-bold text-white">Install</span>
          </motion.button>
        </Tooltip>
      </div>

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
              className="glass-popover fixed inset-x-4 top-1/2 -translate-y-1/2 z-[90] max-w-sm mx-auto rounded-3xl p-6"
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
                <div className="space-y-4">
                  {!isSafari() ? (
                    <NonSafariInstall onDone={() => setShowInstructions(false)} />
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-1">
                        <img src="/icon-192.png" alt="BION" className="w-12 h-12 rounded-2xl" />
                        <div>
                          <p className="text-sm font-bold text-foreground">Get the full BION experience</p>
                          <p className="text-[10px] text-muted-foreground">Full-screen app, push notifications, offline access</p>
                        </div>
                      </div>
                      <div className="glass-1 rounded-2xl p-4 space-y-4">
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-xl bg-teal/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Share className="w-4 h-4 text-teal" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">Tap the Share button</p>
                            <p className="text-[10px] text-muted-foreground">At the bottom of your screen</p>
                          </div>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-xl bg-indigo/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Plus className="w-4 h-4 text-indigo" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">Add to Home Screen</p>
                            <p className="text-[10px] text-muted-foreground">Scroll down in the share menu to find it</p>
                          </div>
                        </div>
                      </div>
                      {/* Arrow pointing to Safari share button */}
                      <div className="flex justify-center pt-2">
                        <motion.div
                          animate={{ y: [0, 8, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="text-teal text-lg"
                        >
                          ↓ Tap share below ↓
                        </motion.div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {device === "android" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Your download should start automatically. If it doesn't:</p>
                  <a
                    href="https://github.com/OkoMac/bio-glass-ui/releases/download/v1.0.0-android/BION-debug.apk"
                    download="BION.apk"
                    className="block w-full py-3 rounded-xl text-xs font-semibold text-center text-white bg-gradient-to-r from-teal to-emerald"
                  >
                    <Download className="w-3.5 h-3.5 inline mr-1.5" />
                    Download BION App
                  </a>
                  <p className="text-[10px] text-muted-foreground">Once downloaded, tap the file to install. You may need to allow "Install from unknown sources" in your settings.</p>
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
