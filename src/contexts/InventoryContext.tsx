import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ITEM_DATABASE, calculateTotalWeight } from '../data/itemDatabase';

interface ItemState {
  id: string;
  remainingUses?: number;
}

interface InventoryContextType {
  // Selected items (IDs)
  selectedItems: string[];

  // Consumed/depleted items
  consumedItems: string[];

  // Item states (for tracking uses)
  itemStates: Record<string, ItemState>;

  // Max capacity (slots)
  maxCapacity: number;

  // Actions
  selectItem: (itemId: string) => boolean;
  deselectItem: (itemId: string) => void;
  isSelected: (itemId: string) => boolean;
  canSelectItem: (itemId: string) => boolean;
  getCurrentWeight: () => number;

  // Consumption
  consumeItem: (itemId: string) => boolean;
  isItemConsumed: (itemId: string) => boolean;
  getRemainingUses: (itemId: string) => number;

  // Reset
  resetInventory: () => void;

  // Item checks (for game logic)
  hasItem: (itemId: string) => boolean;
  hasAnyItem: (itemIds: string[]) => boolean;

  // Sound/haptic feedback
  triggerItemFeedback: (type: 'select' | 'deselect' | 'use' | 'locked') => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [consumedItems, setConsumedItems] = useState<string[]>([]);
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});
  const maxCapacity = 3; // Player can carry 3 slots worth of items

  const getCurrentWeight = useCallback(() => {
    return calculateTotalWeight(selectedItems);
  }, [selectedItems]);

  const canSelectItem = useCallback((itemId: string): boolean => {
    const item = ITEM_DATABASE[itemId];
    if (!item) return false;

    // Already selected
    if (selectedItems.includes(itemId)) return false;

    // Check if adding this item would exceed capacity
    const currentWeight = getCurrentWeight();
    return (currentWeight + item.weight) <= maxCapacity;
  }, [selectedItems, getCurrentWeight, maxCapacity]);

  const selectItem = useCallback((itemId: string): boolean => {
    if (!canSelectItem(itemId)) {
      triggerItemFeedback('locked');
      return false;
    }

    const item = ITEM_DATABASE[itemId];
    setSelectedItems(prev => [...prev, itemId]);

    // Initialize item state
    if (item.isConsumable && item.uses) {
      setItemStates(prev => ({
        ...prev,
        [itemId]: {
          id: itemId,
          remainingUses: item.uses
        }
      }));
    }

    triggerItemFeedback('select');
    return true;
  }, [canSelectItem]);

  const deselectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => prev.filter(id => id !== itemId));

    // Clear item state
    setItemStates(prev => {
      const newStates = { ...prev };
      delete newStates[itemId];
      return newStates;
    });

    triggerItemFeedback('deselect');
  }, []);

  const isSelected = useCallback((itemId: string): boolean => {
    return selectedItems.includes(itemId);
  }, [selectedItems]);

  const consumeItem = useCallback((itemId: string): boolean => {
    const item = ITEM_DATABASE[itemId];
    if (!item || !item.isConsumable) return false;

    // Check if item is in inventory
    if (!selectedItems.includes(itemId)) return false;

    // Check if already fully consumed
    if (consumedItems.includes(itemId)) return false;

    const currentState = itemStates[itemId];
    const remainingUses = currentState?.remainingUses ?? item.uses ?? 1;

    if (remainingUses <= 1) {
      // Last use - mark as consumed
      setConsumedItems(prev => [...prev, itemId]);
      setItemStates(prev => ({
        ...prev,
        [itemId]: { id: itemId, remainingUses: 0 }
      }));
    } else {
      // Decrement uses
      setItemStates(prev => ({
        ...prev,
        [itemId]: { id: itemId, remainingUses: remainingUses - 1 }
      }));
    }

    triggerItemFeedback('use');
    return true;
  }, [selectedItems, consumedItems, itemStates]);

  const isItemConsumed = useCallback((itemId: string): boolean => {
    return consumedItems.includes(itemId);
  }, [consumedItems]);

  const getRemainingUses = useCallback((itemId: string): number => {
    const item = ITEM_DATABASE[itemId];
    if (!item.isConsumable) return Infinity;

    const state = itemStates[itemId];
    return state?.remainingUses ?? item.uses ?? 0;
  }, [itemStates]);

  const hasItem = useCallback((itemId: string): boolean => {
    return selectedItems.includes(itemId) && !consumedItems.includes(itemId);
  }, [selectedItems, consumedItems]);

  const hasAnyItem = useCallback((itemIds: string[]): boolean => {
    return itemIds.some(id => hasItem(id));
  }, [hasItem]);

  const resetInventory = useCallback(() => {
    setSelectedItems([]);
    setConsumedItems([]);
    setItemStates({});
  }, []);

  const triggerItemFeedback = useCallback((type: 'select' | 'deselect' | 'use' | 'locked') => {
    // Visual shake effect
    const body = document.body;

    switch (type) {
      case 'select':
        // Positive feedback - subtle scale up
        body.style.animation = 'none';
        setTimeout(() => {
          body.style.animation = 'item-select 0.2s ease-out';
        }, 10);
        break;

      case 'deselect':
        // Neutral feedback - fade
        body.style.animation = 'none';
        setTimeout(() => {
          body.style.animation = 'item-deselect 0.15s ease-out';
        }, 10);
        break;

      case 'use':
        // Item consumed - flash effect
        body.style.animation = 'none';
        setTimeout(() => {
          body.style.animation = 'item-use 0.3s ease-out';
        }, 10);
        break;

      case 'locked':
        // Error feedback - shake
        body.style.animation = 'none';
        setTimeout(() => {
          body.style.animation = 'item-locked 0.4s ease-out';
        }, 10);
        break;
    }

    // Clear animation after completion
    setTimeout(() => {
      body.style.animation = 'none';
    }, 500);
  }, []);

  const value: InventoryContextType = {
    selectedItems,
    consumedItems,
    itemStates,
    maxCapacity,
    selectItem,
    deselectItem,
    isSelected,
    canSelectItem,
    getCurrentWeight,
    consumeItem,
    isItemConsumed,
    getRemainingUses,
    resetInventory,
    hasItem,
    hasAnyItem,
    triggerItemFeedback
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
}
