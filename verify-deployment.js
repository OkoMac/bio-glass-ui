#!/usr/bin/env node

/**
 * Verify Phase 1 Deployment
 * Checks that enabled features are working correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Phase 1 Deployment\n');
console.log('='.repeat(60));

// Check 1: Application is running
console.log('1. Checking application status...');
try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080', {
    encoding: 'utf8'
  }).trim();
  
  if (response === '200') {
    console.log('   ✅ Application running on port 8080');
  } else {
    console.log(`   ⚠️ Application returned HTTP ${response}`);
  }
} catch (error) {
  console.log('   ❌ Application not running on port 8080');
  console.log('   Start with: npm run dev');
}

// Check 2: Build status
console.log('\n2. Checking build status...');
try {
  const buildCheck = execSync('npm run build 2>&1 | tail -3', {
    cwd: __dirname,
    encoding: 'utf8'
  });
  
  if (buildCheck.includes('✓ built in')) {
    const timeMatch = buildCheck.match(/built in (\d+\.\d+s)/);
    console.log(`   ✅ Build successful (${timeMatch ? timeMatch[1] : 'fast'})`);
  } else {
    console.log('   ⚠️ Build may have warnings');
    console.log(buildCheck);
  }
} catch (error) {
  console.log('   ❌ Build failed');
}

// Check 3: Feature flags
console.log('\n3. Checking feature flags...');
const featureFlagsPath = path.join(__dirname, 'src/lib/featureFlags.ts');
const content = fs.readFileSync(featureFlagsPath, 'utf8');

const phase1Features = [
  { key: 'providerDashboardV2', name: 'Enhanced Dashboard V2', minRollout: 10 },
  { key: 'sessionManagement', name: 'Session Management', minRollout: 10 },
  { key: 'progressTracking', name: 'Progress Tracking', minRollout: 10 },
];

let allFeaturesEnabled = true;

phase1Features.forEach(feature => {
  const enabledRegex = new RegExp(`${feature.key}:\\s*{[^}]+enabled:\\s*true`, 's');
  const rolloutRegex = new RegExp(`${feature.key}:\\s*{[^}]+rolloutPercentage:\\s*(\\d+)`, 's');
  
  const isEnabled = enabledRegex.test(content);
  const rolloutMatch = content.match(rolloutRegex);
  const rollout = rolloutMatch ? parseInt(rolloutMatch[1]) : 0;
  
  if (isEnabled && rollout >= feature.minRollout) {
    console.log(`   ✅ ${feature.name}: Enabled (${rollout}% rollout)`);
  } else if (isEnabled) {
    console.log(`   ⚠️ ${feature.name}: Enabled but low rollout (${rollout}%)`);
    allFeaturesEnabled = false;
  } else {
    console.log(`   ❌ ${feature.name}: Disabled`);
    allFeaturesEnabled = false;
  }
});

// Check 4: Route files exist
console.log('\n4. Checking route components...');
const requiredComponents = [
  'src/pages/provider/DashboardV2.tsx',
  'src/pages/provider/SessionManager.tsx',
  'src/pages/provider/ProgressTracker.tsx',
  'src/pages/provider/ClientCRM.tsx',
];

let allComponentsExist = true;
requiredComponents.forEach(component => {
  const fullPath = path.join(__dirname, component);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${component}`);
  } else {
    console.log(`   ❌ ${component} - Missing`);
    allComponentsExist = false;
  }
});

// Check 5: App.tsx routes configured
console.log('\n5. Checking route configurations...');
const appTsxPath = path.join(__dirname, 'src/App.tsx');
const appContent = fs.readFileSync(appTsxPath, 'utf8');

const requiredRoutes = [
  '/pro/dashboard-v2',
  '/pro/session-manager',
  '/pro/progress-tracker',
  '/pro/client-crm',
];

let allRoutesConfigured = true;
requiredRoutes.forEach(route => {
  if (appContent.includes(`path="${route}"`)) {
    console.log(`   ✅ Route ${route}`);
  } else {
    console.log(`   ❌ Route ${route} - Not configured`);
    allRoutesConfigured = false;
  }
});

// Summary
console.log('\n📊 DEPLOYMENT VERIFICATION SUMMARY:');
console.log('='.repeat(60));

const checks = [
  { name: 'Application Running', passed: true }, // We'll update based on curl
  { name: 'Build Successful', passed: true }, // We'll update based on build
  { name: 'Phase 1 Features Enabled', passed: allFeaturesEnabled },
  { name: 'Component Files Exist', passed: allComponentsExist },
  { name: 'Routes Configured', passed: allRoutesConfigured },
];

// Update first two checks
try {
  execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080', { stdio: 'ignore' });
  checks[0].passed = true;
} catch {
  checks[0].passed = false;
}

try {
  execSync('npm run build 2>&1 | grep -q "✓ built in"', { cwd: __dirname, stdio: 'ignore' });
  checks[1].passed = true;
} catch {
  checks[1].passed = false;
}

checks.forEach(check => {
  console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}`);
});

const passedChecks = checks.filter(c => c.passed).length;
const totalChecks = checks.length;

console.log(`\n🎯 Result: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 PHASE 1 DEPLOYMENT VERIFIED SUCCESSFULLY!');
  console.log('\n🔗 Testing URLs:');
  console.log('   http://localhost:8080/pro/dashboard-v2');
  console.log('   http://localhost:8080/pro/session-manager');
  console.log('   http://localhost:8080/pro/progress-tracker');
  console.log('   http://localhost:8080/pro/client-crm');
  console.log('\n📋 Next: Test features with demo account, monitor for 24h');
} else {
  console.log('\n⚠️ DEPLOYMENT NEEDS ATTENTION');
  console.log('\nPlease fix the issues above before proceeding.');
}

console.log('\n🚀 Deployment verification complete.');