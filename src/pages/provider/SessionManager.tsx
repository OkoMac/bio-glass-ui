import { useState } from "react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FeatureGate } from "@/components/FeatureGate";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import {
  Calendar, Clock, Users, Video, Home, MapPin,
  Plus, Edit, Trash2, Check, X, ChevronRight,
  Sparkles, Lock
} from "lucide-react";

// Session Management System for Gym Providers
// This is a NEW feature that doesn't break existing scheduling

export default function SessionManager() {
  const { isEnabled } = useFeatureFlags();
  
  // Sample data - will be replaced with real data later
  const [sessions, setSessions] = useState([
    { id: 1, type: 'Personal Training', client: 'John Smith', time: '09:00', duration: 60, status: 'confirmed', location: 'Gym Floor' },
    { id: 2, type: 'Group Class', client: 'Yoga Class', time: '10:30', duration: 45, status: 'confirmed', location: 'Studio A' },
    { id: 3, type: 'Virtual Session', client: 'Sarah Johnson', time: '14:00', duration: 30, status: 'pending', location: 'Zoom' },
    { id: 4, type: 'Biokinetics', client: 'Mike Wilson', time: '16:00', duration: 60, status: 'confirmed', location: 'Rehab Room' },
  ]);
  
  const [classes, setClasses] = useState([
    { id: 1, name: 'Morning Yoga', day: 'Mon, Wed, Fri', time: '07:00', capacity: 20, enrolled: 18, location: 'Studio A' },
    { id: 2, name: 'HIIT Burn', day: 'Tue, Thu', time: '17:30', capacity: 15, enrolled: 15, location: 'Gym Floor' },
    { id: 3, name: 'Senior Mobility', day: 'Mon, Thu', time: '10:00', capacity: 12, enrolled: 8, location: 'Studio B' },
  ]);
  
  // If the feature flag is disabled, show upgrade prompt
  if (!isEnabled('sessionManagement')) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
        <div className="mx-auto max-w-2xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
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
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
        
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
              <span className="text-xs text-muted-foreground">4 sessions</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          
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
                      <span>•</span>
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
                  <p className="text-2xl font-bold text-foreground">24</p>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                </div>
                <div className="p-3 glass-1 rounded-xl text-center">
                  <p className="text-2xl font-bold text-foreground">18</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Personal Training</span>
                  <span className="font-medium text-foreground">12 sessions</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Group Classes</span>
                  <span className="font-medium text-foreground">8 sessions</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Virtual Sessions</span>
                  <span className="font-medium text-foreground">4 sessions</span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Revenue</span>
                  <span className="font-bold text-foreground">R8,450</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg per session</span>
                  <span className="font-medium text-foreground">R352</span>
                </div>
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