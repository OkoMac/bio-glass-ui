import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FeatureGate } from "@/components/FeatureGate";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import {
  Package, Tag, Users, Calendar, TrendingUp,
  Plus, Edit, Trash2, Check, X, ChevronRight,
  Sparkles, CreditCard, Percent, Clock, ArrowLeft,
} from "lucide-react";

// Package Builder for Gym Providers
// Allows providers to create and sell session bundles
// Matches EXACT same design patterns as existing components

export default function PackageBuilder() {
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlags();
  
  // Sample packages - will be replaced with real data
  const [packages, setPackages] = useState([
    { id: 1, name: '5-Session Pack', sessions: 5, price: 2250, discount: 10, active: true, sales: 8 },
    { id: 2, name: '10-Session Pack', sessions: 10, price: 4200, discount: 16, active: true, sales: 12 },
    { id: 3, name: 'Monthly Unlimited', sessions: 0, price: 999, discount: 0, active: true, sales: 5 },
    { id: 4, name: 'New Client Intro', sessions: 1, price: 299, discount: 40, active: false, sales: 23 },
  ]);
  
  const [newPackage, setNewPackage] = useState({
    name: '',
    sessions: 1,
    price: 0,
    discount: 0,
    description: ''
  });
  
  // If the feature flag is disabled, show upgrade prompt
  if (!isEnabled('packageBuilder')) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
        <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…" aria-label="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">
          <GlassCard className="p-6 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Package Builder (Coming Soon)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Create and sell session bundles to increase client commitment and revenue.
            </p>
            <p className="text-xs text-muted-foreground">
              This feature requires Pro or Elite subscription.
            </p>
          </GlassCard>
          <ProviderNav />
        </div>
      </div>
    );
  }
  
  const calculateSavings = (sessions: number, price: number, discount: number) => {
    const singleSessionPrice = 500; // Example single session price
    const regularPrice = singleSessionPrice * sessions;
    const discountedPrice = regularPrice * (1 - discount / 100);
    return {
      regularPrice,
      discountedPrice,
      savings: regularPrice - discountedPrice
    };
  };
  
  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…" aria-label="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-6xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Package Builder</h1>
            <p className="text-xs text-muted-foreground">
              Create session bundles to sell to clients
            </p>
          </div>
          <button className="gradient-indigo rounded-pill px-4 py-2 text-sm font-semibold text-white flex items-center gap-2" title="New Package" aria-label="New Package">
            <Plus className="w-4 h-4" />
            New Package
          </button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Packages</p>
                <p className="text-xl font-bold text-foreground">{packages.filter(p => p.active).length}</p>
              </div>
              <Package className="w-8 h-8 text-indigo/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Sales</p>
                <p className="text-xl font-bold text-foreground">{packages.reduce((sum, p) => sum + p.sales, 0)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-teal/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Package Revenue</p>
                <p className="text-xl font-bold text-foreground">R{packages.reduce((sum, p) => sum + (p.price * p.sales), 0).toLocaleString('en-ZA')}</p>
              </div>
              <CreditCard className="w-8 h-8 text-amber/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Discount</p>
                <p className="text-xl font-bold text-foreground">{packages.length > 0 ? (packages.reduce((sum, p) => sum + p.discount, 0) / packages.length).toFixed(0) : 0}%</p>
              </div>
              <Percent className="w-8 h-8 text-purple/50" />
            </div>
          </GlassCard>
        </div>
        
        {/* Your Packages */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Your Packages</h3>
                <p className="text-xs text-muted-foreground">Session bundles available for purchase</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{packages.length} packages</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {packages.map(pkg => {
              const savings = calculateSavings(pkg.sessions, pkg.price, pkg.discount);
              
              return (
                <div key={pkg.id} className="p-4 glass-1 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{pkg.name}</p>
                        {pkg.discount > 0 && (
                          <span className="px-2 py-0.5 bg-teal/20 text-teal rounded-full text-xs font-medium">
                            Save {pkg.discount}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{pkg.sessions === 0 ? 'Unlimited' : `${pkg.sessions} sessions`}</span>
                        <span>•</span>
                        <Users className="w-3 h-3" />
                        <span>{pkg.sales} sold</span>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      pkg.active 
                        ? 'bg-teal/20 text-teal' 
                        : 'bg-muted-foreground/20 text-muted-foreground'
                    }`}>
                      {pkg.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">R{pkg.price.toLocaleString('en-ZA')}</p>
                        {pkg.discount > 0 && (
                          <p className="text-xs text-muted-foreground line-through">
                            R{savings.regularPrice.toLocaleString('en-ZA')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {pkg.discount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Client saves</span>
                        <span className="font-medium text-teal">R{savings.savings.toLocaleString('en-ZA')}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">You earn</span>
                      <span className="font-medium text-foreground">
                        R{Math.floor(pkg.price * 0.95).toLocaleString('en-ZA')}
                        <span className="text-xs text-muted-foreground ml-1">(after 5% fee)</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <button className="flex-1 glass-1 rounded-pill py-2 text-sm font-medium text-foreground" title="Edit" aria-label="Edit">
                      Edit
                    </button>
                    <button className="flex-1 gradient-indigo rounded-pill py-2 text-sm font-semibold text-white">
                      {pkg.active ? 'Manage' : 'Activate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
        
        <div className="grid lg:grid-cols-3 gap-5">
          
          {/* Create New Package */}
          <div className="lg:col-span-2">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Create New Package</h3>
                    <p className="text-xs text-muted-foreground">Design a session bundle for clients</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Package Name</label>
                  <input
                    type="text"
                    className="w-full glass-1 rounded-pill px-4 py-2.5 text-sm text-foreground"
                    placeholder="e.g., 5-Session Strength Pack"
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Number of Sessions</label>
                    <div className="flex items-center">
                      <button className="w-10 h-10 glass-1 rounded-l-pill flex items-center justify-center" title="-" aria-label="-">
                        <span className="text-foreground">-</span>
                      </button>
                      <input
                        type="number"
                        className="flex-1 glass-1 rounded-none py-2.5 text-center text-sm text-foreground"
                        value={newPackage.sessions}
                        onChange={(e) => setNewPackage({...newPackage, sessions: parseInt(e.target.value) || 1})}
                        min="1"
                      />
                      <button className="w-10 h-10 glass-1 rounded-r-pill flex items-center justify-center" title="+" aria-label="+">
                        <span className="text-foreground">+</span>
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Discount %</label>
                    <div className="flex items-center">
                      <button className="w-10 h-10 glass-1 rounded-l-pill flex items-center justify-center" title="-" aria-label="-">
                        <span className="text-foreground">-</span>
                      </button>
                      <input
                        type="number"
                        className="flex-1 glass-1 rounded-none py-2.5 text-center text-sm text-foreground"
                        value={newPackage.discount}
                        onChange={(e) => setNewPackage({...newPackage, discount: parseInt(e.target.value) || 0})}
                        min="0"
                        max="50"
                      />
                      <button className="w-10 h-10 glass-1 rounded-r-pill flex items-center justify-center" title="+" aria-label="+">
                        <span className="text-foreground">+</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Package Price (R)</label>
                  <input
                    type="number"
                    className="w-full glass-1 rounded-pill px-4 py-2.5 text-sm text-foreground"
                    placeholder="0"
                    value={newPackage.price}
                    onChange={(e) => setNewPackage({...newPackage, price: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                  <textarea
                    className="w-full glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground min-h-[80px]"
                    placeholder="Describe what clients get with this package..."
                    value={newPackage.description}
                    onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                  />
                </div>
                
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Single session price</span>
                    <span className="font-medium text-foreground">R500</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Regular price ({newPackage.sessions} sessions)</span>
                    <span className="font-medium text-foreground">R{(500 * newPackage.sessions).toLocaleString('en-ZA')}</span>
                  </div>
                  {newPackage.discount > 0 && (
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Discount ({newPackage.discount}%)</span>
                      <span className="font-medium text-teal">-R{Math.floor(500 * newPackage.sessions * newPackage.discount / 100).toLocaleString('en-ZA')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-foreground">Package price</span>
                    <span className="text-lg text-foreground">
                      R{newPackage.price > 0 ? newPackage.price.toLocaleString('en-ZA') : Math.floor(500 * newPackage.sessions * (1 - newPackage.discount / 100)).toLocaleString('en-ZA')}
                    </span>
                  </div>
                </div>
                
                <button className="w-full gradient-indigo rounded-pill py-3 text-sm font-semibold text-white" title="Create Package" aria-label="Create Package">
                  Create Package
                </button>
              </div>
            </GlassCard>
          </div>
          
          {/* Package Benefits */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Package Benefits</h3>
                  <p className="text-xs text-muted-foreground">Why sell session bundles</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 glass-1 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-indigo/20 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-indigo" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Increase Revenue</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Clients pay upfront for multiple sessions, improving your cash flow.
                </p>
              </div>
              
              <div className="p-3 glass-1 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-teal/20 flex items-center justify-center">
                    <Users className="w-3 h-3 text-teal" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Client Commitment</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Bundles encourage clients to complete their sessions and stay committed.
                </p>
              </div>
              
              <div className="p-3 glass-1 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-amber/20 flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-amber" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Better Scheduling</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Predictable bookings help you plan your schedule more effectively.
                </p>
              </div>
              
              <div className="p-3 glass-1 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center">
                    <Tag className="w-3 h-3 text-purple" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Competitive Advantage</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Offer bundled pricing that standalone providers can't match.
                </p>
              </div>
              
              <div className="pt-3 border-t border-white/5">
                <h4 className="text-sm font-semibold text-foreground mb-2">Recommended Packages</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">5-Session Pack</span>
                    <span className="font-medium text-foreground">Most popular</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">10-Session Pack</span>
                    <span className="font-medium text-foreground">Best value</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Monthly Unlimited</span>
                    <span className="font-medium text-foreground">Recurring revenue</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
        
        {/* Feature-Gated Analytics */}
        <FeatureGate feature="packageBuilder">
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground mb-4">Package Performance</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">R{packages.reduce((sum, p) => sum + (p.price * p.sales), 0).toLocaleString('en-ZA')}</p>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">From package sales</p>
              </div>
              
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{packages.reduce((sum, p) => sum + p.sales, 0)}</p>
                    <p className="text-xs text-muted-foreground">Total Sales</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Packages sold to clients</p>
              </div>
              
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    {/* TODO STUB: was hardcoded "42%" — wire to a real
                        conversion-rate computation when package view tracking
                        ships. Conversion = sales / views over a window. */}
                    <p className="text-2xl font-bold text-foreground">—</p>
                    <p className="text-xs text-muted-foreground">Conversion Rate</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Clients who buy packages</p>
              </div>
            </div>
          </GlassCard>
        </FeatureGate>
        
        <ProviderNav />
      </div>
    </div>
  );
}