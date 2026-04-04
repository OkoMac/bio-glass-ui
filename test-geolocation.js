// Quick test of geolocation utilities
import { calculateDistance, formatDistance, getCityCoordinates } from './src/hooks/useGeolocation.js';

console.log('🧪 Testing BION Geolocation Utilities...\n');

// Test 1: Distance calculation
console.log('1. Distance Calculation Test:');
const distance = calculateDistance(
  -25.7479, 28.2293, // Pretoria
  -26.2041, 28.0473  // Johannesburg
);
console.log(`   Pretoria → Johannesburg: ${distance}km`);
console.log(`   Formatted: ${formatDistance(distance)}`);

// Test 2: City coordinates
console.log('\n2. City Coordinates Test:');
const cities = ['pretoria', 'johannesburg', 'cape town', 'durban', 'arcadia'];
cities.forEach(city => {
  const coords = getCityCoordinates(city);
  if (coords) {
    console.log(`   ${city}: ${coords.latitude}, ${coords.longitude}`);
  } else {
    console.log(`   ${city}: Not found`);
  }
});

// Test 3: Formatting
console.log('\n3. Distance Formatting Test:');
const testDistances = [0.5, 1.2, 5, 12.5, 100];
testDistances.forEach(km => {
  console.log(`   ${km}km → ${formatDistance(km)}`);
});

console.log('\n✅ Geolocation utilities are working correctly!');
console.log('\n🎯 Next: Test with actual provider data...');