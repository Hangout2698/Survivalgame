import type { Environment, Weather, TimeOfDay, Scenario } from '../types/game';
import { getScenarioImagePrompt, decisionIllustrationPrompts } from '../data/imagePrompts';

/**
 * Image Service
 *
 * Manages AI-generated images for scenarios with caching and fallbacks.
 * Supports both batch generation at game start and on-demand generation.
 */

interface CachedImage {
  url: string;
  prompt: string;
  generatedAt: number;
  format: 'webp' | 'png' | 'svg';
}

interface ImageGenerationOptions {
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
  format?: 'webp' | 'png';
}

// In-memory cache for generated images
const imageCache = new Map<string, CachedImage>();

// Cache expiry time (24 hours)
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Generate cache key for scenario images
 */
function getScenarioCacheKey(
  environment: Environment,
  weather: Weather,
  timeOfDay: TimeOfDay
): string {
  return `scenario-${environment}-${weather}-${timeOfDay}`;
}

/**
 * Check if cached image is still valid
 */
function isCacheValid(cached: CachedImage): boolean {
  return Date.now() - cached.generatedAt < CACHE_EXPIRY_MS;
}

/**
 * Get scenario image (from cache or generate)
 *
 * @param scenario - The game scenario
 * @param options - Image generation options
 * @returns Image URL or null if generation fails
 */
export async function getScenarioImage(
  scenario: Scenario,
  options: ImageGenerationOptions = {}
): Promise<string | null> {
  const cacheKey = getScenarioCacheKey(
    scenario.environment,
    scenario.weather,
    scenario.timeOfDay
  );

  // Check cache first
  const cached = imageCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached.url;
  }

  // Return cached image URL if it exists in scenario
  if (scenario.imageUrl) {
    return scenario.imageUrl;
  }

  // Generate new image
  const prompt = scenario.imagePrompt || getScenarioImagePrompt(
    scenario.environment,
    scenario.weather,
    scenario.timeOfDay
  );

  try {
    const url = await generateImage(prompt);

    if (url) {
      imageCache.set(cacheKey, {
        url,
        prompt,
        generatedAt: Date.now(),
        format: options.format || 'webp'
      });
      return url;
    }
  } catch (error) {
    console.warn('Image generation failed:', error);
  }

  // Return fallback
  return getFallbackImage(scenario.environment);
}

/**
 * Batch generate images for common scenarios
 * Call this on game initialization to pre-cache images
 *
 * @returns Promise that resolves when generation is complete
 */
export async function batchGenerateScenarioImages(): Promise<void> {
  const criticalCombinations: Array<{ env: Environment; weather: Weather; time: TimeOfDay }> = [
    // Most dramatic/common scenarios
    { env: 'mountains', weather: 'storm', time: 'dusk' },
    { env: 'mountains', weather: 'snow', time: 'night' },
    { env: 'desert', weather: 'heat', time: 'midday' },
    { env: 'desert', weather: 'storm', time: 'afternoon' },
    { env: 'forest', weather: 'rain', time: 'night' },
    { env: 'forest', weather: 'storm', time: 'dusk' },
    { env: 'coast', weather: 'storm', time: 'afternoon' },
    { env: 'tundra', weather: 'snow', time: 'afternoon' },
    { env: 'tundra', weather: 'wind', time: 'night' },
    { env: 'urban-edge', weather: 'storm', time: 'dusk' }
  ];

  const promises = criticalCombinations.map(async ({ env, weather, time }) => {
    const cacheKey = getScenarioCacheKey(env, weather, time);

    // Skip if already cached
    if (imageCache.has(cacheKey)) {
      return;
    }

    const prompt = getScenarioImagePrompt(env, weather, time);

    try {
      const url = await generateImage(prompt);
      if (url) {
        imageCache.set(cacheKey, {
          url,
          prompt,
          generatedAt: Date.now(),
          format: 'webp'
        });
      }
    } catch (error) {
      console.warn(`Failed to generate image for ${cacheKey}:`, error);
    }
  });

  // Generate in batches to avoid overwhelming API
  const batchSize = 3;
  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize);
    await Promise.all(batch);

    // Small delay between batches
    if (i + batchSize < promises.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Generate image via AI API
 * This is a placeholder - implement with your chosen API (Claude, DALL-E, etc.)
 *
 * @param prompt - Image generation prompt
 * @param options - Generation options
 * @returns Image URL or null
 */
async function generateImage(
  prompt: string
): Promise<string | null> {
  // TODO: Implement actual API call
  // For now, return null to use fallbacks

  /*
   * Example implementation with Claude API:
   *
   * const response = await fetch('https://api.anthropic.com/v1/images/generate', {
   *   method: 'POST',
   *   headers: {
   *     'Content-Type': 'application/json',
   *     'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY
   *   },
   *   body: JSON.stringify({
   *     prompt,
   *     width: options.width || 1024,
   *     height: options.height || 768,
   *     format: options.format || 'webp'
   *   })
   * });
   *
   * if (response.ok) {
   *   const data = await response.json();
   *   return data.imageUrl;
   * }
   */

  console.log('Image generation requested:', prompt);
  return null; // Fallback to icon-based visuals
}

/**
 * Get fallback image for environment
 * Returns stock image URL or CSS gradient if image not available
 */
export function getFallbackImage(environment: Environment): string {
  // Stock images - these should be placed in public/images/environments/
  const stockImages: Record<Environment, string> = {
    mountains: '/images/environments/mountains.jpg',
    desert: '/images/environments/desert.jpg',
    forest: '/images/environments/forest.jpg',
    coast: '/images/environments/coast.jpg',
    tundra: '/images/environments/tundra.jpg',
    'urban-edge': '/images/environments/urban-edge.jpg'
  };

  // Return stock image path (will be used by <img> tag)
  // If image doesn't exist, browser will show broken image
  return stockImages[environment];
}

/**
 * Get decision illustration
 * Returns URL or prompt for decision-specific imagery
 */
export function getDecisionIllustration(decisionId: string): {
  prompt: string | null;
  fallbackIcon: string;
} {
  // Check for pre-defined illustration prompt
  const prompt = decisionIllustrationPrompts[decisionId] || null;

  // Extract fallback icon key from decision ID
  let fallbackIcon = 'activity';
  if (decisionId.includes('shelter')) fallbackIcon = 'tent';
  if (decisionId.includes('fire')) fallbackIcon = 'flame';
  if (decisionId.includes('signal')) fallbackIcon = 'radio';
  if (decisionId.includes('water')) fallbackIcon = 'droplets';
  if (decisionId.includes('navigate')) fallbackIcon = 'compass';

  return { prompt, fallbackIcon };
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, cached] of imageCache.entries()) {
    if (now - cached.generatedAt > CACHE_EXPIRY_MS) {
      imageCache.delete(key);
    }
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
  oldestEntry: number | null;
} {
  const entries = Array.from(imageCache.values());
  const oldestEntry = entries.length > 0
    ? Math.min(...entries.map(e => e.generatedAt))
    : null;

  return {
    size: imageCache.size,
    keys: Array.from(imageCache.keys()),
    oldestEntry
  };
}

/**
 * Preload scenario image prompt into scenario object
 * Call during scenario generation to add prompt field
 */
export function enrichScenarioWithImageData(scenario: Scenario): Scenario {
  return {
    ...scenario,
    imagePrompt: getScenarioImagePrompt(
      scenario.environment,
      scenario.weather,
      scenario.timeOfDay
    ),
    imageFallback: getFallbackImage(scenario.environment)
  };
}
