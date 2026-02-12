import type { GameState } from '../types/game';
import { Target, Clock, TrendingUp, Award } from 'lucide-react';

interface ObjectiveDisplayProps {
  gameState: GameState;
}

export function ObjectiveDisplay({ gameState }: ObjectiveDisplayProps) {
  const hoursElapsed = gameState.hoursElapsed;
  const turnsCompleted = gameState.turnNumber - 1;
  const survivalProb = gameState.metrics.survivalProbability;
  const signalAttempts = gameState.signalAttempts || 0;
  const successfulSignals = gameState.successfulSignals || 0;

  // Estimate distance/progress
  const navigationAttempts = gameState.history.filter(h =>
    h.decision.id.includes('navigate') ||
    h.decision.id.includes('retrace') ||
    h.wasNavigationSuccess
  ).length;

  const successfulNavigation = gameState.history.filter(h => h.wasNavigationSuccess).length;

  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-2 border-blue-700/50 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <Target className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-bold text-blue-300">Mission Objectives</h2>
      </div>

      {/* Primary Objectives */}
      <div className="space-y-3 mb-5">
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="font-semibold text-gray-200">Primary Goal</span>
            </div>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            <strong>Reach expedition camp</strong> (4-6 km south-southwest)<br />
            <span className="text-xs text-gray-300">OR</span><br />
            <strong>Survive until rescue</strong> (typically 24-48 hours)
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-300">Time Survived</span>
            </div>
            <div className="text-lg font-bold text-blue-300">
              {hoursElapsed}h
            </div>
            <div className="text-xs text-gray-300">
              {turnsCompleted} turns completed
            </div>
          </div>

          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-300">Survival Chance</span>
            </div>
            <div className={`text-lg font-bold ${
              survivalProb >= 70 ? 'text-green-400' :
              survivalProb >= 50 ? 'text-yellow-400' :
              survivalProb >= 30 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {Math.round(survivalProb)}%
            </div>
            <div className="text-xs text-gray-300">
              Current viability
            </div>
          </div>

          {signalAttempts > 0 && (
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">📡</span>
                <span className="text-xs text-gray-300">Signal Attempts</span>
              </div>
              <div className="text-lg font-bold text-blue-300">
                {successfulSignals}/{signalAttempts}
              </div>
              <div className="text-xs text-gray-300">
                Successful signals
              </div>
            </div>
          )}

          {navigationAttempts > 0 && (
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🧭</span>
                <span className="text-xs text-gray-300">Navigation</span>
              </div>
              <div className="text-lg font-bold text-blue-300">
                {successfulNavigation}/{navigationAttempts}
              </div>
              <div className="text-xs text-gray-300">
                Progress made
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Win Conditions */}
      <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-4 h-4 text-green-400" />
          <span className="text-sm font-semibold text-green-300">Win Conditions</span>
        </div>
        <ul className="text-xs text-gray-300 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Successfully navigate to expedition camp</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Signal rescue successfully (5+ effective signals after turn 12)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Endure survival (15+ turns with 55%+ survival probability)</span>
          </li>
        </ul>
      </div>

      {/* Loss Conditions */}
      <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">⚠️</span>
          <span className="text-sm font-semibold text-red-300">Fail Conditions</span>
        </div>
        <ul className="text-xs text-gray-300 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">✗</span>
            <span>Energy ≤ 3 (collapse/death)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">✗</span>
            <span>Hydration ≤ 5 (severe dehydration)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">✗</span>
            <span>Body Temperature ≤ 31.5°C (hypothermia) or ≥ 41.5°C (hyperthermia)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">✗</span>
            <span>Injury Severity ≥ 90 (critical injury)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">✗</span>
            <span>Survival Probability &lt; 5% (after turn 5)</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
