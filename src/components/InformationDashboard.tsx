import React, { useState } from 'react';
import { GameState } from '../types/game';
import EquipmentTab from './dashboard/EquipmentTab';
import EnvironmentTab from './dashboard/EnvironmentTab';
import HistoryTab from './dashboard/HistoryTab';

type TabType = 'equipment' | 'environment' | 'history';

interface InformationDashboardProps {
  gameState: GameState;
  compact?: boolean;
}

/**
 * Consolidated information dashboard with tabbed interface
 * Replaces SurvivalStatusDashboard with comprehensive game data access
 *
 * Tabs:
 * - Equipment: Item details, benefits, uses remaining
 * - Environment: Weather, temperature, wind, threats
 * - History: Extended decision log with quality indicators
 */
const InformationDashboard: React.FC<InformationDashboardProps> = ({
  gameState,
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('equipment');

  const tabs = [
    { id: 'equipment' as TabType, label: 'Equipment', icon: '🎒' },
    { id: 'environment' as TabType, label: 'Environment', icon: '🌡️' },
    { id: 'history' as TabType, label: 'History', icon: '📜' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent, tabId: TabType) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab(tabId);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex].id);
    }
  };

  return (
    <div className={`bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700 ${compact ? '' : 'shadow-xl'}`}>
      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label="Information Dashboard Tabs"
        className="flex border-b border-slate-700 bg-slate-900/50"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            className={`
              flex-1 px-3 py-3 text-sm font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-inset
              ${activeTab === tab.id
                ? 'text-cyan-400 border-b-2 border-cyan-500 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }
            `}
          >
            <span className="mr-1.5">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="overflow-y-auto" style={{ maxHeight: compact ? '60vh' : '70vh' }}>
        {activeTab === 'equipment' && (
          <div
            role="tabpanel"
            id="equipment-panel"
            aria-labelledby="equipment-tab"
            tabIndex={0}
          >
            <EquipmentTab gameState={gameState} compact={compact} />
          </div>
        )}

        {activeTab === 'environment' && (
          <div
            role="tabpanel"
            id="environment-panel"
            aria-labelledby="environment-tab"
            tabIndex={0}
          >
            <EnvironmentTab gameState={gameState} compact={compact} />
          </div>
        )}

        {activeTab === 'history' && (
          <div
            role="tabpanel"
            id="history-panel"
            aria-labelledby="history-tab"
            tabIndex={0}
          >
            <HistoryTab gameState={gameState} compact={compact} />
          </div>
        )}
      </div>
    </div>
  );
};

export default InformationDashboard;
