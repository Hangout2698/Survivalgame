import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_FILES = [
  '../survival-reference/SAS Survival Handbook_compressed-1-376.pdf',
  '../survival-reference/SAS Survival Handbook_compressed-377-752.pdf'
];

const OUTPUT_FILE = '../src/data/survivalPrinciples.json';

// Keywords to identify different survival topics
const TOPIC_KEYWORDS = {
  shelter: ['shelter', 'refuge', 'protection', 'camp', 'bivouac', 'tent'],
  water: ['water', 'hydration', 'dehydration', 'purification', 'drinking'],
  fire: ['fire', 'warmth', 'heat', 'ignition', 'tinder', 'kindling'],
  food: ['food', 'edible', 'hunting', 'foraging', 'fish', 'trap', 'snare'],
  navigation: ['navigation', 'compass', 'direction', 'north', 'south', 'stars', 'map'],
  signaling: ['signal', 'rescue', 'whistle', 'mirror', 'smoke', 'flare', 'distress'],
  firstAid: ['first aid', 'injury', 'wound', 'bleeding', 'fracture', 'hypothermia', 'frostbite'],
  priorities: ['priority', 'priorities', 'survival needs', 'essential'],
  psychology: ['morale', 'panic', 'fear', 'mental', 'psychological', 'stay calm'],
  weather: ['weather', 'temperature', 'wind', 'cold', 'heat', 'rain', 'snow']
};

async function extractTextFromPDF(pdfPath) {
  console.log(`Extracting text from ${pdfPath}...`);
  const dataBuffer = fs.readFileSync(path.join(__dirname, pdfPath));
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  return result.text;
}

function categorizeText(text) {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const principles = {};

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    principles[topic] = [];
  }

  let currentSection = null;
  let buffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip very short lines and page numbers
    if (line.length < 10 || /^\d+$/.test(line)) continue;

    // Check if this line starts a new section
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      const lineUpper = line.toUpperCase();
      if (keywords.some(keyword => lineUpper.includes(keyword.toUpperCase()))) {
        // Save previous buffer if exists
        if (currentSection && buffer.length > 0) {
          const principle = buffer.join(' ').trim();
          if (principle.length > 50 && principle.length < 500) {
            principles[currentSection].push(principle);
          }
        }

        currentSection = topic;
        buffer = [line];
        break;
      }
    }

    // Continue building current section
    if (currentSection && buffer.length > 0 && buffer.length < 10) {
      buffer.push(line);
    } else if (currentSection && buffer.length >= 10) {
      // Flush buffer to principles
      const principle = buffer.join(' ').trim();
      if (principle.length > 50 && principle.length < 500) {
        principles[currentSection].push(principle);
      }
      buffer = [];
    }
  }

  return principles;
}

function extractKeyPrinciples(allText) {
  console.log('Categorizing survival principles...');

  const principles = categorizeText(allText);

  // Add some manually curated core principles based on common survival knowledge
  const corePrinciples = {
    priorities: [
      "Rule of 3s: You can survive 3 minutes without air, 3 hours without shelter in harsh conditions, 3 days without water, and 3 weeks without food.",
      "STOP principle: Stop, Think, Observe, Plan before taking action.",
      "Stay put if lost: Movement without a plan can make rescue harder and waste energy.",
      "Shelter is often more critical than food or water in extreme weather.",
      "Signal for rescue using three of anything (fires, whistle blows, mirror flashes) - the international distress signal."
    ],
    shelter: [
      "Shelter protects from wind, rain, and temperature extremes.",
      "Build shelter before dark to avoid working in dangerous conditions.",
      "Insulation from the ground is as important as overhead cover.",
      "Natural shelters like caves or fallen trees can save time and energy."
    ],
    water: [
      "Water is critical - dehydration kills faster than starvation.",
      "Always purify water from natural sources to avoid illness.",
      "In cold climates, melting snow requires energy and lowers body temperature.",
      "Ration sweat, not water - work during cooler hours to conserve water."
    ],
    fire: [
      "Fire provides warmth, water purification, signaling, and psychological comfort.",
      "Prepare tinder, kindling, and fuel before attempting to light a fire.",
      "Protect fire from wind and rain once started.",
      "Fire requires constant attention and fuel gathering."
    ],
    psychology: [
      "Panic leads to poor decisions and wastes energy.",
      "Maintaining morale is essential for survival.",
      "Small victories and routines help maintain mental stability.",
      "Fear is natural but must be controlled through planning and action."
    ],
    signaling: [
      "Three of anything is the international distress signal.",
      "Signal when aircraft or potential rescuers are nearby.",
      "Bright colors, smoke, mirrors, and noise all attract attention.",
      "Ground-to-air signals should be large and contrasting."
    ],
    navigation: [
      "Stay put if you're lost and people know your location.",
      "Navigate only if you know your destination and have energy.",
      "The sun rises in the east and sets in the west.",
      "Following water downstream often leads to civilization but uses energy."
    ],
    firstAid: [
      "Stop bleeding first - it can be life-threatening within minutes.",
      "Treat injuries promptly before they worsen.",
      "Hypothermia and hyperthermia are serious threats requiring immediate action.",
      "Immobilize fractures to prevent further damage."
    ],
    weather: [
      "Wind chill makes temperatures feel colder and increases heat loss.",
      "Wet clothing loses insulating properties and accelerates hypothermia.",
      "Shade and reducing activity helps in extreme heat.",
      "Weather changes can turn a manageable situation deadly."
    ],
    food: [
      "Food is the lowest priority in short-term survival.",
      "Energy spent hunting or foraging must be worth the calories gained.",
      "Some plants and animals are poisonous - know what you're eating.",
      "Insects and grubs are often safe protein sources if properly prepared."
    ]
  };

  // Merge extracted principles with core principles
  for (const [topic, coreItems] of Object.entries(corePrinciples)) {
    if (!principles[topic]) principles[topic] = [];
    principles[topic] = [...coreItems, ...principles[topic]];
  }

  // Remove duplicates and limit per category
  for (const topic in principles) {
    principles[topic] = [...new Set(principles[topic])].slice(0, 20);
  }

  return principles;
}

async function main() {
  console.log('Starting survival principles extraction...\n');

  try {
    let allText = '';

    // Extract text from both PDFs
    for (const pdfFile of PDF_FILES) {
      const text = await extractTextFromPDF(pdfFile);
      allText += '\n' + text;
    }

    console.log(`Total text extracted: ${allText.length} characters\n`);

    // Extract and categorize principles
    const principles = extractKeyPrinciples(allText);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(path.join(__dirname, OUTPUT_FILE));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save to JSON file
    const output = {
      metadata: {
        source: 'SAS Survival Handbook',
        extractedAt: new Date().toISOString(),
        totalCategories: Object.keys(principles).length,
        totalPrinciples: Object.values(principles).reduce((sum, arr) => sum + arr.length, 0)
      },
      principles
    };

    fs.writeFileSync(
      path.join(__dirname, OUTPUT_FILE),
      JSON.stringify(output, null, 2),
      'utf-8'
    );

    console.log('✅ Extraction complete!');
    console.log(`📁 Output saved to: ${OUTPUT_FILE}`);
    console.log(`📊 Categories: ${output.metadata.totalCategories}`);
    console.log(`📝 Total principles: ${output.metadata.totalPrinciples}\n`);

    // Print summary
    console.log('Category breakdown:');
    for (const [topic, items] of Object.entries(principles)) {
      console.log(`  ${topic}: ${items.length} principles`);
    }

  } catch (error) {
    console.error('❌ Error extracting survival principles:', error);
    process.exit(1);
  }
}

main();
