import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BookingsProvider } from "@/contexts/BookingsContext";

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

// Auth guard — redirects unauthenticated users to /welcome
function RequireAuth({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While Supabase is restoring the session, render nothing to avoid flash-to-welcome
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
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/welcome" element={<SplashOnboarding />} />

      {/* Root redirect based on role */}
      <Route path="/" element={
        !user                         ? <Navigate to="/welcome" replace /> :
        user.role === "admin"         ? <Navigate to="/admin/dashboard"    replace /> :
        user.role === "provider"      ? <Navigate to="/pro/dashboard"       replace /> :
        user.role === "corporate"     ? <Navigate to="/corporate/dashboard" replace /> :
        <Index />
      } />

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
      <Route path="/notifications"  element={<RequireAuth><Notifications /></RequireAuth>} />

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
