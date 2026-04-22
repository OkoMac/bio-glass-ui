import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FeatureGate } from "@/components/FeatureGate";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import {
  Users, Calendar, TrendingUp, Package,
  Image, Target, BarChart, MessageSquare,
  ChevronRight, Sparkles, Lock, ArrowLeft,
} from "lucide-react";

// This is the NEW enhanced provider dashboard
// It's completely separate from the existing dashboard
// and only shows when the feature flag is enabled

export default function DashboardV2() {
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlags();
  
  // If the feature flag is disabled, show upgrade prompt
  if (!isEnabled('providerDashboardV2')) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
        <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
          <GlassCard className="p-6 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Enhanced Dashboard (Coming Soon)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              The enhanced provider dashboard with client CRM, progress tracking, 
              and advanced analytics is currently in development.
            </p>
            <p className="text-xs text-muted-foreground">
              Check back soon or contact support for early access.
            </p>
          </GlassCard>
          <ProviderNav />
        </div>
      </div>
    );
  }
  
  // Main dashboard content (will be built incrementally)
  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-6xl xl:max-w-7xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Provider Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Enhanced dashboard with client management and analytics
          </p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Clients</p>
                <p className="text-xl font-bold text-foreground">24</p>
              </div>
              <Users className="w-8 h-8 text-indigo/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-xl font-bold text-foreground">18</p>
              </div>
              <Calendar className="w-8 h-8 text-teal/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold text-foreground">R8,450</p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
                <p className="text-xl font-bold text-foreground">4.8</p>
              </div>
              <Sparkles className="w-8 h-8 text-purple/50" />
            </div>
          </GlassCard>
        </div>
        
        {/* Feature Modules (gated by feature flags) */}
        <div className="grid md:grid-cols-2 gap-5">
          
          {/* Client CRM Module */}
          <FeatureGate feature="providerDashboardV2">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Client CRM</h3>
                    <p className="text-xs text-muted-foreground">Manage your clients</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">New this week</span>
                  <span className="font-medium text-foreground">3 clients</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Due for follow-up</span>
                  <span className="font-medium text-foreground">5 clients</span>
                </div>
                <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground mt-2">
                  View All Clients
                </button>
              </div>
            </GlassCard>
          </FeatureGate>
          
          {/* Progress Tracking Module */}
          <FeatureGate feature="progressTracking">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Progress Tracking</h3>
                    <p className="text-xs text-muted-foreground">Client transformations</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active transformations</span>
                  <span className="font-medium text-foreground">8 clients</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Photos pending review</span>
                  <span className="font-medium text-foreground">12 photos</span>
                </div>
                <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground mt-2">
                  View Progress Gallery
                </button>
              </div>
            </GlassCard>
          </FeatureGate>
          
          {/* Session Management Module */}
          <FeatureGate feature="sessionManagement">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Session Management</h3>
                    <p className="text-xs text-muted-foreground">Classes & appointments</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Today's sessions</span>
                  <span className="font-medium text-foreground">6 sessions</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Waitlisted</span>
                  <span className="font-medium text-foreground">3 clients</span>
                </div>
                <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground mt-2">
                  Manage Schedule
                </button>
              </div>
            </GlassCard>
          </FeatureGate>
          
          {/* Package Builder Module */}
          <FeatureGate feature="packageBuilder">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-purple flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Package Builder</h3>
                    <p className="text-xs text-muted-foreground">Sell session bundles</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active packages</span>
                  <span className="font-medium text-foreground">4 packages</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Package revenue</span>
                  <span className="font-medium text-foreground">R3,200</span>
                </div>
                <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground mt-2">
                  Create Package
                </button>
              </div>
            </GlassCard>
          </FeatureGate>
        </div>
        
        {/* Coming Soon Features */}
        <GlassCard className="p-5">
          <h3 className="font-semibold text-foreground mb-4">Coming Soon</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 glass-1 rounded-xl">
              <BarChart className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs font-medium text-foreground">Advanced Analytics</p>
              <p className="text-xs text-muted-foreground">Q2 2026</p>
            </div>
            <div className="text-center p-4 glass-1 rounded-xl">
              <MessageSquare className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs font-medium text-foreground">Broadcast Messaging</p>
              <p className="text-xs text-muted-foreground">Q2 2026</p>
            </div>
            <div className="text-center p-4 glass-1 rounded-xl">
              <Target className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs font-medium text-foreground">Goal Setting</p>
              <p className="text-xs text-muted-foreground">Q3 2026</p>
            </div>
            <div className="text-center p-4 glass-1 rounded-xl">
              <Image className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs font-medium text-foreground">Photo Gallery</p>
              <p className="text-xs text-muted-foreground">Q3 2026</p>
            </div>
          </div>
        </GlassCard>
        
        <ProviderNav />
      </div>
    </div>
  );
}