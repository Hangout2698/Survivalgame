const fs = require('fs');
const path = require('path');

// Filter criteria for clean principles
function isPrincipleClean(principle) {
  // Must be string
  if (typeof principle !== 'string') return false;

  // Length requirements (20-200 characters)
  if (principle.length < 20 || principle.length > 200) return false;

  // Must start with capital letter
  if (!/^[A-Z]/.test(principle)) return false;

  // No page numbers like "-- 5 of 376 --"
  if (/--\s*\d+\s+of\s+\d+\s*--/.test(principle)) return false;

  // No excessive dashes
  if (principle.includes('--')) return false;

  // Must have more than 3 words
  if (principle.split(' ').length <= 3) return false;

  // No trailing ellipsis
  if (/\.{3}$/.test(principle)) return false;

  // Must end with proper punctuation
  if (!principle.endsWith('.') && !principle.endsWith('!') && !principle.endsWith('?')) return false;

  // No repeated long strings (PDF artifacts like duplicated text)
  const words = principle.split(' ');
  const midpoint = Math.floor(words.length / 2);
  if (words.length > 10) {
    const firstHalf = words.slice(0, midpoint).join(' ');
    const secondHalf = words.slice(midpoint).join(' ');
    if (firstHalf === secondHalf) return false; // Exact repetition
  }

  // No chapter/section headers (e.g., "5 - CAMP CRAFT")
  if (/^\d+\s*-\s*[A-Z\s]+$/i.test(principle)) return false;

  // No fragments that are clearly mid-sentence
  if (principle.startsWith('and ') || principle.startsWith('or ') ||
      principle.startsWith('but ') || principle.startsWith('so ')) return false;

  // Check for common PDF artifacts
  const artifacts = [
    'of 376',
    'circumstances; soldiers',
    'to take everything possible',
    'The main elements of survival are Food, Fire, Shelter, Water',
    'from the elements. This means',
    'Local methods of',
    'Clothing should give',
    'sack to prevent',
    'fats, proteins and carbohydrates',
    'hazardous to the survivor',
    'understanding of survival needs',
    'While waiting to be rescued',
    'terrain as possible',
    'for things going wrong',
    'travel. Water sources',
    'jersey if it turns',
    'there is a danger',
    'waterproofs if you are',
    'gets colder they',
    'Finally, choose a pack',
    'electrical kit water',
    'species of animals',
    'that you can light a fire',
    'fire is safe before',
    'You must ensure',
    'provide our bodies',
    'the polar regions',
    'been a danger',
    'As for natural fabrics',
    'lightest of all natural',
    'It is much easier to use matches',
    'Invaluable for starting',
    'Can start a fire from direct',
    'and screw on to',
    'heat loss. Although wet',
    'your belt or on',
    'onto the ground',
    'tests for plant foods',
    'can be very dangerous to some',
    'traps what the body',
    'secure zips rather',
    'foodstuffs that can',
    'others: fish hooks',
    'inedible. Tallow',
    'Fish hooks and line',
    'will catch both',
    'Fat is the hardest',
    'very good in flavour',
    'food. There are always',
    'temperature—not just',
    'The still may also',
    'and keep cone',
    'The Barrel cactus',
    'tin, knife, compass',
    'cards, navigating',
    'Study your maps',
    'unless you can identify',
    'to confirm your',
    'Most have the facility',
    'When planning your route',
    'a small coin',
    'animals and preparing',
    'handle breaking',
    'found in the southern',
    'Desert animals can',
    'Salt can be obtained',
    'Navigation Navigation',
    'Leave an indication',
    'rescuers to know',
    '10 - RESCUE',
    'their rescue. In areas',
    'may find you',
    '5 Because you have',
    'Do this as soon',
    'clear signal you need',
    'Prearrange a signals',
    'Signals will be weak',
    'know where you last',
    'make your call',
    'but not the receiving',
    'the pouch contains',
    'Signaling in Rescue',
    'themselves dangerous',
    'Don\'t smoke',
    'on. If there is an emergency',
    'misuse of any techniques',
    'replaced by wind',
    'Use to hold together',
    'butterfly sutures',
    '– Pain, illness',
    'to avoid the risk',
    'individual deal first',
    'made by kissing',
    'Frostbite, hypothermia',
    'Be careful that your rope',
    'Handle carefully. Their spines',
    'bites are not enough',
    'incapacitate—wounded',
    'provocation to charge',
    'bumbling—easily',
    'spinach; use their',
    'Produced by Essential',
    'principles form an essential',
    'and capabilities',
    'It is essential that you use',
    'ESSENTIALS',
    'of priority we use',
    'schedules. Have a priority',
    'must be given priority',
    'Anti-malaria tablets',
    'How long can the body',
    'immediate treatment',
    'on all animals except',
    'therefore essential',
    'The advice given here',
    'mental exercise',
    'Equally important',
    'There is nothing like',
    'The survival situation',
    'rationally and realistically',
    'develop and that is',
    'which can knock you',
    'feeling of loneliness',
    'Climb to the highest',
    'Overcome your fear',
    '7 Millets',
    'However, when alarmed',
    'First taking the bait',
    'morale for the single',
    'Not only should everyone',
    'ensure that each and every',
    'important, therefore',
    'You could be isolated',
    'This is the firm foundation',
    '– What special equipment',
    'cold climates. At least',
    'and mountains, and what',
    'kind of vegetation',
    'The wind and rain',
    'windproof garments',
    'comfortable to walk',
    'act like an animal',
    'inside. When wet',
    'wick and draws',
    'back, which quickly',
    'easily carried there'
  ];

  for (const artifact of artifacts) {
    if (principle.includes(artifact)) return false;
  }

  return true;
}

// Read the original file
const inputPath = path.join(__dirname, '../src/data/survivalPrinciples.json');
const outputPath = path.join(__dirname, '../src/data/survivalPrinciples.json.backup');

console.log('Reading survival principles...');
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Backup original file
console.log('Creating backup...');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

// Clean each category
const cleaned = {
  metadata: {
    ...data.metadata,
    extractedAt: new Date().toISOString(),
    cleanedAt: new Date().toISOString(),
    cleaningNote: 'Filtered PDF artifacts using automated script'
  },
  principles: {}
};

let totalOriginal = 0;
let totalCleaned = 0;

console.log('\nCleaning principles by category:');
for (const [category, principles] of Object.entries(data.principles)) {
  const originalCount = principles.length;
  const cleanedPrinciples = principles.filter(isPrincipleClean);
  const cleanedCount = cleanedPrinciples.length;

  cleaned.principles[category] = cleanedPrinciples;

  totalOriginal += originalCount;
  totalCleaned += cleanedCount;

  const percentage = Math.round((cleanedCount / originalCount) * 100);
  console.log(`  ${category}: ${originalCount} → ${cleanedCount} (${percentage}% retained)`);
}

// Update metadata
cleaned.metadata.totalPrinciples = totalCleaned;

console.log(`\nTotal: ${totalOriginal} → ${totalCleaned} principles`);
console.log(`Removed: ${totalOriginal - totalCleaned} noisy principles`);

// Write cleaned data
console.log('\nWriting cleaned data...');
fs.writeFileSync(inputPath, JSON.stringify(cleaned, null, 2));

console.log('✓ Done! Original backed up to survivalPrinciples.json.backup');

// Show borderline cases for manual review
console.log('\n--- BORDERLINE CASES FOR MANUAL REVIEW ---');
console.log('(Principles between 15-19 characters or missing punctuation)\n');

for (const [category, principles] of Object.entries(data.principles)) {
  const borderline = principles.filter(p => {
    if (typeof p !== 'string') return false;
    const length = p.length;
    const hasPunctuation = p.endsWith('.') || p.endsWith('!') || p.endsWith('?');
    return (length >= 15 && length < 20) || (!hasPunctuation && length >= 20 && length <= 200);
  }).slice(0, 3); // Show max 3 per category

  if (borderline.length > 0) {
    console.log(`${category}:`);
    borderline.forEach(p => console.log(`  - "${p}"`));
    console.log();
  }
}
