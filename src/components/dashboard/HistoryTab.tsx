import React, { useState, useMemo } from 'react';
import { GameState, DecisionOutcome } from '../../types/game';

interface HistoryTabProps {
  gameState: GameState;
  compact?: boolean;
}

type FilterType = 'all' | 'good' | 'poor' | 'critical';

/**
 * History Tab - Displays decision history with quality indicators
 * Shows extended decision log with filtering and metrics changes
 */
const HistoryTab: React.FC<HistoryTabProps> = ({ gameState, compact }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const { history } = gameState;

  // Calculate decision quality stats
  const stats = useMemo(() => {
    const excellent = history.filter(h => h.decisionQuality === 'excellent').length;
    const good = history.filter(h => h.decisionQuality === 'good').length;
    const poor = history.filter(h => h.decisionQuality === 'poor').length;
    const critical = history.filter(h => h.decisionQuality === 'critical-error').length;

    return { excellent, good, poor, critical };
  }, [history]);

  // Filter and slice history
  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    if (filter === 'good') {
      filtered = filtered.filter(h => h.decisionQuality === 'excellent' || h.decisionQuality === 'good');
    } else if (filter === 'poor') {
      filtered = filtered.filter(h => h.decisionQuality === 'poor');
    } else if (filter === 'critical') {
      filtered = filtered.filter(h => h.decisionQuality === 'critical-error');
    }

    // Show most recent 15 items
    return filtered.slice(-15).reverse();
  }, [history, filter]);

  // Quality indicator component
  const QualityIndicator: React.FC<{ quality: string }> = ({ quality }) => {
    const qualityConfig: Record<string, { icon: string; label: string; color: string }> = {
      'excellent': { icon: '⬆️', label: 'Excellent', color: 'text-green-400' },
      'good': { icon: '○', label: 'Good', color: 'text-cyan-400' },
      'poor': { icon: '⬇️', label: 'Poor', color: 'text-orange-400' },
      'critical-error': { icon: '⚠️', label: 'Critical', color: 'text-red-400' },
    };

    const config = qualityConfig[quality] || qualityConfig['good'];

    return (
      <div className={`flex items-center gap-1 ${config.color}`}>
        <span>{config.icon}</span>
        <span className="text-xs font-medium">{config.label}</span>
      </div>
    );
  };

  // Decision entry component
  const DecisionEntry: React.FC<{ entry: DecisionOutcome; index: number }> = ({ entry, index }) => {
    const actualTurn = history.length - index; // Calculate actual turn number

    // Format metrics changes
    const metricsChanges = Object.entries(entry.metricsChange || {})
      .filter(([, value]) => typeof value === 'number' && value !== 0)
      .map(([key, value]) => {
        const numValue = value as number;
        const displayKey = key === 'injurySeverity' ? 'injury' :
                          key === 'bodyTemperature' ? 'temp' :
                          key === 'signalEffectiveness' ? 'signal' :
                          key === 'cumulativeRisk' ? 'risk' :
                          key === 'survivalProbability' ? 'survival' :
                          key;

        const color = numValue > 0
          ? (key === 'injurySeverity' || key === 'cumulativeRisk' ? 'text-red-400' : 'text-green-400')
          : (key === 'injurySeverity' || key === 'cumulativeRisk' ? 'text-green-400' : 'text-red-400');

        const prefix = numValue > 0 ? '+' : '';
        const displayValue = key === 'bodyTemperature'
          ? `${prefix}${numValue.toFixed(1)}°C`
          : `${prefix}${Math.round(numValue)}`;

        return { key: displayKey, value: displayValue, color };
      });

    return (
      <div className="bg-slate-900/30 rounded p-3 border border-slate-700/50 hover:border-slate-600 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
              T{actualTurn}
            </span>
            <QualityIndicator quality={entry.decisionQuality || 'good'} />
          </div>
          {entry.decision.timeRequired && (
            <span className="text-xs text-slate-500">
              {entry.decision.timeRequired}h
            </span>
          )}
        </div>

        {/* Decision Text */}
        <div className="text-sm text-slate-200 mb-2">
          {entry.decision.text}
        </div>

        {/* Metrics Changes */}
        {metricsChanges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metricsChanges.map(({ key, value, color }) => (
              <span
                key={key}
                className={`text-xs px-2 py-0.5 rounded bg-slate-800/50 ${color} font-medium`}
              >
                {key}: {value}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Empty state
  if (history.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-3">📜</div>
        <div className="text-sm text-slate-400">No actions taken yet</div>
        <div className="text-xs text-slate-500 mt-1">
          Your decision history will appear here
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-4 ${compact ? 'text-sm' : ''}`}>
      {/* Summary Stats */}
      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xs text-slate-400">Excellent</div>
            <div className="text-lg font-bold text-green-400">{stats.excellent}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Good</div>
            <div className="text-lg font-bold text-cyan-400">{stats.good}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Poor</div>
            <div className="text-lg font-bold text-orange-400">{stats.poor}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Critical</div>
            <div className="text-lg font-bold text-red-400">{stats.critical}</div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'good', 'poor', 'critical'] as FilterType[]).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              filter === filterType
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
            }`}
          >
            {filterType === 'all' ? 'All' :
             filterType === 'good' ? 'Good' :
             filterType === 'poor' ? 'Poor' :
             'Critical'}
            {filterType !== 'all' && (
              <span className="ml-1 text-xs opacity-75">
                ({filterType === 'good' ? stats.excellent + stats.good :
                  filterType === 'poor' ? stats.poor :
                  stats.critical})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* History List */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Recent Decisions ({filteredHistory.length})
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No decisions match this filter
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredHistory.map((entry, index) => (
              <DecisionEntry key={index} entry={entry} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(HistoryTab);
