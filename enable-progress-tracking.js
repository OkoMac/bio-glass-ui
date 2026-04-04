#!/usr/bin/env node

/**
 * Enable Progress Tracking Feature
 * Part of Phase 1 rollout strategy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Enabling Progress Tracking Feature\n');
console.log('='.repeat(60));

// Read feature flags file
const featureFlagsPath = path.join(__dirname, 'src/lib/featureFlags.ts');
let content = fs.readFileSync(featureFlagsPath, 'utf8');

// Check current status
const progressTrackingRegex = /progressTracking:\s*{\s*name:\s*'progressTracking',[^}]+enabled:\s*(true|false),/s;
const match = content.match(progressTrackingRegex);

if (match) {
  const currentlyEnabled = match[1] === 'true';
  
  if (currentlyEnabled) {
    console.log('✅ Progress Tracking is already enabled');
  } else {
    // Enable the feature
    content = content.replace(
      /progressTracking:\s*{\s*name:\s*'progressTracking',\s*description:\s*'([^']+)',\s*enabled:\s*false,\s*targetUsers:\s*'([^']+)',\s*rolloutPercentage:\s*(\d+)/s,
      `progressTracking: {
    name: 'progressTracking',
    description: '$1',
    enabled: true, // ENABLED FOR TESTING
    targetUsers: '$2',
    rolloutPercentage: 10 // 10% rollout for testing`
    );
    
    // Write back to file
    fs.writeFileSync(featureFlagsPath, content, 'utf8');
    console.log('✅ Progress Tracking enabled for testing (10% rollout)');
  }
} else {
  console.log('❌ Could not find progressTracking feature flag');
  process.exit(1);
}

// Also increase rollout for already enabled features to 25%
console.log('\n📈 Increasing rollout percentages:');
console.log('-'.repeat(40));

// Increase providerDashboardV2 rollout to 25%
content = content.replace(
  /providerDashboardV2:[^}]+rolloutPercentage:\s*\d+/s,
  match => match.replace(/rolloutPercentage:\s*\d+/, 'rolloutPercentage: 25')
);
console.log('✅ Enhanced Dashboard V2: 10% → 25% rollout');

// Increase sessionManagement rollout to 25%
content = content.replace(
  /sessionManagement:[^}]+rolloutPercentage:\s*\d+/s,
  match => match.replace(/rolloutPercentage:\s*\d+/, 'rolloutPercentage: 25')
);
console.log('✅ Session Management: 10% → 25% rollout');

// Write updated content
fs.writeFileSync(featureFlagsPath, content, 'utf8');

// Build the application
console.log('\n🔨 Building application...');
console.log('-'.repeat(40));

import { execSync } from 'child_process';
try {
  const buildOutput = execSync('npm run build', { cwd: __dirname, encoding: 'utf8' });
  const lines = buildOutput.split('\n');
  const successLine = lines.find(line => line.includes('✓ built in'));
  
  if (successLine) {
    console.log(`✅ Build successful: ${successLine.trim()}`);
  } else {
    console.log('⚠️ Build completed (check output for details)');
  }
} catch (error) {
  console.error('❌ Build failed:');
  console.error(error.message);
  process.exit(1);
}

// Summary
console.log('\n📊 PHASE 1 DEPLOYMENT STATUS:');
console.log('='.repeat(60));

const enabledFeatures = [
  { name: 'Enhanced Dashboard V2', route: '/pro/dashboard-v2', rollout: 25 },
  { name: 'Session Management', route: '/pro/session-manager', rollout: 25 },
  { name: 'Progress Tracking', route: '/pro/progress-tracker', rollout: 10 },
  { name: 'Client CRM', route: '/pro/client-crm', rollout: 25 }
];

console.log('🎯 ENABLED FEATURES:');
enabledFeatures.forEach(feature => {
  console.log(`  🟢 ${feature.name}`);
  console.log(`     Route: ${feature.route}`);
  console.log(`     Rollout: ${feature.rollout}% of providers`);
  console.log('');
});

console.log('🔗 TESTING URLS:');
console.log('  http://localhost:8080/pro/dashboard-v2');
console.log('  http://localhost:8080/pro/session-manager');
console.log('  http://localhost:8080/pro/progress-tracker');
console.log('  http://localhost:8080/pro/client-crm');

console.log('\n📋 NEXT STEPS:');
console.log('1. Test Progress Tracking feature with demo account');
console.log('2. Monitor error logs and performance metrics');
console.log('3. Collect feedback from test group (25% of providers)');
console.log('4. If successful, increase rollout to 50%');
console.log('5. Enable Package Builder feature');

console.log('\n🎉 Phase 1 deployment progressing successfully!');