#!/usr/bin/env node

/**
 * Check Feature Flags Status
 * Shows which features are enabled/disabled
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 BION Platform Feature Flags Status\n');
console.log('='.repeat(60));

// Read feature flags file
const featureFlagsPath = path.join(__dirname, 'src/lib/featureFlags.ts');
const content = fs.readFileSync(featureFlagsPath, 'utf8');

// Parse feature flags
const featureFlagRegex = /(\w+):\s*{\s*name:\s*'(\w+)',\s*description:\s*'([^']+)',\s*enabled:\s*(true|false),/g;
const flags = [];
let match;

while ((match = featureFlagRegex.exec(content)) !== null) {
  flags.push({
    key: match[1],
    name: match[2],
    description: match[3],
    enabled: match[4] === 'true'
  });
}

// Group by phase
const coreFeatures = flags.filter(f => 
  ['subscriptionSystem', 'bookingPayment', 'publicDirectory'].includes(f.key)
);

const gymProviderFeatures = flags.filter(f => 
  ['providerDashboardV2', 'sessionManagement', 'progressTracking', 'packageBuilder'].includes(f.key)
);

const verticalFeatures = flags.filter(f => 
  ['beautyVertical', 'medicalVertical'].includes(f.key)
);

const viralFeatures = flags.filter(f => 
  ['shareableProgressCards', 'wellnessChallenges'].includes(f.key)
);

// Display status
console.log('🎯 CORE FEATURES (Always Enabled):');
console.log('-'.repeat(40));
coreFeatures.forEach(f => {
  console.log(`  ${f.enabled ? '🟢' : '🔴'} ${f.name}: ${f.description}`);
});

console.log('\n🏋️‍♂️ GYM PROVIDER TOOLS (Phase 1):');
console.log('-'.repeat(40));
gymProviderFeatures.forEach(f => {
  const status = f.enabled ? `🟢 ENABLED (${getRolloutPercentage(content, f.key)}% rollout)` : '🔴 DISABLED';
  console.log(`  ${status}`);
  console.log(`     ${f.name}: ${f.description}`);
});

console.log('\n💅 BEAUTY VERTICAL (Phase 2):');
console.log('-'.repeat(40));
verticalFeatures.filter(f => f.key === 'beautyVertical').forEach(f => {
  const status = f.enabled ? `🟢 ENABLED (${getRolloutPercentage(content, f.key)}% rollout)` : '🔴 DISABLED';
  console.log(`  ${status}`);
  console.log(`     ${f.name}: ${f.description}`);
});

console.log('\n🏥 MEDICAL VERTICAL (Phase 2):');
console.log('-'.repeat(40));
verticalFeatures.filter(f => f.key === 'medicalVertical').forEach(f => {
  const status = f.enabled ? `🟢 ENABLED (${getRolloutPercentage(content, f.key)}% rollout)` : '🔴 DISABLED';
  console.log(`  ${status}`);
  console.log(`     ${f.name}: ${f.description}`);
});

console.log('\n🚀 VIRAL FEATURES (Phase 3):');
console.log('-'.repeat(40));
viralFeatures.forEach(f => {
  const status = f.enabled ? `🟢 ENABLED (${getRolloutPercentage(content, f.key)}% rollout)` : '🔴 DISABLED';
  console.log(`  ${status}`);
  console.log(`     ${f.name}: ${f.description}`);
});

// Summary
console.log('\n📊 SUMMARY:');
console.log('='.repeat(60));

const enabledCount = flags.filter(f => f.enabled).length;
const totalCount = flags.length;

console.log(`Enabled Features: ${enabledCount}/${totalCount}`);
console.log(`Disabled Features: ${totalCount - enabledCount}/${totalCount}`);

// Deployment phase
if (gymProviderFeatures.some(f => f.enabled) && !verticalFeatures.some(f => f.enabled)) {
  console.log('\n🎯 CURRENT PHASE: Phase 1 - Gym Provider Tools Testing');
  console.log('   Next: Increase rollout percentage, then enable Progress Tracking');
} else if (verticalFeatures.some(f => f.enabled)) {
  console.log('\n🎯 CURRENT PHASE: Phase 2 - Vertical Expansion');
  console.log('   Next: Enable Viral Features for growth');
} else if (viralFeatures.some(f => f.enabled)) {
  console.log('\n🎯 CURRENT PHASE: Phase 3 - Viral Growth');
  console.log('   Next: Monitor growth metrics, plan next features');
} else {
  console.log('\n🎯 CURRENT PHASE: Pre-deployment (All features disabled)');
  console.log('   Next: Enable Phase 1 features for testing');
}

console.log('\n🔗 Available Routes:');
console.log('-'.repeat(40));
if (gymProviderFeatures.find(f => f.key === 'providerDashboardV2')?.enabled) {
  console.log('  ✅ /pro/dashboard-v2 - Enhanced Provider Dashboard');
}
if (gymProviderFeatures.find(f => f.key === 'sessionManagement')?.enabled) {
  console.log('  ✅ /pro/session-manager - Session Management');
}
if (gymProviderFeatures.find(f => f.key === 'progressTracking')?.enabled) {
  console.log('  ✅ /pro/progress-tracker - Progress Tracking');
}
if (gymProviderFeatures.find(f => f.key === 'packageBuilder')?.enabled) {
  console.log('  ✅ /pro/package-builder - Package Builder');
}
if (gymProviderFeatures.find(f => f.key === 'providerDashboardV2')?.enabled) {
  console.log('  ✅ /pro/client-crm - Client CRM');
}
if (verticalFeatures.find(f => f.key === 'beautyVertical')?.enabled) {
  console.log('  ✅ /beauty/dashboard - Beauty Dashboard');
}
if (verticalFeatures.find(f => f.key === 'medicalVertical')?.enabled) {
  console.log('  ✅ /medical/dashboard - Medical Dashboard');
}
if (viralFeatures.find(f => f.key === 'shareableProgressCards')?.enabled) {
  console.log('  ✅ /viral-features - Viral Features');
}

console.log('\n🚀 Ready for testing!');

// Helper function to get rollout percentage
function getRolloutPercentage(content, key) {
  const regex = new RegExp(`${key}:\\s*{[^}]+rolloutPercentage:\\s*(\\d+)`, 's');
  const match = content.match(regex);
  return match ? match[1] : '0';
}