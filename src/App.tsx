import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import ProviderProfile from "./pages/ProviderProfile";
import Schedule from "./pages/Schedule";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import SplashOnboarding from "./pages/SplashOnboarding";
import Auth from "./pages/Auth";
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RoleRouter = () => {
  const { user, loading, isProvider, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center"
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(99,102,241,0.12) 0%, #0A0A0F 65%)" }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">BIO</h1>
          <div className="w-20 h-0.5 bg-foreground/10 rounded-full mx-auto overflow-hidden">
            <div className="h-full gradient-indigo rounded-full animate-shimmer" style={{ width: "40%" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/welcome" element={<SplashOnboarding />} />

      {/* Admin routes */}
      <Route path="/admin/*" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} />

      {/* Provider routes */}
      <Route path="/provider-dashboard/*" element={isProvider ? <ProviderDashboard /> : <Navigate to="/" replace />} />

      {/* Client routes (public) */}
      <Route path="/" element={<Index />} />
      <Route path="/provider/:id" element={<ProviderProfile />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/quick-book" element={<Index />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RoleRouter />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
