import { useState, useEffect } from 'react';
import type { GameState, Decision } from '../types/game';
import { createNewGame, makeDecision, getAvailableDecisions } from '../engine/gameController';
import { generateBriefing, generateConciseBrief } from '../engine/briefingGenerator';
import { MetricsDisplay } from './MetricsDisplay';
import { DecisionList } from './DecisionList';
import { GameOutcome } from './GameOutcome';
import { EnvironmentBackground } from './EnvironmentBackground';
import { DecisionIllustration } from './DecisionIllustration';
import { Notification } from './Notification';
import { CloudSnow } from 'lucide-react';

export function Game() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [recentOutcome, setRecentOutcome] = useState<string>('');
  const [showOutcome, setShowOutcome] = useState(false);
  const [lastDecisionId, setLastDecisionId] = useState<string>('');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'warning' | 'info' | 'danger';
  } | null>(null);

  useEffect(() => {
    createNewGame().then(setGameState);
  }, []);
  useEffect(() => {
    if (gameState && gameState.status === 'active') {
      const newDecisions = getAvailableDecisions(gameState);
      setDecisions(newDecisions);
    }
  }, [gameState]);

  const handleDecision = (decision: Decision) => {
    if (!gameState) return;

    setRecentOutcome('');
    setLastDecisionId('');
    setNotification(null);

    const newState = makeDecision(gameState, decision);
    const lastOutcome = newState.history[newState.history.length - 1];

    setLastDecisionId(decision.id);
    setRecentOutcome(lastOutcome.immediateEffect);
    setGameState(newState);

    const notificationType =
      lastOutcome.decisionQuality === 'excellent' ? 'success' :
      lastOutcome.decisionQuality === 'poor' || lastOutcome.decisionQuality === 'critical-error' ? 'danger' :
      decision.riskLevel >= 7 ? 'warning' :
      'info';

    setNotification({
      message: lastOutcome.immediateEffect,
      type: notificationType
    });

    if (newState.status === 'ended') {
      setTimeout(() => setShowOutcome(true), 1000);
    }
  };

  const handleNewGame = async () => {
    setRecentOutcome('');
    setShowOutcome(false);
    setLastDecisionId('');
    setNotification(null);
    const newGame = await createNewGame();
    setGameState(newGame);
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading survival scenario...</p>
        </div>
      </div>
    );
  }

  if (gameState.status === 'ended' && showOutcome) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4 relative">
        <EnvironmentBackground environment={gameState.currentEnvironment} />
        <div className="max-w-3xl mx-auto py-8 relative z-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-light text-gray-100 mb-2">Survival</h1>
            <p className="text-gray-500">A decision game</p>
          </div>
          <GameOutcome state={gameState} onNewGame={handleNewGame} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 relative">
      <EnvironmentBackground environment={gameState.currentEnvironment} />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}

      <div className="max-w-6xl mx-auto p-4 py-8 relative z-10">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CloudSnow className="w-8 h-8 text-gray-400" />
            <h1 className="text-3xl font-light text-gray-100">Survival</h1>
          </div>
          <p className="text-gray-500">Think. Endure. Decide.</p>
        </div>

        <div className="space-y-6">
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              {gameState.turnNumber === 1 ? (
                <div className="p-8 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="prose prose-invert max-w-none">
                    <div className="text-gray-300 leading-relaxed whitespace-pre-line text-xl columns-2 gap-8">
                      {generateBriefing(gameState.scenario)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="text-gray-300 leading-relaxed whitespace-pre-line text-base">
                    {generateConciseBrief(
                      gameState.scenario,
                      gameState.metrics,
                      gameState.currentTimeOfDay,
                      gameState.equipment,
                      gameState.history.length > 0 ? gameState.history[gameState.history.length - 1] : undefined
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="p-6 bg-gray-900 rounded-lg border border-gray-800 sticky top-4">
                <h3 className="text-2xl text-gray-400 mb-4">Condition</h3>
                <MetricsDisplay
                  metrics={gameState.metrics}
                  equipment={gameState.equipment}
                  scenario={gameState.scenario}
                  currentTimeOfDay={gameState.currentTimeOfDay}
                  hoursElapsed={gameState.hoursElapsed}
                />
              </div>
            </div>
          </div>

          {recentOutcome && (
            <div className="p-6 bg-blue-900/20 border border-blue-800 rounded-lg relative overflow-hidden">
              {lastDecisionId && (
                <div className="absolute inset-0 pointer-events-none">
                  <DecisionIllustration
                    decisionId={lastDecisionId}
                    environment={gameState.currentEnvironment}
                  />
                </div>
              )}
              <div className="relative z-10">
                <p className="text-gray-300 leading-relaxed text-lg">{recentOutcome}</p>
                {gameState.history.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-800 space-y-1">
                    {gameState.history[gameState.history.length - 1].consequences.map(
                      (consequence, index) => (
                        <p key={index} className="text-base text-gray-400">
                          {consequence}
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="mb-4">
              <h2 className="text-2xl text-gray-400">What do you do?</h2>
              <div className="text-base text-gray-600 mt-1">Turn {gameState.turnNumber}</div>
            </div>
            <DecisionList
              decisions={decisions}
              onSelect={handleDecision}
              disabled={gameState.status !== 'active'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
