import React, { useMemo } from 'react';
import { GameState } from '../../types/game';

// Wind chill calculation (moved from windSystem if not exported)
function calculateWindChill(tempC: number, windKmh: number): number {
  // Wind chill formula for metric units
  if (windKmh < 5 || tempC > 10) return tempC;
  const windPow = Math.pow(windKmh, 0.16);
  return 13.12 + 0.6215 * tempC - 11.37 * windPow + 0.3965 * tempC * windPow;
}

interface EnvironmentTabProps {
  gameState: GameState;
  compact?: boolean;
}

/**
 * Environment Tab - Displays environmental conditions and threats
 * Shows temperature, wind, weather, time, and contextual warnings
 */
const EnvironmentTab: React.FC<EnvironmentTabProps> = ({ gameState, compact }) => {
  const { scenario, metrics, currentTimeOfDay } = gameState;

  // Calculate wind chill
  const windChill = useMemo(() => {
    return calculateWindChill(scenario.temperature, scenario.windSpeed);
  }, [scenario.temperature, scenario.windSpeed]);

  // Calculate temperature status
  const tempStatus = useMemo(() => {
    const temp = metrics.bodyTemperature;
    if (temp < 33) return { label: 'HYPOTHERMIA', color: 'text-red-400', severity: 'critical' };
    if (temp < 35) return { label: 'Cold Stress', color: 'text-orange-400', severity: 'warning' };
    if (temp > 40) return { label: 'HYPERTHERMIA', color: 'text-red-400', severity: 'critical' };
    if (temp > 38.5) return { label: 'Heat Stress', color: 'text-orange-400', severity: 'warning' };
    return { label: 'Normal', color: 'text-green-400', severity: 'safe' };
  }, [metrics.bodyTemperature]);

  // Generate environmental threats
  const threats = useMemo(() => {
    const threatList: string[] = [];

    // Temperature threats
    if (scenario.temperature < 0 && metrics.shelter < 40) {
      threatList.push('Freezing temperatures with inadequate shelter');
    }
    if (scenario.temperature > 35 && metrics.hydration < 50) {
      threatList.push('Extreme heat with low hydration');
    }

    // Wind threats
    if (scenario.windSpeed > 30 && metrics.shelter < 50) {
      threatList.push('High winds threaten shelter integrity');
    }
    if (windChill < scenario.temperature - 10) {
      threatList.push(`Wind chill significantly lowering effective temperature`);
    }

    // Weather threats
    if (scenario.weather === 'storm' || scenario.weather === 'snow') {
      threatList.push('Severe weather conditions limit visibility');
    }
    if (scenario.weather === 'rain' && metrics.shelter < 30) {
      threatList.push('Rain exposure without adequate shelter');
    }

    // Time threats
    if ((currentTimeOfDay === 'night' || currentTimeOfDay === 'dusk') && metrics.shelter < 40) {
      threatList.push('Night approaching with poor shelter');
    }

    // Fire/warmth threats
    const hasLighter = gameState.equipment.some(eq => eq.name === 'Waterproof Lighter');
    const hasBlanket = gameState.equipment.some(eq => eq.name === 'Space Blanket');
    if (scenario.temperature < 10 && !hasLighter && !hasBlanket) {
      threatList.push('No fire or insulation in cold environment');
    }

    // Visibility threats
    if ((currentTimeOfDay === 'night' || scenario.weather === 'storm') && metrics.signalEffectiveness > 50) {
      threatList.push('Poor visibility limits rescue probability');
    }

    return threatList;
  }, [scenario, metrics, currentTimeOfDay, windChill, gameState.equipment]);

  // Time of day display
  const timeDisplay = useMemo(() => {
    const timeMap: Record<string, { label: string; icon: string; color: string }> = {
      dawn: { label: 'Dawn', icon: '🌅', color: 'text-orange-300' },
      morning: { label: 'Morning', icon: '🌄', color: 'text-yellow-300' },
      midday: { label: 'Midday', icon: '☀️', color: 'text-yellow-400' },
      afternoon: { label: 'Afternoon', icon: '🌤️', color: 'text-yellow-400' },
      dusk: { label: 'Dusk', icon: '🌆', color: 'text-orange-400' },
      night: { label: 'Night', icon: '🌙', color: 'text-blue-300' },
    };
    return timeMap[currentTimeOfDay] || { label: 'Unknown', icon: '❓', color: 'text-slate-400' };
  }, [currentTimeOfDay]);

  // Weather display
  const weatherDisplay = useMemo(() => {
    const weatherMap: Record<string, { icon: string; color: string }> = {
      clear: { icon: '☀️', color: 'text-yellow-400' },
      rain: { icon: '🌧️', color: 'text-blue-400' },
      wind: { icon: '💨', color: 'text-slate-400' },
      snow: { icon: '❄️', color: 'text-cyan-300' },
      heat: { icon: '🌡️', color: 'text-red-400' },
      storm: { icon: '⛈️', color: 'text-purple-400' },
    };
    return weatherMap[scenario.weather] || { icon: '❓', color: 'text-slate-400' };
  }, [scenario.weather]);

  return (
    <div className={`p-4 space-y-4 ${compact ? 'text-sm' : ''}`}>
      {/* Environment Type */}
      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
        <div className="text-xs text-slate-400 mb-1">Environment</div>
        <div className="text-lg font-bold text-cyan-400 capitalize">
          {scenario.environment}
        </div>
      </div>

      {/* Temperature Section */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Temperature
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-900/30 rounded p-2 border border-slate-700/50">
            <div className="text-xs text-slate-400">Ambient</div>
            <div className={`text-lg font-bold ${
              scenario.temperature < 0 ? 'text-blue-400' :
              scenario.temperature > 30 ? 'text-red-400' :
              'text-green-400'
            }`}>
              {scenario.temperature}°C
            </div>
          </div>

          <div className="bg-slate-900/30 rounded p-2 border border-slate-700/50">
            <div className="text-xs text-slate-400">Wind Chill</div>
            <div className={`text-lg font-bold ${
              windChill < 0 ? 'text-blue-400' :
              windChill < 10 ? 'text-cyan-400' :
              'text-green-400'
            }`}>
              {windChill.toFixed(1)}°C
            </div>
          </div>

          <div className="bg-slate-900/30 rounded p-2 border border-slate-700/50">
            <div className="text-xs text-slate-400">Body Temp</div>
            <div className={`text-lg font-bold ${tempStatus.color}`}>
              {metrics.bodyTemperature.toFixed(1)}°C
            </div>
          </div>
        </div>

        <div className={`text-xs font-medium text-center p-2 rounded ${
          tempStatus.severity === 'critical' ? 'bg-red-950/30 text-red-400' :
          tempStatus.severity === 'warning' ? 'bg-orange-950/30 text-orange-400' :
          'bg-green-950/30 text-green-400'
        }`}>
          {tempStatus.label}
        </div>
      </div>

      {/* Wind Section */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Wind
        </div>

        <div className="bg-slate-900/30 rounded p-3 border border-slate-700/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400">Wind Speed</span>
            <span className={`text-sm font-bold ${
              scenario.windSpeed > 40 ? 'text-red-400' :
              scenario.windSpeed > 20 ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {scenario.windSpeed} km/h
            </span>
          </div>

          <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                scenario.windSpeed > 40 ? 'bg-red-500' :
                scenario.windSpeed > 20 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, (scenario.windSpeed / 60) * 100)}%` }}
            />
          </div>

          <div className="text-xs text-slate-500 mt-2">
            Heat loss: {scenario.windSpeed > 30 ? 'Severe' : scenario.windSpeed > 15 ? 'Moderate' : 'Low'}
          </div>
        </div>
      </div>

      {/* Weather Section */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Weather
        </div>

        <div className="bg-slate-900/30 rounded p-3 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{weatherDisplay.icon}</span>
            <div className="flex-1">
              <div className={`text-sm font-semibold ${weatherDisplay.color} capitalize`}>
                {scenario.weather}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Visibility: {
                  scenario.weather === 'storm' || scenario.weather === 'snow' ? 'Poor' :
                  scenario.weather === 'rain' ? 'Limited' :
                  'Good'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Section */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Time of Day
        </div>

        <div className="bg-slate-900/30 rounded p-3 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{timeDisplay.icon}</span>
            <div className="flex-1">
              <div className={`text-sm font-semibold ${timeDisplay.color}`}>
                {timeDisplay.label}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Light: {currentTimeOfDay === 'midday' || currentTimeOfDay === 'morning' || currentTimeOfDay === 'afternoon' ? 'Full' : currentTimeOfDay === 'dawn' || currentTimeOfDay === 'dusk' ? 'Limited' : 'Dark'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shelter/Fire Status */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Protection
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/30 rounded p-2 border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Shelter</div>
            <div className={`text-lg font-bold ${
              metrics.shelter < 20 ? 'text-red-400' :
              metrics.shelter < 50 ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {Math.round(metrics.shelter)}%
            </div>
          </div>

          <div className="bg-slate-900/30 rounded p-2 border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Fire</div>
            <div className={`text-sm font-bold ${
              gameState.equipment.some(eq => eq.name === 'Waterproof Lighter') ? 'text-green-400' : 'text-slate-500'
            }`}>
              {gameState.equipment.some(eq => eq.name === 'Waterproof Lighter') ? 'Available' : 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Threats */}
      {threats.length > 0 && (
        <div className="bg-orange-950/20 border border-orange-700/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-orange-400 mb-1">
                ENVIRONMENTAL THREATS
              </div>
              <ul className="space-y-1">
                {threats.map((threat, idx) => (
                  <li key={idx} className="text-xs text-orange-300">
                    • {threat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentTab;
