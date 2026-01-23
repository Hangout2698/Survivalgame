import { useEffect, useRef } from 'react';
import type { DecisionOutcome } from '../types/game';
import { Clock, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface ActionHistoryProps {
  history: DecisionOutcome[];
  maxVisible?: number;
  currentTurn?: number;
}

export function ActionHistory({ history, maxVisible = 5 }: ActionHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history.length]);

  // Get most recent entries
  const recentHistory = history.slice(-maxVisible);

  if (recentHistory.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-30">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
        <div className="px-4 py-2 border-b border-gray-700 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-300">Recent Actions</h3>
        </div>

        <div
          ref={containerRef}
          className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        >
          <div className="p-3 space-y-2">
            {recentHistory.map((entry, index) => (
              <ActionEntry
                key={index}
                entry={entry}
                isLatest={index === recentHistory.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActionEntryProps {
  entry: DecisionOutcome;
  isLatest: boolean;
}

function ActionEntry({ entry, isLatest }: ActionEntryProps) {
  const hasPositiveEffect = Object.entries(entry.metricsChange).some(
    ([key, value]) => {
      if (key === 'injurySeverity' || key === 'cumulativeRisk') {
        return (value || 0) < 0; // For these, lower is better
      }
      return (value || 0) > 0;
    }
  );

  const icon = entry.decisionQuality === 'critical-error' || entry.decisionQuality === 'poor'
    ? AlertTriangle
    : hasPositiveEffect
    ? TrendingUp
    : TrendingDown;

  const iconColor = entry.decisionQuality === 'excellent'
    ? 'text-green-400'
    : entry.decisionQuality === 'good'
    ? 'text-blue-400'
    : entry.decisionQuality === 'poor'
    ? 'text-orange-400'
    : 'text-red-400';

  const Icon = icon;

  return (
    <div
      className={`
        text-xs p-2 rounded border transition-all duration-300
        ${isLatest ? 'bg-blue-900/20 border-blue-700/50 animate-fadeIn' : 'bg-gray-800/50 border-gray-700/50'}
      `}
    >
      <div className="flex items-start gap-2">
        <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-gray-300 leading-relaxed mb-1">
            {entry.decision.text}
          </p>

          {/* Show metric changes */}
          <div className="flex flex-wrap gap-2 text-[10px]">
            {Object.entries(entry.metricsChange).map(([key, value]) => {
              if (value === 0 || value === undefined) return null;

              const displayKey = formatMetricKey(key);
              const numValue = value as number;
              const isPositive = ['injurySeverity', 'cumulativeRisk'].includes(key)
                ? numValue < 0
                : numValue > 0;

              return (
                <span
                  key={key}
                  className={`
                    px-1.5 py-0.5 rounded
                    ${isPositive ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}
                  `}
                >
                  {displayKey} {numValue > 0 ? '+' : ''}{Math.round(numValue)}
                </span>
              );
            })}

            {entry.decision.timeRequired && entry.decision.timeRequired > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">
                ⏱ {entry.decision.timeRequired}h
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatMetricKey(key: string): string {
  const labels: Record<string, string> = {
    energy: 'Energy',
    hydration: 'H₂O',
    bodyTemperature: 'Temp',
    morale: 'Morale',
    shelter: 'Shelter',
    injurySeverity: 'Injury',
    signalEffectiveness: 'Signal',
    cumulativeRisk: 'Risk'
  };
  return labels[key] || key;
}
