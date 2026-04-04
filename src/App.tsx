import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BookingsProvider } from "@/contexts/BookingsContext";
import FeatureFlagRoute from "@/components/FeatureFlagRoute";

// Client pages
import Index           from "./pages/Index";
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

// NEW: Enhanced provider dashboard (feature-flagged)
import ProviderDashboardV2 from "./pages/provider/DashboardV2";
import SessionManager from "./pages/provider/SessionManager";
import ProgressTracker from "./pages/provider/ProgressTracker";
import PackageBuilder from "./pages/provider/PackageBuilder";
import ClientCRM from "./pages/provider/ClientCRM";
import BeautyDashboard from "./pages/beauty/BeautyDashboard";
import MedicalDashboard from "./pages/medical/MedicalDashboard";
import ViralFeatures from "./pages/viral/ViralFeatures";

// Client billing
import ClientBilling from "./pages/client/Billing";

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

const queryClient = new QueryClient();

// ─── Onboarding check ─────────────────────────────────────────────────────────

const ONBOARDING_ROUTES: Record<string, string> = {
  client: "/onboarding/client",
  provider: "/onboarding/provider",
  corporate: "/onboarding/corporate",
  admin: "/onboarding/admin",
};

function isOnboardingComplete(userId: string, role: string): boolean {
  // Demo accounts have id prefixed "demo_" — they bypass onboarding entirely
  if (userId.startsWith("demo_")) return true;
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
      user.role === "corporate"  ? "/corporate/dashboard"  : "/";
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
      {/* Public */}
      <Route path="/welcome" element={<SplashOnboarding />} />

      {/* Onboarding routes — no role guard, but must be authenticated */}
      <Route path="/onboarding/client"    element={<RequireAuth skipOnboardingCheck><ClientOnboarding /></RequireAuth>} />
      <Route path="/onboarding/provider"  element={<RequireAuth skipOnboardingCheck><ProviderOnboarding /></RequireAuth>} />
      <Route path="/onboarding/corporate" element={<RequireAuth skipOnboardingCheck><CorporateOnboarding /></RequireAuth>} />
      <Route path="/onboarding/admin"     element={<RequireAuth skipOnboardingCheck><AdminOnboarding /></RequireAuth>} />

      {/* Root redirect based on role */}
      <Route path="/" element={
        user?.role === "admin"         ? <Navigate to="/admin/dashboard"    replace /> :
        user?.role === "provider"      ? <Navigate to="/pro/dashboard"       replace /> :
        user?.role === "corporate"     ? <Navigate to="/corporate/dashboard" replace /> :
        <Index />
      } />

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
      <Route path="/billing"        element={<RequireAuth allowedRoles={["client"]}><ClientBilling /></RequireAuth>} />
      <Route path="/notifications"  element={<RequireAuth><Notifications /></RequireAuth>} />

      {/* Provider portal */}
      <Route path="/pro/dashboard"    element={<RequireAuth allowedRoles={["provider"]}><ProviderDashboard /></RequireAuth>} />
      <Route path="/pro/dashboard-v2" element={
        <RequireAuth allowedRoles={["provider"]}>
          <FeatureFlagRoute 
            feature="providerDashboardV2"
            enabledComponent={<ProviderDashboardV2 />}
            disabledComponent={<ProviderDashboard />} // Fall back to old dashboard
          />
        </RequireAuth>
      } />
      <Route path="/pro/session-manager" element={
        <RequireAuth allowedRoles={["provider"]}>
          <FeatureFlagRoute 
            feature="sessionManagement"
            enabledComponent={<SessionManager />}
            disabledComponent={<ProviderSchedule />} // Fall back to existing schedule
          />
        </RequireAuth>
      } />
      <Route path="/pro/progress-tracker" element={
        <RequireAuth allowedRoles={["provider"]}>
          <FeatureFlagRoute 
            feature="progressTracking"
            enabledComponent={<ProgressTracker />}
            disabledComponent={<ProviderClients />} // Fall back to clients page
          />
        </RequireAuth>
      } />
      <Route path="/pro/package-builder" element={
        <RequireAuth allowedRoles={["provider"]}>
          <FeatureFlagRoute 
            feature="packageBuilder"
            enabledComponent={<PackageBuilder />}
            disabledComponent={<ProviderBilling />} // Fall back to billing page
          />
        </RequireAuth>
      } />
      <Route path="/pro/client-crm" element={
        <RequireAuth allowedRoles={["provider"]}>
          <FeatureFlagRoute 
            feature="providerDashboardV2"
            enabledComponent={<ClientCRM />}
            disabledComponent={<ProviderClients />} // Fall back to clients page
          />
        </RequireAuth>
      } />
      <Route path="/beauty/dashboard" element={
        <RequireAuth allowedRoles={["provider"]}>
          <FeatureFlagRoute 
            feature="beautyVertical"
            enabledComponent={<BeautyDashboard />}
            disabledComponent={<ProviderDashboard />} // Fall back to main dashboard
          />
        </RequireAuth>
      } />
      <Route path="/medical/dashboard" element={
        <RequireAuth allowedRoles={["provider"]}>
          <FeatureFlagRoute 
            feature="medicalVertical"
            enabledComponent={<MedicalDashboard />}
            disabledComponent={<ProviderDashboard />} // Fall back to main dashboard
          />
        </RequireAuth>
      } />
      <Route path="/viral-features" element={
        <RequireAuth allowedRoles={["provider", "client"]}>
          <FeatureFlagRoute 
            feature="shareableProgressCards"
            enabledComponent={<ViralFeatures />}
            disabledComponent={<Index />} // Fall back to home page
          />
        </RequireAuth>
      } />
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
      <Route path="/pro/programs"     element={<RequireAuth allowedRoles={["provider"]}><ProviderProgramBuilder /></RequireAuth>} />

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
      <Route path="/corporate/analytics" element={<RequireAuth allowedRoles={["corporate"]}><CorporateAnalytics /></RequireAuth>} />
      <Route path="/corporate/wallet"    element={<RequireAuth allowedRoles={["corporate"]}><CorporateWallet /></RequireAuth>} />
      <Route path="/corporate/settings"  element={<RequireAuth allowedRoles={["corporate"]}><CorporateSettings /></RequireAuth>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BookingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </BookingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
