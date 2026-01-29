import { useState, useEffect, useRef } from 'react';
import type { PlayerMetrics, Equipment, Scenario, TimeOfDay, GameState } from '../types/game';
import { Package, Clock, Lock, HelpCircle, Radio, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { calculateWindEffect, getWindDescription } from '../engine/windSystem';
import { getEnvironmentTips } from '../engine/survivalPrinciplesService';
import { getPersonalizedTip } from '../engine/principleRecommendationEngine';
import { getNextPrinciples, getCategoryIcon } from '../engine/principleProgressService';
import { calculateRescueStatus, getRescueProbabilityDescription } from '../engine/rescueCalculator';
import { getLowResourceWarnings } from '../engine/equipmentMapper';
import { getEquipmentIcon } from '../data/iconMapping';
import { MetricChangeIndicator } from './MetricChangeIndicator';
import { StatTrendGraph } from './StatTrendGraph';
import { isCritical } from '../utils/statusThresholds';

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

  // Flash animation state for metric changes
  const prevMetricsRef = useRef<PlayerMetrics>(metrics);
  const [flashingMetrics, setFlashingMetrics] = useState<Record<string, 'positive' | 'negative'>>({});
  const [metricChanges, setMetricChanges] = useState<Record<string, number>>({});
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

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

  // Detect metric changes and trigger flash animations
  useEffect(() => {
    const changes: Record<string, 'positive' | 'negative'> = {};
    const changeAmounts: Record<string, number> = {};

    // List of metrics to track
    const metricsToTrack: Array<{ key: keyof PlayerMetrics; isInverse?: boolean }> = [
      { key: 'energy' },
      { key: 'hydration' },
      { key: 'bodyTemperature' },
      { key: 'morale' },
      { key: 'shelter' },
      { key: 'injurySeverity', isInverse: true },
      { key: 'cumulativeRisk', isInverse: true },
      { key: 'signalEffectiveness' },
      { key: 'survivalProbability' }
    ];

    metricsToTrack.forEach(({ key, isInverse = false }) => {
      const prev = prevMetricsRef.current[key];
      const curr = metrics[key];

      if (typeof prev === 'number' && typeof curr === 'number' && Math.abs(curr - prev) > 0.01) {
        const change = curr - prev;
        changeAmounts[key] = change;

        // For inverse metrics (injury, risk), lower is better
        const isPositive = isInverse ? change < 0 : change > 0;
        changes[key] = isPositive ? 'positive' : 'negative';
      }
    });

    if (Object.keys(changes).length > 0) {
      setFlashingMetrics(changes);
      setMetricChanges(changeAmounts);

      // Clear flash after 2 seconds
      const timer = setTimeout(() => {
        setFlashingMetrics({});
        setMetricChanges({});
      }, 2000);

      return () => clearTimeout(timer);
    }

    prevMetricsRef.current = metrics;
  }, [metrics]);

  // Calculate day number from hours
  const dayNumber = hoursElapsed !== undefined ? Math.floor(hoursElapsed / 24) + 1 : 1;
  const hoursIntoDay = hoursElapsed !== undefined ? hoursElapsed % 24 : 0;

  return (
    <div className="space-y-3">
      {/* Prominent Turn Counter */}
      <div className="pb-3 border-b-2 border-blue-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <div className="text-lg font-bold text-blue-300">Turn {turnNumber}</div>
          </div>
          {hoursElapsed !== undefined && (
            <div className="text-right">
              <div className="text-sm text-gray-400">Day {dayNumber}</div>
              <div className="text-xs text-gray-500">{hoursElapsed}h total</div>
            </div>
          )}
        </div>
        {hoursElapsed !== undefined && (
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>Hour {hoursIntoDay} of Day {dayNumber}</span>
          </div>
        )}
      </div>

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
        flashState={flashingMetrics.energy}
        changeAmount={metricChanges.energy}
        metricKey="energy"
        showHistory={true}
        onToggleHistory={() => setExpandedMetric(expandedMetric === 'energy' ? null : 'energy')}
        historyExpanded={expandedMetric === 'energy'}
        gameState={gameState}
        initialValue={100}
        metricRange={{ min: 0, max: 100 }}
      />
      <MetricBar
        label="Hydration"
        value={metrics.hydration}
        max={100}
        color={getHydrationColor(metrics.hydration)}
        flashState={flashingMetrics.hydration}
        changeAmount={metricChanges.hydration}
        metricKey="hydration"
        showHistory={true}
        onToggleHistory={() => setExpandedMetric(expandedMetric === 'hydration' ? null : 'hydration')}
        historyExpanded={expandedMetric === 'hydration'}
        gameState={gameState}
        initialValue={100}
        metricRange={{ min: 0, max: 100 }}
      />
      <div className={`relative rounded p-2 -mx-2 transition-colors ${flashingMetrics.bodyTemperature ? `flash-${flashingMetrics.bodyTemperature}` : ''}`}>
        <div className="flex justify-between text-base text-gray-400 mb-1">
          <div className="flex items-center gap-2">
            <span>Body Temperature</span>
            {isCritical('bodyTemperature', metrics.bodyTemperature) && (
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            )}
          </div>
          <span className={`font-mono ${flashingMetrics.bodyTemperature ? 'pulse-value' : ''}`}>
            {metrics.bodyTemperature.toFixed(1)}°C
          </span>
        </div>
        <div className="relative">
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ${getBodyTempBarColor(metrics.bodyTemperature)} ${isCritical('bodyTemperature', metrics.bodyTemperature) ? 'animate-pulse' : ''}`}
              style={{ width: `${getBodyTempPercentage(metrics.bodyTemperature)}%` }}
            />
          </div>
          <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-white opacity-50" style={{ transform: 'translateX(-50%)' }} />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>32°C Hypothermic</span>
            <span>37°C Normal</span>
            <span>42°C Heat Exhaustion</span>
          </div>
        </div>
        {metricChanges.bodyTemperature !== undefined && Math.abs(metricChanges.bodyTemperature) > 0.01 && (
          <MetricChangeIndicator change={metricChanges.bodyTemperature} />
        )}
        {gameState && (
          <button
            onClick={() => setExpandedMetric(expandedMetric === 'bodyTemperature' ? null : 'bodyTemperature')}
            className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1"
            aria-expanded={expandedMetric === 'bodyTemperature'}
          >
            {expandedMetric === 'bodyTemperature' ? (
              <>
                <ChevronDown className="w-3 h-3" />
                Hide History
              </>
            ) : (
              <>
                <ChevronRight className="w-3 h-3" />
                View History
              </>
            )}
          </button>
        )}
        {expandedMetric === 'bodyTemperature' && gameState && (
          <div className="mt-2 animate-slideDown">
            <StatTrendGraph
              history={gameState.history}
              metricKey="bodyTemperature"
              metricLabel="Body Temperature"
              initialValue={37}
              metricRange={{ min: 32, max: 42 }}
            />
          </div>
        )}
      </div>

      <div className={`pt-3 border-t border-gray-700 relative rounded p-2 -mx-2 transition-colors ${flashingMetrics.morale ? `flash-${flashingMetrics.morale}` : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="text-base text-gray-400 flex items-center gap-2">
            Morale
            {isCritical('morale', metrics.morale) && (
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            )}
          </div>
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-gray-500 hover:text-gray-300 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-900 border border-gray-700 rounded p-3 text-xs text-gray-300 hidden group-hover:block z-50 shadow-lg">
              <div className="font-semibold text-blue-400 mb-1">Morale affects:</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Decision success rates (±10%)</li>
                <li>Signal effectiveness</li>
                <li>Survival probability</li>
                <li>Unlocks special decisions</li>
              </ul>
              <div className="mt-2 text-gray-400 italic">
                Current impact: {getMoraleImpactDescription(metrics.morale)}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-mono ${getMoraleColor(metrics.morale)} ${flashingMetrics.morale ? 'pulse-value' : ''}`}>
            {getMoraleLabel(metrics.morale)}
          </div>
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getMoraleBarColor(metrics.morale)} ${isCritical('morale', metrics.morale) ? 'animate-pulse' : ''}`}
              style={{ width: `${metrics.morale}%` }}
            />
          </div>
        </div>
        {metricChanges.morale !== undefined && Math.abs(metricChanges.morale) > 0.01 && (
          <MetricChangeIndicator change={metricChanges.morale} />
        )}
        {gameState && (
          <button
            onClick={() => setExpandedMetric(expandedMetric === 'morale' ? null : 'morale')}
            className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1"
            aria-expanded={expandedMetric === 'morale'}
          >
            {expandedMetric === 'morale' ? (
              <>
                <ChevronDown className="w-3 h-3" />
                Hide History
              </>
            ) : (
              <>
                <ChevronRight className="w-3 h-3" />
                View History
              </>
            )}
          </button>
        )}
        {expandedMetric === 'morale' && gameState && (
          <div className="mt-2 animate-slideDown">
            <StatTrendGraph
              history={gameState.history}
              metricKey="morale"
              metricLabel="Morale"
              initialValue={100}
              metricRange={{ min: 0, max: 100 }}
            />
          </div>
        )}
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
            {equipment.map((item, index) => {
              const ItemIcon = getEquipmentIcon(item.name);
              return (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <ItemIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-400">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.quantity > 1 && (
                      <span className="text-gray-500">×{item.quantity}</span>
                    )}
                    <span className={`${getConditionColor(item.condition)} font-mono text-sm`}>
                      {item.condition}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Low Resource Warnings */}
          {(() => {
            const warnings = getLowResourceWarnings(equipment);
            if (warnings.length === 0) return null;

            return (
              <div className="pt-3 border-t border-red-900/50 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-300 font-semibold">Resource Warnings</span>
                </div>
                <div className="space-y-1.5">
                  {warnings.map((warning, idx) => (
                    <div
                      key={idx}
                      className={`
                        p-2 rounded text-xs flex items-start gap-2
                        ${warning.warning.startsWith('CRITICAL')
                          ? 'bg-red-900/30 border border-red-700 text-red-200'
                          : 'bg-orange-900/20 border border-orange-700 text-orange-200'
                        }
                      `}
                    >
                      <span className="text-base flex-shrink-0">
                        {warning.warning.startsWith('CRITICAL') ? '🚨' : '⚠️'}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold">{warning.warning}</div>
                        {warning.quantity <= 1 && (
                          <div className="text-[10px] mt-0.5 opacity-75">
                            Gather or find more before it runs out
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

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

              {/* Next Principles to Discover */}
              {gameState && turnNumber >= 3 && (() => {
                const nextPrinciples = getNextPrinciples(gameState, 2);
                return nextPrinciples.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-blue-300 font-medium">Almost Discovered:</span>
                    </div>
                    {nextPrinciples.map((next, idx) => (
                      <div key={idx} className="pl-5 text-xs text-gray-400 leading-relaxed">
                        <span className="mr-1">{getCategoryIcon(next.category)}</span>
                        <span className="italic">{next.principle.substring(0, 60)}{next.principle.length > 60 ? '...' : ''}</span>
                        <div className="text-[10px] text-gray-500 mt-0.5">Unlock: {next.hint}</div>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
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

      {/* Rescue Status - Show after turn 2 */}
      {gameState && turnNumber >= 2 && (() => {
        const rescueStatus = calculateRescueStatus(gameState);
        return (
          <div className="pt-3 border-t border-blue-900/50 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-5 h-5 text-blue-400" />
              <div className="text-base font-medium text-blue-300">Rescue Status</div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Signal Attempts:</span>
                <span className="text-gray-300 font-mono">
                  {rescueStatus.successfulSignals} / {rescueStatus.requiredSignals}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Rescue Probability:</span>
                <span className={`font-semibold ${getRescueProbabilityColor(rescueStatus.rescueProbability)}`}>
                  {rescueStatus.rescueProbability.toFixed(0)}% ({getRescueProbabilityDescription(rescueStatus.rescueProbability)})
                </span>
              </div>

              {rescueStatus.estimatedTurnsToRescue !== null && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Est. Time:</span>
                  <span className="text-gray-300 font-mono">
                    {rescueStatus.estimatedTurnsToRescue} turn{rescueStatus.estimatedTurnsToRescue !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Progress bars for closest win condition */}
              <div className="mt-3 space-y-2">
                {rescueStatus.activeWinConditions
                  .filter(c => c.progress > 0)
                  .slice(0, 2)
                  .map((condition, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">{condition.description}</span>
                        <span className="text-gray-500">{condition.progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getWinConditionBarColor(condition.type)}`}
                          style={{ width: `${condition.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

interface MetricBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  flashState?: 'positive' | 'negative';
  changeAmount?: number;
  metricKey?: keyof PlayerMetrics;
  isInverse?: boolean;
  showHistory?: boolean;
  onToggleHistory?: () => void;
  historyExpanded?: boolean;
  gameState?: GameState;
  initialValue?: number;
  metricRange?: { min: number; max: number };
}

function MetricBar({
  label,
  value,
  max,
  color,
  flashState,
  changeAmount,
  metricKey,
  isInverse = false,
  showHistory = false,
  onToggleHistory,
  historyExpanded = false,
  gameState,
  initialValue = 100,
  metricRange = { min: 0, max: 100 }
}: MetricBarProps) {
  const percentage = (value / max) * 100;
  const isCriticalStat = metricKey && isCritical(metricKey, value);

  return (
    <div>
      {/* Container with flash animation */}
      <div className={`relative rounded p-2 -mx-2 transition-colors ${flashState ? `flash-${flashState}` : ''}`}>
        <div className="flex justify-between text-base text-gray-400 mb-1">
          <div className="flex items-center gap-2">
            <span>{label}</span>
            {isCriticalStat && (
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            )}
          </div>
          <span className={`font-mono ${flashState ? 'pulse-value' : ''}`}>
            {Math.round(value)}
          </span>
        </div>

        {/* Metric bar with threshold markers */}
        <div className="relative h-3 bg-gray-800 rounded-full overflow-visible mb-1">
          {/* Threshold markers */}
          <div className="absolute top-0 left-1/4 w-px h-4 bg-red-500/30" title="Critical (25%)" />
          <div className="absolute top-0 left-1/2 w-px h-4 bg-yellow-500/30" title="Warning (50%)" />
          <div className="absolute top-0 left-3/4 w-px h-4 bg-green-500/30" title="Good (75%)" />

          {/* Progress bar */}
          <div
            className={`h-full transition-all duration-500 ${color} ${isCriticalStat ? 'animate-pulse' : ''}`}
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        </div>

        {/* Change indicator */}
        {changeAmount !== undefined && Math.abs(changeAmount) > 0.01 && (
          <MetricChangeIndicator change={changeAmount} isInverse={isInverse} />
        )}

        {/* View History button */}
        {showHistory && gameState && metricKey && (
          <button
            onClick={onToggleHistory}
            className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1"
            aria-expanded={historyExpanded}
          >
            {historyExpanded ? (
              <>
                <ChevronDown className="w-3 h-3" />
                Hide History
              </>
            ) : (
              <>
                <ChevronRight className="w-3 h-3" />
                View History
              </>
            )}
          </button>
        )}
      </div>

      {/* Trend graph (expanded) */}
      {historyExpanded && showHistory && gameState && metricKey && (
        <div className="mt-2 animate-slideDown">
          <StatTrendGraph
            history={gameState.history}
            metricKey={metricKey}
            metricLabel={label}
            initialValue={initialValue}
            metricRange={metricRange}
            isInverse={isInverse}
          />
        </div>
      )}
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

function getMoraleBarColor(value: number): string {
  if (value > 70) return 'bg-green-500';
  if (value > 60) return 'bg-green-600';
  if (value > 50) return 'bg-yellow-500';
  if (value > 30) return 'bg-orange-500';
  return 'bg-red-500';
}

function getMoraleImpactDescription(morale: number): string {
  const modifier = (morale - 50) / 100;
  const successAdjustment = modifier * 0.2 * 100; // Convert to percentage

  if (morale > 70) {
    return `+${Math.round(successAdjustment)}% success rate, can attempt challenging climbs`;
  } else if (morale > 60) {
    return `+${Math.round(successAdjustment)}% success rate, steady performance`;
  } else if (morale > 50) {
    return `+${Math.round(successAdjustment)}% success rate, baseline performance`;
  } else if (morale > 30) {
    return `${Math.round(successAdjustment)}% success rate, decisions more risky`;
  } else {
    return `${Math.round(successAdjustment)}% success rate, prone to panic decisions`;
  }
}

function getRescueProbabilityColor(probability: number): string {
  if (probability >= 70) return 'text-green-400';
  if (probability >= 50) return 'text-blue-400';
  if (probability >= 30) return 'text-yellow-400';
  if (probability >= 15) return 'text-orange-400';
  return 'text-red-400';
}

function getWinConditionBarColor(type: 'signal' | 'navigate' | 'endure'): string {
  if (type === 'signal') return 'bg-blue-500';
  if (type === 'navigate') return 'bg-green-500';
  return 'bg-purple-500';
}
