import type { GameState } from '../types/game';

interface DecisionTimelineProps {
  state: GameState;
  highlightRootCauseTurn?: number;
  highlightPointOfNoReturn?: number;
}

export default function DecisionTimeline({
  state,
  highlightRootCauseTurn,
  highlightPointOfNoReturn
}: DecisionTimelineProps) {
  const crossings = state.metricThresholdCrossings || [];

  return (
    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
      <h3 className="text-lg font-bold text-amber-400 mb-4">Decision Timeline</h3>

      <div className="flex gap-2 pb-4 min-w-max">
        {state.history.map((outcome, index) => {
          const turn = index + 1;
          const isRootCause = turn === highlightRootCauseTurn;
          const isPointOfNoReturn = turn === highlightPointOfNoReturn;

          // Find threshold crossings for this turn
          const turnCrossings = crossings.filter(c => c.turn === turn);
          const hasCriticalCrossing = turnCrossings.some(c => c.crossingType === 'critical' || c.crossingType === 'fatal');
          const hasDangerCrossing = turnCrossings.some(c => c.crossingType === 'danger');
          const hasWarningCrossing = turnCrossings.some(c => c.crossingType === 'warning');

          // Determine border color based on decision quality and crossings
          let borderColor = 'border-gray-600';
          if (isRootCause) {
            borderColor = 'border-red-500 shadow-lg shadow-red-500/50';
          } else if (isPointOfNoReturn) {
            borderColor = 'border-orange-500 shadow-lg shadow-orange-500/50';
          } else if (hasCriticalCrossing) {
            borderColor = 'border-red-400';
          } else if (hasDangerCrossing) {
            borderColor = 'border-orange-400';
          } else if (hasWarningCrossing) {
            borderColor = 'border-yellow-400';
          } else if (outcome.decisionQuality === 'excellent') {
            borderColor = 'border-green-500';
          } else if (outcome.decisionQuality === 'good') {
            borderColor = 'border-green-400';
          } else if (outcome.decisionQuality === 'poor') {
            borderColor = 'border-orange-300';
          } else if (outcome.decisionQuality === 'critical-error') {
            borderColor = 'border-red-300';
          }

          // Get quality indicator
          let qualityIndicator = '';
          let qualityColor = 'text-gray-400';
          if (outcome.decisionQuality === 'excellent') {
            qualityIndicator = '✓✓';
            qualityColor = 'text-green-400';
          } else if (outcome.decisionQuality === 'good') {
            qualityIndicator = '✓';
            qualityColor = 'text-green-300';
          } else if (outcome.decisionQuality === 'poor') {
            qualityIndicator = '⚠';
            qualityColor = 'text-orange-300';
          } else if (outcome.decisionQuality === 'critical-error') {
            qualityIndicator = '✗';
            qualityColor = 'text-red-400';
          }

          // Get metric changes summary
          const significantChanges: string[] = [];
          if (outcome.metricsChange.energy && Math.abs(outcome.metricsChange.energy) > 10) {
            const sign = outcome.metricsChange.energy > 0 ? '+' : '';
            const color = outcome.metricsChange.energy > 0 ? 'text-green-400' : 'text-red-400';
            significantChanges.push(
              `<span class="${color}">Energy ${sign}${outcome.metricsChange.energy.toFixed(0)}</span>`
            );
          }
          if (outcome.metricsChange.hydration && Math.abs(outcome.metricsChange.hydration) > 10) {
            const sign = outcome.metricsChange.hydration > 0 ? '+' : '';
            const color = outcome.metricsChange.hydration > 0 ? 'text-green-400' : 'text-red-400';
            significantChanges.push(
              `<span class="${color}">Hydration ${sign}${outcome.metricsChange.hydration.toFixed(0)}</span>`
            );
          }
          if (outcome.metricsChange.bodyTemperature && Math.abs(outcome.metricsChange.bodyTemperature) > 0.5) {
            const sign = outcome.metricsChange.bodyTemperature > 0 ? '+' : '';
            const color = Math.abs(37 - (state.metrics.bodyTemperature + outcome.metricsChange.bodyTemperature)) <
              Math.abs(37 - state.metrics.bodyTemperature) ? 'text-green-400' : 'text-red-400';
            significantChanges.push(
              `<span class="${color}">Temp ${sign}${outcome.metricsChange.bodyTemperature.toFixed(1)}°C</span>`
            );
          }
          if (outcome.metricsChange.injurySeverity && Math.abs(outcome.metricsChange.injurySeverity) > 5) {
            const sign = outcome.metricsChange.injurySeverity > 0 ? '+' : '';
            const color = outcome.metricsChange.injurySeverity > 0 ? 'text-red-400' : 'text-green-400';
            significantChanges.push(
              `<span class="${color}">Injury ${sign}${outcome.metricsChange.injurySeverity.toFixed(0)}</span>`
            );
          }

          return (
            <div
              key={turn}
              className={`flex-shrink-0 w-48 border-2 ${borderColor} rounded-lg p-3 bg-gray-800`}
            >
              {/* Turn number and quality indicator */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-400">Turn {turn}</span>
                <span className={`text-sm font-bold ${qualityColor}`}>{qualityIndicator}</span>
              </div>

              {/* Decision text */}
              <div className="text-sm text-white mb-2 line-clamp-2" title={outcome.decision.text}>
                {outcome.decision.text}
              </div>

              {/* Metric changes */}
              {significantChanges.length > 0 && (
                <div
                  className="text-xs space-y-1"
                  dangerouslySetInnerHTML={{ __html: significantChanges.join('<br/>') }}
                />
              )}

              {/* Threshold crossing indicators */}
              {turnCrossings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {turnCrossings.map((crossing, idx) => {
                    let icon = '';
                    let textColor = 'text-gray-400';
                    if (crossing.crossingType === 'fatal') {
                      icon = '💀';
                      textColor = 'text-red-500';
                    } else if (crossing.crossingType === 'critical') {
                      icon = '🔴';
                      textColor = 'text-red-400';
                    } else if (crossing.crossingType === 'danger') {
                      icon = '⚠️';
                      textColor = 'text-orange-400';
                    } else if (crossing.crossingType === 'warning') {
                      icon = '⚡';
                      textColor = 'text-yellow-400';
                    }

                    return (
                      <div key={idx} className={`text-xs ${textColor} flex items-center gap-1`}>
                        <span>{icon}</span>
                        <span className="uppercase font-bold">{crossing.crossingType}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Special labels */}
              {isRootCause && (
                <div className="mt-2 text-xs font-bold text-red-500 bg-red-900/30 px-2 py-1 rounded">
                  ROOT CAUSE
                </div>
              )}
              {isPointOfNoReturn && (
                <div className="mt-2 text-xs font-bold text-orange-500 bg-orange-900/30 px-2 py-1 rounded">
                  POINT OF NO RETURN
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-500 rounded"></div>
          <span className="text-gray-400">Excellent Decision</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-400 rounded"></div>
          <span className="text-gray-400">Good Decision</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-300 rounded"></div>
          <span className="text-gray-400">Poor Decision</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-red-300 rounded"></div>
          <span className="text-gray-400">Critical Error</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">⚡</span>
          <span className="text-gray-400">Warning Threshold</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-orange-400">⚠️</span>
          <span className="text-gray-400">Danger Threshold</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-400">🔴</span>
          <span className="text-gray-400">Critical Threshold</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-500">💀</span>
          <span className="text-gray-400">Fatal Threshold</span>
        </div>
      </div>
    </div>
  );
}
