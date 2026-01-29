import React, { useMemo } from 'react';
import type { Environment, TimeOfDay, Weather, PlayerMetrics } from '../types/game';
import {
  computeEnvironmentGradient,
  computeTimeOfDayFilters,
  computeWeatherOverlay,
  computeHazardFilters,
  computeShelterVisibility,
  computeProgressionEffects,
  prefersReducedMotion,
  isMobileDevice,
} from '../utils/backgroundCalculator';
import '../styles/backgroundLayers.css';

interface DynamicEnvironmentBackgroundProps {
  environment: Environment;
  timeOfDay: TimeOfDay;
  weather: Weather;
  temperature: number;
  windSpeed: number;
  metrics: PlayerMetrics;
  turnNumber: number;
}

/**
 * Dynamic layered background system that responds to game state
 * 6 GPU-accelerated CSS layers with smooth transitions
 */
export const DynamicEnvironmentBackground: React.FC<DynamicEnvironmentBackgroundProps> = ({
  environment,
  timeOfDay,
  weather,
  temperature,
  windSpeed,
  metrics,
  turnNumber,
}) => {
  // Memoize computed values to avoid recalculation on every render
  const environmentGradient = useMemo(
    () => computeEnvironmentGradient(environment),
    [environment]
  );

  const timeFilters = useMemo(
    () => computeTimeOfDayFilters(timeOfDay),
    [timeOfDay]
  );

  const weatherConfig = useMemo(
    () => computeWeatherOverlay(weather, windSpeed),
    [weather, windSpeed]
  );

  const hazardFilters = useMemo(
    () => computeHazardFilters(metrics, temperature),
    [metrics, temperature]
  );

  const shelterConfig = useMemo(
    () => computeShelterVisibility(metrics.shelter, environment),
    [metrics.shelter, environment]
  );

  const progressionEffects = useMemo(
    () => computeProgressionEffects(turnNumber),
    [turnNumber]
  );

  // Check accessibility and device preferences
  const reducedMotion = prefersReducedMotion();
  const isMobile = isMobileDevice();

  // Build filter string for time of day layer
  const timeFilterString = timeFilters.length > 0 ? timeFilters.join(' ') : 'none';

  // Adjust blur for mobile performance
  const adjustedHazardFilters = isMobile
    ? hazardFilters.filter(f => !f.includes('blur'))
    : hazardFilters;
  const adjustedHazardFilterString =
    adjustedHazardFilters.length > 0 ? adjustedHazardFilters.join(' ') : 'none';

  return (
    <>
      {/* Layer 1: Base Environment Gradient */}
      <div
        className="background-layer environment-gradient"
        style={{
          background: environmentGradient,
        }}
      />

      {/* Layer 2: Time of Day Overlay */}
      <div
        className="background-layer time-overlay background-layer-transition"
        style={{
          filter: timeFilterString,
        }}
      />

      {/* Layer 3: Weather Effects */}
      {weatherConfig.opacity > 0 && (
        <div
          className="background-layer weather-overlay background-layer-transition"
          data-animation={!reducedMotion ? weatherConfig.animation : undefined}
          style={{
            background: weatherConfig.overlay,
            opacity: weatherConfig.opacity,
          }}
        />
      )}

      {/* Layer 4: Shelter Structure */}
      {shelterConfig.opacity > 0 && (
        <div
          className="background-layer shelter-overlay"
          style={{
            opacity: shelterConfig.opacity,
          }}
        >
          <ShelterSilhouette
            shape={shelterConfig.shape}
            position={shelterConfig.position}
          />
        </div>
      )}

      {/* Layer 5: Hazard Filters */}
      {hazardFilters.length > 0 && (
        <div
          className="background-layer hazard-overlay background-layer-transition"
          style={{
            background: 'transparent',
            filter: adjustedHazardFilterString,
          }}
        />
      )}

      {/* Layer 6: Progression Effects (Noise + Vignette) */}
      {progressionEffects.noiseOpacity > 0 && (
        <div
          className="background-layer progression-overlay noise-texture"
          style={{
            opacity: progressionEffects.noiseOpacity,
          }}
        />
      )}
    </>
  );
};

/**
 * Shelter silhouette SVG component
 * Renders different shelter shapes based on environment
 */
interface ShelterSilhouetteProps {
  shape: string;
  position: string;
}

const ShelterSilhouette: React.FC<ShelterSilhouetteProps> = ({ shape, position }) => {
  const positionClass = `shelter-position-${position}`;

  // SVG path definitions for different shelter types
  const shelterPaths: Record<string, JSX.Element> = {
    'lean-to': (
      <svg viewBox="0 0 200 150" className={`shelter-silhouette ${positionClass}`}>
        <path
          d="M 20 140 L 100 40 L 180 140 L 180 145 L 20 145 Z"
          fill="rgba(80, 60, 40, 0.5)"
          stroke="rgba(60, 40, 20, 0.3)"
          strokeWidth="2"
        />
        <line
          x1="100"
          y1="40"
          x2="100"
          y2="145"
          stroke="rgba(60, 40, 20, 0.4)"
          strokeWidth="3"
        />
      </svg>
    ),
    'rock-shelter': (
      <svg viewBox="0 0 200 150" className={`shelter-silhouette ${positionClass}`}>
        <ellipse
          cx="100"
          cy="130"
          rx="80"
          ry="40"
          fill="rgba(120, 100, 80, 0.5)"
          stroke="rgba(90, 70, 50, 0.3)"
          strokeWidth="2"
        />
        <path
          d="M 40 130 Q 50 80, 100 70 T 160 130"
          fill="rgba(140, 120, 100, 0.3)"
          stroke="none"
        />
      </svg>
    ),
    'debris-hut': (
      <svg viewBox="0 0 200 150" className={`shelter-silhouette ${positionClass}`}>
        <path
          d="M 30 140 Q 100 50, 170 140 L 170 145 L 30 145 Z"
          fill="rgba(70, 90, 50, 0.5)"
          stroke="rgba(50, 70, 30, 0.3)"
          strokeWidth="2"
        />
        <line
          x1="60"
          y1="110"
          x2="140"
          y2="110"
          stroke="rgba(50, 70, 30, 0.4)"
          strokeWidth="2"
        />
      </svg>
    ),
    'driftwood-shelter': (
      <svg viewBox="0 0 200 150" className={`shelter-silhouette ${positionClass}`}>
        <path
          d="M 20 140 L 90 60 L 110 60 L 180 140 L 180 145 L 20 145 Z"
          fill="rgba(100, 80, 60, 0.5)"
          stroke="rgba(80, 60, 40, 0.3)"
          strokeWidth="2"
        />
        <rect
          x="85"
          y="100"
          width="30"
          height="45"
          fill="rgba(40, 30, 20, 0.4)"
        />
      </svg>
    ),
    'snow-cave': (
      <svg viewBox="0 0 200 150" className={`shelter-silhouette ${positionClass}`}>
        <ellipse
          cx="100"
          cy="135"
          rx="90"
          ry="50"
          fill="rgba(220, 230, 240, 0.5)"
          stroke="rgba(200, 210, 220, 0.3)"
          strokeWidth="2"
        />
        <ellipse
          cx="100"
          cy="120"
          rx="40"
          ry="25"
          fill="rgba(40, 50, 60, 0.6)"
        />
      </svg>
    ),
    'tarp-shelter': (
      <svg viewBox="0 0 200 150" className={`shelter-silhouette ${positionClass}`}>
        <path
          d="M 30 145 L 40 80 L 160 80 L 170 145 Z"
          fill="rgba(80, 100, 120, 0.5)"
          stroke="rgba(60, 80, 100, 0.3)"
          strokeWidth="2"
        />
        <line
          x1="50"
          y1="80"
          x2="50"
          y2="145"
          stroke="rgba(60, 60, 60, 0.4)"
          strokeWidth="2"
        />
        <line
          x1="150"
          y1="80"
          x2="150"
          y2="145"
          stroke="rgba(60, 60, 60, 0.4)"
          strokeWidth="2"
        />
      </svg>
    ),
  };

  return shelterPaths[shape] || null;
};
