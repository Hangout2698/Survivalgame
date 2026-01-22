export type Environment = 'mountains' | 'desert' | 'forest' | 'coast' | 'tundra' | 'urban-edge';

export type Weather = 'clear' | 'rain' | 'wind' | 'snow' | 'heat' | 'storm';

export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'night';

export type GameOutcome = 'survived' | 'barely_survived' | 'died';

export type GameStatus = 'active' | 'ended';

export interface Equipment {
  name: string;
  quantity: number;
  condition: 'good' | 'worn' | 'damaged';
}

export interface Scenario {
  environment: Environment;
  weather: Weather;
  timeOfDay: TimeOfDay;
  temperature: number;
  windSpeed: number;
  equipment: Equipment[];
  initialCondition: string;
  distanceToSafety: string;
  terrainDifficulty: number;
  backstoryType?: string;
  wetness?: 'soaked' | 'damp' | 'dry';
}

export interface PlayerMetrics {
  energy: number;
  bodyTemperature: number;
  hydration: number;
  injurySeverity: number;
  morale: number;
  shelter: number;
  signalEffectiveness: number;
  cumulativeRisk: number;
  survivalProbability: number;
}

export interface Decision {
  id: string;
  text: string;
  energyCost: number;
  riskLevel: number;
  timeRequired: number;
}

export interface DecisionOutcome {
  decision: Decision;
  consequences: string[];
  metricsChange: Partial<PlayerMetrics>;
  equipmentChanges?: {
    added?: Equipment[];
    removed?: string[];
    updated?: Equipment[];
  };
  environmentChange?: Environment;
  immediateEffect: string;
  delayedEffects?: Array<{
    turn: number;
    effect: string;
    metricsChange: Partial<PlayerMetrics>;
  }>;
  wasSignalAttempt?: boolean;
  wasSuccessfulSignal?: boolean;
  wasNavigationSuccess?: boolean;
  decisionQuality?: 'excellent' | 'good' | 'poor' | 'critical-error';
  survivalPrincipleAlignment?: string;
}

export interface SurvivalGuide {
  id: string;
  rawText: string;
  fileName: string;
}

export interface GameState {
  id: string;
  scenario: Scenario;
  metrics: PlayerMetrics;
  equipment: Equipment[];
  turnNumber: number;
  currentTimeOfDay: TimeOfDay;
  hoursElapsed: number;
  history: DecisionOutcome[];
  status: GameStatus;
  currentEnvironment: Environment;
  outcome?: GameOutcome;
  lessons?: string[];
  keyMoments?: Array<{
    turn: number;
    description: string;
    impact: 'positive' | 'negative' | 'critical';
  }>;
  survivalGuide?: SurvivalGuide | null;
  signalAttempts?: number;
  successfulSignals?: number;
  goodDecisions?: Array<{ turn: number; description: string; principle: string }>;
  poorDecisions?: Array<{ turn: number; description: string; principle: string }>;
}

export interface SurvivalRule {
  name: string;
  priority: number;
  evaluate: (decision: Decision, state: GameState) => number;
}
