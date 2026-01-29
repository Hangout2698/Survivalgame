import { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { ITEM_DATABASE } from '../data/itemDatabase';
import { Package, X, ChevronDown, ChevronUp } from 'lucide-react';

export function InventoryTray() {
  const {
    selectedItems,
    consumedItems,
    getRemainingUses,
    isItemConsumed
  } = useInventory();

  const [expandedTooltip, setExpandedTooltip] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  if (selectedItems.length === 0) return null;

  // Show first 6 items on mobile when not expanded
  const MOBILE_ITEM_LIMIT = 6;
  const hasOverflow = selectedItems.length > MOBILE_ITEM_LIMIT;
  const displayedItems = !showAllItems && hasOverflow
    ? selectedItems.slice(0, MOBILE_ITEM_LIMIT)
    : selectedItems;

  return (
    <div className="fixed bottom-4 left-4 right-4 lg:bottom-auto lg:top-4 lg:left-auto lg:right-4 lg:w-96 z-40">
      <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl px-3 lg:px-6 py-3 lg:py-4">
        {/* Header with collapse button */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-300">Inventory</span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:hidden p-1 hover:bg-gray-700/50 rounded transition-colors"
            aria-label={isCollapsed ? "Expand inventory" : "Collapse inventory"}
          >
            {isCollapsed ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* Item grid - collapsible on mobile, wraps on desktop */}
        {!isCollapsed && (
          <div className="grid grid-cols-6 lg:flex lg:flex-wrap items-center gap-2 pb-2 lg:pb-0">
          {displayedItems.map((itemId) => {
            const item = ITEM_DATABASE[itemId];
            if (!item) return null;

            const consumed = isItemConsumed(itemId);
            const remainingUses = getRemainingUses(itemId);
            const isExpanded = expandedTooltip === itemId;

            return (
              <div
                key={itemId}
                className="relative flex-shrink-0"
                onMouseEnter={() => setExpandedTooltip(itemId)}
                onMouseLeave={() => setExpandedTooltip(null)}
                onClick={() => setExpandedTooltip(expandedTooltip === itemId ? null : itemId)}
              >
                {/* Item Icon Button */}
                <div
                  className={`
                    w-12 h-12 lg:w-16 lg:h-16 rounded-lg border-2 transition-all duration-200
                    flex items-center justify-center text-xl lg:text-2xl cursor-pointer
                    ${consumed
                      ? 'bg-gray-800 border-gray-700 opacity-40 grayscale'
                      : 'bg-gray-800 border-gray-600 hover:border-gray-500 active:scale-95 hover:scale-105'
                    }
                  `}
                >
                  {item.icon}

                  {/* Consumed Overlay */}
                  {consumed && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <X className="w-6 h-6 md:w-8 md:h-8 text-red-500" strokeWidth={3} />
                    </div>
                  )}

                  {/* Uses Counter */}
                  {!consumed && item.initialUses !== undefined && remainingUses > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                      <span className="text-[10px] md:text-xs font-bold text-gray-900">{remainingUses}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Tooltip */}
                {isExpanded && (
                  <div className="absolute bottom-full left-1/2 lg:bottom-auto lg:left-auto lg:right-full lg:top-0 transform -translate-x-1/2 lg:translate-x-0 mb-2 lg:mb-0 lg:mr-2 w-56 md:w-64 animate-fadeIn z-50">
                    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl">
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
                          {item.initialUses !== undefined && (
                            <div className="pt-2 border-t border-gray-700">
                              <p className="text-xs text-yellow-400 font-medium">
                                {item.isContainer ? '💧' : '⚡'} {remainingUses} use{remainingUses !== 1 ? 's' : ''} remaining
                                {item.isContainer && ' (container stays with you)'}
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
                      <div className="absolute top-full left-1/2 lg:top-2 lg:left-full lg:right-auto transform -translate-x-1/2 lg:translate-x-0 lg:-translate-y-0 -mt-px lg:mt-0 lg:-ml-px">
                        <div className="w-3 h-3 bg-gray-800 border-r border-b lg:border-l lg:border-t lg:border-r-0 lg:border-b-0 border-gray-600 rotate-45" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}

        {/* Show more button for overflow items */}
        {!isCollapsed && hasOverflow && (
          <button
            onClick={() => setShowAllItems(!showAllItems)}
            className="lg:hidden w-full mt-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 active:scale-95 rounded-lg text-xs text-gray-300 font-medium transition-all border border-gray-700"
          >
            {showAllItems
              ? `Show less`
              : `Show all ${selectedItems.length} items`
            }
          </button>
        )}

        {/* Quick Stats */}
        {!isCollapsed && (
          <div className="mt-2 pt-2 border-t border-gray-700 flex items-center justify-between text-xs">
            <span className="text-gray-500">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}</span>
            {consumedItems.length > 0 && (
              <span className="text-red-400">{consumedItems.length} depleted</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
