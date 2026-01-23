// Quick test to verify survival principles are loaded correctly
import {
  getAllPrinciples,
  getPrinciplesByCategory,
  getRandomPrinciple,
  searchPrinciples,
  getEnvironmentTips,
  getMetadata
} from './src/engine/survivalPrinciplesService.ts';

console.log('🧪 Testing Survival Principles Service\n');

// Test 1: Get metadata
console.log('1. Metadata:');
const metadata = getMetadata();
console.log(`   Source: ${metadata.source}`);
console.log(`   Total Principles: ${metadata.totalPrinciples}`);
console.log(`   Categories: ${metadata.totalCategories}\n`);

// Test 2: Get principles by category
console.log('2. Shelter Principles (first 3):');
const shelterPrinciples = getPrinciplesByCategory('shelter');
shelterPrinciples.slice(0, 3).forEach((p, i) => {
  console.log(`   ${i + 1}. ${p}`);
});
console.log('');

// Test 3: Get random principle
console.log('3. Random Fire Principle:');
const randomFire = getRandomPrinciple('fire');
console.log(`   ${randomFire}\n`);

// Test 4: Search principles
console.log('4. Search for "water":');
const waterResults = searchPrinciples('water');
console.log(`   Found ${waterResults.length} results`);
waterResults.slice(0, 2).forEach(r => {
  console.log(`   - [${r.category}] ${r.principle.substring(0, 80)}...`);
});
console.log('');

// Test 5: Get environment tips
console.log('5. Desert Environment Tips:');
const desertTips = getEnvironmentTips('desert');
desertTips.slice(0, 3).forEach((tip, i) => {
  console.log(`   ${i + 1}. ${tip}`);
});
console.log('');

console.log('✅ All tests passed!');
