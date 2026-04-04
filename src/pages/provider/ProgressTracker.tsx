import { useState } from "react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FeatureGate } from "@/components/FeatureGate";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import {
  Image, TrendingUp, Target, BarChart, Ruler, Weight,
  Camera, CheckCircle, Clock, Users, Download, Share2,
  Plus, Edit, Trash2, ChevronRight, Sparkles, Lock
} from "lucide-react";

// Progress Tracking System for Client Transformations
// This is a NEW feature that doesn't break existing functionality

export default function ProgressTracker() {
  const { isEnabled } = useFeatureFlags();
  
  // Sample data - will be replaced with real data later
  const [clients, setClients] = useState([
    { id: 1, name: 'John Smith', startDate: '2026-01-15', progress: 85, photos: 12, lastUpdate: '2 days ago', goal: 'Weight Loss' },
    { id: 2, name: 'Sarah Johnson', startDate: '2026-02-01', progress: 60, photos: 8, lastUpdate: '1 week ago', goal: 'Muscle Gain' },
    { id: 3, name: 'Mike Wilson', startDate: '2026-01-20', progress: 45, photos: 6, lastUpdate: '3 days ago', goal: 'Rehabilitation' },
    { id: 4, name: 'Emma Davis', startDate: '2026-02-10', progress: 30, photos: 4, lastUpdate: '2 weeks ago', goal: 'Fitness' },
  ]);
  
  const [measurements, setMeasurements] = useState([
    { id: 1, client: 'John Smith', date: '2026-03-28', weight: 82.5, bodyFat: 18.2, chest: 102, waist: 86, hips: 98 },
    { id: 2, client: 'Sarah Johnson', date: '2026-03-27', weight: 65.2, bodyFat: 24.5, chest: 88, waist: 72, hips: 94 },
    { id: 3, client: 'Mike Wilson', date: '2026-03-26', weight: 75.8, bodyFat: 22.1, chest: 96, waist: 84, hips: 100 },
  ]);
  
  // If the feature flag is disabled, show upgrade prompt
  if (!isEnabled('progressTracking')) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
        <div className="mx-auto max-w-2xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
          <GlassCard className="p-6 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Progress Tracking (Coming Soon)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Advanced client progress tracking with before/after galleries is currently in development.
            </p>
            <p className="text-xs text-muted-foreground">
              This feature includes measurement tracking, progress photos, goal setting, and transformation analytics.
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
            <h1 className="text-2xl font-bold text-foreground">Progress Tracking</h1>
            <p className="text-xs text-muted-foreground">
              Track client transformations, measurements, and goal progress
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="glass-1 rounded-pill px-4 py-2 text-sm font-medium text-foreground flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </button>
            <button className="gradient-indigo rounded-pill px-4 py-2 text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          </div>
        </div>
        
        {/* Client Progress Overview */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Active Transformations</h3>
                <p className="text-xs text-muted-foreground">Clients with ongoing progress tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">4 clients</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {clients.map(client => (
              <div key={client.id} className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.goal}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-indigo">{client.progress}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Started</span>
                    <span className="font-medium text-foreground">{client.startDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress Photos</span>
                    <span className="font-medium text-foreground">{client.photos}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Last Update</span>
                    <span className="font-medium text-foreground">{client.lastUpdate}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div 
                      className="bg-indigo rounded-full h-2 transition-all"
                      style={{ width: `${client.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
        
        <div className="grid lg:grid-cols-3 gap-5">
          
          {/* Recent Measurements */}
          <div className="lg:col-span-2">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                    <Ruler className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Recent Measurements</h3>
                    <p className="text-xs text-muted-foreground">Client body measurements over time</p>
                  </div>
                </div>
                <button className="glass-1 rounded-pill px-3 py-1.5 text-xs font-medium text-foreground">
                  View All
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-white/5">
                      <th className="pb-2 font-medium">Client</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Weight</th>
                      <th className="pb-2 font-medium">Body Fat</th>
                      <th className="pb-2 font-medium">Chest</th>
                      <th className="pb-2 font-medium">Waist</th>
                      <th className="pb-2 font-medium">Hips</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map(measurement => (
                      <tr key={measurement.id} className="border-b border-white/5 last:border-0">
                        <td className="py-3">
                          <p className="text-sm font-medium text-foreground">{measurement.client}</p>
                        </td>
                        <td className="py-3">
                          <p className="text-sm text-muted-foreground">{measurement.date}</p>
                        </td>
                        <td className="py-3">
                          <p className="text-sm font-medium text-foreground">{measurement.weight}kg</p>
                        </td>
                        <td className="py-3">
                          <p className="text-sm font-medium text-foreground">{measurement.bodyFat}%</p>
                        </td>
                        <td className="py-3">
                          <p className="text-sm font-medium text-foreground">{measurement.chest}cm</p>
                        </td>
                        <td className="py-3">
                          <p className="text-sm font-medium text-foreground">{measurement.waist}cm</p>
                        </td>
                        <td className="py-3">
                          <p className="text-sm font-medium text-foreground">{measurement.hips}cm</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground mt-4 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Log New Measurement
              </button>
            </GlassCard>
          </div>
          
          {/* Quick Actions */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Photo Management</h3>
                  <p className="text-xs text-muted-foreground">Progress photos and galleries</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">Pending Photo Reviews</p>
                  <span className="text-xs font-medium text-amber">3 new</span>
                </div>
                <p className="text-xs text-muted-foreground">Clients have uploaded progress photos for your review</p>
              </div>
              
              <div className="p-3 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">Before/After Galleries</p>
                  <span className="text-xs font-medium text-teal">8 ready</span>
                </div>
                <p className="text-xs text-muted-foreground">Complete transformation galleries ready to share</p>
              </div>
              
              <div className="space-y-2">
                <button className="w-full gradient-indigo rounded-pill py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" />
                  Request Progress Photos
                </button>
                <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share Transformation
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
        
        {/* Feature-Gated Analytics */}
        <FeatureGate feature="progressTracking">
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground mb-4">Progress Analytics</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">12.5kg</p>
                    <p className="text-xs text-muted-foreground">Total Weight Lost</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Across all active clients this month</p>
              </div>
              
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">68%</p>
                    <p className="text-xs text-muted-foreground">Goal Completion</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Average progress toward client goals</p>
              </div>
              
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                    <BarChart className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">94%</p>
                    <p className="text-xs text-muted-foreground">Client Retention</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Clients who continue progress tracking</p>
              </div>
            </div>
          </GlassCard>
        </FeatureGate>
        
        <ProviderNav />
      </div>
    </div>
  );
}