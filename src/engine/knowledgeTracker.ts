/**
 * Knowledge Tracker Service
 *
 * Tracks player learning progress across sessions.
 * Persists to localStorage to maintain history.
 */

import type { PrincipleCategory } from './survivalPrinciplesService';

export interface PrincipleRecord {
  principle: string;
  category: PrincipleCategory;
  firstSeenAt: string; // ISO timestamp
  viewCount: number;
  lastSeenAt: string; // ISO timestamp
}

export interface SessionRecord {
  sessionId: string;
  startedAt: string;
  endedAt?: string;
  principlesLearned: string[]; // Principle texts
  scenarioEnvironment: string;
  outcome: 'survived' | 'barely_survived' | 'died' | 'in_progress';
}

export interface KnowledgeTrackerState {
  principles: Map<string, PrincipleRecord>; // keyed by principle text
  sessions: SessionRecord[];
  currentSessionId: string | null;
  stats: {
    totalPrinciplesDiscovered: number;
    categoryStrengths: Record<PrincipleCategory, number>; // count per category
  };
}

const STORAGE_KEY = 'survival_game_knowledge';
const CURRENT_SESSION_KEY = 'survival_game_current_session';

/**
 * Load knowledge state from localStorage
 */
export function loadKnowledgeState(): KnowledgeTrackerState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createEmptyState();
    }

    const parsed = JSON.parse(stored);

    // Convert principles array back to Map
    const principlesMap = new Map<string, PrincipleRecord>();
    if (parsed.principles && Array.isArray(parsed.principles)) {
      parsed.principles.forEach((record: PrincipleRecord) => {
        principlesMap.set(record.principle, record);
      });
    }

    return {
      principles: principlesMap,
      sessions: parsed.sessions || [],
      currentSessionId: parsed.currentSessionId || null,
      stats: parsed.stats || {
        totalPrinciplesDiscovered: principlesMap.size,
        categoryStrengths: calculateCategoryStrengths(principlesMap)
      }
    };
  } catch (error) {
    console.error('Failed to load knowledge state:', error);
    return createEmptyState();
  }
}

/**
 * Save knowledge state to localStorage
 */
export function saveKnowledgeState(state: KnowledgeTrackerState): void {
  try {
    // Convert Map to array for JSON serialization
    const principlesArray = Array.from(state.principles.values());

    const toStore = {
      principles: principlesArray,
      sessions: state.sessions,
      currentSessionId: state.currentSessionId,
      stats: state.stats
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('Failed to save knowledge state:', error);
  }
}

/**
 * Create empty knowledge state
 */
function createEmptyState(): KnowledgeTrackerState {
  return {
    principles: new Map(),
    sessions: [],
    currentSessionId: null,
    stats: {
      totalPrinciplesDiscovered: 0,
      categoryStrengths: {
        shelter: 0,
        water: 0,
        fire: 0,
        food: 0,
        navigation: 0,
        signaling: 0,
        firstAid: 0,
        priorities: 0,
        psychology: 0,
        weather: 0
      }
    }
  };
}

/**
 * Calculate category strengths from principles map
 */
function calculateCategoryStrengths(principles: Map<string, PrincipleRecord>): Record<PrincipleCategory, number> {
  const strengths: Record<PrincipleCategory, number> = {
    shelter: 0,
    water: 0,
    fire: 0,
    food: 0,
    navigation: 0,
    signaling: 0,
    firstAid: 0,
    priorities: 0,
    psychology: 0,
    weather: 0
  };

  principles.forEach(record => {
    strengths[record.category]++;
  });

  return strengths;
}

/**
 * Start a new session
 */
export function startSession(sessionId: string, environment: string): void {
  const state = loadKnowledgeState();

  const newSession: SessionRecord = {
    sessionId,
    startedAt: new Date().toISOString(),
    principlesLearned: [],
    scenarioEnvironment: environment,
    outcome: 'in_progress'
  };

  state.sessions.push(newSession);
  state.currentSessionId = sessionId;

  saveKnowledgeState(state);

  // Also store current session ID separately for quick access
  localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
}

/**
 * End current session
 */
export function endSession(outcome: 'survived' | 'barely_survived' | 'died'): void {
  const state = loadKnowledgeState();

  if (!state.currentSessionId) {
    return;
  }

  const session = state.sessions.find(s => s.sessionId === state.currentSessionId);
  if (session) {
    session.endedAt = new Date().toISOString();
    session.outcome = outcome;
  }

  state.currentSessionId = null;
  saveKnowledgeState(state);
  localStorage.removeItem(CURRENT_SESSION_KEY);
}

/**
 * Record that a principle was shown to the player
 */
export function recordPrincipleView(principle: string, category: PrincipleCategory): void {
  const state = loadKnowledgeState();
  const now = new Date().toISOString();

  let record = state.principles.get(principle);

  if (record) {
    // Update existing record
    record.viewCount++;
    record.lastSeenAt = now;
  } else {
    // Create new record
    record = {
      principle,
      category,
      firstSeenAt: now,
      viewCount: 1,
      lastSeenAt: now
    };
    state.principles.set(principle, record);
    state.stats.totalPrinciplesDiscovered++;
    state.stats.categoryStrengths[category]++;
  }

  // Add to current session if active
  if (state.currentSessionId) {
    const session = state.sessions.find(s => s.sessionId === state.currentSessionId);
    if (session && !session.principlesLearned.includes(principle)) {
      session.principlesLearned.push(principle);
    }
  }

  saveKnowledgeState(state);
}

/**
 * Get view count for a specific principle
 */
export function getPrincipleViewCount(principle: string): number {
  const state = loadKnowledgeState();
  const record = state.principles.get(principle);
  return record ? record.viewCount : 0;
}

/**
 * Get current session's learned principles
 */
export function getCurrentSessionPrinciples(): string[] {
  const state = loadKnowledgeState();

  if (!state.currentSessionId) {
    return [];
  }

  const session = state.sessions.find(s => s.sessionId === state.currentSessionId);
  return session ? session.principlesLearned : [];
}

/**
 * Get strongest and weakest knowledge categories
 */
export function getKnowledgeStrengths(): {
  strongest: { category: PrincipleCategory; count: number }[];
  weakest: { category: PrincipleCategory; count: number }[];
} {
  const state = loadKnowledgeState();

  const entries = Object.entries(state.stats.categoryStrengths) as [PrincipleCategory, number][];
  const sorted = entries
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    strongest: sorted.slice(0, 3),
    weakest: sorted.slice(-3).reverse()
  };
}

/**
 * Get total statistics
 */
export function getTotalStats(): {
  totalPrinciples: number;
  totalSessions: number;
  survivalRate: number;
  categoryBreakdown: Record<PrincipleCategory, number>;
} {
  const state = loadKnowledgeState();

  const completedSessions = state.sessions.filter(s => s.outcome !== 'in_progress');
  const survivedSessions = completedSessions.filter(s => s.outcome === 'survived' || s.outcome === 'barely_survived');

  return {
    totalPrinciples: state.stats.totalPrinciplesDiscovered,
    totalSessions: completedSessions.length,
    survivalRate: completedSessions.length > 0
      ? (survivedSessions.length / completedSessions.length) * 100
      : 0,
    categoryBreakdown: state.stats.categoryStrengths
  };
}

/**
 * Get recommended categories to focus on (weakest areas)
 */
export function getRecommendedCategories(): PrincipleCategory[] {
  const { weakest } = getKnowledgeStrengths();
  return weakest.map(w => w.category);
}

/**
 * Reset all knowledge (for testing or fresh start)
 */
export function resetKnowledge(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CURRENT_SESSION_KEY);
}
