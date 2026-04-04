#!/usr/bin/env node

/**
 * Access Client UI on BION Platform
 * You're seeing provider UI because you're logged in as a provider.
 * This script helps you access the client UI.
 */

console.log('🎯 ACCESSING CLIENT UI ON BION PLATFORM');
console.log('='.repeat(60));
console.log('\nPROBLEM: You\'re seeing PROVIDER UI (dashboard, session manager, etc.)');
console.log('REASON: You\'re logged in as a PROVIDER (James Okafor)');
console.log('SOLUTION: Logout and login as CLIENT (Oko Mthembu)\n');

console.log('📋 STEP-BY-STEP SOLUTION:');
console.log('-'.repeat(40));

console.log('\n1. 🚪 LOGOUT FROM PROVIDER ACCOUNT:');
console.log('   • Go to: http://localhost:8080/pro/settings');
console.log('   • Look for "Logout" or "Sign Out" button');
console.log('   • Click it to logout');

console.log('\n2. 🔄 QUICK FIX (Browser Console):');
console.log('   • Open Developer Tools (F12)');
console.log('   • Go to Console tab');
console.log('   • Paste and run:');
console.log('     localStorage.clear();');
console.log('     sessionStorage.clear();');
console.log('     location.reload();');

console.log('\n3. 👤 LOGIN AS CLIENT:');
console.log('   • After logout, you\'ll see the welcome screen');
console.log('   • Click "I\'m a Client"');
console.log('   • On login screen, click "client" demo button');

console.log('\n4. 🎯 VERIFY CLIENT UI:');
console.log('   • You should see CLIENT HOME PAGE (not provider dashboard)');
console.log('   • Test these CLIENT URLs:');
console.log('     • http://localhost:8080/              - Client home');
console.log('     • http://localhost:8080/profile       - Your profile');
console.log('     • http://localhost:8080/progress      - Progress tracking');
console.log('     • http://localhost:8080/viral-features - Shareable cards & challenges');
console.log('     • http://localhost:8080/challenges    - Wellness challenges');

console.log('\n🔗 DIFFERENT UIs AVAILABLE ON BION:');
console.log('-'.repeat(40));

console.log('\n👤 CLIENT UI (General Users):');
console.log('• Home Page: Public directory of providers');
console.log('• Profile: Client profile management');
console.log('• Progress: Health/fitness tracking');
console.log('• Viral Features: Shareable cards, challenges');
console.log('• Challenges: Wellness challenges');
console.log('• Schedule: Client bookings');
console.log('• Wallet: Client payment wallet');

console.log('\n🏋️ PROVIDER UI (Service Providers):');
console.log('• Dashboard: Provider analytics');
console.log('• Session Manager: Class/session management');
console.log('• Progress Tracker: Client progress tracking');
console.log('• Package Builder: Session bundles');
console.log('• Client CRM: Advanced client management');
console.log('• Billing: Subscription management');

console.log('\n💅 BEAUTY VERTICAL UI:');
console.log('• Beauty Dashboard: Hair formulas, skin profiles');

console.log('\n🏥 MEDICAL VERTICAL UI:');
console.log('• Medical Dashboard: SOAP notes, prescriptions');

console.log('\n🎯 DEMO ACCOUNTS:');
console.log('-'.repeat(40));
console.log('👤 CLIENT: Oko Mthembu (client@bion.app)');
console.log('🏋️ PROVIDER: James Okafor (provider@bion.app)');
console.log('👑 ADMIN: Admin (admin@bion.app)');
console.log('🏢 CORPORATE: Capitec HR (corporate@bion.app)');

console.log('\n🚨 WHY YOU SEE PROVIDER UI:');
console.log('-'.repeat(40));
console.log('The application routes based on your role:');
console.log('• If provider → /pro/dashboard (provider UI)');
console.log('• If client → / (client home page)');
console.log('• If admin → /admin/dashboard');
console.log('• If corporate → /corporate/dashboard');
console.log('\nYou\'re logged in as a provider, so you see provider UI.');

console.log('\n🔧 TECHNICAL CHECK:');
console.log('-'.repeat(40));

import { execSync } from 'child_process';

try {
  const httpCode = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080', {
    encoding: 'utf8'
  }).trim();
  
  if (httpCode === '200') {
    console.log('✅ BION application is running on http://localhost:8080');
    
    // Try to detect current page
    try {
      const title = execSync('curl -s http://localhost:8080 | grep -o "<title>[^<]*</title>" | head -1', {
        encoding: 'utf8'
      }).trim();
      console.log(`📄 Current page title: ${title}`);
      
      // Check if it's a provider page
      const isProvider = execSync('curl -s http://localhost:8080 | grep -o "pro/" | head -1', {
        encoding: 'utf8'
      }).trim();
      
      if (isProvider) {
        console.log('🔍 Detected: You\'re on a PROVIDER page');
        console.log('   This confirms you\'re logged in as a provider.');
      }
    } catch {
      console.log('📄 Could not determine current page details');
    }
  } else {
    console.log(`⚠️ Application returned HTTP ${httpCode}`);
  }
} catch {
  console.log('❌ Application not accessible on port 8080');
  console.log('   Start with: cd /Users/mac/Documents/Builds/BION/bio-glass-ui && npm run dev');
}

console.log('\n🎉 FOLLOW THE STEPS ABOVE TO ACCESS CLIENT UI!');
console.log('\nOnce logged in as client, you\'ll see:');
console.log('• Public directory of Pretoria service providers');
console.log('• Your client profile and progress tracking');
console.log('• Viral features (shareable cards, challenges)');
console.log('• All 8 new features enabled (but client-appropriate ones)');