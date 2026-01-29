import { useEffect, useState } from 'react';
import type { Scenario } from '../types/game';
import { getScenarioImage, getFallbackImage } from '../services/imageService';
import { getEnvironmentIcon, getWeatherIcon, getTimeOfDayIcon } from '../data/iconMapping';

interface ScenarioHeroImageProps {
  scenario: Scenario;
  className?: string;
  showOverlay?: boolean;
}

/**
 * Scenario Hero Image Component
 *
 * Displays atmospheric hero image for the current scenario
 * Falls back to gradient + icons if AI generation unavailable
 */
export function ScenarioHeroImage({
  scenario,
  className = '',
  showOverlay = true
}: ScenarioHeroImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  const EnvironmentIcon = getEnvironmentIcon(scenario.environment);
  const WeatherIcon = getWeatherIcon(scenario.weather);
  const TimeIcon = getTimeOfDayIcon(scenario.timeOfDay);

  useEffect(() => {
    let mounted = true;

    async function loadImage() {
      setIsLoading(true);

      const url = await getScenarioImage(scenario);

      if (mounted) {
        if (url) {
          setImageUrl(url);
          setUseFallback(false);
        } else {
          setUseFallback(true);
        }
        setIsLoading(false);
      }
    }

    loadImage();

    return () => {
      mounted = false;
    };
  }, [scenario]);

  // Fallback gradient view
  if (useFallback || !imageUrl) {
    const gradientStyle = {
      background: scenario.imageFallback || getFallbackImage(scenario.environment)
    };

    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={gradientStyle}
      >
        {/* Icon overlay for visual interest */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <EnvironmentIcon size={200} className="text-white" strokeWidth={1} />
        </div>

        {/* Context icons */}
        {showOverlay && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <div className="bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <WeatherIcon size={20} className="text-white" />
              <TimeIcon size={20} className="text-white" />
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>
    );
  }

  // AI-generated image view
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={imageUrl}
        alt={`${scenario.environment} during ${scenario.weather} at ${scenario.timeOfDay}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Dark overlay for text legibility */}
      {showOverlay && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

          {/* Context icons */}
          <div className="absolute bottom-4 right-4 flex gap-2 z-10">
            <div className="bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <WeatherIcon size={20} className="text-white" />
              <TimeIcon size={20} className="text-white" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
