import { supabase } from '../lib/supabase';
import type { GameState } from '../types/game';

export interface AIScenarioData {
  scenario: {
    title: string;
    description: string;
    environment: string;
    timeOfDay: string;
    weather: string;
  };
  decisions: Array<{
    id: string;
    text: string;
    reasoning: string;
    metrics: {
      health?: number;
      hunger?: number;
      thirst?: number;
      energy?: number;
      morale?: number;
      warmth?: number;
    };
    risk: 'low' | 'medium' | 'high';
  }>;
  briefing: string;
}

export async function generateAIScenario(gameState: GameState): Promise<AIScenarioData> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  const currentMetrics = {
    health: 100 - gameState.metrics.injurySeverity,
    hunger: 100 - (gameState.metrics.energy < 50 ? 50 : 0),
    thirst: gameState.metrics.hydration,
    energy: gameState.metrics.energy,
    morale: gameState.metrics.morale,
    warmth: gameState.metrics.bodyTemperature > 36 ? 100 : (gameState.metrics.bodyTemperature - 30) * 20,
  };

  const previousDecisions = gameState.history.slice(-3).map(h => h.decision.text);

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scenario`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentDay: Math.floor(gameState.hoursElapsed / 24) + 1,
        currentMetrics,
        previousDecisions: previousDecisions.length > 0 ? previousDecisions : undefined,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Failed to generate AI scenario: ${errorData.error || response.statusText}`);
  }

  const data = await response.json();
  return data;
}
