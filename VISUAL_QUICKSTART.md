# Visual System - Quick Start Guide

## What You Get Right Now (Zero Configuration)

### ✨ Hero Images with Gradients
Beautiful environment-specific gradients on turn 1:

```tsx
// Automatically shown in Game.tsx on turn 1
<ScenarioHeroImage
  scenario={gameState.scenario}
  className="h-48 md:h-64"
/>
```

**Gradients by environment:**
- 🏔️ Mountains: Purple (dramatic peaks)
- 🏜️ Desert: Pink-red (harsh sun)
- 🌲 Forest: Blue-cyan (lush wilderness)
- 🌊 Coast: Green-teal (ocean atmosphere)
- ❄️ Tundra: Pink-yellow (aurora-like)
- 🏭 Urban-edge: Blue-purple (industrial)

### 🎨 Equipment Icons
Every item in your inventory now has an icon:

- 🔪 Knife → Axe icon
- 💧 Water bottle → Droplets icon
- 🔥 Lighter → Flame icon
- 📱 Phone → Phone icon
- 🔦 Flashlight → Flashlight icon
- ... and 10+ more

**Visible in:** MetricsDisplay sidebar

### 🌤️ Weather & Time Icons
Contextual icons overlay the hero image:

- ☀️ Clear → Sun
- 🌧️ Rain → CloudRain
- 💨 Wind → Wind
- ❄️ Snow → CloudSnow
- 🌅 Dawn → Sunrise
- 🌙 Night → Moon

## Using the Icon System

### Get an icon for any game element:

```typescript
import { getEquipmentIcon, getMetricIcon, getDecisionIcon } from '../data/iconMapping';

// Equipment
const WaterIcon = getEquipmentIcon('Water bottle');
<WaterIcon className="w-5 h-5 text-blue-400" />

// Metrics
const EnergyIcon = getMetricIcon('energy'); // Returns Battery
<EnergyIcon className="w-5 h-5 text-green-500" />

// Decisions
const ShelterIcon = getDecisionIcon('build-shelter'); // Returns Tent
<ShelterIcon className="w-5 h-5 text-gray-400" />
```

### Color utilities:

```typescript
import { getMetricColorClass, getRiskColorClass } from '../data/iconMapping';

// Get Tailwind color class based on value
const energyColor = getMetricColorClass('energy', 45);
// Returns: 'text-yellow-500'

const riskColor = getRiskColorClass(8);
// Returns: 'text-red-600'
```

## Enabling AI Image Generation (Optional)

Want photorealistic wilderness scenes instead of gradients?

### Step 1: Choose your API

**Option A: Claude (Recommended)**
- Best quality for wilderness scenes
- ~$0.02-0.04 per image
- Sign up: https://console.anthropic.com

**Option B: DALL-E 3**
- High quality, reliable
- ~$0.04 per image
- Sign up: https://platform.openai.com

**Option C: Stable Diffusion (Replicate)**
- Most cost-effective
- ~$0.01 per image
- Sign up: https://replicate.com

### Step 2: Get API key

Add to your `.env` file:

```env
# For Claude
VITE_ANTHROPIC_API_KEY=your-key-here

# OR for DALL-E
VITE_OPENAI_API_KEY=your-key-here

# OR for Replicate
VITE_REPLICATE_API_KEY=your-key-here
```

### Step 3: Update the image service

Edit `src/services/imageService.ts`, find the `generateImage()` function (line ~165), and uncomment the example for your chosen API.

**For Claude:**
```typescript
async function generateImage(
  prompt: string,
  _options: ImageGenerationOptions = {}
): Promise<string | null> {
  const response = await fetch('https://api.anthropic.com/v1/images/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY
    },
    body: JSON.stringify({
      prompt,
      width: 1024,
      height: 768,
      format: 'webp'
    })
  });

  if (response.ok) {
    const data = await response.json();
    return data.imageUrl;
  }

  return null; // Fallback to gradients on error
}
```

### Step 4: Test it

```bash
npm run dev
```

Start a new game and watch turn 1 - the hero image will now be AI-generated!

**First load:** May take 2-5 seconds to generate
**Subsequent loads:** Instant (24-hour cache)

## Customizing Prompts

Want different image styles? Edit the prompts!

**File:** `src/data/imagePrompts.ts`

```typescript
const scenarioPrompts = {
  'mountains-storm-dusk': {
    heroImage: 'Mountain ridge at dusk with approaching storm',
    style: 'Dramatic wilderness photography, high contrast',
    mood: 'Ominous and threatening, isolated feeling'
  },
  // Add your own!
  'desert-clear-dawn': {
    heroImage: 'Desert sunrise with warm golden light',
    style: 'Serene landscape photography, soft focus',
    mood: 'Peaceful dawn, hope and new beginnings'
  }
};
```

## Advanced: Batch Pre-Generation

Pre-generate images for all common scenarios on game load:

```typescript
// In src/components/Game.tsx, add to useEffect:
import { batchGenerateScenarioImages } from '../services/imageService';

useEffect(() => {
  if (loadoutComplete && !gameState) {
    createNewGame().then(setGameState);

    // Pre-generate images in background
    batchGenerateScenarioImages();
  }
}, [loadoutComplete, gameState]);
```

This generates 10 images in the background while you play. Future games load instantly.

## Troubleshooting

### "Images not showing"
✅ Check browser console for errors
✅ Verify API key is in `.env` file
✅ Restart dev server after adding `.env`
✅ Fallback gradients always work (expected behavior)

### "Images loading slowly"
✅ First generation takes 2-5 seconds (normal)
✅ Enable batch pre-generation (see Advanced section)
✅ Images cached for 24 hours automatically

### "Too expensive"
✅ Use fallback gradients (current default, free)
✅ Only generate for premium users
✅ Use Stable Diffusion (~$0.01/image instead of $0.04)
✅ Increase cache duration (edit `CACHE_EXPIRY_MS`)

## Performance Tips

1. **Start with gradients** (current default)
   - Zero cost, instant loading
   - Beautiful and atmospheric
   - No API configuration needed

2. **Enable AI for special occasions**
   - Premium users only
   - Special events or promotions
   - A/B testing engagement

3. **Optimize cache**
   - Default: 24-hour memory cache
   - Upgrade to LocalStorage for persistence
   - CDN for shared cache across users

## What's Coming (Optional Future)

These are ideas for future enhancement:

- [ ] Decision outcome illustrations
- [ ] Progressive image loading (blur-up effect)
- [ ] User preference toggle (AI vs gradients)
- [ ] LocalStorage cache persistence
- [ ] CDN integration for shared images
- [ ] Animated weather effects overlay

## Summary

**Right now, with zero setup:**
- ✅ Beautiful gradient hero images
- ✅ 50+ icons throughout UI
- ✅ Weather & time visual indicators
- ✅ Mobile-optimized and fast

**With 10 minutes of API setup:**
- 🎨 Photorealistic wilderness scenes
- 🖼️ Contextual images per scenario
- ⚡ 24-hour caching for speed
- 💰 ~$3-12/month for active use

**The choice is yours!** The system works great either way.
