import type { SurvivalRule, Decision, GameState } from '../types/game';

export const survivalRules: SurvivalRule[] = [
  {
    name: 'Protection from elements',
    priority: 1,
    evaluate: (decision: Decision, state: GameState): number => {
      if (decision.id === 'shelter' || decision.id === 'fortify') {
        const tempDanger = Math.abs(state.scenario.temperature - 20);
        return Math.min(100, 70 + tempDanger * 2);
      }
      if (decision.id === 'move' || decision.id === 'panic-move') {
        return 20;
      }
      return 50;
    }
  },
  {
    name: 'Energy conservation',
    priority: 2,
    evaluate: (decision: Decision, state: GameState): number => {
      if (decision.energyCost < 0) return 90;
      if (decision.energyCost < 20) return 75;
      if (decision.energyCost < 35) return 55;
      if (state.metrics.energy < 40 && decision.energyCost > 30) return 10;
      return 40;
    }
  },
  {
    name: 'Visibility and signalling',
    priority: 3,
    evaluate: (decision: Decision, state: GameState): number => {
      if (decision.id === 'signal') {
        return Math.min(95, 60 + state.metrics.signalEffectiveness * 0.4);
      }
      return 50;
    }
  },
  {
    name: 'Risk minimization',
    priority: 4,
    evaluate: (decision: Decision, state: GameState): number => {
      const riskScore = 100 - (decision.riskLevel * 10);
      if (state.metrics.cumulativeRisk > 50 && decision.riskLevel > 6) {
        return 15;
      }
      return Math.max(0, riskScore);
    }
  },
  {
    name: 'Movement restraint',
    priority: 5,
    evaluate: (decision: Decision, state: GameState): number => {
      if (decision.id === 'panic-move') return 5;
      if (decision.id === 'move' && state.turnNumber < 5) return 20;
      if (decision.id === 'move' && state.metrics.energy < 50) return 15;
      if (decision.id === 'rest' || decision.id === 'shelter') return 85;
      return 50;
    }
  }
];

export function evaluateDecision(decision: Decision, state: GameState): {
  overallScore: number;
  ruleScores: Array<{ rule: string; score: number }>;
} {
  const ruleScores = survivalRules.map(rule => ({
    rule: rule.name,
    score: rule.evaluate(decision, state)
  }));

  const weightedSum = ruleScores.reduce((sum, item, index) => {
    const weight = survivalRules[index].priority;
    return sum + (item.score * (6 - weight));
  }, 0);

  const totalWeight = survivalRules.reduce((sum, rule) => sum + (6 - rule.priority), 0);
  const overallScore = weightedSum / totalWeight;

  return { overallScore, ruleScores };
}

export function analyzeSurvivalPerformance(state: GameState): {
  strengths: string[];
  weaknesses: string[];
  lessons: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const lessons: string[] = [];

  const shelterDecisions = state.history.filter(h =>
    h.decision.id === 'shelter' || h.decision.id === 'fortify'
  ).length;

  const movementDecisions = state.history.filter(h =>
    h.decision.id === 'move' || h.decision.id === 'panic-move'
  ).length;

  const restDecisions = state.history.filter(h =>
    h.decision.id === 'rest'
  ).length;

  const highRiskDecisions = state.history.filter(h =>
    h.decision.riskLevel > 6
  ).length;

  if (shelterDecisions >= 3) {
    strengths.push('You prioritized protection from the elements');
  } else if (shelterDecisions === 0) {
    weaknesses.push('You never improved your shelter');
    lessons.push('Shelter is more important than movement in most scenarios');
  }

  if (movementDecisions === 0) {
    strengths.push('You resisted the urge to move unnecessarily');
  } else if (movementDecisions > 3) {
    weaknesses.push('You moved too much when staying put was safer');
    lessons.push('Unnecessary movement burns energy and increases risk');
  }

  if (restDecisions >= 2) {
    strengths.push('You understood the value of conserving energy');
  }

  if (highRiskDecisions > 2) {
    weaknesses.push('You took too many high-risk actions');
    lessons.push('Desperation leads to poor decisions');
  }

  const avgEnergy = state.history.reduce((sum, _h, i) =>
    sum + (state.history[i].metricsChange.energy || 0), 0
  ) / Math.max(state.history.length, 1);

  if (avgEnergy > -20) {
    strengths.push('You managed energy consumption well');
  } else {
    weaknesses.push('Your decisions depleted energy too quickly');
    lessons.push('Energy conservation is critical to survival');
  }

  if (state.metrics.cumulativeRisk > 40) {
    weaknesses.push('You accumulated excessive risk');
    lessons.push('Each decision has consequences that compound over time');
  } else if (state.metrics.cumulativeRisk < 15) {
    strengths.push('You minimized unnecessary risk');
  }

  if (state.outcome === 'survived') {
    if (strengths.length < 2) {
      lessons.push('You survived despite poor choices. Luck played a role.');
    }
  } else if (state.outcome === 'died') {
    if (weaknesses.length === 0) {
      lessons.push('Sometimes the scenario is not survivable from the start.');
      lessons.push('Recognize when the odds are against you.');
    }
  }

  if (lessons.length === 0) {
    if (state.outcome === 'survived') {
      lessons.push('Discipline and restraint are survival tools.');
    } else {
      lessons.push('Small mistakes compound into fatal outcomes.');
    }
  }

  return { strengths, weaknesses, lessons };
}
