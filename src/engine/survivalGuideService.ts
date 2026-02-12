import { supabase } from '../lib/supabase';
import type { GameState, Decision } from '../types/game';

export interface SurvivalGuideContent {
  id: string;
  rawText: string;
  fileName: string;
}

export async function loadActiveSurvivalGuide(): Promise<SurvivalGuideContent | null> {
  // If Supabase is not configured, return null gracefully
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('survival_guide_content')
    .select('id, raw_text, file_name')
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    console.error('Failed to load survival guide:', error);
    return null;
  }

  return {
    id: data.id,
    rawText: data.raw_text,
    fileName: data.file_name,
  };
}

export function extractRelevantGuidance(
  guideContent: SurvivalGuideContent | null,
  state: GameState
): string {
  if (!guideContent || !guideContent.rawText) {
    return '';
  }
  const { scenario, metrics } = state;

  const keywords: string[] = [];

  keywords.push(scenario.environment);

  if (scenario.weather === 'storm' || scenario.weather === 'snow') {
    keywords.push('cold', 'hypothermia', 'shelter', 'warmth');
  }

  if (scenario.weather === 'heat') {
    keywords.push('heat', 'dehydration', 'shade', 'sun');
  }

  if (scenario.environment === 'desert') {
    keywords.push('desert', 'water', 'dehydration', 'heat');
  }

  if (scenario.environment === 'mountains') {
    keywords.push('mountain', 'altitude', 'elevation', 'terrain');
  }

  if (metrics.hydration < 40) {
    keywords.push('water', 'hydration', 'thirst');
  }

  if (metrics.bodyTemperature < 36.5) {
    keywords.push('cold', 'hypothermia', 'temperature', 'warmth');
  }

  if (metrics.energy < 30) {
    keywords.push('energy', 'rest', 'fatigue', 'exhaustion');
  }

  if (metrics.injurySeverity > 20) {
    keywords.push('injury', 'first aid', 'wound', 'treatment');
  }

  keywords.push('shelter', 'signal', 'rescue', 'survival');

  const sentences = guideContent.rawText
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 20);

  const relevantSentences = sentences
    .map(sentence => {
      const lowerSentence = sentence.toLowerCase();
      const matchCount = keywords.filter(keyword =>
        lowerSentence.includes(keyword)
      ).length;
      return { sentence: sentence.trim(), matchCount };
    })
    .filter(item => item.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 5)
    .map(item => item.sentence);

  return relevantSentences.join('. ');
}

export function enhanceDecisionWithGuidance(
  decision: Decision,
  guidance: string
): Decision {
  if (!guidance) {
    return decision;
  }

  return {
    ...decision,
    text: decision.text
  };
}

export function generateGuidanceBasedFeedback(
  guidance: string,
  decisionId: string
): string[] {
  if (!guidance) {
    return [];
  }

  const feedback: string[] = [];
  const lowerGuidance = guidance.toLowerCase();

  if (decisionId === 'shelter' && lowerGuidance.includes('shelter')) {
    feedback.push('Survival principles recommend: proper shelter is a top priority.');
  }

  if (decisionId.includes('signal') && lowerGuidance.includes('signal')) {
    feedback.push('According to survival principles: signaling increases rescue chances.');
  }

  if (decisionId === 'rest' && lowerGuidance.includes('rest')) {
    feedback.push('The guide advises: conserving energy is crucial for survival.');
  }

  if ((decisionId.includes('travel') || decisionId.includes('move')) &&
      (lowerGuidance.includes('stay') || lowerGuidance.includes('shelter'))) {
    feedback.push('Warning from guide: moving without a clear plan often worsens your situation.');
  }

  if (decisionId === 'drink' && lowerGuidance.includes('water')) {
    feedback.push('The guide notes: staying hydrated is essential, but ration carefully.');
  }

  return feedback;
}
