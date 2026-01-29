import type {
  PlayerMetrics,
  GameState,
  MetricThresholdCrossing,
  CausalityChain
} from '../types/game';

// Threshold definitions for each metric
const THRESHOLDS = {
  energy: {
    warning: 70,
    danger: 50,
    critical: 30,
    fatal: 10
  },
  hydration: {
    warning: 70,
    danger: 50,
    critical: 30,
    fatal: 15
  },
  bodyTemperature: {
    warning: { low: 36.5, high: 37.5 },
    danger: { low: 35, high: 38 },
    critical: { low: 34, high: 39 },
    fatal: { low: 32, high: 40 }
  },
  injurySeverity: {
    warning: 30,
    danger: 50,
    critical: 70,
    fatal: 85
  }
};

/**
 * Track when metrics cross critical thresholds
 */
export function trackThresholdCrossing(
  metric: keyof PlayerMetrics,
  previousValue: number,
  newValue: number,
  turn: number,
  decisionText: string,
  decisionId: string
): MetricThresholdCrossing | null {
  // Special handling for body temperature (bidirectional thresholds)
  if (metric === 'bodyTemperature') {
    const tempThresholds = THRESHOLDS.bodyTemperature;

    // Check for fatal threshold crossings
    if ((previousValue > tempThresholds.fatal.low && newValue <= tempThresholds.fatal.low) ||
        (previousValue < tempThresholds.fatal.high && newValue >= tempThresholds.fatal.high)) {
      return {
        turn,
        metric,
        previousValue,
        newValue,
        threshold: newValue <= tempThresholds.fatal.low ? tempThresholds.fatal.low : tempThresholds.fatal.high,
        crossingType: 'fatal',
        contributingDecision: { turn, decisionText, decisionId }
      };
    }

    // Check for critical threshold crossings
    if ((previousValue > tempThresholds.critical.low && newValue <= tempThresholds.critical.low) ||
        (previousValue < tempThresholds.critical.high && newValue >= tempThresholds.critical.high)) {
      return {
        turn,
        metric,
        previousValue,
        newValue,
        threshold: newValue <= tempThresholds.critical.low ? tempThresholds.critical.low : tempThresholds.critical.high,
        crossingType: 'critical',
        contributingDecision: { turn, decisionText, decisionId }
      };
    }

    // Check for danger threshold crossings
    if ((previousValue > tempThresholds.danger.low && newValue <= tempThresholds.danger.low) ||
        (previousValue < tempThresholds.danger.high && newValue >= tempThresholds.danger.high)) {
      return {
        turn,
        metric,
        previousValue,
        newValue,
        threshold: newValue <= tempThresholds.danger.low ? tempThresholds.danger.low : tempThresholds.danger.high,
        crossingType: 'danger',
        contributingDecision: { turn, decisionText, decisionId }
      };
    }

    // Check for warning threshold crossings
    if ((previousValue > tempThresholds.warning.low && newValue <= tempThresholds.warning.low) ||
        (previousValue < tempThresholds.warning.high && newValue >= tempThresholds.warning.high)) {
      return {
        turn,
        metric,
        previousValue,
        newValue,
        threshold: newValue <= tempThresholds.warning.low ? tempThresholds.warning.low : tempThresholds.warning.high,
        crossingType: 'warning',
        contributingDecision: { turn, decisionText, decisionId }
      };
    }
  }

  // Handle unidirectional metrics (energy, hydration decrease; injurySeverity increases)
  const thresholds = THRESHOLDS[metric as keyof typeof THRESHOLDS];
  if (typeof thresholds === 'object' && !('low' in thresholds)) {
    const metricThresholds = thresholds as { warning: number; danger: number; critical: number; fatal: number };
    const isDescending = metric === 'energy' || metric === 'hydration';
    const isAscending = metric === 'injurySeverity';

    if (isDescending) {
      // Check fatal (descending)
      if (previousValue > metricThresholds.fatal && newValue <= metricThresholds.fatal) {
        return {
          turn,
          metric,
          previousValue,
          newValue,
          threshold: metricThresholds.fatal,
          crossingType: 'fatal',
          contributingDecision: { turn, decisionText, decisionId }
        };
      }

      // Check critical (descending)
      if (previousValue > metricThresholds.critical && newValue <= metricThresholds.critical) {
        return {
          turn,
          metric,
          previousValue,
          newValue,
          threshold: metricThresholds.critical,
          crossingType: 'critical',
          contributingDecision: { turn, decisionText, decisionId }
        };
      }

      // Check danger (descending)
      if (previousValue > metricThresholds.danger && newValue <= metricThresholds.danger) {
        return {
          turn,
          metric,
          previousValue,
          newValue,
          threshold: metricThresholds.danger,
          crossingType: 'danger',
          contributingDecision: { turn, decisionText, decisionId }
        };
      }

      // Check warning (descending)
      if (previousValue > metricThresholds.warning && newValue <= metricThresholds.warning) {
        return {
          turn,
          metric,
          previousValue,
          newValue,
          threshold: metricThresholds.warning,
          crossingType: 'warning',
          contributingDecision: { turn, decisionText, decisionId }
        };
      }
    } else if (isAscending) {
      // Check fatal (ascending)
      if (previousValue < metricThresholds.fatal && newValue >= metricThresholds.fatal) {
        return {
          turn,
          metric,
          previousValue,
          newValue,
          threshold: metricThresholds.fatal,
          crossingType: 'fatal',
          contributingDecision: { turn, decisionText, decisionId }
        };
      }

      // Check critical (ascending)
      if (previousValue < metricThresholds.critical && newValue >= metricThresholds.critical) {
        return {
          turn,
          metric,
          previousValue,
          newValue,
          threshold: metricThresholds.critical,
          crossingType: 'critical',
          contributingDecision: { turn, decisionText, decisionId }
        };
      }

      // Check danger (ascending)
      if (previousValue < metricThresholds.danger && newValue >= metricThresholds.danger) {
        return {
          turn,
          metric,
          previousValue,
          newValue,
          threshold: metricThresholds.danger,
          crossingType: 'danger',
          contributingDecision: { turn, decisionText, decisionId }
        };
      }

      // Check warning (ascending)
      if (previousValue < metricThresholds.warning && newValue >= metricThresholds.warning) {
        return {
          turn,
          metric,
          previousValue,
          newValue,
          threshold: metricThresholds.warning,
          crossingType: 'warning',
          contributingDecision: { turn, decisionText, decisionId }
        };
      }
    }
  }

  return null;
}

/**
 * Identify the root cause decision that started the cascade
 */
export function identifyRootCause(state: GameState, fatalCrossing: MetricThresholdCrossing): {
  turn: number;
  decisionText: string;
  decisionId: string;
  immediateEffect: string;
} {
  const crossings = state.metricThresholdCrossings || [];
  const fatalMetric = fatalCrossing.metric;

  // Find the first critical or danger threshold crossing for the fatal metric
  const relevantCrossings = crossings
    .filter(c => c.metric === fatalMetric && (c.crossingType === 'critical' || c.crossingType === 'danger'))
    .sort((a, b) => a.turn - b.turn);

  if (relevantCrossings.length > 0) {
    const firstCritical = relevantCrossings[0];
    const outcome = state.history[firstCritical.turn - 1];
    return {
      turn: firstCritical.turn,
      decisionText: firstCritical.contributingDecision.decisionText,
      decisionId: firstCritical.contributingDecision.decisionId,
      immediateEffect: outcome?.immediateEffect || 'Unknown effect'
    };
  }

  // Fallback: find the decision that caused the largest negative change to the fatal metric
  let worstDecisionTurn = 1;
  let worstChange = 0;

  state.history.forEach((outcome, index) => {
    const metricChange = outcome.metricsChange[fatalMetric];
    if (metricChange !== undefined) {
      // For energy/hydration, negative is bad; for injury, positive is bad; for temp, deviation is bad
      const isBad = fatalMetric === 'injurySeverity' ? metricChange > worstChange : metricChange < worstChange;
      if (isBad) {
        worstChange = metricChange as number;
        worstDecisionTurn = index + 1;
      }
    }
  });

  const worstOutcome = state.history[worstDecisionTurn - 1];
  return {
    turn: worstDecisionTurn,
    decisionText: worstOutcome.decision.text,
    decisionId: worstOutcome.decision.id,
    immediateEffect: worstOutcome.immediateEffect
  };
}

/**
 * Build the full causality chain from root cause to death
 */
export function buildCausalityChain(state: GameState, fatalCrossing: MetricThresholdCrossing): CausalityChain {
  const rootCause = identifyRootCause(state, fatalCrossing);
  const cascadeSteps: CausalityChain['cascadeSteps'] = [];

  // Build timeline from root cause to death
  for (let i = rootCause.turn - 1; i < state.history.length; i++) {
    const outcome = state.history[i];
    const turn = i + 1;
    const metricChange = outcome.metricsChange[fatalCrossing.metric];

    if (metricChange !== undefined && metricChange !== 0) {
      // Get before/after values
      const beforeValue = i === 0
        ? state.scenario.initialCondition.includes('exhausted') && fatalCrossing.metric === 'energy' ? 45 : 100
        : getMetricValueAtTurn(state, fatalCrossing.metric, i);
      const afterValue = beforeValue + (metricChange as number);

      // Determine severity
      const crossings = state.metricThresholdCrossings || [];
      const crossingAtThisTurn = crossings.find(c => c.turn === turn && c.metric === fatalCrossing.metric);
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (crossingAtThisTurn) {
        if (crossingAtThisTurn.crossingType === 'fatal') severity = 'critical';
        else if (crossingAtThisTurn.crossingType === 'critical') severity = 'critical';
        else if (crossingAtThisTurn.crossingType === 'danger') severity = 'high';
        else if (crossingAtThisTurn.crossingType === 'warning') severity = 'medium';
      } else if (Math.abs(metricChange as number) > 15) {
        severity = 'high';
      } else if (Math.abs(metricChange as number) > 8) {
        severity = 'medium';
      }

      cascadeSteps.push({
        turn,
        description: outcome.decision.text,
        metricChange: `${formatMetricName(fatalCrossing.metric)}: ${formatMetricValue(fatalCrossing.metric, beforeValue)} → ${formatMetricValue(fatalCrossing.metric, afterValue)}`,
        severity
      });
    }
  }

  const alternativePath = generateAlternativePath(state, rootCause, fatalCrossing);

  return {
    rootCauseDecision: rootCause,
    cascadeSteps,
    fatalThreshold: fatalCrossing,
    alternativePath
  };
}

/**
 * Generate suggestions for what player should have done instead
 */
export function generateAlternativePath(
  state: GameState,
  rootCause: CausalityChain['rootCauseDecision'],
  fatalCrossing: MetricThresholdCrossing
): string {
  const metric = fatalCrossing.metric;
  const decisionId = rootCause.decisionId;

  // Analyze the pattern
  let suggestion = '';

  if (metric === 'energy') {
    suggestion = `Instead of "${rootCause.decisionText}" (Turn ${rootCause.turn}), you should have:\n`;
    suggestion += `1. Rested in shelter to restore energy above 60\n`;
    suggestion += `2. Avoided high-effort actions while exhausted\n`;
    suggestion += `3. Maintained shelter and fire to reduce passive energy loss\n`;

    if (decisionId.includes('navigate') || decisionId.includes('backtrack')) {
      suggestion += `4. Waited for better conditions before attempting navigation\n`;
    }

    suggestion += `\nYour pattern: High-effort decisions while exhausted in harsh conditions`;
  } else if (metric === 'hydration') {
    suggestion = `Instead of "${rootCause.decisionText}" (Turn ${rootCause.turn}), you should have:\n`;
    suggestion += `1. Prioritized finding water immediately when hydration dropped below 60\n`;
    suggestion += `2. Used equipment (water bottle, container) if available\n`;
    suggestion += `3. Avoided high-exertion activities that increase water loss\n`;
    suggestion += `4. Sought shelter to reduce dehydration from heat/exertion\n`;
    suggestion += `\nYour pattern: Delayed water-finding until critical dehydration`;
  } else if (metric === 'bodyTemperature') {
    const isDyingFromCold = fatalCrossing.newValue < 35;
    if (isDyingFromCold) {
      suggestion = `Instead of "${rootCause.decisionText}" (Turn ${rootCause.turn}), you should have:\n`;
      suggestion += `1. Built or improved shelter immediately to block wind/precipitation\n`;
      suggestion += `2. Started and maintained a fire for warmth\n`;
      suggestion += `3. Avoided getting wet (wetness amplifies heat loss)\n`;
      suggestion += `4. Rested in shelter rather than attempting high-effort actions in cold\n`;
      suggestion += `\nYour pattern: Neglected shelter and fire in freezing temperatures`;
    } else {
      suggestion = `Instead of "${rootCause.decisionText}" (Turn ${rootCause.turn}), you should have:\n`;
      suggestion += `1. Sought shade and shelter from direct sun\n`;
      suggestion += `2. Avoided exertion during peak heat (midday)\n`;
      suggestion += `3. Prioritized hydration to support cooling\n`;
      suggestion += `4. Rested during hottest periods\n`;
      suggestion += `\nYour pattern: Overexertion in extreme heat`;
    }
  } else if (metric === 'injurySeverity') {
    suggestion = `Instead of "${rootCause.decisionText}" (Turn ${rootCause.turn}), you should have:\n`;
    suggestion += `1. Treated injuries immediately using first aid equipment\n`;
    suggestion += `2. Avoided high-risk actions while injured\n`;
    suggestion += `3. Rested to prevent injury worsening\n`;
    suggestion += `4. Not attempted risky navigation or panic moves\n`;
    suggestion += `\nYour pattern: Took high-risk actions while injured`;
  }

  return suggestion;
}

/**
 * Helper: Get metric value at specific turn
 */
function getMetricValueAtTurn(state: GameState, metric: keyof PlayerMetrics, turnIndex: number): number {
  // Start with initial value
  let value: number;

  // Initialize based on scenario
  if (metric === 'energy') {
    value = state.scenario.initialCondition.includes('exhausted') ? 45 : 100;
  } else if (metric === 'hydration') {
    value = state.scenario.initialCondition.includes('dehydrated') ? 65 : 100;
  } else if (metric === 'bodyTemperature') {
    value = state.scenario.initialCondition.includes('cold') ? 36.2 : 37.0;
  } else if (metric === 'injurySeverity') {
    if (state.scenario.initialCondition.includes('sprained')) value = 25;
    else if (state.scenario.initialCondition.includes('head injury')) value = 30;
    else if (state.scenario.initialCondition.includes('bruised')) value = 15;
    else value = 0;
  } else {
    value = 100; // Default
  }

  // Apply changes up to turnIndex
  for (let i = 0; i <= turnIndex; i++) {
    const outcome = state.history[i];
    const change = outcome.metricsChange[metric];
    if (change !== undefined) {
      value += change as number;
    }
  }

  return value;
}

/**
 * Helper: Format metric name for display
 */
function formatMetricName(metric: keyof PlayerMetrics): string {
  const names: Record<keyof PlayerMetrics, string> = {
    energy: 'Energy',
    hydration: 'Hydration',
    bodyTemperature: 'Body Temperature',
    injurySeverity: 'Injury Severity',
    morale: 'Morale',
    shelter: 'Shelter',
    fireQuality: 'Fire Quality',
    signalEffectiveness: 'Signal Effectiveness',
    cumulativeRisk: 'Cumulative Risk',
    survivalProbability: 'Survival Probability'
  };
  return names[metric] || metric;
}

/**
 * Helper: Format metric value for display
 */
function formatMetricValue(metric: keyof PlayerMetrics, value: number): string {
  if (metric === 'bodyTemperature') {
    return `${value.toFixed(1)}°C`;
  }
  return value.toFixed(0);
}
