import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FeatureGate } from "@/components/FeatureGate";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import {
  Calendar, Clock, Users, Video, Home, MapPin,
  Plus, Edit, Trash2, Check, X, ChevronRight,
  Sparkles, Lock, TrendingUp, ArrowLeft,
} from "lucide-react";

// Session Management System for Gym Providers
// This is a NEW feature that doesn't break existing scheduling

export default function SessionManager() {
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlags();
  
  // Empty state - will be populated with real session data from Supabase
  const [sessions, setSessions] = useState<
    { id: number; type: string; client: string; time: string; duration: number; status: string; location: string }[]
  >([]);

  const [classes, setClasses] = useState<
    { id: number; name: string; day: string; time: string; capacity: number; enrolled: number; location: string }[]
  >([]);
  
  // If the feature flag is disabled, show upgrade prompt
  if (!isEnabled('sessionManagement')) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
        <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">
          <GlassCard className="p-6 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Session Management (Coming Soon)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Advanced session and class management for gym providers is currently in development.
            </p>
            <p className="text-xs text-muted-foreground">
              This feature includes class scheduling, capacity management, waitlists, and attendance tracking.
            </p>
          </GlassCard>
          <ProviderNav />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-6xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Session Management</h1>
            <p className="text-xs text-muted-foreground">
              Manage personal sessions, group classes, and virtual appointments
            </p>
          </div>
          <button className="gradient-indigo rounded-pill px-4 py-2 text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>
        
        {/* Today's Schedule */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Today's Schedule</h3>
                <p className="text-xs text-muted-foreground">Saturday, March 28</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{sessions.length} sessions</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id} className="flex items-center justify-between p-3 glass-1 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    session.status === 'confirmed' ? 'bg-teal/20' : 'bg-amber/20'
                  }`}>
                    {session.type === 'Virtual Session' ? (
                      <Video className="w-4 h-4 text-teal" />
                    ) : session.type === 'Group Class' ? (
                      <Users className="w-4 h-4 text-teal" />
                    ) : (
                      <Clock className="w-4 h-4 text-teal" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{session.client}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{session.type}</span>
                      <span>-</span>
                      <span>{session.time} ({session.duration}min)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs">
                    <MapPin className="w-3 h-3" />
                    <span>{session.location}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    session.status === 'confirmed'
                      ? 'bg-teal/20 text-teal'
                      : 'bg-amber/20 text-amber'
                  }`}>
                    {session.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No sessions scheduled</p>
              <p className="text-xs text-muted-foreground mt-1">Sessions will appear here as clients book with you.</p>
            </div>
          )}
        </GlassCard>
        
        <div className="grid md:grid-cols-2 gap-5">
          
          {/* Group Classes */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Group Classes</h3>
                  <p className="text-xs text-muted-foreground">Manage your weekly classes</p>
                </div>
              </div>
              <button className="glass-1 rounded-pill px-3 py-1.5 text-xs font-medium text-foreground">
                View All
              </button>
            </div>
            
            {classes.length > 0 ? (
            <div className="space-y-3">
              {classes.map(cls => (
                <div key={cls.id} className="p-3 glass-1 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{cls.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{cls.enrolled}/{cls.capacity}</span>
                      <div className="w-2 h-2 rounded-full bg-teal"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{cls.day}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{cls.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{cls.location}</span>
                    </div>
                  </div>
                </div>
              ))}

              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground mt-2 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Add New Class
              </button>
            </div>
            ) : (
              <div className="text-center py-6">
                <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No group classes set up yet.</p>
                <button className="glass-1 rounded-pill py-2.5 px-4 text-sm font-medium text-foreground flex items-center justify-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  Add New Class
                </button>
              </div>
            )}
          </GlassCard>
          
          {/* Quick Stats */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Session Stats</h3>
                  <p className="text-xs text-muted-foreground">This week's performance</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 glass-1 rounded-xl text-center">
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                </div>
                <div className="p-3 glass-1 rounded-xl text-center">
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5">
                <p className="text-sm text-muted-foreground text-center">Session stats will appear once you have bookings.</p>
              </div>
            </div>
          </GlassCard>
        </div>
        
        {/* Feature-Gated Sections */}
        <FeatureGate feature="sessionManagement">
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground mb-4">Advanced Features</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 glass-1 rounded-xl">
                <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Waitlist Management</h4>
                <p className="text-xs text-muted-foreground">Auto-notify waitlisted clients when slots open</p>
              </div>
              
              <div className="p-4 glass-1 rounded-xl">
                <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Recurring Sessions</h4>
                <p className="text-xs text-muted-foreground">Set up weekly/fortnightly recurring appointments</p>
              </div>
              
              <div className="p-4 glass-1 rounded-xl">
                <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center mb-3">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Home Visits</h4>
                <p className="text-xs text-muted-foreground">Manage mobile sessions with travel time buffers</p>
              </div>
            </div>
          </GlassCard>
        </FeatureGate>
        
        <ProviderNav />
      </div>
    </div>
  );
}