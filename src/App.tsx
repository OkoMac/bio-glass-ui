import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BookingsProvider } from "@/contexts/BookingsContext";

// ─── Error Boundary ──────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "system-ui", color: "#fff", background: "#0a0a0f", minHeight: "100vh" }}>
          <h1 style={{ color: "#f87171", marginBottom: 16 }}>Runtime Error</h1>
          <pre style={{ background: "#1e1e2e", padding: 16, borderRadius: 8, overflow: "auto", fontSize: 13 }}>
            {this.state.error?.message}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "8px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Client pages
import Index           from "./pages/Index";
import Directory       from "./pages/Directory";
import ProviderProfile from "./pages/ProviderProfile";
import Schedule        from "./pages/Schedule";
import Messages        from "./pages/Messages";
import Profile         from "./pages/Profile";
import ClientSettings  from "./pages/Settings";
import Routines        from "./pages/Routines";
import Progress        from "./pages/Progress";
import QuickBook       from "./pages/QuickBook";
import Challenges      from "./pages/Challenges";
import HealthProfile   from "./pages/HealthProfile";
import Wallet          from "./pages/Wallet";
import Notifications   from "./pages/Notifications";
import SplashOnboarding from "./pages/SplashOnboarding";
import NotFound        from "./pages/NotFound";
import NotificationBell from "./components/NotificationBell";
import InstallButton    from "./components/InstallButton";
import CalendarButton   from "./components/CalendarButton";

// Legal pages
import AcceptableUse     from "./pages/legal/AcceptableUse";
import PaymentFlow       from "./pages/legal/PaymentFlow";
import DisputeResolution from "./pages/legal/DisputeResolution";

// Client free tools
import WaterTracker from "./pages/WaterTracker";
import SleepTracker from "./pages/SleepTracker";
import MedicalCard  from "./pages/MedicalCard";
import LifeCoach    from "./pages/LifeCoach";
import FoodTracker    from "./pages/FoodTracker";
import ClientBilling  from "./pages/client/Billing";
import BionCalendar from "./pages/BionCalendar";
import HealthInsights from "./pages/HealthInsights";

// Role onboarding
import ClientOnboarding    from "./pages/onboarding/ClientOnboarding";
import ProviderOnboarding  from "./pages/onboarding/ProviderOnboarding";
import CorporateOnboarding from "./pages/onboarding/CorporateOnboarding";
import AdminOnboarding     from "./pages/onboarding/AdminOnboarding";

// Provider portal
import ProviderClientDetail from "./pages/provider/ClientDetail";
import ProviderDashboard    from "./pages/provider/Dashboard";
import ProviderBookings     from "./pages/provider/Bookings";
import ProviderSchedule     from "./pages/provider/Schedule";
import ProviderClients      from "./pages/provider/Clients";
import ProviderServices     from "./pages/provider/Services";
import ProviderMessages     from "./pages/provider/Messages";
import ProviderAnalytics    from "./pages/provider/Analytics";
import ProviderAvailability from "./pages/provider/Availability";
import ProviderSettings     from "./pages/provider/Settings";
import ProviderBilling      from "./pages/provider/Billing";
import ProviderProgramBuilder from "./pages/provider/ProgramBuilder";
import ProviderVerification  from "./pages/provider/Verification";

// Admin portal
import AdminDashboard  from "./pages/admin/Dashboard";
import AdminProviders  from "./pages/admin/Providers";
import AdminClients    from "./pages/admin/Clients";
import AdminAnalytics  from "./pages/admin/Analytics";
import AdminSettings   from "./pages/admin/Settings";
import AdminUsers      from "./pages/admin/Users";

// Corporate portal
import CorporateDashboard  from "./pages/corporate/Dashboard";
import CorporateEmployees  from "./pages/corporate/Employees";
import CorporateAnalytics  from "./pages/corporate/Analytics";
import CorporateWallet     from "./pages/corporate/Wallet";
import CorporateSettings   from "./pages/corporate/Settings";
import CorporateProviders  from "./pages/corporate/Providers";

// Sales rep portal
import RepDashboard  from "./pages/rep/Dashboard";
import RepProviders  from "./pages/rep/Providers";
import RepAgreement  from "./pages/rep/Agreement";

const queryClient = new QueryClient();

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

      {/* Public legal pages */}
      <Route path="/legal/acceptable-use"     element={<AcceptableUse />} />
      <Route path="/legal/payment-flow"       element={<PaymentFlow />} />
      <Route path="/legal/dispute-resolution" element={<DisputeResolution />} />

      {/* Client home (authenticated) */}
      <Route path="/home" element={<RequireAuth allowedRoles={["client"]}><Index /></RequireAuth>} />

      {/* Onboarding routes — no role guard, but must be authenticated */}
      <Route path="/onboarding/client"    element={<RequireAuth skipOnboardingCheck><ClientOnboarding /></RequireAuth>} />
      <Route path="/onboarding/provider"  element={<RequireAuth skipOnboardingCheck><ProviderOnboarding /></RequireAuth>} />
      <Route path="/onboarding/corporate" element={<RequireAuth skipOnboardingCheck><CorporateOnboarding /></RequireAuth>} />
      <Route path="/onboarding/admin"     element={<RequireAuth skipOnboardingCheck><AdminOnboarding /></RequireAuth>} />

      {/* Client routes */}
      <Route path="/provider/:id" element={<RequireAuth><ProviderProfile /></RequireAuth>} />
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
      <Route path="/sleep-tracker"  element={<RequireAuth allowedRoles={["client"]}><SleepTracker /></RequireAuth>} />
      <Route path="/medical-card"   element={<RequireAuth allowedRoles={["client"]}><MedicalCard /></RequireAuth>} />
      <Route path="/life-coach"       element={<RequireAuth allowedRoles={["client"]}><LifeCoach /></RequireAuth>} />
      <Route path="/food-tracker"    element={<RequireAuth allowedRoles={["client"]}><FoodTracker /></RequireAuth>} />
      <Route path="/calendar"        element={<RequireAuth allowedRoles={["client"]}><BionCalendar /></RequireAuth>} />
      <Route path="/health-insights" element={<RequireAuth allowedRoles={["client"]}><HealthInsights /></RequireAuth>} />
      <Route path="/billing"          element={<RequireAuth allowedRoles={["client"]}><ClientBilling /></RequireAuth>} />
      <Route path="/notifications"   element={<RequireAuth><Notifications /></RequireAuth>} />

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

      {/* Admin portal */}
      <Route path="/admin/dashboard" element={<RequireAuth allowedRoles={["admin"]}><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/providers" element={<RequireAuth allowedRoles={["admin"]}><AdminProviders /></RequireAuth>} />
      <Route path="/admin/clients"   element={<RequireAuth allowedRoles={["admin"]}><AdminClients /></RequireAuth>} />
      <Route path="/admin/analytics" element={<RequireAuth allowedRoles={["admin"]}><AdminAnalytics /></RequireAuth>} />
      <Route path="/admin/settings"  element={<RequireAuth allowedRoles={["admin"]}><AdminSettings /></RequireAuth>} />
      <Route path="/admin/users"     element={<RequireAuth allowedRoles={["admin"]}><AdminUsers /></RequireAuth>} />

      {/* Corporate portal */}
      <Route path="/corporate/dashboard" element={<RequireAuth allowedRoles={["corporate"]}><CorporateDashboard /></RequireAuth>} />
      <Route path="/corporate/employees" element={<RequireAuth allowedRoles={["corporate"]}><CorporateEmployees /></RequireAuth>} />
      <Route path="/corporate/providers" element={<RequireAuth allowedRoles={["corporate"]}><CorporateProviders /></RequireAuth>} />
      <Route path="/corporate/analytics" element={<RequireAuth allowedRoles={["corporate"]}><CorporateAnalytics /></RequireAuth>} />
      <Route path="/corporate/wallet"    element={<RequireAuth allowedRoles={["corporate"]}><CorporateWallet /></RequireAuth>} />
      <Route path="/corporate/settings"  element={<RequireAuth allowedRoles={["corporate"]}><CorporateSettings /></RequireAuth>} />

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
              <CalendarButton />
              <NotificationBell />
              <InstallButton />
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </BookingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
