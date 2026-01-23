import { useState, useEffect } from 'react';
import type { GameState, Decision } from '../types/game';
import { createNewGame, makeDecision, getAvailableDecisions } from '../engine/gameController';
import { generateBriefing, generateConciseBrief } from '../engine/briefingGenerator';
import { getEnvironmentTips } from '../engine/survivalPrinciplesService';
import { useInventory } from '../contexts/InventoryContext';
import { getTriggeredTutorialScenario } from '../data/tutorialScenarios';
import { MetricsDisplay } from './MetricsDisplay';
import { StatusHUD, type PlayerStats } from './StatusHUD';
import { DangerVignette } from './DangerVignette';
import { ActionHistory } from './ActionHistory';
import { LoadoutScreen } from './LoadoutScreen';
import { InventoryTray } from './InventoryTray';
import { TutorialScenarioModal } from './TutorialScenarioModal';
import { DecisionList } from './DecisionList';
import { GameOutcome } from './GameOutcome';
import { EnvironmentBackground } from './EnvironmentBackground';
import { DecisionIllustration } from './DecisionIllustration';
import { Notification } from './Notification';
import { CloudSnow } from 'lucide-react';

export function Game() {
  const { resetInventory } = useInventory();
  const [loadoutComplete, setLoadoutComplete] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [recentOutcome, setRecentOutcome] = useState<string>('');
  const [showOutcome, setShowOutcome] = useState(false);
  const [lastDecisionId, setLastDecisionId] = useState<string>('');
  const [currentTutorialScenario, setCurrentTutorialScenario] = useState<any>(null);
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'warning' | 'info' | 'danger';
  } | null>(null);

  // Convert game metrics to simplified PlayerStats for HUD
  const getPlayerStats = (state: GameState | null): PlayerStats => {
    if (!state) {
      return { bodyHeat: 80, hydration: 100, energy: 100, morale: 100 };
    }

    // Map bodyTemperature (32-42°C) to bodyHeat (0-100)
    const tempRange = 42 - 32;
    const tempOffset = state.metrics.bodyTemperature - 32;
    const bodyHeat = Math.round((tempOffset / tempRange) * 100);

    return {
      bodyHeat: Math.max(0, Math.min(100, bodyHeat)),
      hydration: Math.round(state.metrics.hydration),
      energy: Math.round(state.metrics.energy),
      morale: Math.round(state.metrics.morale)
    };
  };

  const handleGameOverFromHUD = (reason: string) => {
    if (!gameState) return;

    // Force game end with the specific reason (stored in lessons[0])
    const updatedState: GameState = {
      ...gameState,
      status: 'ended',
      outcome: 'died',
      lessons: [reason, ...(gameState.lessons || [])]
    };
    setGameState(updatedState);
    setTimeout(() => setShowOutcome(true), 1000);
  };

  useEffect(() => {
    // Only create game after loadout is complete
    if (loadoutComplete && !gameState) {
      createNewGame().then(setGameState);
    }
  }, [loadoutComplete, gameState]);
  useEffect(() => {
    if (gameState && gameState.status === 'active') {
      // Check for tutorial scenario triggers
      const tutorialScenario = getTriggeredTutorialScenario(gameState);
      if (tutorialScenario && !completedTutorials.has(tutorialScenario.id)) {
        setCurrentTutorialScenario(tutorialScenario);
        return; // Don't load regular decisions while tutorial is active
      }

      const newDecisions = getAvailableDecisions(gameState);
      setDecisions(newDecisions);
    }
  }, [gameState, completedTutorials]);

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
    setGameState(null);
    setLoadoutComplete(false);
    resetInventory();
  };

  const handleLoadoutComplete = () => {
    setLoadoutComplete(true);
  };

  const handleTutorialChoice = (choiceId: string) => {
    if (!currentTutorialScenario || !gameState) return;

    const choice = currentTutorialScenario.choices.find((c: any) => c.id === choiceId);
    if (!choice) return;

    // Apply tutorial scenario outcome to game state
    const updatedMetrics = { ...gameState.metrics };
    Object.entries(choice.outcome.metricsChange).forEach(([key, value]) => {
      if (key in updatedMetrics && typeof value === 'number') {
        (updatedMetrics as any)[key] = Math.max(0, Math.min(100, (updatedMetrics as any)[key] + value));
      }
    });

    // Update game state with tutorial outcome
    const updatedState: GameState = {
      ...gameState,
      metrics: updatedMetrics,
      turnNumber: gameState.turnNumber + 1,
      history: [
        ...gameState.history,
        {
          decision: {
            id: choiceId,
            text: choice.text,
            energyCost: 0,
            riskLevel: 0,
            timeRequired: 1
          },
          consequences: [choice.outcome.principle],
          metricsChange: choice.outcome.metricsChange,
          immediateEffect: choice.outcome.immediate,
          decisionQuality: choice.outcome.quality,
          survivalPrincipleAlignment: choice.outcome.educationalFeedback
        }
      ]
    };

    setGameState(updatedState);
    setCompletedTutorials(prev => new Set([...prev, currentTutorialScenario.id]));
    setCurrentTutorialScenario(null);

    // Show notification based on quality
    const notificationType =
      choice.outcome.quality === 'excellent' ? 'success' :
      choice.outcome.quality === 'poor' || choice.outcome.quality === 'critical-error' ? 'danger' :
      'info';

    setNotification({
      message: choice.outcome.principle,
      type: notificationType
    });
  };

  const handleDismissTutorial = () => {
    if (!currentTutorialScenario) return;
    setCompletedTutorials(prev => new Set([...prev, currentTutorialScenario.id]));
    setCurrentTutorialScenario(null);
  };

  // Show loadout screen first
  if (!loadoutComplete) {
    return <LoadoutScreen onComplete={handleLoadoutComplete} />;
  }

  // Loading state while game initializes
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Generating survival scenario...</p>
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

      {/* Danger Vignette - Visual warning effect */}
      <DangerVignette stats={getPlayerStats(gameState)} />

      {/* Status HUD - Fixed at top */}
      <StatusHUD
        stats={getPlayerStats(gameState)}
        onGameOver={handleGameOverFromHUD}
      />

      {/* Action History Log - Fixed at bottom */}
      <ActionHistory history={gameState.history} maxVisible={5} />

      {/* Inventory Tray - Shows equipped items */}
      <InventoryTray />

      {/* Tutorial Scenario Modal */}
      {currentTutorialScenario && (
        <TutorialScenarioModal
          scenario={currentTutorialScenario}
          onChoice={handleTutorialChoice}
          onDismiss={handleDismissTutorial}
        />
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}

      {/* Add padding-top to account for fixed HUD */}
      <div className="max-w-6xl mx-auto p-4 py-8 pt-24 relative z-10">
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
                <>
                  <div className="p-8 bg-gray-900 rounded-lg border border-gray-800">
                    <div className="prose prose-invert max-w-none">
                      <div className="text-gray-300 leading-relaxed whitespace-pre-line text-xl columns-2 gap-8">
                        {generateBriefing(gameState.scenario)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/40 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🎯</span>
                      <h4 className="text-base font-semibold text-blue-300">Survival Priorities</h4>
                    </div>
                    <div className="space-y-2">
                      {getEnvironmentTips(gameState.scenario.environment).slice(0, 3).map((tip, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-blue-400 text-sm font-mono mt-0.5 flex-shrink-0">
                            {i + 1}.
                          </span>
                          <span className="text-sm text-gray-300 leading-relaxed">{tip}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-800/30">
                      <p className="text-xs text-gray-400 italic">
                        These principles are based on the SAS Survival Handbook
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="text-gray-300 leading-relaxed whitespace-pre-line text-base">
                    {generateConciseBrief(
                      gameState.scenario,
                      gameState.metrics,
                      gameState.currentTimeOfDay,
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
                  turnNumber={gameState.turnNumber}
                  gameState={gameState}
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
