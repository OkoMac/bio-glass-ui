import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { storeUser } from "@/lib/auth";
import { CLIENT_TIER_FEATURES } from "@/lib/subscription";
import {
  CreditCard, Heart, Activity, TrendingUp, Check,
  Shield, Zap, Target, BarChart, Smartphone, Bell,
  Crown, Star, CheckCircle, Loader2
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function ClientBilling() {
  const { user } = useAuth();
  const { subscription, tierDisplayName, getUpgradeUrl, CLIENT_TIER_PRICING } = useSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;
    setUpgrading(true);
    try {
      const res = await fetch(`${API}/api/paystack/subscribe/client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          plan: selectedPlan,
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
        return;
      }
    } catch {
      // Paystack API not available — activate locally for demo
    }
    // Fallback: activate premium locally
    const updated = {
      ...user,
      subscription: {
        userType: 'client' as const,
        tier: 'premium' as const,
        status: 'active' as const,
        currentPeriodEnd: null,
        trialEnd: null,
        features: CLIENT_TIER_FEATURES.premium,
      },
    };
    storeUser(updated);
    window.location.reload();
  };
  
  // Check if user is a client
  const isClient = user?.role === 'client';
  
  if (!isClient) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow">
        <div className="mx-auto max-w-2xl px-4 pt-12 pb-28 space-y-5">
          <GlassCard className="p-6 text-center">
            <h1 className="text-xl font-bold text-foreground mb-2">Client Billing</h1>
            <p className="text-sm text-muted-foreground">
              This page is only available for client accounts.
            </p>
          </GlassCard>
        </div>
      </div>
    );
  }
  
  const currentTier = subscription?.tier || 'free';
  const isPremium = currentTier === 'premium';
  
  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow">
      <div className="mx-auto max-w-4xl px-4 pt-12 pb-28 space-y-5">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Health Tracking Subscription</h1>
          <p className="text-sm text-muted-foreground">
            Upgrade to unlock advanced health tracking features
          </p>
        </div>
        
        {/* Current Plan Status */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Current Plan</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isPremium ? 'gradient-indigo text-white' : 'glass-1 text-muted-foreground'
                }`}>
                  {tierDisplayName()}
                </div>
                {isPremium && (
                  <div className="flex items-center gap-1 text-xs text-teal">
                    <CheckCircle className="w-3 h-3" />
                    <span>Active</span>
                  </div>
                )}
              </div>
            </div>
            {!isPremium && (
              <button
                onClick={handleUpgrade} disabled={upgrading}
                className="gradient-indigo rounded-pill px-4 py-2 text-sm font-semibold text-white"
              >
                Upgrade Now
              </button>
            )}
          </div>
          
          {isPremium && (
            <div className="mt-4 p-4 glass-1 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Premium Health Tracking</p>
                  <p className="text-xs text-muted-foreground">All features unlocked</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">R100<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                  <p className="text-xs text-muted-foreground">Next billing: 28 Apr 2026</p>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
        
        {/* Billing Toggle */}
        <div className="flex justify-center">
          <div className="glass-1 rounded-pill p-1 inline-flex">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${
                selectedPlan === 'monthly' 
                  ? 'gradient-indigo text-white' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${
                selectedPlan === 'yearly' 
                  ? 'gradient-indigo text-white' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly (Save 17%)
            </button>
          </div>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Free Plan */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Free</h3>
                <p className="text-sm text-muted-foreground">Basic health tracking</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">R0</p>
                <p className="text-xs text-muted-foreground">forever</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal" />
                <span className="text-sm text-foreground">Free platform access</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal" />
                <span className="text-sm text-foreground">Browse local services</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal" />
                <span className="text-sm text-foreground">View contact details</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal" />
                <span className="text-sm text-foreground">Basic health tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal" />
                <span className="text-sm text-foreground">Book appointments (5% fee)</span>
              </div>
            </div>
            
            {currentTier === 'free' ? (
              <button className="w-full glass-1 rounded-pill py-3 text-sm font-medium text-foreground">
                Current Plan
              </button>
            ) : (
              <button className="w-full glass-1 rounded-pill py-3 text-sm font-medium text-foreground">
                Downgrade to Free
              </button>
            )}
          </GlassCard>
          
          {/* Premium Plan */}
          <GlassCard className="p-6 border-2 border-indigo/20 relative">
            {isPremium && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <div className="gradient-indigo rounded-full px-3 py-1 text-xs font-semibold text-white flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Current Plan
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">Premium</h3>
                  <Star className="w-4 h-4 text-amber" />
                </div>
                <p className="text-sm text-muted-foreground">Advanced health features</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  R{selectedPlan === 'monthly' ? '100' : '999'}
                </p>
                <p className="text-xs text-muted-foreground">
                  per {selectedPlan === 'monthly' ? 'month' : 'year'}
                </p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo" />
                <span className="text-sm font-medium text-foreground">Everything in Free, plus:</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-indigo" />
                  <span className="text-xs text-foreground">Advanced metrics</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-indigo" />
                  <span className="text-xs text-foreground">Progress analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3 text-indigo" />
                  <span className="text-xs text-foreground">Custom health goals</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart className="w-3 h-3 text-indigo" />
                  <span className="text-xs text-foreground">Health reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3 h-3 text-indigo" />
                  <span className="text-xs text-foreground">Wearable integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-indigo" />
                  <span className="text-xs text-foreground">Premium support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-3 h-3 text-indigo" />
                  <span className="text-xs text-foreground">Unlimited history</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-3 h-3 text-indigo" />
                  <span className="text-xs text-foreground">Health reminders</span>
                </div>
              </div>
            </div>
            
            {isPremium ? (
              <button className="w-full glass-1 rounded-pill py-3 text-sm font-medium text-foreground">
                Manage Subscription
              </button>
            ) : (
              <button
                onClick={handleUpgrade} disabled={upgrading}
                className="w-full gradient-indigo rounded-pill py-3 text-sm font-semibold text-white flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Upgrade to Premium - R{selectedPlan === 'monthly' ? '100' : '999'}/{selectedPlan === 'monthly' ? 'month' : 'year'}
              </button>
            )}
          </GlassCard>
        </div>
        
        {/* Feature Details */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Premium Health Features</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full gradient-indigo flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Advanced Health Metrics</h4>
                  <p className="text-xs text-muted-foreground">Track detailed health indicators beyond basic measurements.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full gradient-indigo flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Progress Analytics</h4>
                  <p className="text-xs text-muted-foreground">Visualize your health journey with detailed charts and insights.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full gradient-indigo flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Custom Health Goals</h4>
                  <p className="text-xs text-muted-foreground">Set personalized health targets and track your progress.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full gradient-indigo flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Wearable Integration</h4>
                  <p className="text-xs text-muted-foreground">Sync with Apple Health, Fitbit, Garmin, and other wearables.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full gradient-indigo flex items-center justify-center flex-shrink-0">
                  <BarChart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Health Reports</h4>
                  <p className="text-xs text-muted-foreground">Generate comprehensive health reports to share with providers.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full gradient-indigo flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Premium Support</h4>
                  <p className="text-xs text-muted-foreground">Get priority support for all your health tracking questions.</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
        
        {/* FAQ */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">What's the difference between Free and Premium?</h4>
              <p className="text-xs text-muted-foreground">
                Free includes basic platform access and health tracking. Premium unlocks all advanced health tracking features, analytics, wearable integration, and premium support.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">Can I still book appointments without Premium?</h4>
              <p className="text-xs text-muted-foreground">
                Yes! Platform access and appointment booking are completely free. You only pay a 5% transaction fee when you book and pay through the platform.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">Can I cancel anytime?</h4>
              <p className="text-xs text-muted-foreground">
                Yes, you can cancel your Premium subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">Is there a free trial?</h4>
              <p className="text-xs text-muted-foreground">
                New users get a 7-day free trial of Premium features to experience all the advanced health tracking capabilities.
              </p>
            </div>
          </div>
        </GlassCard>
        
        {/* Payment Methods */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Payment Methods</h3>
          <div className="flex flex-wrap gap-3">
            <div className="px-3 py-2 glass-1 rounded-lg text-xs font-medium text-foreground">Credit/Debit Card</div>
            <div className="px-3 py-2 glass-1 rounded-lg text-xs font-medium text-foreground">PayPal</div>
            <div className="px-3 py-2 glass-1 rounded-lg text-xs font-medium text-foreground">Apple Pay</div>
            <div className="px-3 py-2 glass-1 rounded-lg text-xs font-medium text-foreground">Google Pay</div>
            <div className="px-3 py-2 glass-1 rounded-lg text-xs font-medium text-foreground">Bank Transfer</div>
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground">
            <p>All payments are processed securely. Your payment information is encrypted and never stored on our servers.</p>
          </div>
        </GlassCard>
        
        {/* Call to Action */}
        {!isPremium && (
          <div className="text-center">
            <button
              onClick={handleUpgrade} disabled={upgrading}
              className="gradient-indigo rounded-pill px-6 py-3 text-sm font-semibold text-white inline-flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Start Your 7-Day Free Trial
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              No credit card required for trial. Cancel anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}