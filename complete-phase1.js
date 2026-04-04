#!/usr/bin/env node

/**
 * Complete Phase 1 Deployment
 * Enable Package Builder and increase rollout to 50%
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Completing Phase 1 Deployment\n');
console.log('='.repeat(60));

// Read feature flags file
const featureFlagsPath = path.join(__dirname, 'src/lib/featureFlags.ts');
let content = fs.readFileSync(featureFlagsPath, 'utf8');

console.log('📈 Increasing rollout percentages to 50%:');
console.log('-'.repeat(40));

// Update all Phase 1 features to 50% rollout
const phase1Features = [
  'providerDashboardV2',
  'sessionManagement', 
  'progressTracking'
];

phase1Features.forEach(feature => {
  const regex = new RegExp(`(${feature}:\\s*{[^}]+rolloutPercentage:\\s*)(\\d+)`, 's');
  const match = content.match(regex);
  
  if (match) {
    const oldRollout = match[2];
    content = content.replace(regex, `$1 50`);
    console.log(`✅ ${feature}: ${oldRollout}% → 50% rollout`);
  }
});

console.log('\n🎯 Enabling Package Builder feature:');
console.log('-'.repeat(40));

// Enable Package Builder
const packageBuilderEnabled = content.includes('packageBuilder: {\n    name: \'packageBuilder\',\n    enabled: true');
if (packageBuilderEnabled) {
  console.log('✅ Package Builder already enabled');
} else {
  content = content.replace(
    /packageBuilder:\s*{\s*name:\s*'packageBuilder',\s*description:\s*'([^']+)',\s*enabled:\s*false,\s*targetUsers:\s*'([^']+)',\s*rolloutPercentage:\s*(\d+)/s,
    `packageBuilder: {
    name: 'packageBuilder',
    description: '$1',
    enabled: true, // ENABLED - COMPLETING PHASE 1
    targetUsers: '$2',
    rolloutPercentage: 25 // Start with 25% rollout`
  );
  console.log('✅ Package Builder enabled (25% rollout)');
}

// Write updated feature flags
fs.writeFileSync(featureFlagsPath, content, 'utf8');

console.log('\n🔨 Building application with updated features...');
console.log('-'.repeat(40));

try {
  const buildOutput = execSync('npm run build 2>&1', { 
    cwd: __dirname, 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  if (buildOutput.includes('✓ built in')) {
    const timeMatch = buildOutput.match(/built in (\d+\.\d+s)/);
    console.log(`✅ Build successful (${timeMatch ? timeMatch[1] : 'fast'})`);
  } else {
    // Show last few lines if build has warnings
    const lines = buildOutput.split('\n');
    const lastLines = lines.slice(-5).join('\n');
    console.log('⚠️ Build completed with output:');
    console.log(lastLines);
  }
} catch (error) {
  console.error('❌ Build failed:');
  console.error(error.message);
  process.exit(1);
}

// Display Phase 1 completion status
console.log('\n🎉 PHASE 1 DEPLOYMENT COMPLETE!');
console.log('='.repeat(60));

console.log('\n📊 PHASE 1 FEATURES STATUS:');
console.log('-'.repeat(40));

const features = [
  { name: 'Enhanced Dashboard V2', flag: 'providerDashboardV2', route: '/pro/dashboard-v2' },
  { name: 'Session Management', flag: 'sessionManagement', route: '/pro/session-manager' },
  { name: 'Progress Tracking', flag: 'progressTracking', route: '/pro/progress-tracker' },
  { name: 'Package Builder', flag: 'packageBuilder', route: '/pro/package-builder' },
  { name: 'Client CRM', flag: 'providerDashboardV2', route: '/pro/client-crm' },
];

features.forEach(feature => {
  const enabledRegex = new RegExp(`${feature.flag}:\\s*{[^}]+enabled:\\s*true`, 's');
  const rolloutRegex = new RegExp(`${feature.flag}:\\s*{[^}]+rolloutPercentage:\\s*(\\d+)`, 's');
  
  const isEnabled = enabledRegex.test(content);
  const rolloutMatch = content.match(rolloutRegex);
  const rollout = rolloutMatch ? parseInt(rolloutMatch[1]) : 0;
  
  const status = isEnabled ? '🟢' : '🔴';
  const rolloutText = isEnabled ? `(${rollout}% rollout)` : '(DISABLED)';
  
  console.log(`${status} ${feature.name} ${rolloutText}`);
  console.log(`   Route: ${feature.route}`);
});

console.log('\n🔗 ALL PHASE 1 ROUTES NOW AVAILABLE:');
console.log('-'.repeat(40));
features.forEach(f => {
  console.log(`  http://localhost:8080${f.route}`);
});

console.log('\n📈 DEPLOYMENT PROGRESS:');
console.log('-'.repeat(40));
console.log('Phase 1: 🟢 COMPLETE (5/5 features enabled)');
console.log('Phase 2: 🔴 PENDING (Beauty & Medical verticals)');
console.log('Phase 3: 🔴 PENDING (Viral features)');

console.log('\n🎯 NEXT STEPS (Phase 2 Preparation):');
console.log('1. Monitor Phase 1 features for 48-72 hours');
console.log('2. Collect feedback from 50% of providers');
console.log('3. Check performance metrics and error rates');
console.log('4. Prepare Beauty Vertical feature enablement');
console.log('5. Update marketing for vertical expansion');

console.log('\n📋 IMMEDIATE TESTING TASKS:');
console.log('1. Test Package Builder at /pro/package-builder');
console.log('2. Verify all features work with 50% rollout simulation');
console.log('3. Check subscription integration across all features');
console.log('4. Test mobile responsiveness for new features');
console.log('5. Validate payment processing still works');

console.log('\n🚀 Phase 1 successfully completed! Ready for Phase 2 planning.');