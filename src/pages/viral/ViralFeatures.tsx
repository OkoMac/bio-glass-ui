import { useState } from "react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FeatureGate } from "@/components/FeatureGate";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import {
  Share2, Trophy, Users, TrendingUp, Star,
  Target, Award, Zap, Heart, Sparkles,
  Filter, Search, Plus, Edit, Trash2, ChevronRight,
  Sparkles as SparklesIcon, Gift, Bell, Calendar, CheckCircle
} from "lucide-react";

// Viral Features Dashboard
// Social sharing, challenges, and gamification for platform growth
// Matches EXACT same design patterns as existing components

export default function ViralFeatures() {
  const { isEnabled } = useFeatureFlags();
  
  // Sample challenges - will be replaced with real data
  const [challenges, setChallenges] = useState([
    { id: 1, name: '30-Day Fitness Challenge', participants: 142, endDate: '2026-04-27',
      reward: 'Premium Month Free', status: 'active', description: 'Complete daily workouts' },
    { id: 2, name: 'Wellness Week', participants: 89, endDate: '2026-04-05',
      reward: 'BION Merch', status: 'active', description: 'Mindfulness & nutrition focus' },
    { id: 3, name: 'Transformation Challenge', participants: 56, endDate: '2026-03-30',
      reward: 'R1,000 Cash Prize', status: 'ending', description: 'Before/after progress' },
  ]);
  
  // Sample achievements
  const [achievements, setAchievements] = useState([
    { id: 1, name: 'Consistency King', icon: '🏆', earned: true, points: 500 },
    { id: 2, name: 'Social Butterfly', icon: '🦋', earned: true, points: 300 },
    { id: 3, name: 'Challenge Champion', icon: '🥇', earned: false, points: 750 },
    { id: 4, name: 'Referral Master', icon: '👑', earned: false, points: 1000 },
  ]);
  
  // If the feature flag is disabled, show upgrade prompt
  if (!isEnabled('shareableProgressCards')) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
        <div className="mx-auto max-w-2xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
          <GlassCard className="p-6 text-center">
            <SparklesIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Viral Features (Coming Soon)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Social sharing, challenges, and gamification for platform growth.
            </p>
            <p className="text-xs text-muted-foreground">
              These features will be available to all users.
            </p>
          </GlassCard>
          <ProviderNav />
        </div>
      </div>
    );
  }
  
  const stats = {
    totalParticipants: challenges.reduce((sum, c) => sum + c.participants, 0),
    activeChallenges: challenges.filter(c => c.status === 'active').length,
    userAchievements: achievements.filter(a => a.earned).length,
    totalPoints: achievements.filter(a => a.earned).reduce((sum, a) => sum + a.points, 0),
  };
  
  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Viral Features</h1>
            <p className="text-xs text-muted-foreground">
              Social sharing, challenges, and gamification for platform growth
            </p>
          </div>
          <button className="gradient-indigo rounded-pill px-4 py-2 text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Challenge
          </button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Participants</p>
                <p className="text-xl font-bold text-foreground">{stats.totalParticipants}</p>
              </div>
              <Users className="w-8 h-8 text-indigo/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Challenges</p>
                <p className="text-xl font-bold text-foreground">{stats.activeChallenges}</p>
              </div>
              <Trophy className="w-8 h-8 text-teal/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Your Achievements</p>
                <p className="text-xl font-bold text-foreground">{stats.userAchievements}</p>
              </div>
              <Award className="w-8 h-8 text-amber/50" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">BION Points</p>
                <p className="text-xl font-bold text-foreground">{stats.totalPoints}</p>
              </div>
              <Star className="w-8 h-8 text-purple/50" />
            </div>
          </GlassCard>
        </div>
        
        {/* Active Challenges */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Active Challenges</h3>
                <p className="text-xs text-muted-foreground">Community wellness challenges</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{challenges.length} challenges</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-3">
            {challenges.map(challenge => (
              <div key={challenge.id} className="p-4 glass-1 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo/20 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-6 h-6 text-indigo" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{challenge.name}</p>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{challenge.participants} participants</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Ends: {challenge.endDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`px-2 py-0.5 rounded-full text-xs mb-1 ${
                      challenge.status === 'active' 
                        ? 'bg-teal/20 text-teal' 
                        : 'bg-amber/20 text-amber'
                    }`}>
                      {challenge.status}
                    </div>
                    <p className="text-xs text-muted-foreground">Reward: {challenge.reward}</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-foreground">{challenge.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="flex-1 glass-1 rounded-pill py-2 text-sm font-medium text-foreground">
                    View Details
                  </button>
                  <button className="flex-1 glass-1 rounded-pill py-2 text-sm font-medium text-foreground">
                    Share Challenge
                  </button>
                  <button className="flex-1 gradient-indigo rounded-pill py-2 text-sm font-semibold text-white">
                    Join Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
        
        <div className="grid lg:grid-cols-3 gap-5">
          
          {/* Shareable Progress Cards */}
          <div className="lg:col-span-2">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Shareable Progress Cards</h3>
                    <p className="text-xs text-muted-foreground">Create and share your progress on social media</p>
                  </div>
                </div>
                <button className="glass-1 rounded-pill px-3 py-1.5 text-xs font-medium text-foreground">
                  Create Card
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 glass-1 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Fitness Progress Card</p>
                      <p className="text-xs text-muted-foreground">Share your workout achievements</p>
                    </div>
                    <div className="text-2xl">💪</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="p-2 glass-1 rounded-lg text-center">
                      <p className="text-lg font-bold text-foreground">24</p>
                      <p className="text-xs text-muted-foreground">Workouts</p>
                    </div>
                    <div className="p-2 glass-1 rounded-lg text-center">
                      <p className="text-lg font-bold text-foreground">85kg</p>
                      <p className="text-xs text-muted-foreground">Weight</p>
                    </div>
                    <div className="p-2 glass-1 rounded-lg text-center">
                      <p className="text-lg font-bold text-foreground">+12%</p>
                      <p className="text-xs text-muted-foreground">Strength</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="flex-1 glass-1 rounded-pill py-1.5 text-xs font-medium text-foreground">
                      Customize
                    </button>
                    <button className="flex-1 glass-1 rounded-pill py-1.5 text-xs font-medium text-foreground">
                      Preview
                    </button>
                    <button className="flex-1 gradient-indigo rounded-pill py-1.5 text-xs font-semibold text-white">
                      Share Now
                    </button>
                  </div>
                </div>
                
                <div className="p-4 glass-1 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Wellness Journey Card</p>
                      <p className="text-xs text-muted-foreground">Share your wellness achievements</p>
                    </div>
                    <div className="text-2xl">🧘</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="p-2 glass-1 rounded-lg text-center">
                      <p className="text-lg font-bold text-foreground">30</p>
                      <p className="text-xs text-muted-foreground">Days</p>
                    </div>
                    <div className="p-2 glass-1 rounded-lg text-center">
                      <p className="text-lg font-bold text-foreground">8h</p>
                      <p className="text-xs text-muted-foreground">Sleep Avg</p>
                    </div>
                    <div className="p-2 glass-1 rounded-lg text-center">
                      <p className="text-lg font-bold text-foreground">92%</p>
                      <p className="text-xs text-muted-foreground">Hydration</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="flex-1 glass-1 rounded-pill py-1.5 text-xs font-medium text-foreground">
                      Customize
                    </button>
                    <button className="flex-1 glass-1 rounded-pill py-1.5 text-xs font-medium text-foreground">
                      Preview
                    </button>
                    <button className="flex-1 gradient-indigo rounded-pill py-1.5 text-xs font-semibold text-white">
                      Share Now
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
          
          {/* Achievements & Rewards */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Your Achievements</h3>
                  <p className="text-xs text-muted-foreground">Earn badges and rewards</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {achievements.map(achievement => (
                <div key={achievement.id} className={`p-3 glass-1 rounded-xl ${achievement.earned ? '' : 'opacity-60'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">{achievement.points} BION Points</p>
                      </div>
                    </div>
                    <div>
                      {achievement.earned ? (
                        <CheckCircle className="w-5 h-5 text-teal" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-muted-foreground"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-3 border-t border-white/5">
                <h4 className="text-sm font-semibold text-foreground mb-2">BION Score</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Your Score</span>
                    <span className="font-medium text-foreground">1,250</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Platform Rank</span>
                    <span className="font-medium text-foreground">#42</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Next Level</span>
                    <span className="font-medium text-foreground">250 points</span>
                  </div>
                </div>
              </div>
              
              <button className="w-full gradient-indigo rounded-pill py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2">
                <Gift className="w-4 h-4" />
                Redeem Points
              </button>
            </div>
          </GlassCard>
        </div>
        
        {/* Feature-Gated Viral Analytics */}
        <FeatureGate feature="shareableProgressCards">
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground mb-4">Viral Analytics</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">328</p>
                    <p className="text-xs text-muted-foreground">Shares This Week</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Progress cards shared on social media</p>
              </div>
              
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">+18%</p>
                    <p className="text-xs text-muted-foreground">User Growth</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">From viral features this month</p>
              </div>
              
              <div className="p-4 glass-1 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">4.2x</p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Increase in platform activity</p>
              </div>
            </div>
          </GlassCard>
        </FeatureGate>
        
        <ProviderNav />
      </div>
    </div>
  );
}