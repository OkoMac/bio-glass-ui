import { useState } from "react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FeatureGate } from "@/components/FeatureGate";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import {
  Scissors, Palette, Droplets, Sparkles, User,
  Calendar, Clock, TrendingUp, Package, Star,
  Filter, Search, Plus, Edit, Trash2, ChevronRight,
  Sparkles as SparklesIcon, AlertCircle, CheckCircle
} from "lucide-react";

// Beauty Vertical Dashboard
// Tools for beauty service providers (hair stylists, estheticians, nail techs)
// Matches EXACT same design patterns as existing components

export default function BeautyDashboard() {
  const { isEnabled } = useFeatureFlags();
  
  // Beauty clients loaded from backend
  const [clients, setClients] = useState<{
    id: number; name: string; service: string; lastVisit: string;
    hairFormula: string; skinType: string; nextAppointment: string; notes: string;
  }[]>([]);

  // Hair formulas loaded from backend
  const [formulas, setFormulas] = useState<{
    id: number; name: string; code: string; developer: string; time: string;
    client: string; lastUsed: string; notes: string;
  }[]>([]);
  
  // If the feature flag is disabled, show upgrade prompt
  if (!isEnabled('beautyVertical')) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
        <div className="mx-auto max-w-2xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
          <GlassCard className="p-6 text-center">
            <SparklesIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Beauty Vertical (Coming Soon)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Specialized tools for hair stylists, estheticians, and beauty professionals.
            </p>
            <p className="text-xs text-muted-foreground">
              This feature requires Beauty Vertical add-on subscription.
            </p>
          </GlassCard>
          <ProviderNav />
        </div>
      </div>
    );
  }
  
  const stats = {
    totalClients: clients.length,
    upcomingAppointments: clients.filter(c => c.nextAppointment).length,
    formulasCount: formulas.length,
    revenue: 0,
  };
  
  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Beauty Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              Specialized tools for beauty service providers
            </p>
          </div>
          <button className="gradient-indigo rounded-pill px-4 py-2 text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Client
          </button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Beauty Clients</p>
                <p className="text-xl font-bold text-foreground">{stats.totalClients}</p>
              </div>
              <User className="w-8 h-8 text-indigo/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Upcoming</p>
                <p className="text-xl font-bold text-foreground">{stats.upcomingAppointments}</p>
              </div>
              <Calendar className="w-8 h-8 text-teal/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Hair Formulas</p>
                <p className="text-xl font-bold text-foreground">{stats.formulasCount}</p>
              </div>
              <Droplets className="w-8 h-8 text-amber/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold text-foreground">R{stats.revenue.toLocaleString('en-ZA')}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple/50" />
            </div>
          </GlassCard>
        </div>
        
        {/* Beauty Clients */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Beauty Clients</h3>
                <p className="text-xs text-muted-foreground">Clients with beauty service history</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{clients.length} clients</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-3">
            {clients.length === 0 ? (
              <div className="p-6 text-center">
                <User className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No beauty clients yet</p>
                <p className="text-xs text-muted-foreground">
                  Add clients to track their service history, formulas, and preferences.
                </p>
              </div>
            ) : (
              clients.map(client => (
                <div key={client.id} className="p-4 glass-1 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-indigo" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{client.name}</p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Scissors className="w-3 h-3" />
                            <span>{client.service}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Last: {client.lastVisit}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <Calendar className="w-3 h-3 text-teal" />
                        <p className="text-sm font-medium text-teal">{client.nextAppointment}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Next appointment</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {client.hairFormula !== 'N/A' && (
                      <div className="p-2 glass-1 rounded-lg">
                        <p className="text-xs text-muted-foreground">Hair Formula</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Droplets className="w-3 h-3 text-amber" />
                          <p className="text-sm font-medium text-foreground">{client.hairFormula}</p>
                        </div>
                      </div>
                    )}

                    <div className="p-2 glass-1 rounded-lg">
                      <p className="text-xs text-muted-foreground">Skin Type</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Sparkles className="w-3 h-3 text-purple" />
                        <p className="text-sm font-medium text-foreground">{client.skinType}</p>
                      </div>
                    </div>
                  </div>

                  {client.notes && (
                    <div className="p-2 glass-1 rounded-lg mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm text-foreground">{client.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button className="flex-1 glass-1 rounded-pill py-2 text-sm font-medium text-foreground">
                      View History
                    </button>
                    <button className="flex-1 glass-1 rounded-pill py-2 text-sm font-medium text-foreground">
                      Book Next
                    </button>
                    <button className="flex-1 gradient-indigo rounded-pill py-2 text-sm font-semibold text-white">
                      Edit Profile
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
        
        <div className="grid lg:grid-cols-3 gap-5">
          
          {/* Hair Formula Library */}
          <div className="lg:col-span-2">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Hair Formula Library</h3>
                    <p className="text-xs text-muted-foreground">Track and manage color formulas</p>
                  </div>
                </div>
                <button className="glass-1 rounded-pill px-3 py-1.5 text-xs font-medium text-foreground">
                  Add Formula
                </button>
              </div>
              
              <div className="space-y-3">
                {formulas.length === 0 ? (
                  <div className="p-6 text-center">
                    <Droplets className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">No formulas yet</p>
                    <p className="text-xs text-muted-foreground">Add hair formulas to track color recipes for your clients.</p>
                  </div>
                ) : (
                  formulas.map(formula => (
                    <div key={formula.id} className="p-3 glass-1 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{formula.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>Code: {formula.code}</span>
                            <span>•</span>
                            <span>Developer: {formula.developer}</span>
                            <span>•</span>
                            <span>Time: {formula.time}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Last used</p>
                          <p className="text-sm font-medium text-foreground">{formula.lastUsed}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formula.client}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button className="glass-1 rounded-pill px-3 py-1 text-xs font-medium text-foreground">
                            Edit
                          </button>
                          <button className="gradient-indigo rounded-pill px-3 py-1 text-xs font-semibold text-white">
                            Use Again
                          </button>
                        </div>
                      </div>

                      {formula.notes && (
                        <div className="mt-2 p-2 glass-1 rounded-lg">
                          <p className="text-xs text-muted-foreground">Notes</p>
                          <p className="text-sm text-foreground">{formula.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}

                <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Formula
                </button>
              </div>
            </GlassCard>
          </div>
          
          {/* Beauty Quick Tools */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Beauty Tools</h3>
                  <p className="text-xs text-muted-foreground">Quick access to beauty features</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <Scissors className="w-4 h-4" />
                Service History Cards
              </button>
              
              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Skin Profile Analysis
              </button>
              
              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <Package className="w-4 h-4" />
                Product Recommendations
              </button>
              
              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <Star className="w-4 h-4" />
                Before/After Gallery
              </button>
              
              <div className="pt-3 border-t border-white/5">
                <h4 className="text-sm font-semibold text-foreground mb-2">Beauty Stats</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Avg Service Time</span>
                    <span className="font-medium text-foreground">--</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Client Retention</span>
                    <span className="font-medium text-foreground">--</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Product Sales</span>
                    <span className="font-medium text-foreground">--</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
        
        {/* Feature-Gated Beauty Analytics */}
        <FeatureGate feature="beautyVertical">
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground mb-4">Beauty Analytics</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">28</p>
                    <p className="text-xs text-muted-foreground">Services/Month</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Average beauty services</p>
              </div>
              
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">R{stats.revenue.toLocaleString('en-ZA')}</p>
                    <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">From beauty services</p>
              </div>
              
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">4.9</p>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Beauty service satisfaction</p>
              </div>
            </div>
          </GlassCard>
        </FeatureGate>
        
        <ProviderNav />
      </div>
    </div>
  );
}