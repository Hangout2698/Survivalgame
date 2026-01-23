import { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { ITEM_DATABASE } from '../data/itemDatabase';
import { Package, X } from 'lucide-react';

export function InventoryTray() {
  const {
    selectedItems,
    consumedItems,
    getRemainingUses,
    isItemConsumed
  } = useInventory();

  const [expandedTooltip, setExpandedTooltip] = useState<string | null>(null);

  if (selectedItems.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-gray-900/95 backdrop-blur-md border-2 border-gray-700 rounded-2xl shadow-2xl px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inventory</span>
        </div>

        <div className="flex items-center gap-3">
          {selectedItems.map((itemId) => {
            const item = ITEM_DATABASE[itemId];
            if (!item) return null;

            const consumed = isItemConsumed(itemId);
            const remainingUses = getRemainingUses(itemId);
            const isExpanded = expandedTooltip === itemId;

            return (
              <div
                key={itemId}
                className="relative"
                onMouseEnter={() => setExpandedTooltip(itemId)}
                onMouseLeave={() => setExpandedTooltip(null)}
              >
                {/* Item Icon Button */}
                <div
                  className={`
                    w-16 h-16 rounded-xl border-2 transition-all duration-200
                    flex items-center justify-center text-3xl cursor-help
                    ${consumed
                      ? 'bg-gray-800 border-gray-700 opacity-40 grayscale'
                      : 'bg-gray-800 border-gray-600 hover:border-gray-500 hover:scale-110'
                    }
                  `}
                >
                  {item.icon}

                  {/* Consumed Overlay */}
                  {consumed && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <X className="w-8 h-8 text-red-500" strokeWidth={3} />
                    </div>
                  )}

                  {/* Uses Counter */}
                  {!consumed && item.isConsumable && remainingUses > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                      <span className="text-xs font-bold text-gray-900">{remainingUses}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Tooltip */}
                {isExpanded && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 animate-fadeIn">
                    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-xl">
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-3xl">{item.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-100 text-sm mb-1">{item.name}</h4>
                          <p className="text-xs text-gray-400">{item.description}</p>
                        </div>
                      </div>

                      {consumed ? (
                        <div className="pt-2 border-t border-gray-700">
                          <p className="text-xs text-red-400 font-medium">✗ Depleted</p>
                        </div>
                      ) : (
                        <>
                          {item.isConsumable && (
                            <div className="pt-2 border-t border-gray-700">
                              <p className="text-xs text-yellow-400 font-medium">
                                ⚡ {remainingUses} use{remainingUses !== 1 ? 's' : ''} remaining
                              </p>
                            </div>
                          )}

                          {item.benefits.bonuses && Object.keys(item.benefits.bonuses).length > 0 && (
                            <div className="pt-2 border-t border-gray-700 mt-2">
                              <p className="text-xs text-green-400 font-medium mb-1">Active Benefits:</p>
                              <div className="space-y-1">
                                {item.benefits.bonuses.bodyHeat && (
                                  <div className="text-xs text-gray-300">
                                    🌡️ +{item.benefits.bonuses.bodyHeat} Body Heat
                                  </div>
                                )}
                                {item.benefits.bonuses.hydration && (
                                  <div className="text-xs text-gray-300">
                                    💧 +{item.benefits.bonuses.hydration} Hydration
                                  </div>
                                )}
                                {item.benefits.bonuses.energy && (
                                  <div className="text-xs text-gray-300">
                                    ⚡ +{item.benefits.bonuses.energy} Energy
                                  </div>
                                )}
                                {item.benefits.bonuses.morale && (
                                  <div className="text-xs text-gray-300">
                                    ❤️ +{item.benefits.bonuses.morale} Morale
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Tooltip Arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                        <div className="w-3 h-3 bg-gray-800 border-r border-b border-gray-600 rotate-45" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
          <span>{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} equipped</span>
          {consumedItems.length > 0 && (
            <span className="ml-3 text-red-400">• {consumedItems.length} depleted</span>
          )}
        </div>
      </div>
    </div>
  );
}
