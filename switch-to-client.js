#!/usr/bin/env node

/**
 * Switch to Client Account
 * Helps logout from provider and login as client
 */

import { execSync } from 'child_process';

console.log('🔄 Switching to Client Account\n');
console.log('='.repeat(60));

console.log('📋 INSTRUCTIONS TO SWITCH FROM PROVIDER TO CLIENT:');
console.log('-'.repeat(60));

console.log('\n1. 🚪 LOGOUT FROM PROVIDER ACCOUNT:');
console.log('   • Go to: http://localhost:8080/pro/settings');
console.log('   • Look for "Logout" or "Sign Out" button');
console.log('   • Click it to logout');

console.log('\n2. 🔄 ALTERNATIVE: Clear browser storage manually:');
console.log('   • Open browser Developer Tools (F12)');
console.log('   • Go to Console tab');
console.log('   • Paste and run:');
console.log('     localStorage.clear();');
console.log('     sessionStorage.clear();');
console.log('     location.reload();');

console.log('\n3. 👤 LOGIN AS CLIENT:');
console.log('   • After logout, you\'ll see the welcome screen');
console.log('   • Click "I\'m a Client"');
console.log('   • On login screen, click "client" demo button');

console.log('\n4. 🎯 VERIFY CLIENT ACCESS:');
console.log('   • You should see client home page (not provider dashboard)');
console.log('   • Test these client URLs:');
console.log('     • http://localhost:8080/profile');
console.log('     • http://localhost:8080/progress');
console.log('     • http://localhost:8080/viral-features');
console.log('     • http://localhost:8080/challenges');

console.log('\n5. ⚠️ TROUBLESHOOTING:');
console.log('   • If still seeing provider pages, restart browser');
console.log('   • Try incognito/private browsing mode');
console.log('   • Restart the dev server:');
console.log('     cd /Users/mac/Documents/Builds/BION/bio-glass-ui');
console.log('     pkill -f "vite"');
console.log('     npm run dev');

console.log('\n🔍 CHECKING CURRENT APPLICATION STATUS:');
console.log('-'.repeat(40));

try {
  const httpCode = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080', {
    encoding: 'utf8'
  }).trim();
  
  if (httpCode === '200') {
    console.log('✅ Application is running on http://localhost:8080');
    
    // Try to get page title
    try {
      const title = execSync('curl -s http://localhost:8080 | grep -o "<title>[^<]*</title>" | head -1', {
        encoding: 'utf8'
      }).trim();
      console.log(`📄 Current page: ${title}`);
    } catch {
      console.log('📄 Could not determine current page');
    }
  } else {
    console.log(`⚠️ Application returned HTTP ${httpCode}`);
  }
} catch {
  console.log('❌ Application not accessible on port 8080');
  console.log('   Start with: npm run dev');
}

console.log('\n🎯 DEMO CLIENT ACCOUNT DETAILS:');
console.log('-'.repeat(40));
console.log('Name: Oko Mthembu');
console.log('Email: client@bion.app');
console.log('Role: client');
console.log('Subscription: Premium (R100/month features)');

console.log('\n🚀 CLIENT FEATURES AVAILABLE:');
console.log('• Free provider directory browsing');
console.log('• Booking with 5% fee transparency');
console.log('• Progress tracking and photo galleries');
console.log('• Viral features (shareable cards, challenges)');
console.log('• Wellness challenges and BION Score');
console.log('• Health profile and metrics tracking');

console.log('\n🔗 DIRECT CLIENT URLS (after login):');
console.log('http://localhost:8080/              - Client home');
console.log('http://localhost:8080/profile       - Your profile');
console.log('http://localhost:8080/progress      - Progress tracking');
console.log('http://localhost:8080/viral-features - Shareable cards & challenges');
console.log('http://localhost:8080/challenges    - Wellness challenges');
console.log('http://localhost:8080/schedule      - Your bookings');

console.log('\n🎉 Follow the steps above to switch from provider to client account!');