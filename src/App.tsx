import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BookingsProvider } from "@/contexts/BookingsContext";
import { useBookingReminders } from "@/hooks/useBookingReminders";

// ─── Error Boundary ──────────────────────────────────
//
// Behaviour:
//   - Chunk-load errors: NEVER show error UI — they're recoverable. Show the
//     same Suspense-style spinner + silently kick off a background auto-reload.
//   - Other errors: wait 800ms before rendering the error UI. If the error
//     state clears within that window (transient async issue), the user
//     never sees a flash of "Something went wrong".
//
// This kills the UX bug where every authenticated page briefly flashed the
// error screen during slow async loads / chunk fetches.
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null; showError: boolean; isChunkError: boolean }
> {
  private showErrorTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, showError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error) {
    const msg = error.message ?? "";
    const isChunk =
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Loading chunk") ||
      msg.includes("Loading CSS chunk") ||
      msg.includes("error loading dynamically imported module");
    return {
      hasError: true,
      error,
      isChunkError: isChunk,
      showError: false, // don't render the loud UI yet — see componentDidCatch
    };
  }

  componentDidCatch(error: Error) {
    if (this.state.isChunkError) {
      // Chunk-loading failure → silently auto-reload. Limit retries to avoid loop.
      const key = "bion_chunk_reload_count";
      const count = parseInt(sessionStorage.getItem(key) ?? "0", 10);
      if (count < 3) {
        sessionStorage.setItem(key, String(count + 1));
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
        }
        if ("caches" in window) {
          caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
        }
        // Brief backoff so we don't reload-loop the user. Spinner shows in the meantime.
        setTimeout(() => window.location.reload(), 400 * Math.pow(2, count));
        return;
      }
      // After 3 reload attempts, escalate to the visible error UI
      sessionStorage.removeItem(key);
    }

    // Non-chunk error (or chunk error after 3 retries) — wait 800ms before
    // showing the loud UI. This swallows transient errors that resolve on
    // the next render (common with Suspense / async hooks during navigation).
    if (this.showErrorTimer) clearTimeout(this.showErrorTimer);
    this.showErrorTimer = setTimeout(() => {
      // Only show if we're still in the error state when the timer fires
      if (this.state.hasError) {
        this.setState({ showError: true });
      }
    }, 800);

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error);
    }
  }

  componentWillUnmount() {
    if (this.showErrorTimer) clearTimeout(this.showErrorTimer);
  }

  render() {
    // Chunk error or pre-timer non-chunk error → minimal spinner, no scary UI
    if (this.state.hasError && !this.state.showError) {
      return (
        <div style={{
          minHeight: "100vh", background: "#0a0a0f",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            border: "2px solid rgba(99,102,241,0.25)",
            borderTopColor: "#6366f1",
            animation: "bionSpin 0.8s linear infinite",
          }} />
          <style>{`@keyframes bionSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    // Persistent error after the grace period
    if (this.state.hasError && this.state.showError) {
      return (
        <div style={{ padding: 40, fontFamily: "'DM Sans', system-ui", color: "#fff", background: "#0a0a0f", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{this.state.isChunkError ? "🔄" : "⚠️"}</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {this.state.isChunkError ? "BION just updated" : "Something went wrong"}
          </h1>
          <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 24, maxWidth: 400 }}>
            {this.state.isChunkError
              ? "A new version was deployed. Tap reload to get the latest."
              : "An unexpected error occurred. Reloading usually fixes it."}
          </p>
          <button onClick={() => {
            sessionStorage.removeItem("bion_chunk_reload_count");
            if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
            if ("caches" in window) caches.keys().then(ks => ks.forEach(k => caches.delete(k)));
            setTimeout(() => window.location.reload(), 200);
          }}
            style={{ padding: "12px 32px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 999, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            Reload BION
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{ background: "#1e1e2e", padding: 16, borderRadius: 8, overflow: "auto", fontSize: 11, marginTop: 24, maxWidth: "90vw", textAlign: "left" }}>
              {this.state.error.message}{"\n"}{this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Eager-loaded essential pages (always visible / first paint) ──
import Directory       from "./pages/Directory";
import SplashOnboarding from "./pages/SplashOnboarding";
import NotFound        from "./pages/NotFound";
import NotificationBell from "./components/NotificationBell";
import HabitTracker     from "./components/HabitTracker";
import InstallButton    from "./components/InstallButton";
import CalendarButton   from "./components/CalendarButton";
import OfflineBanner    from "./components/OfflineBanner";
import CommandPalette   from "./components/CommandPalette";
import CookieConsent    from "./components/CookieConsent";

// ── Lazy-loaded pages (split into separate chunks) ──
import { lazy, Suspense } from "react";

// Client pages
const Index           = lazy(() => import("./pages/Index"));
const ProviderProfile = lazy(() => import("./pages/ProviderProfile"));
const Schedule        = lazy(() => import("./pages/Schedule"));
const Messages        = lazy(() => import("./pages/Messages"));
const Profile         = lazy(() => import("./pages/Profile"));
const ClientSettings  = lazy(() => import("./pages/Settings"));
const Routines        = lazy(() => import("./pages/Routines"));
const Progress        = lazy(() => import("./pages/Progress"));
const QuickBook       = lazy(() => import("./pages/QuickBook"));
const Challenges      = lazy(() => import("./pages/Challenges"));
const HealthProfile   = lazy(() => import("./pages/HealthProfile"));
const Wallet          = lazy(() => import("./pages/Wallet"));
const Notifications   = lazy(() => import("./pages/Notifications"));
const Favorites       = lazy(() => import("./pages/Favorites"));
const Store           = lazy(() => import("./pages/Store"));
const ProgramDetail   = lazy(() => import("./pages/ProgramDetail"));
const MyPrograms      = lazy(() => import("./pages/MyPrograms"));

// Legal pages
const AcceptableUse     = lazy(() => import("./pages/legal/AcceptableUse"));
const PaymentFlow       = lazy(() => import("./pages/legal/PaymentFlow"));
const DisputeResolution = lazy(() => import("./pages/legal/DisputeResolution"));
const Privacy           = lazy(() => import("./pages/legal/Privacy"));

// Client free tools
const WaterTracker  = lazy(() => import("./pages/WaterTracker"));
const SleepTracker  = lazy(() => import("./pages/SleepTracker"));
const MedicalCard   = lazy(() => import("./pages/MedicalCard"));
const LifeCoach     = lazy(() => import("./pages/LifeCoach"));
const FoodTracker   = lazy(() => import("./pages/FoodTracker"));
const ClientBilling = lazy(() => import("./pages/client/Billing"));
const BionCalendar  = lazy(() => import("./pages/BionCalendar"));
const HealthInsights = lazy(() => import("./pages/HealthInsights"));

// Role onboarding
const ClientOnboarding    = lazy(() => import("./pages/onboarding/ClientOnboarding"));
const ProviderOnboarding  = lazy(() => import("./pages/onboarding/ProviderOnboarding"));
const CorporateOnboarding = lazy(() => import("./pages/onboarding/CorporateOnboarding"));
const AdminOnboarding     = lazy(() => import("./pages/onboarding/AdminOnboarding"));

// Provider portal
const ProviderClientDetail   = lazy(() => import("./pages/provider/ClientDetail"));
const ProviderDashboard      = lazy(() => import("./pages/provider/Dashboard"));
const ProviderBookings       = lazy(() => import("./pages/provider/Bookings"));
const ProviderSchedule       = lazy(() => import("./pages/provider/Schedule"));
const ProviderClients        = lazy(() => import("./pages/provider/Clients"));
const ProviderServices       = lazy(() => import("./pages/provider/Services"));
const ProviderMessages       = lazy(() => import("./pages/provider/Messages"));
const ProviderAnalytics      = lazy(() => import("./pages/provider/Analytics"));
const ProviderAvailability   = lazy(() => import("./pages/provider/Availability"));
const ProviderSettings       = lazy(() => import("./pages/provider/Settings"));
const ProviderBilling        = lazy(() => import("./pages/provider/Billing"));
const ProviderProgramBuilder = lazy(() => import("./pages/provider/ProgramBuilder"));
const ProviderStorefront     = lazy(() => import("./pages/provider/Storefront"));
const ProviderOrders         = lazy(() => import("./pages/provider/Orders"));
const ProviderVerification   = lazy(() => import("./pages/provider/Verification"));

// Admin portal
const AdminDashboard    = lazy(() => import("./pages/admin/Dashboard"));
const AdminProviders    = lazy(() => import("./pages/admin/Providers"));
const AdminClients      = lazy(() => import("./pages/admin/Clients"));
const AdminAnalytics    = lazy(() => import("./pages/admin/Analytics"));
const AdminSettings     = lazy(() => import("./pages/admin/Settings"));
const AdminUsers        = lazy(() => import("./pages/admin/Users"));
const AdminVerification = lazy(() => import("./pages/admin/Verification"));
const AdminDisputes     = lazy(() => import("./pages/admin/Disputes"));
const AdminBQueue       = lazy(() => import("./pages/admin/BQueue"));
const AdminCatalogs     = lazy(() => import("./pages/admin/Catalogs"));
const AdminWhatsApp     = lazy(() => import("./pages/admin/WhatsApp"));
const AdminCompliance   = lazy(() => import("./pages/admin/Compliance"));
const AdminProviderClaims = lazy(() => import("./pages/admin/ProviderClaims"));
const AdminSubscriptions  = lazy(() => import("./pages/admin/Subscriptions"));
const AdminRefunds        = lazy(() => import("./pages/admin/Refunds"));
const AdminTickets        = lazy(() => import("./pages/admin/Tickets"));
const Logout              = lazy(() => import("./pages/Logout"));
const Help                = lazy(() => import("./pages/Help"));
const MyTickets           = lazy(() => import("./pages/MyTickets"));
const SeoCategoryCity     = lazy(() => import("./pages/seo/SeoCategoryCity"));

// Catalogs (provider + public viewer)
const ProviderCatalogs  = lazy(() => import("./pages/provider/Catalogs"));
const CatalogEditor     = lazy(() => import("./pages/provider/CatalogEditor"));
const CatalogViewer     = lazy(() => import("./pages/CatalogViewer"));

// Bicademy (Ranger training)
const Bicademy           = lazy(() => import("./pages/Bicademy"));
const BicademyCourse     = lazy(() => import("./pages/BicademyCourse"));
const BicademyLesson     = lazy(() => import("./pages/BicademyLesson"));
const BicademyAssessment = lazy(() => import("./pages/BicademyAssessment"));
const BicademyCertificate = lazy(() => import("./pages/BicademyCertificate"));

// Corporate portal
const CorporateDashboard = lazy(() => import("./pages/corporate/Dashboard"));
const CorporateEmployees = lazy(() => import("./pages/corporate/Employees"));
const CorporateAnalytics = lazy(() => import("./pages/corporate/Analytics"));
const CorporateWallet    = lazy(() => import("./pages/corporate/Wallet"));
const CorporateSettings  = lazy(() => import("./pages/corporate/Settings"));
const CorporateProviders = lazy(() => import("./pages/corporate/Providers"));
const CorporateBeneficialOwners = lazy(() => import("./pages/corporate/BeneficialOwners"));

// Sales rep portal
const RepDashboard  = lazy(() => import("./pages/rep/Dashboard"));
const RepProviders  = lazy(() => import("./pages/rep/Providers"));
const RepAgreement  = lazy(() => import("./pages/rep/Agreement"));

// Public marketing landing pages
const ForProviders = lazy(() => import("./pages/landing/ForProviders"));
const ForCorporate = lazy(() => import("./pages/landing/ForCorporate"));
const ForRangers   = lazy(() => import("./pages/landing/ForRangers"));

const queryClient = new QueryClient();

// Install the on-unload cache sweep + background-tab query invalidation.
// Runs exactly once on first import.
if (typeof window !== "undefined") {
  import("./lib/cacheControl").then(m => m.installCacheControl(queryClient)).catch(() => {});
}

// ─── Onboarding check ─────────────────────────────────────────────────────────

const ONBOARDING_ROUTES: Record<string, string> = {
  client: "/onboarding/client",
  provider: "/onboarding/provider",
  corporate: "/onboarding/corporate",
  admin: "/onboarding/admin",
  sales_rep: "/rep/agreement",
};

function isOnboardingComplete(userId: string, role: string): boolean {
  // Demo accounts have id prefixed "demo_" — they bypass onboarding entirely
  if (userId.startsWith("demo_")) return true;
  
  // Admin and sales_rep users skip onboarding
  if (role === "admin") return true;
  if (role === "sales_rep") return true;
  
  try {
    const key = `bion_onboarding_${userId}_${role}`;
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const data = JSON.parse(raw) as { scorm?: { lessonStatus?: string } };
    return data?.scorm?.lessonStatus === "passed";
  } catch {
    return false;
  }
}

// ─── Auth guard — redirects unauthenticated users to /welcome ─────────────────

function RequireAuth({ children, allowedRoles, skipOnboardingCheck }: {
  children: ReactNode;
  allowedRoles?: string[];
  skipOnboardingCheck?: boolean;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While Supabase is restoring the session, render a spinner to avoid flash-to-welcome
  if (loading) return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-indigo border-t-transparent animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/welcome" state={{ from: location }} replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const home =
      user.role === "admin"      ? "/admin/dashboard"     :
      user.role === "provider"   ? "/pro/dashboard"        :
      user.role === "corporate"  ? "/corporate/dashboard"  :
      user.role === "sales_rep"  ? "/rep/dashboard"         : "/";
    return <Navigate to={home} replace />;
  }

  // Redirect new users to onboarding on first login
  if (!skipOnboardingCheck) {
    const userId = user.id ?? user.email;
    if (!isOnboardingComplete(userId, user.role)) {
      const onboardingRoute = ONBOARDING_ROUTES[user.role];
      if (onboardingRoute && !location.pathname.startsWith("/onboarding")) {
        return <Navigate to={onboardingRoute} replace />;
      }
    }
  }

  return <>{children}</>;
}

/** Runs booking reminder checks globally for logged-in users */
function BookingReminderRunner() {
  useBookingReminders();
  return null;
}

/** Only renders children once auth has resolved (prevents hooks firing with stale/undefined user) */
function AuthGate({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  if (loading || (!user && loading)) return null;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public — Directory IS the root landing page */}
      <Route path="/" element={
        !user                         ? <Directory /> :
        user.role === "admin"         ? <Navigate to="/admin/dashboard"    replace /> :
        user.role === "provider"      ? <Navigate to="/pro/dashboard"       replace /> :
        user.role === "corporate"     ? <Navigate to="/corporate/dashboard" replace /> :
        user.role === "sales_rep"    ? <Navigate to="/rep/dashboard"       replace /> :
        <Navigate to="/home" replace />
      } />
      <Route path="/directory" element={<Directory />} />
      <Route path="/welcome" element={<SplashOnboarding />} />

      {/* Universal sign-out: go to /logout from anywhere to clear session. */}
      <Route path="/logout" element={<Logout />} />
      <Route path="/signout" element={<Logout />} />

      {/* Programmatic SEO — /s/<citySlug>/<categorySlug> */}
      <Route path="/s/:citySlug/:categorySlug" element={<SeoCategoryCity />} />

      {/* Public marketing landing pages */}
      <Route path="/for-providers"  element={<ForProviders />} />
      <Route path="/for-corporate"  element={<ForCorporate />} />
      <Route path="/for-rangers"    element={<ForRangers />} />

      {/* Help & support (public ticket creation allowed) */}
      <Route path="/help" element={<Help />} />
      <Route path="/my-tickets"      element={<RequireAuth><MyTickets /></RequireAuth>} />
      <Route path="/my-tickets/:id"  element={<RequireAuth><MyTickets /></RequireAuth>} />

      {/* Public legal pages */}
      <Route path="/legal/acceptable-use"     element={<AcceptableUse />} />
      <Route path="/legal/payment-flow"       element={<PaymentFlow />} />
      <Route path="/legal/dispute-resolution" element={<DisputeResolution />} />
      <Route path="/legal/privacy"            element={<Privacy />} />
      <Route path="/privacy"                  element={<Navigate to="/legal/privacy" replace />} />

      {/* Client home (authenticated) */}
      <Route path="/home" element={<RequireAuth allowedRoles={["client"]}><Index /></RequireAuth>} />

      {/* Onboarding routes — no role guard, but must be authenticated */}
      <Route path="/onboarding/client"    element={<RequireAuth skipOnboardingCheck><ClientOnboarding /></RequireAuth>} />
      <Route path="/onboarding/provider"  element={<RequireAuth skipOnboardingCheck><ProviderOnboarding /></RequireAuth>} />
      <Route path="/onboarding/corporate" element={<RequireAuth skipOnboardingCheck><CorporateOnboarding /></RequireAuth>} />
      <Route path="/onboarding/admin"     element={<RequireAuth skipOnboardingCheck><AdminOnboarding /></RequireAuth>} />

      {/* Client routes */}
      <Route path="/provider/:id" element={<ProviderProfile />} />
      <Route path="/schedule"    element={<RequireAuth allowedRoles={["client"]}><Schedule /></RequireAuth>} />
      <Route path="/messages"    element={<RequireAuth allowedRoles={["client"]}><Messages /></RequireAuth>} />
      <Route path="/profile"     element={<RequireAuth allowedRoles={["client"]}><Profile /></RequireAuth>} />
      <Route path="/settings"    element={<RequireAuth allowedRoles={["client"]}><ClientSettings /></RequireAuth>} />
      <Route path="/routines"       element={<RequireAuth allowedRoles={["client"]}><Routines /></RequireAuth>} />
      <Route path="/progress"       element={<RequireAuth allowedRoles={["client"]}><Progress /></RequireAuth>} />
      <Route path="/quick-book"     element={<RequireAuth allowedRoles={["client"]}><QuickBook /></RequireAuth>} />
      <Route path="/challenges"     element={<RequireAuth allowedRoles={["client"]}><Challenges /></RequireAuth>} />
      <Route path="/health-profile" element={<RequireAuth allowedRoles={["client"]}><HealthProfile /></RequireAuth>} />
      <Route path="/wallet"         element={<RequireAuth allowedRoles={["client"]}><Wallet /></RequireAuth>} />
      <Route path="/water-tracker"  element={<RequireAuth allowedRoles={["client"]}><WaterTracker /></RequireAuth>} />
      <Route path="/water"          element={<Navigate to="/water-tracker" replace />} />
      <Route path="/sleep-tracker"  element={<RequireAuth allowedRoles={["client"]}><SleepTracker /></RequireAuth>} />
      <Route path="/sleep"          element={<Navigate to="/sleep-tracker" replace />} />
      <Route path="/medical-card"   element={<RequireAuth allowedRoles={["client"]}><MedicalCard /></RequireAuth>} />
      <Route path="/life-coach"     element={<RequireAuth allowedRoles={["client"]}><LifeCoach /></RequireAuth>} />
      <Route path="/coach"          element={<Navigate to="/life-coach" replace />} />
      <Route path="/food-tracker"   element={<RequireAuth allowedRoles={["client"]}><FoodTracker /></RequireAuth>} />
      <Route path="/food"           element={<Navigate to="/food-tracker" replace />} />
      <Route path="/calendar"        element={<RequireAuth allowedRoles={["client"]}><BionCalendar /></RequireAuth>} />
      <Route path="/health-insights" element={<RequireAuth allowedRoles={["client"]}><HealthInsights /></RequireAuth>} />
      <Route path="/billing"          element={<RequireAuth allowedRoles={["client"]}><ClientBilling /></RequireAuth>} />
      <Route path="/notifications"   element={<RequireAuth><Notifications /></RequireAuth>} />
      <Route path="/favorites"       element={<RequireAuth allowedRoles={["client"]}><Favorites /></RequireAuth>} />
      <Route path="/store"           element={<RequireAuth allowedRoles={["client"]}><Store /></RequireAuth>} />
      {/* Programs — public detail page + client-side dashboard */}
      <Route path="/program/:id"                     element={<ProgramDetail />} />
      <Route path="/my-programs"                     element={<RequireAuth><MyPrograms /></RequireAuth>} />
      <Route path="/my-programs/:enrollmentId"       element={<RequireAuth><MyPrograms /></RequireAuth>} />

      {/* Provider portal */}
      <Route path="/pro/dashboard"    element={<RequireAuth allowedRoles={["provider"]}><ProviderDashboard /></RequireAuth>} />
      <Route path="/pro/bookings"     element={<RequireAuth allowedRoles={["provider"]}><ProviderBookings /></RequireAuth>} />
      <Route path="/pro/schedule"     element={<RequireAuth allowedRoles={["provider"]}><ProviderSchedule /></RequireAuth>} />
      <Route path="/pro/clients"      element={<RequireAuth allowedRoles={["provider"]}><ProviderClients /></RequireAuth>} />
      <Route path="/pro/clients/:id"  element={<RequireAuth allowedRoles={["provider"]}><ProviderClientDetail /></RequireAuth>} />
      <Route path="/pro/services"     element={<RequireAuth allowedRoles={["provider"]}><ProviderServices /></RequireAuth>} />
      <Route path="/pro/messages"     element={<RequireAuth allowedRoles={["provider"]}><ProviderMessages /></RequireAuth>} />
      <Route path="/pro/analytics"    element={<RequireAuth allowedRoles={["provider"]}><ProviderAnalytics /></RequireAuth>} />
      <Route path="/pro/availability" element={<RequireAuth allowedRoles={["provider"]}><ProviderAvailability /></RequireAuth>} />
      <Route path="/pro/settings"     element={<RequireAuth allowedRoles={["provider"]}><ProviderSettings /></RequireAuth>} />
      <Route path="/pro/billing"      element={<RequireAuth allowedRoles={["provider"]}><ProviderBilling /></RequireAuth>} />
      <Route path="/pro/programs"       element={<RequireAuth allowedRoles={["provider"]}><ProviderProgramBuilder /></RequireAuth>} />
      <Route path="/pro/verification"  element={<RequireAuth allowedRoles={["provider"]}><ProviderVerification /></RequireAuth>} />
      <Route path="/pro/storefront"    element={<RequireAuth allowedRoles={["provider"]}><ProviderStorefront /></RequireAuth>} />
      <Route path="/pro/orders"        element={<RequireAuth allowedRoles={["provider"]}><ProviderOrders /></RequireAuth>} />
      <Route path="/pro/catalogs"      element={<RequireAuth allowedRoles={["provider"]}><ProviderCatalogs /></RequireAuth>} />
      <Route path="/pro/catalogs/:id"  element={<RequireAuth allowedRoles={["provider"]}><CatalogEditor /></RequireAuth>} />
      <Route path="/catalog/:shortUrl" element={<CatalogViewer />} />

      {/* Bicademy — open to all authenticated users */}
      <Route path="/bicademy"                           element={<RequireAuth><Bicademy /></RequireAuth>} />
      <Route path="/bicademy/:code"                     element={<RequireAuth><BicademyCourse /></RequireAuth>} />
      <Route path="/bicademy/:code/lesson/:n"           element={<RequireAuth><BicademyLesson /></RequireAuth>} />
      <Route path="/bicademy/:code/assessment"          element={<RequireAuth><BicademyAssessment /></RequireAuth>} />
      <Route path="/bicademy/certificate/:courseSlug"   element={<RequireAuth><BicademyCertificate /></RequireAuth>} />

      {/* Admin portal */}
      <Route path="/admin/dashboard" element={<RequireAuth allowedRoles={["admin"]}><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/providers" element={<RequireAuth allowedRoles={["admin"]}><AdminProviders /></RequireAuth>} />
      <Route path="/admin/clients"   element={<RequireAuth allowedRoles={["admin"]}><AdminClients /></RequireAuth>} />
      <Route path="/admin/analytics" element={<RequireAuth allowedRoles={["admin"]}><AdminAnalytics /></RequireAuth>} />
      <Route path="/admin/settings"  element={<RequireAuth allowedRoles={["admin"]}><AdminSettings /></RequireAuth>} />
      <Route path="/admin/users"        element={<RequireAuth allowedRoles={["admin"]}><AdminUsers /></RequireAuth>} />
      <Route path="/admin/verification" element={<RequireAuth allowedRoles={["admin"]}><AdminVerification /></RequireAuth>} />
      <Route path="/admin/disputes"     element={<RequireAuth allowedRoles={["admin"]}><AdminDisputes /></RequireAuth>} />
      <Route path="/admin/b-queue"      element={<RequireAuth allowedRoles={["admin"]}><AdminBQueue /></RequireAuth>} />
      <Route path="/admin/catalogs"     element={<RequireAuth allowedRoles={["admin"]}><AdminCatalogs /></RequireAuth>} />
      <Route path="/admin/whatsapp"     element={<RequireAuth allowedRoles={["admin"]}><AdminWhatsApp /></RequireAuth>} />
      <Route path="/admin/compliance"   element={<RequireAuth allowedRoles={["admin"]}><AdminCompliance /></RequireAuth>} />
      <Route path="/admin/provider-claims" element={<RequireAuth allowedRoles={["admin"]}><AdminProviderClaims /></RequireAuth>} />
      <Route path="/admin/subscriptions"   element={<RequireAuth allowedRoles={["admin"]}><AdminSubscriptions /></RequireAuth>} />
      <Route path="/admin/refunds"         element={<RequireAuth allowedRoles={["admin"]}><AdminRefunds /></RequireAuth>} />
      <Route path="/admin/tickets"         element={<RequireAuth allowedRoles={["admin"]}><AdminTickets /></RequireAuth>} />

      {/* Corporate portal */}
      <Route path="/corporate/dashboard" element={<RequireAuth allowedRoles={["corporate"]}><CorporateDashboard /></RequireAuth>} />
      <Route path="/corporate/employees" element={<RequireAuth allowedRoles={["corporate"]}><CorporateEmployees /></RequireAuth>} />
      <Route path="/corporate/providers" element={<RequireAuth allowedRoles={["corporate"]}><CorporateProviders /></RequireAuth>} />
      <Route path="/corporate/analytics" element={<RequireAuth allowedRoles={["corporate"]}><CorporateAnalytics /></RequireAuth>} />
      <Route path="/corporate/wallet"    element={<RequireAuth allowedRoles={["corporate"]}><CorporateWallet /></RequireAuth>} />
      <Route path="/corporate/settings"  element={<RequireAuth allowedRoles={["corporate"]}><CorporateSettings /></RequireAuth>} />
      <Route path="/corporate/beneficial-owners" element={<RequireAuth allowedRoles={["corporate"]}><CorporateBeneficialOwners /></RequireAuth>} />

      {/* Sales rep portal */}
      <Route path="/rep/agreement" element={<RequireAuth allowedRoles={["sales_rep"]}><RepAgreement /></RequireAuth>} />
      <Route path="/rep/dashboard" element={<RequireAuth allowedRoles={["sales_rep"]}><RepDashboard /></RequireAuth>} />
      <Route path="/rep/providers" element={<RequireAuth allowedRoles={["sales_rep"]}><RepProviders /></RequireAuth>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BookingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <OfflineBanner />
              <CommandPalette />
              <AuthGate>
                <CalendarButton />
                <NotificationBell />
                <BookingReminderRunner />
                <HabitTracker />
              </AuthGate>
              <InstallButton />
              {/* POPIA / GDPR cookie-consent banner. Renders only until the
                  user has made a first-time decision, then re-openable from
                  Settings → Privacy. Must load before any analytics / ad pixel. */}
              <CookieConsent />
              <Suspense fallback={
                <div className="min-h-screen bg-obsidian flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-violet/30 border-t-violet rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  </div>
                </div>
              }>
                <AppRoutes />
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </BookingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
