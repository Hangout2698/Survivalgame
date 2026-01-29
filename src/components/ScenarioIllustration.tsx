import type { Environment, Weather, TimeOfDay } from '../types/game';
import { getEnvironmentIcon, getWeatherIcon, getTimeOfDayIcon } from '../data/iconMapping';

interface ScenarioIllustrationProps {
  environment: Environment;
  weather: Weather;
  timeOfDay: TimeOfDay;
  temperature: number;
  className?: string;
}

/**
 * Simple CSS/SVG-based scenario illustrations
 * Creates recognizable scenes without requiring external images
 */
export function ScenarioIllustration({
  environment,
  weather,
  timeOfDay,
  temperature,
  className = ''
}: ScenarioIllustrationProps) {
  const EnvironmentIcon = getEnvironmentIcon(environment);
  const WeatherIcon = getWeatherIcon(weather);
  const TimeIcon = getTimeOfDayIcon(timeOfDay);

  // Determine sky gradient based on time of day
  const skyGradient = getSkyGradient(timeOfDay);

  // Determine ground/environment color
  const environmentColors = getEnvironmentColors(environment);

  // Determine if it's dark (night/dusk)
  const isDark = timeOfDay === 'night' || timeOfDay === 'dusk';

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: skyGradient }}>
      {/* Ground/Terrain Layer */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background: environmentColors.ground,
          clipPath: getTerrainPath(environment)
        }}
      />

      {/* Environment-specific scene elements */}
      <div className="absolute inset-0">
        {environment === 'mountains' && <MountainScene isDark={isDark} />}
        {environment === 'desert' && <DesertScene isDark={isDark} temperature={temperature} />}
        {environment === 'forest' && <ForestScene isDark={isDark} />}
        {environment === 'coast' && <CoastScene isDark={isDark} />}
        {environment === 'tundra' && <TundraScene isDark={isDark} />}
        {environment === 'urban-edge' && <UrbanScene isDark={isDark} />}
      </div>

      {/* Weather overlay effects */}
      {weather !== 'clear' && (
        <div className="absolute inset-0 pointer-events-none">
          <WeatherOverlay weather={weather} />
        </div>
      )}

      {/* Large environment icon in background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <EnvironmentIcon size={300} className="text-white" strokeWidth={1} />
      </div>

      {/* Sun/Moon */}
      {(timeOfDay === 'dawn' || timeOfDay === 'morning' || timeOfDay === 'midday') && (
        <div className="absolute top-8 right-12">
          <div className="w-20 h-20 rounded-full bg-yellow-300 opacity-80 shadow-lg shadow-yellow-400/50" />
        </div>
      )}
      {timeOfDay === 'night' && (
        <div className="absolute top-8 right-12">
          <div className="w-16 h-16 rounded-full bg-gray-200 opacity-70" />
        </div>
      )}

      {/* Context icons badge */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-10">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-3 border border-white/20">
          <div className="flex items-center gap-1">
            <WeatherIcon size={18} className="text-white" />
            <span className="text-xs text-white font-medium capitalize">{weather}</span>
          </div>
          <div className="w-px h-4 bg-white/30" />
          <div className="flex items-center gap-1">
            <TimeIcon size={18} className="text-white" />
            <span className="text-xs text-white font-medium capitalize">{timeOfDay}</span>
          </div>
        </div>
      </div>

      {/* Dark overlay for legibility if needed */}
      {isDark && (
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      )}
    </div>
  );
}

// Sky gradients for different times of day
function getSkyGradient(timeOfDay: TimeOfDay): string {
  const gradients: Record<TimeOfDay, string> = {
    dawn: 'linear-gradient(to bottom, #FF6B6B 0%, #FFA500 30%, #FFD700 60%, #87CEEB 100%)',
    morning: 'linear-gradient(to bottom, #4A90E2 0%, #87CEEB 50%, #B0D8F0 100%)',
    midday: 'linear-gradient(to bottom, #1E88E5 0%, #64B5F6 50%, #90CAF9 100%)',
    afternoon: 'linear-gradient(to bottom, #5E88C7 0%, #87CEEB 40%, #FFB84D 100%)',
    dusk: 'linear-gradient(to bottom, #2C1E5C 0%, #5E3F8C 30%, #E07856 70%, #F4A460 100%)',
    night: 'linear-gradient(to bottom, #0A0E27 0%, #1A1F3A 50%, #2C3E50 100%)',
  };
  return gradients[timeOfDay];
}

// Environment-specific colors
function getEnvironmentColors(environment: Environment) {
  const colors: Record<Environment, { ground: string }> = {
    mountains: { ground: 'linear-gradient(to top, #5D6D7E 0%, #7F8C8D 100%)' },
    desert: { ground: 'linear-gradient(to top, #D4A574 0%, #EDC9AF 100%)' },
    forest: { ground: 'linear-gradient(to top, #2E5233 0%, #4A7C59 100%)' },
    coast: { ground: 'linear-gradient(to top, #C2B280 0%, #E8D5B7 100%)' },
    tundra: { ground: 'linear-gradient(to top, #E8E8E8 0%, #F5F5F5 100%)' },
    'urban-edge': { ground: 'linear-gradient(to top, #555555 0%, #777777 100%)' },
  };
  return colors[environment];
}

// Terrain clip paths for variety
function getTerrainPath(environment: Environment): string {
  const paths: Record<Environment, string> = {
    mountains: 'polygon(0 100%, 0 40%, 15% 60%, 30% 30%, 45% 50%, 60% 25%, 75% 45%, 90% 35%, 100% 55%, 100% 100%)',
    desert: 'polygon(0 100%, 0 70%, 20% 65%, 40% 75%, 60% 70%, 80% 80%, 100% 75%, 100% 100%)',
    forest: 'polygon(0 100%, 0 60%, 100% 60%, 100% 100%)',
    coast: 'polygon(0 100%, 0 75%, 30% 70%, 60% 75%, 100% 70%, 100% 100%)',
    tundra: 'polygon(0 100%, 0 65%, 25% 68%, 50% 65%, 75% 67%, 100% 65%, 100% 100%)',
    'urban-edge': 'polygon(0 100%, 0 80%, 100% 80%, 100% 100%)',
  };
  return paths[environment];
}

// Mountain scene elements
function MountainScene({ isDark }: { isDark: boolean }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice">
      <path
        d="M0 600 L200 400 L400 500 L600 300 L800 450 L1000 350 L1200 500 L1200 800 L0 800 Z"
        fill={isDark ? 'rgba(70, 80, 90, 0.7)' : 'rgba(100, 110, 120, 0.6)'}
      />
      <path
        d="M100 650 L300 500 L500 600 L700 450 L900 550 L1100 500 L1200 600 L1200 800 L0 800 Z"
        fill={isDark ? 'rgba(50, 60, 70, 0.6)' : 'rgba(120, 130, 140, 0.5)'}
      />
    </svg>
  );
}

// Desert scene elements
function DesertScene({ isDark, temperature }: { isDark: boolean; temperature: number }) {
  const showHeatShimmer = temperature > 30;
  return (
    <>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice">
        {/* Sand dunes */}
        <path
          d="M0 600 Q300 550, 600 600 T1200 600 L1200 800 L0 800 Z"
          fill={isDark ? 'rgba(180, 150, 120, 0.7)' : 'rgba(220, 190, 160, 0.7)'}
        />
        <path
          d="M200 650 Q450 620, 700 650 T1200 650"
          stroke={isDark ? 'rgba(150, 130, 100, 0.5)' : 'rgba(200, 170, 140, 0.5)'}
          strokeWidth="3"
          fill="none"
        />
        {/* Cactus */}
        <g transform="translate(150, 520)">
          <rect x="18" y="30" width="14" height="60" fill={isDark ? '#4A6741' : '#6B8E23'} rx="7" />
          <rect x="5" y="45" width="14" height="30" fill={isDark ? '#4A6741' : '#6B8E23'} rx="7" />
          <rect x="31" y="50" width="14" height="25" fill={isDark ? '#4A6741' : '#6B8E23'} rx="7" />
        </g>
      </svg>
      {showHeatShimmer && (
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-200/10 to-transparent animate-pulse" />
      )}
    </>
  );
}

// Forest scene elements
function ForestScene({ isDark }: { isDark: boolean }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice">
      {/* Trees */}
      {[...Array(8)].map((_, i) => {
        const x = (i * 150) + 50;
        const height = 180 + (i % 3) * 40;
        return (
          <g key={i} transform={`translate(${x}, ${650 - height})`}>
            <rect x="18" y={height - 40} width="14" height="80" fill={isDark ? '#3E2723' : '#5D4037'} />
            <path
              d={`M25 0 L5 ${height * 0.4} L45 ${height * 0.4} Z`}
              fill={isDark ? '#1B5E20' : '#2E7D32'}
            />
            <path
              d={`M25 ${height * 0.25} L5 ${height * 0.55} L45 ${height * 0.55} Z`}
              fill={isDark ? '#2E7D32' : '#388E3C'}
            />
            <path
              d={`M25 ${height * 0.45} L5 ${height * 0.7} L45 ${height * 0.7} Z`}
              fill={isDark ? '#388E3C' : '#43A047'}
            />
          </g>
        );
      })}
    </svg>
  );
}

// Coast scene elements
function CoastScene({ isDark }: { isDark: boolean }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice">
      {/* Ocean waves */}
      <path
        d="M0 500 Q300 480, 600 500 T1200 500 L1200 800 L0 800 Z"
        fill={isDark ? 'rgba(30, 90, 140, 0.7)' : 'rgba(30, 136, 229, 0.7)'}
      />
      <path
        d="M0 550 Q250 530, 500 550 T1000 550"
        stroke={isDark ? 'rgba(176, 224, 230, 0.4)' : 'rgba(176, 224, 230, 0.6)'}
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M200 580 Q400 565, 600 580 T1000 580"
        stroke={isDark ? 'rgba(176, 224, 230, 0.3)' : 'rgba(176, 224, 230, 0.5)'}
        strokeWidth="2"
        fill="none"
      />
      {/* Rocks */}
      <ellipse cx="250" cy="620" rx="40" ry="30" fill={isDark ? 'rgba(90, 90, 90, 0.8)' : 'rgba(120, 120, 120, 0.7)'} />
      <ellipse cx="850" cy="630" rx="50" ry="35" fill={isDark ? 'rgba(90, 90, 90, 0.8)' : 'rgba(120, 120, 120, 0.7)'} />
    </svg>
  );
}

// Tundra scene elements
function TundraScene({ isDark }: { isDark: boolean }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice">
      {/* Snow ground with small rocks */}
      <path
        d="M0 600 Q300 590, 600 600 T1200 600 L1200 800 L0 800 Z"
        fill={isDark ? 'rgba(200, 200, 210, 0.8)' : 'rgba(235, 235, 245, 0.9)'}
      />
      {/* Scattered rocks */}
      {[...Array(12)].map((_, i) => (
        <circle
          key={i}
          cx={100 + i * 90}
          cy={600 + (i % 3) * 15}
          r={3 + (i % 2) * 2}
          fill={isDark ? 'rgba(80, 80, 90, 0.6)' : 'rgba(100, 100, 110, 0.5)'}
        />
      ))}
      {/* Low shrubs */}
      <path
        d="M100 630 L103 625 L106 630 L109 623 L112 630"
        stroke={isDark ? '#4A5D45' : '#556B2F'}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M600 640 L603 635 L606 640 L609 633 L612 640"
        stroke={isDark ? '#4A5D45' : '#556B2F'}
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

// Urban edge scene elements
function UrbanScene({ isDark }: { isDark: boolean }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice">
      {/* Building silhouettes */}
      <rect x="50" y="450" width="120" height="350" fill={isDark ? 'rgba(40, 40, 50, 0.9)' : 'rgba(80, 80, 90, 0.8)'} />
      <rect x="200" y="380" width="100" height="420" fill={isDark ? 'rgba(50, 50, 60, 0.9)' : 'rgba(90, 90, 100, 0.8)'} />
      <rect x="330" y="500" width="90" height="300" fill={isDark ? 'rgba(40, 40, 50, 0.9)' : 'rgba(80, 80, 90, 0.8)'} />
      <rect x="900" y="420" width="110" height="380" fill={isDark ? 'rgba(50, 50, 60, 0.9)' : 'rgba(90, 90, 100, 0.8)'} />
      <rect x="1040" y="480" width="85" height="320" fill={isDark ? 'rgba(40, 40, 50, 0.9)' : 'rgba(80, 80, 90, 0.8)'} />

      {/* Windows (lit up at night) */}
      {isDark && [...Array(15)].map((_, i) => (
        <rect
          key={i}
          x={60 + (i % 5) * 20}
          y={500 + Math.floor(i / 5) * 60}
          width={12}
          height={20}
          fill="rgba(253, 216, 53, 0.8)"
        />
      ))}
    </svg>
  );
}

// Weather overlay effects
function WeatherOverlay({ weather }: { weather: Weather }) {
  if (weather === 'rain') {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/20">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(100, 150, 200, 0.3) 2px, rgba(100, 150, 200, 0.3) 4px)',
        }} />
      </div>
    );
  }

  if (weather === 'snow') {
    return (
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-70"
            style={{
              left: `${(i * 67) % 100}%`,
              top: `${(i * 43) % 100}%`,
            }}
          />
        ))}
      </div>
    );
  }

  if (weather === 'storm') {
    return <div className="absolute inset-0 bg-gray-900/40" />;
  }

  if (weather === 'heat') {
    return <div className="absolute inset-0 bg-yellow-200/10" />;
  }

  return null;
}
