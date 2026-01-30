import React, { useMemo } from 'react';
import { GameState } from '../../types/game';
import { ITEM_DATABASE } from '../../data/itemDatabase';
import { useInventory } from '../../contexts/InventoryContext';

interface EquipmentTabProps {
  gameState: GameState;
  compact?: boolean;
}

interface ItemDisplayProps {
  itemId: string;
  remainingUses?: number;
  isConsumed: boolean;
}

const ItemDisplay: React.FC<ItemDisplayProps> = ({ itemId, remainingUses, isConsumed }) => {
  const item = ITEM_DATABASE[itemId];

  if (!item) {
    return (
      <div className="p-3 bg-slate-900/30 rounded border border-slate-700/50">
        <div className="text-xs text-slate-500">Unknown item: {itemId}</div>
      </div>
    );
  }

  // Determine item condition
  const condition = isConsumed
    ? { label: 'Depleted', color: 'text-red-400', bg: 'bg-red-950/20' }
    : remainingUses !== undefined && remainingUses === 0
    ? { label: 'Empty', color: 'text-yellow-400', bg: 'bg-yellow-950/20' }
    : { label: 'Available', color: 'text-green-400', bg: 'bg-green-950/20' };

  // Extract benefits
  const benefits: string[] = [];

  if (item.benefits.bonuses) {
    const { bodyHeat, hydration, energy, morale } = item.benefits.bonuses;
    if (bodyHeat) benefits.push(`+${bodyHeat}°C Body Heat`);
    if (hydration) benefits.push(`+${hydration} Hydration`);
    if (energy) benefits.push(`+${energy} Energy`);
    if (morale) benefits.push(`+${morale} Morale`);
  }

  if (item.benefits.successRateBonus) {
    benefits.push(`+${item.benefits.successRateBonus}% Success Rate`);
  }

  if (item.benefits.enablesChoices && item.benefits.enablesChoices.length > 0) {
    benefits.push(`Unlocks ${item.benefits.enablesChoices.length} action(s)`);
  }

  return (
    <div className={`p-3 rounded border ${condition.bg} ${
      isConsumed ? 'border-red-700/50 opacity-60' : 'border-slate-700/50'
    }`}>
      {/* Item Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{item.icon}</span>
          <div>
            <div className={`text-sm font-semibold ${isConsumed ? 'text-slate-500' : 'text-slate-200'}`}>
              {item.name}
            </div>
            <div className="text-xs text-slate-400 capitalize">
              {item.category}
            </div>
          </div>
        </div>
        <div className={`text-xs font-medium px-2 py-1 rounded ${condition.bg} ${condition.color} border ${
          condition.color.replace('text-', 'border-').replace('400', '700')
        }`}>
          {condition.label}
        </div>
      </div>

      {/* Description */}
      <div className="text-xs text-slate-400 mb-2">
        {item.description}
      </div>

      {/* Uses Remaining (for consumables/containers) */}
      {item.initialUses !== undefined && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Uses Remaining</span>
            <span className={`font-semibold ${
              (remainingUses ?? 0) === 0 ? 'text-red-400' : 'text-cyan-400'
            }`}>
              {remainingUses ?? 0} / {item.initialUses}
            </span>
          </div>
          <div className="h-1.5 bg-slate-900/50 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                (remainingUses ?? 0) === 0 ? 'bg-red-600' : 'bg-cyan-500'
              }`}
              style={{ width: `${((remainingUses ?? 0) / item.initialUses) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Benefits */}
      {benefits.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-400">Benefits:</div>
          <ul className="space-y-0.5">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-center gap-1">
                <span className="text-green-500">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strategic Value */}
      <div className="mt-2 pt-2 border-t border-slate-700/30">
        <div className="text-xs text-slate-500 italic">
          {item.strategicValue}
        </div>
      </div>
    </div>
  );
};

/**
 * Equipment Tab - Displays equipped items with detailed benefits
 * Shows effectiveness, uses remaining, and condition
 */
const EquipmentTab: React.FC<EquipmentTabProps> = ({ gameState, compact }) => {
  const inventory = useInventory();
  const { equipment } = gameState;

  // Convert Equipment names to item IDs (map equipment names to database keys)
  const equipmentIds = useMemo(() => {
    return equipment.map(eq => {
      // Try to find matching item in database by name
      const entry = Object.entries(ITEM_DATABASE).find(
        ([, item]) => item.name === eq.name
      );
      return entry ? entry[0] : null;
    }).filter((id): id is string => id !== null);
  }, [equipment]);

  // Calculate equipment stats
  const stats = useMemo(() => {
    const total = equipmentIds.length;
    const depleted = equipmentIds.filter(itemId => inventory.isItemConsumed(itemId)).length;
    const lowUses = equipmentIds.filter(itemId => {
      const item = ITEM_DATABASE[itemId];
      if (!item || !item.initialUses) return false;
      const remaining = inventory.getRemainingUses(itemId);
      return remaining > 0 && remaining <= 1;
    }).length;

    return { total, depleted, lowUses };
  }, [equipmentIds, inventory]);

  // Empty state
  if (equipmentIds.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-3">🎒</div>
        <div className="text-sm text-slate-400">No equipment selected</div>
        <div className="text-xs text-slate-500 mt-1">
          You started this survival scenario without any equipment
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-4 ${compact ? 'text-sm' : ''}`}>
      {/* Equipment Summary */}
      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-slate-400">Total Items</div>
            <div className="text-lg font-bold text-cyan-400">{stats.total}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Depleted</div>
            <div className={`text-lg font-bold ${
              stats.depleted > 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              {stats.depleted}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Low Uses</div>
            <div className={`text-lg font-bold ${
              stats.lowUses > 0 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {stats.lowUses}
            </div>
          </div>
        </div>
      </div>

      {/* Resource Warnings */}
      {(stats.depleted > 0 || stats.lowUses > 0) && (
        <div className="bg-yellow-950/20 border border-yellow-700/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-yellow-400 mb-1">
                RESOURCE WARNINGS
              </div>
              <ul className="space-y-1">
                {stats.depleted > 0 && (
                  <li className="text-xs text-yellow-300">
                    • {stats.depleted} item(s) fully depleted
                  </li>
                )}
                {stats.lowUses > 0 && (
                  <li className="text-xs text-yellow-300">
                    • {stats.lowUses} item(s) running low on uses
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Equipment List */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Equipped Items
        </div>
        {equipmentIds.map(itemId => (
          <ItemDisplay
            key={itemId}
            itemId={itemId}
            remainingUses={inventory.getRemainingUses(itemId)}
            isConsumed={inventory.isItemConsumed(itemId)}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(EquipmentTab);
