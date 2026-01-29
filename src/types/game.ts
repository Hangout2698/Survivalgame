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

  // Visual elements
  imagePrompt?: string; // AI generation prompt for hero image
  imageUrl?: string; // Cached/generated image URL
  imageFallback?: string; // Fallback image/icon if generation fails
}

export interface PlayerMetrics {
  energy: number;
  bodyTemperature: number;
  hydration: number;
  injurySeverity: number;
  morale: number;
  shelter: number;
  fireQuality: number;
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

  // Visual elements
  illustrationPrompt?: string; // Optional micro-illustration prompt
  iconKey?: string; // Icon identifier for quick-load fallback
}

// Detailed breakdown for a single stat change
export interface StatChangeReason {
  amount: number;
  reason: string;
  category: 'base' | 'environmental' | 'condition' | 'cascade';
}

// Environmental context at time of decision
export interface EnvironmentalContext {
  weather: Weather;
  temperature: number;
  windSpeed: number;
  visibility: 'clear' | 'reduced' | 'poor' | 'whiteout';
  timeOfDay: TimeOfDay;
  shelterQuality: number;
  challengeMultiplier: number;
}

// Player condition factors affecting outcome
export interface PlayerConditionFactors {
  energyLevel: number;
  hydrationLevel: number;
  bodyTemp: number;
  injuryStatus: number;
  energyDeficiency: number; // How far below recommended
  conditionMultiplier: number; // Overall penalty/bonus
}

// Detailed breakdown for each stat change
export interface MetricBreakdown {
  finalChange: number;
  reasons: StatChangeReason[];
  calculation?: string; // Optional formula explanation
}

// Complete consequence explanation
export interface ConsequenceExplanation {
  // Tier 1: Quick summary
  summary: string;
  riskAssessment: 'safe' | 'manageable' | 'risky' | 'dangerous' | 'critical';

  // Tier 2: Detailed narrative
  detailedNarrative: string;
  environmentalFactors: EnvironmentalContext;
  playerFactors: PlayerConditionFactors;
  outcomeType: 'success' | 'partial-success' | 'failure' | 'critical-failure' | 'cascade-failure';

  // Tier 3: Mechanical breakdown
  metricBreakdowns: {
    energy?: MetricBreakdown;
    hydration?: MetricBreakdown;
    bodyTemperature?: MetricBreakdown;
    morale?: MetricBreakdown;
    shelter?: MetricBreakdown;
    injurySeverity?: MetricBreakdown;
    cumulativeRisk?: MetricBreakdown;
  };

  // Learning & recommendations
  lessonLearned?: string;
  recommendations?: string[];
  survivalPrinciple?: string;
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

  // NEW: Detailed consequence explanation
  explanation?: ConsequenceExplanation;
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
  principleAlignmentScore?: number; // 0-100, tracks learning
  discoveredPrinciples?: Set<string>; // Unlocked principles
}

export interface SurvivalRule {
  name: string;
  priority: number;
  evaluate: (decision: Decision, state: GameState) => number;
}
