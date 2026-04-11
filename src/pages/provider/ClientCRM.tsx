import { useState } from "react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FeatureGate } from "@/components/FeatureGate";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import {
  Users, User, Calendar, MessageSquare, Phone, Mail,
  TrendingUp, Target, Clock, Star, Filter, Search,
  Plus, Edit, Trash2, ChevronRight, Sparkles,
  CheckCircle, AlertCircle, Clock as ClockIcon
} from "lucide-react";

// Client CRM for Gym Providers
// Advanced client management with history, notes, and follow-ups
// Matches EXACT same design patterns as existing components

export default function ClientCRM() {
  const { isEnabled } = useFeatureFlags();
  
  // Empty state - will be populated with real client data from Supabase
  const [clients, setClients] = useState<
    { id: number; name: string; email: string; phone: string; lastBooking: string; totalBookings: number; lifetimeValue: number; status: string; healthFlags: string[]; notes: string }[]
  >([]);
  
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // If the feature flag is disabled, show upgrade prompt
  if (!isEnabled('providerDashboardV2')) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
        <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
          <GlassCard className="p-6 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Client CRM (Coming Soon)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Advanced client management with history, notes, and follow-up system.
            </p>
            <p className="text-xs text-muted-foreground">
              This feature requires Enhanced Dashboard (Pro/Elite subscription).
            </p>
          </GlassCard>
          <ProviderNav />
        </div>
      </div>
    );
  }
  
  const filteredClients = clients.filter(client => {
    // Apply search filter
    if (search && !client.name.toLowerCase().includes(search.toLowerCase()) && 
        !client.email.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    // Apply status filter
    if (filter === 'active') return client.status === 'active';
    if (filter === 'lapsing') return client.status === 'lapsing';
    if (filter === 'lapsed') return client.status === 'lapsed';
    return true;
  });
  
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    lapsing: clients.filter(c => c.status === 'lapsing').length,
    lapsed: clients.filter(c => c.status === 'lapsed').length,
    totalValue: clients.reduce((sum, c) => sum + c.lifetimeValue, 0),
    avgBookings: clients.reduce((sum, c) => sum + c.totalBookings, 0) / clients.length
  };
  
  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-6xl xl:max-w-7xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Client CRM</h1>
            <p className="text-xs text-muted-foreground">
              Manage your clients, track history, and automate follow-ups
            </p>
          </div>
          <button className="gradient-indigo rounded-pill px-4 py-2 text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Clients</p>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-indigo/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Clients</p>
                <p className="text-xl font-bold text-foreground">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-teal/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Lifetime Value</p>
                <p className="text-xl font-bold text-foreground">R{stats.totalValue.toLocaleString('en-ZA')}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Bookings</p>
                <p className="text-xl font-bold text-foreground">{stats.avgBookings.toFixed(1)}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple/50" />
            </div>
          </GlassCard>
        </div>
        
        {/* Search and Filter */}
        <GlassCard className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                className="w-full glass-1 rounded-pill pl-10 pr-4 py-2.5 text-sm text-foreground"
                placeholder="Search clients by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="glass-1 rounded-pill p-1 flex">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
                    filter === 'all' 
                      ? 'gradient-indigo text-white' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
                    filter === 'active' 
                      ? 'gradient-teal text-white' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Active ({stats.active})
                </button>
                <button
                  onClick={() => setFilter('lapsing')}
                  className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
                    filter === 'lapsing' 
                      ? 'gradient-amber text-white' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Lapsing ({stats.lapsing})
                </button>
                <button
                  onClick={() => setFilter('lapsed')}
                  className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
                    filter === 'lapsed' 
                      ? 'gradient-red text-white' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Lapsed ({stats.lapsed})
                </button>
              </div>
              
              <button className="glass-1 rounded-pill p-2">
                <Filter className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>
        </GlassCard>
        
        {/* Clients List */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Your Clients</h3>
                <p className="text-xs text-muted-foreground">{filteredClients.length} clients found</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sorted by recent</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          
          {filteredClients.length > 0 ? (
          <div className="space-y-3">
            {filteredClients.map(client => (
              <div key={client.id} className="p-4 glass-1 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-indigo" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{client.name}</p>
                        <div className={`px-2 py-0.5 rounded-full text-xs ${
                          client.status === 'active' 
                            ? 'bg-teal/20 text-teal' 
                            : client.status === 'lapsing'
                            ? 'bg-amber/20 text-amber'
                            : 'bg-muted-foreground/20 text-muted-foreground'
                        }`}>
                          {client.status}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">R{client.lifetimeValue.toLocaleString('en-ZA')}</p>
                    <p className="text-xs text-muted-foreground">Lifetime value</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="p-2 glass-1 rounded-lg">
                    <p className="text-xs text-muted-foreground">Last Booking</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3 text-foreground" />
                      <p className="text-sm font-medium text-foreground">{client.lastBooking}</p>
                    </div>
                  </div>
                  
                  <div className="p-2 glass-1 rounded-lg">
                    <p className="text-xs text-muted-foreground">Total Bookings</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3 text-foreground" />
                      <p className="text-sm font-medium text-foreground">{client.totalBookings}</p>
                    </div>
                  </div>
                  
                  <div className="p-2 glass-1 rounded-lg">
                    <p className="text-xs text-muted-foreground">Health Flags</p>
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 text-amber" />
                      <p className="text-sm font-medium text-foreground">{client.healthFlags.length}</p>
                    </div>
                  </div>
                  
                  <div className="p-2 glass-1 rounded-lg">
                    <p className="text-xs text-muted-foreground">Follow-up</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ClockIcon className="w-3 h-3 text-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        {client.status === 'lapsed' ? 'Overdue' : 'On track'}
                      </p>
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
                  <button className="flex-1 glass-1 rounded-pill py-2 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </button>
                  <button className="flex-1 glass-1 rounded-pill py-2 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Book Session
                  </button>
                  <button className="flex-1 glass-1 rounded-pill py-2 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No CRM data yet</p>
              <p className="text-xs text-muted-foreground mt-1">Client records will appear here as clients book sessions with you.</p>
            </div>
          )}
        </GlassCard>

        <div className="grid lg:grid-cols-3 gap-5">

          {/* Follow-up Automation */}
          <div className="lg:col-span-2">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Follow-up Automation</h3>
                    <p className="text-xs text-muted-foreground">Proactive client engagement</p>
                  </div>
                </div>
                <button className="glass-1 rounded-pill px-3 py-1.5 text-xs font-medium text-foreground">
                  Configure
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 glass-1 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">7-Day Follow-up</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">0 pending</span>
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Auto-message clients who haven't booked in 7 days
                  </p>
                </div>

                <div className="p-3 glass-1 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">30-Day Check-in</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">0 pending</span>
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Check in with clients at risk of lapsing
                  </p>
                </div>

                <div className="p-3 glass-1 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">Birthday Messages</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">0 this month</span>
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Send personalized birthday greetings
                  </p>
                </div>
                
                <button className="w-full gradient-indigo rounded-pill py-2.5 text-sm font-semibold text-white">
                  Run Follow-up Campaign
                </button>
              </div>
            </GlassCard>
          </div>
          
          {/* Quick Actions */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Quick Actions</h3>
                  <p className="text-xs text-muted-foreground">Manage your client base</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                Email All Clients
              </button>
              
              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                WhatsApp Broadcast
              </button>
              
              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Export Client Data
              </button>
              
              <button className="w-full glass-1 rounded-pill py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <Star className="w-4 h-4" />
                Request Reviews
              </button>
              
              <div className="pt-3 border-t border-white/5">
                <h4 className="text-sm font-semibold text-foreground mb-2">Client Health</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Need follow-up</span>
                    <span className="font-medium text-foreground">{stats.lapsing + stats.lapsed} clients</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Health flags</span>
                    <span className="font-medium text-foreground">{clients.reduce((sum, c) => sum + c.healthFlags.length, 0)} flags</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Avg retention</span>
                    <span className="font-medium text-foreground">--</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
        
        {/* Feature-Gated Analytics */}
        <FeatureGate feature="providerDashboardV2">
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground mb-4">Client Analytics</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">--</p>
                    <p className="text-xs text-muted-foreground">Growth Rate</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Will calculate from client data</p>
              </div>

              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">--</p>
                    <p className="text-xs text-muted-foreground">Avg Sessions/Month</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Will calculate from booking data</p>
              </div>

              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">--</p>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Will calculate from client reviews</p>
              </div>
            </div>
          </GlassCard>
        </FeatureGate>
        
        <ProviderNav />
      </div>
    </div>
  );
}