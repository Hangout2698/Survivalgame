/**
 * Item Database - All available equipment for pre-game loadout
 */

export type ItemCategory = 'warmth' | 'fire' | 'water' | 'medical' | 'signaling' | 'shelter' | 'tool';

export interface GameItem {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  icon: string; // Emoji icon
  weight: number; // Slot cost (most items = 1, heavy items = 2)
  isConsumable: boolean;
  uses?: number; // For consumables
  benefits: {
    // What this item enables
    enablesChoices?: string[]; // Decision IDs this unlocks
    successRateBonus?: number; // Percentage boost to related actions
    bonuses?: {
      // Passive or active bonuses
      bodyHeat?: number;
      hydration?: number;
      energy?: number;
      morale?: number;
    };
  };
  strategicValue: string; // Tooltip explaining when this is useful
}

export const ITEM_DATABASE: Record<string, GameItem> = {
  spaceBlanket: {
    id: 'spaceBlanket',
    name: 'Space Blanket',
    category: 'warmth',
    description: 'Emergency thermal blanket. Reflects 90% of body heat.',
    icon: '🛡️',
    weight: 1,
    isConsumable: false,
    benefits: {
      bonuses: {
        bodyHeat: 15 // Passive bonus
      },
      successRateBonus: 40 // 40% better success on shelter-building
    },
    strategicValue: 'Essential for cold environments. Provides passive warmth and improves shelter quality.'
  },

  lighter: {
    id: 'lighter',
    name: 'Waterproof Lighter',
    category: 'fire',
    description: 'Reliable fire starter. 100% success rate for fires.',
    icon: '🔥',
    weight: 1,
    isConsumable: false,
    benefits: {
      enablesChoices: ['start-fire-lighter', 'signal-fire'],
      successRateBonus: 100 // Guaranteed fire success
    },
    strategicValue: 'Fire = warmth, water purification, and signaling. Critical for night survival.'
  },

  waterBottle: {
    id: 'waterBottle',
    name: '1L Water Bottle',
    category: 'water',
    description: 'Clean drinking water. One-time use restores 40 hydration.',
    icon: '💧',
    weight: 1,
    isConsumable: true,
    uses: 1,
    benefits: {
      enablesChoices: ['drink-water-bottle'],
      bonuses: {
        hydration: 40
      }
    },
    strategicValue: 'Immediate hydration boost. Buys time to find water sources.'
  },

  signalingMirror: {
    id: 'signalingMirror',
    name: 'Signal Mirror',
    category: 'signaling',
    description: 'Can be seen 10+ miles away. Best for daytime rescue.',
    icon: '🪞',
    weight: 1,
    isConsumable: false,
    benefits: {
      enablesChoices: ['use-mirror', 'signal-aircraft'],
      successRateBonus: 60 // Major boost to rescue chances
    },
    strategicValue: 'Highest rescue probability during daylight. Essential for open terrain.'
  },

  firstAidKit: {
    id: 'firstAidKit',
    name: 'First Aid Kit',
    category: 'medical',
    description: 'Bandages, antiseptic, painkillers. Treats injuries completely.',
    icon: '⚕️',
    weight: 1,
    isConsumable: true,
    uses: 2, // Can use twice
    benefits: {
      enablesChoices: ['treat-injury-full'],
      bonuses: {
        energy: 10 // Pain relief = more energy
      }
    },
    strategicValue: 'Prevents death from infections. Critical if taking risky actions.'
  },

  heavyJacket: {
    id: 'heavyJacket',
    name: 'Insulated Jacket',
    category: 'warmth',
    description: 'Heavy-duty winter coat. Major passive warmth bonus.',
    icon: '🧥',
    weight: 2, // Takes 2 slots!
    isConsumable: false,
    benefits: {
      bonuses: {
        bodyHeat: 25, // Best passive warmth
        morale: 5 // Comfort bonus
      }
    },
    strategicValue: 'Best warmth option but costs 2 slots. Trade-off between warmth and versatility.'
  },

  emergencyWhistle: {
    id: 'emergencyWhistle',
    name: 'Emergency Whistle',
    category: 'signaling',
    description: 'Can be heard 1 mile away. Works day or night.',
    icon: '📣',
    weight: 1,
    isConsumable: false,
    benefits: {
      enablesChoices: ['use-whistle'],
      successRateBonus: 30
    },
    strategicValue: 'Reliable signaling in forests/mountains. Lower range but works in any weather.'
  },

  multiTool: {
    id: 'multiTool',
    name: 'Multi-Tool Knife',
    category: 'tool',
    description: 'Knife, saw, can opener. Enables multiple survival tasks.',
    icon: '🔪',
    weight: 1,
    isConsumable: false,
    benefits: {
      enablesChoices: ['build-shelter-advanced', 'create-spear', 'cut-branches'],
      successRateBonus: 25 // Better at many tasks
    },
    strategicValue: 'Most versatile item. Opens up creative survival options.'
  },

  paracord: {
    id: 'paracord',
    name: '50ft Paracord',
    category: 'shelter',
    description: 'Military-grade rope. Essential for building shelters.',
    icon: '🪢',
    weight: 1,
    isConsumable: false,
    benefits: {
      enablesChoices: ['build-tarp-shelter', 'create-snare'],
      successRateBonus: 35 // Much better shelters
    },
    strategicValue: 'Critical for advanced shelter building. Combines well with Multi-Tool.'
  },

  energyBars: {
    id: 'energyBars',
    name: 'Energy Bars (3x)',
    category: 'water', // Using water as generic supplies
    description: 'High-calorie food. Restores 30 energy per bar.',
    icon: '🍫',
    weight: 1,
    isConsumable: true,
    uses: 3,
    benefits: {
      enablesChoices: ['eat-energy-bar'],
      bonuses: {
        energy: 30,
        morale: 5
      }
    },
    strategicValue: 'Sustains energy for physical tasks. Good for long survival scenarios.'
  }
};

// Helper function to get items by category
export function getItemsByCategory(category: ItemCategory): GameItem[] {
  return Object.values(ITEM_DATABASE).filter(item => item.category === category);
}

// Helper to calculate total weight of selected items
export function calculateTotalWeight(itemIds: string[]): number {
  return itemIds.reduce((total, id) => {
    const item = ITEM_DATABASE[id];
    return total + (item?.weight || 0);
  }, 0);
}

// Get all available items for loadout screen
export function getAllItems(): GameItem[] {
  return Object.values(ITEM_DATABASE);
}

// Check if player has required item
export function hasItem(inventory: string[], itemId: string): boolean {
  return inventory.includes(itemId);
}

// Check if item is available (not consumed)
export function isItemAvailable(itemId: string, consumedItems: string[]): boolean {
  return !consumedItems.includes(itemId);
}
