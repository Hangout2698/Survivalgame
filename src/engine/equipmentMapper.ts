/**
 * Equipment Mapper
 *
 * Maps decisions to their equipment requirements and consumption
 */

import type { Decision, Equipment, GameState } from '../types/game';

export interface EquipmentRequirement {
  name: string;
  icon: string;
  consumed: boolean; // Will this item be consumed/reduced?
  quantity: number; // How many will be consumed
  currentQuantity: number; // Current available quantity
  required: boolean; // Is this required vs optional?
}

/**
 * Get equipment requirements for a decision
 */
export function getEquipmentRequirements(
  decision: Decision,
  gameState: GameState
): EquipmentRequirement[] {
  const requirements: EquipmentRequirement[] = [];
  const equipment = gameState.equipment;

  // Helper to find equipment by partial name match
  const findEquipment = (search: string): Equipment | undefined => {
    return equipment.find(e => e.name.toLowerCase().includes(search.toLowerCase()));
  };

  // Helper to add requirement
  const addReq = (
    name: string,
    icon: string,
    consumed: boolean,
    quantity: number = 1,
    required: boolean = true
  ) => {
    const item = findEquipment(name);
    requirements.push({
      name,
      icon,
      consumed,
      quantity,
      currentQuantity: item?.quantity || 0,
      required
    });
  };

  // Map decision IDs to equipment requirements
  const decisionId = decision.id;

  // Fire-related decisions
  if (decisionId.includes('start-fire-lighter') || decisionId === 'gather-start-fire') {
    addReq('lighter', '🔥', false, 0, true);
    if (decisionId === 'gather-start-fire') {
      addReq('tinder', '🌾', true, 1, false); // Will gather tinder
    } else {
      addReq('tinder', '🌾', true, 1, true);
    }
  }

  if (decisionId.includes('start-fire-matches')) {
    addReq('matches', '🔥', true, 1, true);
    addReq('tinder', '🌾', true, 1, true);
  }

  if (decisionId.includes('start-fire-friction')) {
    addReq('knife', '🔪', false, 0, false); // Helps but not required
    addReq('tinder', '🌾', true, 1, false); // Will create tinder
  }

  if (decisionId === 'maintain-fire' || decisionId === 'stoke-fire') {
    const fuelLog = findEquipment('fuel log');
    const kindling = findEquipment('kindling');
    if (fuelLog && fuelLog.quantity > 0) {
      addReq('fuel log', '🪵', true, 1, false);
    } else if (kindling && kindling.quantity > 0) {
      addReq('kindling', '🌿', true, 1, false);
    }
  }

  // Water-related decisions
  if (decisionId === 'drink' || decisionId === 'drink-clean-water') {
    addReq('water', '💧', true, 1, true);
  }

  if (decisionId === 'drink-untreated-water') {
    addReq('water bottle (untreated)', '💧', true, 1, true);
  }

  if (decisionId === 'boil-water-fire') {
    addReq('water bottle (untreated)', '💧', true, 1, true);
    addReq('fire', '🔥', false, 0, true); // Requires active fire
  }

  if (decisionId === 'purify-water-tablets') {
    addReq('purification tablets', '💊', true, 1, true);
    addReq('water bottle (untreated)', '💧', true, 1, true);
  }

  if (decisionId === 'fill-water-bottle') {
    addReq('water bottle (empty)', '💧', false, 0, true);
  }

  // Signaling decisions
  if (decisionId === 'use-whistle') {
    addReq('whistle', '📢', false, 0, true);
  }

  if (decisionId === 'use-mirror') {
    addReq('signal mirror', '🪞', false, 0, true);
  }

  if (decisionId === 'use-flashlight-signal') {
    addReq('flashlight', '🔦', false, 0, true);
  }

  if (decisionId === 'signal-fire') {
    addReq('tinder', '🌾', true, 2, true); // Extra tinder for smoke
  }

  // Medical decisions
  if (decisionId === 'treat-injury-full') {
    addReq('first aid kit', '⚕️', true, 1, true);
  }

  if (decisionId === 'treat-injury-partial') {
    const bandage = findEquipment('bandage');
    const antiseptic = findEquipment('antiseptic');
    if (bandage && bandage.quantity > 0) {
      addReq('bandage', '🩹', true, 1, false);
    }
    if (antiseptic && antiseptic.quantity > 0) {
      addReq('antiseptic', '💊', true, 1, false);
    }
  }

  // Food decisions
  if (decisionId === 'eat-food') {
    const energyBar = findEquipment('energy bar');
    const berries = findEquipment('berries');
    const food = findEquipment('food');

    if (energyBar && energyBar.quantity > 0) {
      addReq('energy bar', '🍫', true, 1, false);
    } else if (berries && berries.quantity > 0) {
      addReq('berries', '🫐', true, 1, false);
    } else if (food) {
      addReq('food', '🍖', true, 1, false);
    }
  }

  // Shelter/utility decisions
  if (decisionId === 'use-knife-shelter') {
    addReq('knife', '🔪', false, 0, true);
  }

  if (decisionId === 'use-rope-descend') {
    addReq('rope', '🪢', false, 0, true);
  }

  if (decisionId === 'use-blanket') {
    addReq('blanket', '🛏️', false, 0, true);
  }

  if (decisionId === 'use-tarp') {
    addReq('tarp', '⛺', false, 0, false);
  }

  // Remove duplicates and sort by required status
  const unique = requirements.filter((req, index, self) =>
    index === self.findIndex((r) => r.name === req.name)
  );

  return unique.sort((a, b) => {
    if (a.required !== b.required) return a.required ? -1 : 1;
    return 0;
  });
}

/**
 * Check if player has required equipment for decision
 */
export function hasRequiredEquipment(
  decision: Decision,
  gameState: GameState
): { hasAll: boolean; missing: string[] } {
  const requirements = getEquipmentRequirements(decision, gameState);
  const missing: string[] = [];

  for (const req of requirements) {
    if (req.required && req.currentQuantity < req.quantity) {
      missing.push(req.name);
    }
  }

  return {
    hasAll: missing.length === 0,
    missing
  };
}

/**
 * Get low resource warnings
 */
export function getLowResourceWarnings(equipment: Equipment[]): Array<{
  name: string;
  quantity: number;
  warning: string;
}> {
  const warnings: Array<{ name: string; quantity: number; warning: string }> = [];

  // Critical items to track
  const criticalItems = [
    { match: 'water', critical: 1, low: 2, type: 'survival' },
    { match: 'food', critical: 1, low: 2, type: 'survival' },
    { match: 'energy bar', critical: 1, low: 2, type: 'survival' },
    { match: 'tinder', critical: 1, low: 2, type: 'fire' },
    { match: 'fuel log', critical: 1, low: 3, type: 'fire' },
    { match: 'first aid', critical: 1, low: 2, type: 'medical' },
    { match: 'bandage', critical: 1, low: 2, type: 'medical' },
    { match: 'matches', critical: 1, low: 3, type: 'fire' }
  ];

  for (const item of equipment) {
    for (const critical of criticalItems) {
      if (item.name.toLowerCase().includes(critical.match.toLowerCase())) {
        if (item.quantity <= critical.critical) {
          warnings.push({
            name: item.name,
            quantity: item.quantity,
            warning: `CRITICAL: ${item.name} is almost depleted!`
          });
        } else if (item.quantity <= critical.low) {
          warnings.push({
            name: item.name,
            quantity: item.quantity,
            warning: `LOW: ${item.name} running low (${item.quantity} remaining)`
          });
        }
      }
    }
  }

  return warnings;
}
