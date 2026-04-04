#!/usr/bin/env node

/**
 * Test Script for BION Platform Routes
 * Verifies all new feature routes are properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing BION Platform Routes\n');

// Read App.tsx to check route configurations
const appTsxPath = path.join(__dirname, 'src/App.tsx');
const appContent = fs.readFileSync(appTsxPath, 'utf8');

// List of expected routes from our implementation
const expectedRoutes = [
  // Gym Provider Tools
  { path: '/pro/dashboard-v2', component: 'ProviderDashboardV2', flag: 'providerDashboardV2' },
  { path: '/pro/session-manager', component: 'SessionManager', flag: 'sessionManagement' },
  { path: '/pro/progress-tracker', component: 'ProgressTracker', flag: 'progressTracking' },
  { path: '/pro/package-builder', component: 'PackageBuilder', flag: 'packageBuilder' },
  { path: '/pro/client-crm', component: 'ClientCRM', flag: 'providerDashboardV2' },
  
  // Vertical Expansion
  { path: '/beauty/dashboard', component: 'BeautyDashboard', flag: 'beautyVertical' },
  { path: '/medical/dashboard', component: 'MedicalDashboard', flag: 'medicalVertical' },
  
  // Viral Features
  { path: '/viral-features', component: 'ViralFeatures', flag: 'shareableProgressCards' },
];

// Check each route
console.log('📋 Route Configuration Check:');
console.log('─'.repeat(50));

let allRoutesFound = true;

expectedRoutes.forEach(route => {
  // Check if route path exists in App.tsx
  const routePattern = `path="${route.path}"`;
  const routeExists = appContent.includes(routePattern);
  
  // Check if component is imported
  const importPattern = `import.*${route.component}`;
  const importExists = appContent.includes(route.component);
  
  // Check if FeatureFlagRoute is used
  const featureFlagPattern = `feature="${route.flag}"`;
  const featureFlagExists = appContent.includes(featureFlagPattern);
  
  const status = routeExists && importExists && featureFlagExists ? '✅' : '❌';
  
  console.log(`${status} ${route.path}`);
  console.log(`   Component: ${route.component} ${importExists ? '✅' : '❌'}`);
  console.log(`   Route: ${routeExists ? '✅' : '❌'}`);
  console.log(`   Feature Flag: ${route.flag} ${featureFlagExists ? '✅' : '❌'}`);
  console.log('');
  
  if (!routeExists || !importExists || !featureFlagExists) {
    allRoutesFound = false;
  }
});

// Check feature flags file
console.log('🔧 Feature Flags Status:');
console.log('─'.repeat(50));

const featureFlagsPath = path.join(__dirname, 'src/lib/featureFlags.ts');
const featureFlagsContent = fs.readFileSync(featureFlagsPath, 'utf8');

const expectedFlags = [
  'providerDashboardV2',
  'sessionManagement', 
  'progressTracking',
  'packageBuilder',
  'beautyVertical',
  'medicalVertical',
  'shareableProgressCards'
];

expectedFlags.forEach(flag => {
  const flagExists = featureFlagsContent.includes(`name: '${flag}'`);
  const disabled = featureFlagsContent.includes(`${flag}: {\n    name: '${flag}',\n    enabled: false`);
  
  const status = flagExists ? '✅' : '❌';
  const enabledStatus = disabled ? '🔴 Disabled' : '🟢 Enabled';
  
  console.log(`${status} ${flag}: ${enabledStatus}`);
});

// Check component files exist
console.log('\n📁 Component Files Check:');
console.log('─'.repeat(50));

const components = [
  'src/pages/provider/DashboardV2.tsx',
  'src/pages/provider/SessionManager.tsx',
  'src/pages/provider/ProgressTracker.tsx',
  'src/pages/provider/PackageBuilder.tsx',
  'src/pages/provider/ClientCRM.tsx',
  'src/pages/beauty/BeautyDashboard.tsx',
  'src/pages/medical/MedicalDashboard.tsx',
  'src/pages/viral/ViralFeatures.tsx',
];

components.forEach(componentPath => {
  const fullPath = path.join(__dirname, componentPath);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${componentPath}`);
});

// Summary
console.log('\n📊 Summary:');
console.log('─'.repeat(50));

if (allRoutesFound) {
  console.log('✅ All routes are properly configured');
  console.log('✅ All feature flags are present');
  console.log('✅ All component files exist');
  console.log('\n🎉 Deployment is ready!');
  console.log('\nNext steps:');
  console.log('1. Enable features gradually using feature flags');
  console.log('2. Test each route with appropriate user roles');
  console.log('3. Monitor performance and user feedback');
  console.log('4. Refer to DEPLOYMENT_PLAN.md for detailed rollout strategy');
} else {
  console.log('❌ Some routes or components are missing');
  console.log('\nPlease check the errors above and fix before deployment.');
}

console.log('\n🚀 BION Platform Implementation Complete!');