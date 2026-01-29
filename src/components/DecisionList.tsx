import { useState } from 'react';
import type { Decision, GameState } from '../types/game';
import { EnhancedDecisionCard } from './EnhancedDecisionCard';

interface DecisionListProps {
  decisions: Decision[];
  onSelect: (decision: Decision) => void;
  disabled?: boolean;
  gameState?: GameState;
}

export function DecisionList({ decisions, onSelect, disabled = false, gameState }: DecisionListProps) {
  const [showAll, setShowAll] = useState(false);

  // Show first 4 decisions on mobile when not expanded
  const MOBILE_DECISION_LIMIT = 4;
  const hasMoreDecisions = decisions.length > MOBILE_DECISION_LIMIT;
  const displayedDecisions = !showAll && hasMoreDecisions
    ? decisions.slice(0, MOBILE_DECISION_LIMIT)
    : decisions;
  // If gameState is provided, use enhanced cards
  if (gameState) {
    return (
      <div className="space-y-4">
        {displayedDecisions.map((decision) => (
          <EnhancedDecisionCard
            key={decision.id}
            decision={decision}
            gameState={gameState}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}

        {/* Show all button for mobile */}
        {hasMoreDecisions && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="md:hidden w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 active:scale-95 rounded-lg text-sm text-gray-300 font-medium transition-all border border-gray-700"
          >
            {showAll
              ? `Show fewer decisions`
              : `Show all ${decisions.length} decisions`
            }
          </button>
        )}
      </div>
    );
  }

  // Fallback to simple cards if no gameState
  return (
    <div className="space-y-3">
      {displayedDecisions.map((decision) => (
        <button
          key={decision.id}
          onClick={() => onSelect(decision)}
          disabled={disabled}
          className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed border border-gray-700 hover:border-gray-600 disabled:border-gray-800 rounded transition-colors"
        >
          <div className="text-gray-100 leading-relaxed text-lg mb-2">{decision.text}</div>
          <div className="flex gap-4 text-sm text-gray-500">
            <span>Effort: {getEffortLabel(decision.energyCost)}</span>
            <span>Time: {decision.timeRequired}h</span>
          </div>
        </button>
      ))}

      {/* Show all button for mobile */}
      {hasMoreDecisions && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="md:hidden w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 active:scale-95 rounded-lg text-sm text-gray-300 font-medium transition-all border border-gray-700"
        >
          {showAll
            ? `Show fewer decisions`
            : `Show all ${decisions.length} decisions`
          }
        </button>
      )}
    </div>
  );
}

function getEffortLabel(energyCost: number): string {
  if (energyCost < 0) return 'Recovery';
  if (energyCost < 15) return 'Minimal';
  if (energyCost < 25) return 'Light';
  if (energyCost < 35) return 'Moderate';
  if (energyCost < 45) return 'High';
  return 'Extreme';
}
