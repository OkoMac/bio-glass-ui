import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Smartphone, Share, X, Check, RefreshCw, Plus, Copy } from "lucide-react";
import { toast } from "sonner";
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
    navigator.clipboard.writeText(window.location.origin).then(() => setCopied(true)).catch((err) => console.warn("[InstallButton] then failed:", err?.message));
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

/* ── Shared hook: useInstallApp ─────────────────────────────── */
export function useInstallApp() {
  const [installed, setInstalled] = useState(isInstalled);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [device] = useState(getDeviceType);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("bion_install_dismissed") === "1"; }
    catch { return false; }
  });

  // Auto-show install guide for iOS (Safari + non-Safari) on first visit
  useEffect(() => {
    if (device !== "ios" || installed || dismissed) return;
    try {
      const seen = localStorage.getItem("bion_ios_install_shown");
      if (!seen) {
        const t = setTimeout(() => {
          setShowInstructions(true);
          localStorage.setItem("bion_ios_install_shown", "1");
        }, 2000);
        return () => clearTimeout(t);
      }
    } catch { /* */ }
  }, [device, installed, dismissed]);

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

  // Auto-show Android "Add to Home Screen" banner once Chrome has fired
  // beforeinstallprompt. Mirrors the iOS auto-show flow — user gets a
  // single, non-blocking nudge instead of having to dig into the browser
  // menu. Dismissal is sticky for 14 days via localStorage.
  const [androidBannerVisible, setAndroidBannerVisible] = useState(false);
  useEffect(() => {
    if (device !== "android" || installed || dismissed) return;
    if (!deferredPrompt) return;
    let snoozedUntil = 0;
    try {
      const v = localStorage.getItem("bion_android_install_snoozed_until");
      snoozedUntil = v ? parseInt(v, 10) || 0 : 0;
    } catch { /* */ }
    if (Date.now() < snoozedUntil) return;
    const t = setTimeout(() => setAndroidBannerVisible(true), 4000);
    return () => clearTimeout(t);
  }, [device, installed, dismissed, deferredPrompt]);

  const snoozeAndroidBanner = useCallback(() => {
    setAndroidBannerVisible(false);
    try {
      // Snooze for 14 days — long enough to not nag, short enough that the
      // next visit re-prompts. Users who explicitly tap "Don't show again"
      // hit handleDismiss instead which is permanent.
      const until = Date.now() + 14 * 24 * 60 * 60 * 1000;
      localStorage.setItem("bion_android_install_snoozed_until", String(until));
    } catch { /* */ }
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
            if (APP_VERSION) {
              try {
                if (localStorage.getItem("bion_sw_build_id") === APP_VERSION) return;
              } catch { /* */ }
            }
            setUpdateAvailable(true);
          }
        });
      });
      setInterval(() => reg.update(), 30 * 60 * 1000);
    });
  }, []);

  // Auto-show update modal when a new version is detected
  useEffect(() => {
    if (updateAvailable) {
      setShowUpdateModal(true);
    }
  }, [updateAvailable]);

  const installApp = useCallback(async () => {
    // iOS: show the native "Add to Home Screen" instructions modal
    if (device === "ios") {
      setShowInstructions(true);
      return;
    }
    // Android/Desktop: try browser install prompt if available
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }
    // No native prompt available — show instructions modal
    setShowInstructions(true);
  }, [device, deferredPrompt, setShowInstructions]);

  const handleUpdate = useCallback(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => reg?.update());
    }
    window.location.reload();
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem("bion_install_dismissed", "1");
  }, []);

  return {
    installApp,
    showInstructions,
    setShowInstructions,
    showUpdateModal,
    setShowUpdateModal,
    installed,
    deferredPrompt,
    device,
    isInstalledFlag: installed,
    dismissed,
    updateAvailable,
    handleUpdate,
    handleDismiss,
    APP_VERSION,
    androidBannerVisible,
    snoozeAndroidBanner,
  };
}

/* ── AndroidInstallBanner ─────────────────────────────────────
 * Auto-shown non-blocking bottom banner on Android Chrome once the
 * browser has fired beforeinstallprompt. Tap "Add to Home Screen" to
 * trigger the native install prompt; tap "Not now" to snooze for 14 days.
 * Mount once at the App.tsx root — it self-gates on device/installed/etc.
 * via the useInstallApp hook.
 */
export function AndroidInstallBanner() {
  const { androidBannerVisible, snoozeAndroidBanner, installApp, handleDismiss } = useInstallApp();

  return (
    <AnimatePresence>
      {androidBannerVisible && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed bottom-4 inset-x-4 z-[95] mx-auto max-w-sm rounded-2xl glass-2 border border-white/[0.08] p-4 shadow-2xl pb-safe-or-4"
          role="dialog"
          aria-label="Install BION to your home screen"
        >
          <div className="flex items-start gap-3">
            <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                Add BION to your Home Screen
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                Full-screen app, notifications, faster open. No extra download.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { installApp(); snoozeAndroidBanner(); }}
                  className="px-4 py-2 rounded-pill text-[11px] font-semibold text-white bg-gradient-to-r from-indigo to-violet"
                >
                  Add to Home Screen
                </button>
                <button
                  onClick={snoozeAndroidBanner}
                  className="px-3 py-2 rounded-pill text-[11px] font-medium text-muted-foreground border border-white/[0.08] bg-white/[0.02]"
                >
                  Not now
                </button>
                <button
                  onClick={() => { handleDismiss(); snoozeAndroidBanner(); }}
                  className="px-2 py-2 text-[10px] text-muted-foreground/70 hover:text-muted-foreground"
                  aria-label="Don't show again"
                >
                  Never
                </button>
              </div>
            </div>
            <button
              onClick={snoozeAndroidBanner}
              className="w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Close banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Update Banner (shown inside InstallModal for update flow) ─ */
function UpdateBanner({ onUpdate, onLater }: { onUpdate: () => void; onLater: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal/20 flex items-center justify-center mx-auto">
        <RefreshCw className="w-8 h-8 text-teal" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">New version available</p>
        <p className="text-xs text-muted-foreground mt-1">
          A new version of BION is ready. Update now for the latest features and fixes.
        </p>
      </div>
      <button
        onClick={onUpdate}
        className="w-full py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal to-emerald flex items-center justify-center gap-1.5"
      >
        <RefreshCw className="w-4 h-4" />
        Update now
      </button>
      <button onClick={onLater} className="text-[10px] text-muted-foreground">
        Later
      </button>
    </div>
  );
}

/* ── Install Modal (platform instructions) ──────────────────── */
export function InstallModal({
  show,
  onClose,
  device,
  deferredPrompt,
  onDismiss,
  showUpdateModal,
  handleUpdate,
}: {
  show: boolean;
  onClose: () => void;
  device: string;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onDismiss: () => void;
  showUpdateModal?: boolean;
  handleUpdate?: () => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-obsidian/70 z-[80]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-popover fixed inset-x-4 z-[90] max-w-sm mx-auto rounded-3xl p-6 overflow-y-auto max-h-[75vh] pb-safe-or-6"
            style={{ top: "20%", transform: "none" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-teal" />
                <h3 className="text-base font-bold text-foreground">Install BION</h3>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Close" title="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            {showUpdateModal && handleUpdate ? (
              <UpdateBanner
                onUpdate={() => {
                  handleUpdate();
                  onClose();
                }}
                onLater={onClose}
              />
            ) : (
              <>
                {device === "ios" && (
                  <div className="space-y-4">
                    {!isSafari() ? (
                      <NonSafariInstall onDone={onClose} />
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

                    {!deferredPrompt && (() => {
                      // Detect Brave — it supports PWA but blocks beforeinstallprompt
                      const isBrave = (navigator as any).brave?.isBrave;
                      // Detect Firefox — no PWA support at all
                      const isFirefox = navigator.userAgent.includes("Firefox");
                      if (isBrave) {
                        return (
                          <div className="rounded-xl border border-teal/20 bg-teal/5 p-3 mb-2">
                            <p className="text-[11px] text-teal leading-relaxed">
                              Brave supports app installation. Click the Brave menu (☰ top-right) → <strong>"Install BION…"</strong>
                            </p>
                          </div>
                        );
                      }
                      if (isFirefox) {
                        return (
                          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 mb-2">
                            <p className="text-[11px] text-amber leading-relaxed">
                              Firefox doesn't support app installation.{" "}
                              <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer"
                                className="underline font-medium">Open in Chrome</a> to install.
                            </p>
                          </div>
                        );
                      }
                      // Other browser (Safari desktop, Edge without event, etc.)
                      return (
                        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 mb-2">
                          <p className="text-[11px] text-amber leading-relaxed">
                            Look for the install icon in your address bar, or{" "}
                            <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer"
                              className="underline font-medium">open in Chrome</a> for the best experience.
                          </p>
                        </div>
                      );
                    })()}

                    <ol className="space-y-2.5 text-xs text-foreground">
                      <li className="flex gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal/20 text-teal flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                        <span>Look for the <Download className="w-3.5 h-3.5 inline" /> install icon in your address bar, or use the browser menu → Install BION</span>
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

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("https://bionhealth.co.za");
                        toast.success("Link copied — open in your browser to install");
                      }}
                      className="w-full py-2.5 rounded-xl border border-indigo/20 bg-indigo/5 text-xs font-medium text-indigo flex items-center justify-center gap-1.5 hover:bg-indigo/10 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      Copy BION link
                    </button>
                  </div>
                )}

                <div className="flex gap-2 mt-5">
                  <button onClick={onDismiss}
                    className="flex-1 py-2.5 rounded-2xl text-xs font-medium border border-white/[0.08] bg-white/[0.02] text-muted-foreground">
                    Don't show again
                  </button>
                  <button
                    onClick={() => {
                      if (device === "ios" && !isSafari()) {
                        // Non-Safari iOS: copy URL and tell user to open Safari
                        navigator.clipboard.writeText("https://bionhealth.co.za").catch((e: unknown) => console.warn("[InstallButton] clipboard writeText:", e instanceof Error ? e.message : String(e)));
                      } else if (navigator.share && device === "ios") {
                        // Safari iOS: open native Share sheet (has Add to Home Screen)
                        navigator.share({ title: "BION Health", url: "https://bionhealth.co.za" }).catch((e: unknown) => console.warn("[InstallButton] share:", e instanceof Error ? e.message : String(e)));
                      }
                      onClose();
                    }}
                    className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-indigo to-violet">
                    {device === "ios" && !isSafari() ? "Copy Link & Open Safari" : "Open Share Menu"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * InstallButton — renders as either a card or a pill, NOT fixed-position.
 * Use the `useInstallApp` hook and `InstallModal` component for custom placement.
 */
export default function InstallButton({ variant = "pill" }: { variant?: "card" | "pill" }) {
  const {
    installApp,
    showInstructions,
    setShowInstructions,
    showUpdateModal,
    setShowUpdateModal,
    installed,
    device,
    dismissed,
    updateAvailable,
    handleUpdate,
    handleDismiss,
    APP_VERSION,
  } = useInstallApp();

  if (installed) {
    return (
      <>
        <Tooltip text={updateAvailable ? "New version available — tap to update" : `BION app v${APP_VERSION}`} side="bottom">
          <button
            onClick={() => {
              if (updateAvailable) {
                handleUpdate();
              } else {
                setShowUpdateModal(false);
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-sm"
            style={{ color: updateAvailable ? "#14b8a6" : "#9ca3af" }}
            aria-label={updateAvailable ? "Update available" : `BION version ${APP_VERSION}`}
          >
            {updateAvailable ? (
              <RefreshCw className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {updateAvailable ? "Upgrade BION" : "BION installed"}
          </button>
        </Tooltip>
        <InstallModal
          show={showInstructions || showUpdateModal}
          onClose={() => {
            setShowInstructions(false);
            setShowUpdateModal(false);
          }}
          device={device}
          deferredPrompt={null}
          onDismiss={handleDismiss}
          showUpdateModal={showUpdateModal}
          handleUpdate={handleUpdate}
        />
      </>
    );
  }

  if (dismissed) return null;

  if (variant === "card") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo to-violet flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground">Install BION App</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Full-screen experience, push notifications, offline access</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={installApp}
                className="mt-3 h-9 px-4 rounded-full bg-gradient-to-r from-indigo to-violet flex items-center gap-1.5 shadow-cta"
                aria-label="Install BION app"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span className="text-[10px] font-bold text-white">Install</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        <InstallModal
          show={showInstructions || showUpdateModal}
          onClose={() => {
            setShowInstructions(false);
            setShowUpdateModal(false);
          }}
          device={device}
          deferredPrompt={null}
          onDismiss={handleDismiss}
          showUpdateModal={showUpdateModal}
          handleUpdate={handleUpdate}
        />
      </>
    );
  }

  // Pill variant (for menus, inline usage) — renders as a text menu item,
  // NOT a floating pill. Same visual style as Sign Out buttons.
  return (
    <>
      <button
        onClick={installApp}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-teal hover:bg-white/5 transition-all text-sm"
        aria-label="Install BION app"
      >
        <Download className="w-4 h-4" /> Install BION
      </button>

      <InstallModal
        show={showInstructions || showUpdateModal}
        onClose={() => {
          setShowInstructions(false);
          setShowUpdateModal(false);
        }}
        device={device}
        deferredPrompt={null}
        onDismiss={handleDismiss}
        showUpdateModal={showUpdateModal}
        handleUpdate={handleUpdate}
      />
    </>
  );
}
