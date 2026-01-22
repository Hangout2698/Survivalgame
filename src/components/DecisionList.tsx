import type { Decision } from '../types/game';
import { Activity } from 'lucide-react';

interface DecisionListProps {
  decisions: Decision[];
  onSelect: (decision: Decision) => void;
  disabled?: boolean;
}

export function DecisionList({ decisions, onSelect, disabled = false }: DecisionListProps) {
  return (
    <div className="space-y-3">
      {decisions.map((decision) => (
        <button
          key={decision.id}
          onClick={() => onSelect(decision)}
          disabled={disabled}
          className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed border border-gray-700 hover:border-gray-600 disabled:border-gray-800 rounded transition-colors"
        >
          <div className="flex items-start gap-3">
            <Activity className="w-6 h-6 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-gray-100 leading-relaxed text-lg">{decision.text}</div>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>Effort: {getEffortLabel(decision.energyCost)}</span>
                <span>Time: {decision.timeRequired}h</span>
              </div>
            </div>
          </div>
        </button>
      ))}
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
