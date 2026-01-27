import { useState, useEffect } from 'react';
import type { PlayerMetrics, Equipment, Scenario, TimeOfDay, GameState } from '../types/game';
import { Package, Clock } from 'lucide-react';
import { calculateWindEffect, getWindDescription } from '../engine/windSystem';
import { getEnvironmentTips } from '../engine/survivalPrinciplesService';
import { getPersonalizedTip } from '../engine/principleRecommendationEngine';

interface MetricsDisplayProps {
  metrics: PlayerMetrics;
  equipment: Equipment[];
  scenario?: Scenario;
  showProbability?: boolean;
  currentTimeOfDay?: TimeOfDay;
  hoursElapsed?: number;
  turnNumber?: number;
  gameState?: GameState;
}

export function MetricsDisplay({ metrics, equipment, scenario, showProbability = false, currentTimeOfDay, hoursElapsed, turnNumber = 1, gameState }: MetricsDisplayProps) {
  const [currentTip, setCurrentTip] = useState<string>('');
  const [personalizedTip, setPersonalizedTip] = useState<string | null>(null);

  useEffect(() => {
    if (scenario) {
      const tips = getEnvironmentTips(scenario.environment);
      // Rotate tip every 3 turns
      const tipIndex = Math.floor(turnNumber / 3) % tips.length;
      setCurrentTip(tips[tipIndex] || '');
    }
  }, [scenario?.environment, turnNumber]);

  useEffect(() => {
    if (gameState && turnNumber >= 5) {
      setPersonalizedTip(getPersonalizedTip(gameState));
    }
  }, [turnNumber, gameState]);

  return (
    <div className="space-y-3">
      {currentTimeOfDay && (
        <div className="pb-3 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <div className="text-base font-medium text-gray-300">Time</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Time of Day</span>
              <span className={`font-mono font-medium ${getTimeOfDayColor(currentTimeOfDay)}`}>
                {formatTimeOfDay(currentTimeOfDay)}
              </span>
            </div>
            {hoursElapsed !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Hours Elapsed</span>
                <span className="font-mono text-gray-300">{hoursElapsed}h</span>
              </div>
            )}
            <div className="mt-2">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getTimePeriodBarColor(currentTimeOfDay)}`}
                  style={{ width: `${getTimePeriodProgress(currentTimeOfDay)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Dawn</span>
                <span>Day</span>
                <span>Dusk</span>
                <span>Night</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <MetricBar
        label="Condition"
        value={metrics.energy}
        max={100}
        color={getEnergyColor(metrics.energy)}
      />
      <MetricBar
        label="Hydration"
        value={metrics.hydration}
        max={100}
        color={getHydrationColor(metrics.hydration)}
      />
      <div>
        <div className="text-base text-gray-400 mb-1">Body Temperature</div>
        <div className="relative">
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ${getBodyTempBarColor(metrics.bodyTemperature)}`}
              style={{ width: `${getBodyTempPercentage(metrics.bodyTemperature)}%` }}
            />
          </div>
          <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-white opacity-50" style={{ transform: 'translateX(-50%)' }} />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>32°C Hypothermic</span>
            <span className="text-white font-medium">{metrics.bodyTemperature.toFixed(1)}°C</span>
            <span>42°C Heat Exhaustion</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-700">
        <div className="text-base text-gray-400 mb-1">Morale</div>
        <div className={`text-2xl font-mono ${getMoraleColor(metrics.morale)}`}>
          {getMoraleLabel(metrics.morale)}
        </div>
      </div>
      {scenario && (
        <div className="pt-2 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-base text-gray-400 mb-1">Ambient Temp</div>
              <div className={`text-lg font-mono ${getAmbientTempColor(scenario.temperature)}`}>
                {scenario.temperature}°C
              </div>
            </div>
            <div>
              <div className="text-base text-gray-400 mb-1">Wind</div>
              <div className="text-lg text-gray-300">
                <div className="font-mono">{scenario.windSpeed} km/h</div>
                <div className="text-sm text-gray-400">{getWindDescription(scenario.windSpeed)}</div>
              </div>
            </div>
          </div>
          {scenario.windSpeed >= 5 && (
            <div className="mt-2 text-sm text-blue-400">
              Feels like: {calculateWindEffect(scenario.temperature, scenario.windSpeed).effectiveTemp.toFixed(1)}°C
            </div>
          )}
        </div>
      )}
      {metrics.injurySeverity > 0 && (
        <div>
          <div className="text-base text-gray-400 mb-1">Injury Severity</div>
          <div className={`text-2xl font-mono ${getInjuryColor(metrics.injurySeverity)}`}>
            {getInjuryLabel(metrics.injurySeverity)}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-gray-700">
        <div className="text-base text-gray-400 mb-1">Shelter</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getShelterColor(metrics.shelter)}`}
              style={{ width: `${Math.max(0, Math.min(100, metrics.shelter))}%` }}
            />
          </div>
          <span className={`text-lg font-mono ${getShelterColor(metrics.shelter)}`}>
            {Math.round(metrics.shelter)}%
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🔥</span>
          <div className="text-base text-gray-400">Fire</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getFireColor(metrics.fireQuality)}`}
              style={{ width: `${Math.max(0, Math.min(100, metrics.fireQuality))}%` }}
            />
          </div>
          <span className={`text-lg font-mono ${getFireTextColor(metrics.fireQuality)}`}>
            {getFireLabel(metrics.fireQuality)}
          </span>
        </div>
      </div>

      {equipment.length > 0 && (
        <div className="pt-3 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-gray-400" />
            <div className="text-base font-medium text-gray-300">Equipment</div>
          </div>
          <div className="space-y-1.5">
            {equipment.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{item.name}</span>
                <div className="flex items-center gap-2">
                  {item.quantity > 1 && (
                    <span className="text-gray-500">×{item.quantity}</span>
                  )}
                  <span className={`${getConditionColor(item.condition)} font-mono text-sm`}>
                    {item.condition}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {currentTip && (
            <div className="pt-3 border-t border-gray-700 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💡</span>
                <span className="text-sm text-gray-400 font-medium">Survival Tip</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed italic">
                {currentTip}
              </p>
            </div>
          )}
          {personalizedTip && (
            <div className="pt-3 border-t border-orange-800/50 mt-3">
              <div className="text-xs text-orange-300 leading-relaxed">
                {personalizedTip}
              </div>
            </div>
          )}
          {gameState?.discoveredPrinciples && gameState.discoveredPrinciples.size > 0 && (
            <div className="pt-3 border-t border-gray-700 mt-3">
              <div className="text-sm text-gray-400 mb-1">Knowledge Progress</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Principles Discovered:</span>
                <span className="text-sm font-mono text-green-400">
                  {gameState.discoveredPrinciples.size} / 90
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                  style={{ width: `${(gameState.discoveredPrinciples.size / 90) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {showProbability && (
        <div className="pt-2 border-t border-gray-700">
          <div className="text-sm text-gray-500 mb-1">Estimated Survival Probability</div>
          <div className="text-base font-mono text-gray-300">
            {metrics.survivalProbability.toFixed(0)}%
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

function MetricBar({ label, value, max, color }: MetricBarProps) {
  const percentage = (value / max) * 100;

  return (
    <div>
      <div className="flex justify-between text-base text-gray-400 mb-1">
        <span>{label}</span>
        <span className="font-mono">{Math.round(value)}</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
        />
      </div>
    </div>
  );
}

function getEnergyColor(value: number): string {
  if (value > 60) return 'bg-green-600';
  if (value > 30) return 'bg-yellow-600';
  return 'bg-red-600';
}

function getHydrationColor(value: number): string {
  if (value > 60) return 'bg-blue-600';
  if (value > 30) return 'bg-orange-600';
  return 'bg-red-600';
}

function getBodyTempPercentage(temp: number): number {
  const min = 32;
  const max = 42;
  const clamped = Math.max(min, Math.min(max, temp));
  return ((clamped - min) / (max - min)) * 100;
}

function getBodyTempBarColor(temp: number): string {
  if (temp < 35) return 'bg-blue-500';
  if (temp < 35.5) return 'bg-blue-400';
  if (temp < 36) return 'bg-cyan-500';
  if (temp < 36.5) return 'bg-yellow-500';
  if (temp <= 37.5) return 'bg-green-600';
  if (temp <= 38) return 'bg-yellow-500';
  if (temp <= 39) return 'bg-orange-500';
  if (temp <= 40) return 'bg-red-500';
  return 'bg-red-600';
}

function getMoraleColor(value: number): string {
  if (value > 60) return 'text-green-400';
  if (value > 30) return 'text-yellow-400';
  return 'text-red-400';
}

function getMoraleLabel(value: number): string {
  if (value > 70) return 'Focused';
  if (value > 50) return 'Steady';
  if (value > 30) return 'Shaken';
  return 'Desperate';
}

function getInjuryColor(value: number): string {
  if (value > 60) return 'text-red-400';
  if (value > 30) return 'text-orange-400';
  return 'text-yellow-400';
}

function getInjuryLabel(value: number): string {
  if (value > 70) return 'Critical';
  if (value > 50) return 'Severe';
  if (value > 30) return 'Serious';
  return 'Minor';
}

function getConditionColor(condition: 'good' | 'worn' | 'damaged'): string {
  if (condition === 'good') return 'text-green-400';
  if (condition === 'worn') return 'text-yellow-400';
  return 'text-orange-400';
}

function getAmbientTempColor(value: number): string {
  if (value < 0) return 'text-blue-400';
  if (value < 10) return 'text-cyan-400';
  if (value > 35) return 'text-red-400';
  if (value > 25) return 'text-orange-400';
  return 'text-green-400';
}

function getShelterColor(value: number): string {
  if (value > 70) return 'bg-green-600 text-green-400';
  if (value > 40) return 'bg-yellow-600 text-yellow-400';
  if (value > 20) return 'bg-orange-600 text-orange-400';
  return 'bg-red-600 text-red-400';
}

function formatTimeOfDay(time: TimeOfDay): string {
  const labels: Record<TimeOfDay, string> = {
    dawn: 'Dawn',
    morning: 'Morning',
    midday: 'Midday',
    afternoon: 'Afternoon',
    dusk: 'Dusk',
    night: 'Night'
  };
  return labels[time];
}

function getTimeOfDayColor(time: TimeOfDay): string {
  const colors: Record<TimeOfDay, string> = {
    dawn: 'text-orange-300',
    morning: 'text-yellow-300',
    midday: 'text-yellow-400',
    afternoon: 'text-orange-400',
    dusk: 'text-purple-400',
    night: 'text-blue-400'
  };
  return colors[time];
}

function getTimePeriodBarColor(time: TimeOfDay): string {
  const colors: Record<TimeOfDay, string> = {
    dawn: 'bg-orange-500',
    morning: 'bg-yellow-400',
    midday: 'bg-yellow-500',
    afternoon: 'bg-orange-500',
    dusk: 'bg-purple-500',
    night: 'bg-blue-600'
  };
  return colors[time];
}

function getTimePeriodProgress(time: TimeOfDay): number {
  const progress: Record<TimeOfDay, number> = {
    dawn: 8,
    morning: 33,
    midday: 50,
    afternoon: 67,
    dusk: 83,
    night: 100
  };
  return progress[time];
}

function getFireColor(value: number): string {
  if (value > 75) return 'bg-red-500';      // Strong fire
  if (value > 50) return 'bg-red-600';      // Burning
  if (value > 25) return 'bg-orange-600';   // Smoldering
  return 'bg-gray-600';                     // Extinguished
}

function getFireTextColor(value: number): string {
  if (value > 75) return 'text-red-400';    // Strong fire
  if (value > 50) return 'text-red-500';    // Burning
  if (value > 25) return 'text-orange-400'; // Smoldering
  return 'text-gray-500';                   // Extinguished
}

function getFireLabel(value: number): string {
  if (value > 75) return 'Strong';
  if (value > 50) return 'Burning';
  if (value > 25) return 'Smoldering';
  return 'Out';
}
