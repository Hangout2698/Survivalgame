import { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { getAllItems, type GameItem } from '../data/itemDatabase';
import { Check, AlertCircle, Info } from 'lucide-react';

interface LoadoutScreenProps {
  onComplete: () => void;
}

export function LoadoutScreen({ onComplete }: LoadoutScreenProps) {
  const {
    selectedItems,
    maxCapacity,
    selectItem,
    deselectItem,
    isSelected,
    canSelectItem,
    getCurrentWeight
  } = useInventory();

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const allItems = getAllItems();

  const currentWeight = getCurrentWeight();
  const canProceed = selectedItems.length > 0; // At least one item

  const handleItemClick = (item: GameItem) => {
    if (isSelected(item.id)) {
      deselectItem(item.id);
    } else {
      selectItem(item.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Prepare Your Loadout
          </h1>
          <p className="text-gray-400 text-lg mb-6">
            Choose your equipment wisely. Your survival depends on it.
          </p>

          {/* Capacity Indicator */}
          <div className="inline-block px-8 py-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">Capacity Used</div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        currentWeight >= maxCapacity
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}
                      style={{ width: `${(currentWeight / maxCapacity) * 100}%` }}
                    />
                  </div>
                  <span className="text-xl font-mono font-bold text-gray-200">
                    {currentWeight}/{maxCapacity}
                  </span>
                </div>
              </div>

              <div className="h-12 w-px bg-gray-700" />

              <div>
                <div className="text-sm text-gray-400 mb-1">Items Selected</div>
                <div className="text-xl font-mono font-bold text-gray-200">
                  {selectedItems.length} / 10
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategic Tip */}
        <div className="mb-8 p-4 bg-blue-900/20 border border-blue-800/40 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-blue-400 font-semibold mb-1">Tactical Advice</h3>
              <p className="text-sm text-gray-300">
                Balance your loadout: <span className="text-blue-300 font-medium">Warmth</span> for survival,{' '}
                <span className="text-orange-300 font-medium">Fire</span> for versatility, and{' '}
                <span className="text-green-300 font-medium">Signaling</span> for rescue.
                Heavy items (2 slots) offer powerful benefits but limit versatility.
              </p>
            </div>
          </div>
        </div>

        {/* Item Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {allItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isSelected={isSelected(item.id)}
              canSelect={canSelectItem(item.id)}
              onClick={() => handleItemClick(item)}
              onHover={(hovered) => setHoveredItem(hovered ? item.id : null)}
              isHovered={hoveredItem === item.id}
            />
          ))}
        </div>

        {/* Selected Items Summary */}
        {selectedItems.length > 0 && (
          <div className="mb-6 p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Your Loadout</h3>
            <div className="flex flex-wrap gap-3">
              {selectedItems.map((itemId) => {
                const item = allItems.find(i => i.id === itemId);
                if (!item) return null;

                return (
                  <div
                    key={itemId}
                    className="px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 flex items-center gap-2"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-200">{item.name}</span>
                    {item.weight > 1 && (
                      <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-0.5 rounded">
                        {item.weight} slots
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={onComplete}
            disabled={!canProceed}
            className={`
              px-12 py-4 rounded-lg font-bold text-lg transition-all duration-300
              ${canProceed
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white shadow-lg hover:shadow-green-500/50'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {canProceed ? '🎒 Begin Survival Scenario' : 'Select at least one item'}
          </button>

          {canProceed && (
            <p className="mt-3 text-sm text-gray-400 italic">
              Remember: You can't change your loadout once the scenario begins
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ItemCardProps {
  item: GameItem;
  isSelected: boolean;
  canSelect: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  isHovered: boolean;
}

function ItemCard({ item, isSelected, canSelect, onClick, onHover, isHovered }: ItemCardProps) {
  const canClick = isSelected || canSelect;

  return (
    <div
      className={`
        relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer
        ${isSelected
          ? 'bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-500 shadow-lg shadow-green-500/20'
          : canSelect
          ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:shadow-lg'
          : 'bg-gray-900/30 border-gray-800 opacity-60'
        }
        ${isHovered && !isSelected ? 'scale-105' : ''}
      `}
      onClick={canClick ? onClick : undefined}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-fadeIn">
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        </div>
      )}

      {/* Cannot Select Indicator */}
      {!canSelect && !isSelected && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center shadow-lg">
          <AlertCircle className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
      )}

      {/* Item Icon */}
      <div className="text-center mb-3">
        <div className="text-5xl mb-2">{item.icon}</div>
        <h3 className="font-bold text-gray-100 text-base">{item.name}</h3>
        {item.weight > 1 && (
          <div className="mt-1">
            <span className="inline-block px-2 py-0.5 bg-orange-900/50 text-orange-300 text-xs rounded font-medium">
              Heavy ({item.weight} slots)
            </span>
          </div>
        )}
      </div>

      {/* Category Badge */}
      <div className="mb-3">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryStyle(item.category)}`}>
          {getCategoryLabel(item.category)}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
        {item.description}
      </p>

      {/* Strategic Value */}
      <div className="pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500 italic leading-relaxed">
          {item.strategicValue}
        </p>
      </div>

      {/* Consumable Indicator */}
      {item.isConsumable && item.uses && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <span className="text-xs text-yellow-400 font-medium">
            ⚡ {item.uses}x use{item.uses > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function getCategoryStyle(category: string): string {
  const styles: Record<string, string> = {
    warmth: 'bg-blue-900/50 text-blue-300',
    fire: 'bg-orange-900/50 text-orange-300',
    water: 'bg-cyan-900/50 text-cyan-300',
    medical: 'bg-red-900/50 text-red-300',
    signaling: 'bg-yellow-900/50 text-yellow-300',
    shelter: 'bg-green-900/50 text-green-300',
    tool: 'bg-purple-900/50 text-purple-300'
  };
  return styles[category] || 'bg-gray-700 text-gray-300';
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    warmth: '🌡️ Warmth',
    fire: '🔥 Fire',
    water: '💧 Supplies',
    medical: '⚕️ Medical',
    signaling: '📡 Signal',
    shelter: '🏕️ Shelter',
    tool: '🔧 Tool'
  };
  return labels[category] || category;
}
