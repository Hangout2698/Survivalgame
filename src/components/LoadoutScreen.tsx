import { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { getAllItems, type GameItem } from '../data/itemDatabase';
import { Check, Info, MapPin, CloudRain, Thermometer, Clock, Mountain } from 'lucide-react';
import type { Scenario } from '../types/game';

interface LoadoutScreenProps {
  scenario: Scenario;
  onComplete: () => void;
}

export function LoadoutScreen({ scenario, onComplete }: LoadoutScreenProps) {
  const {
    selectedItems,
    maxItems,
    selectItem,
    deselectItem,
    isSelected,
    canSelectItem,
    getSelectedCount
  } = useInventory();

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const allItems = getAllItems();

  const selectedCount = getSelectedCount();
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
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Select Your Survival Kit
          </h1>
          <p className="text-gray-400 text-lg mb-4">
            Choose {maxItems} items. Force yourself to make hard decisions—that's the training.
          </p>
        </div>

        {/* Environmental Briefing */}
        <EnvironmentalBriefing scenario={scenario} />

        {/* Kit Selection Indicator */}
        <div className="text-center mb-8">
          <div className="inline-block px-8 py-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">Kit Selection</div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        selectedCount >= maxItems
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}
                      style={{ width: `${(selectedCount / maxItems) * 100}%` }}
                    />
                  </div>
                  <span className="text-xl font-mono font-bold text-gray-200">
                    {selectedCount}/{maxItems}
                  </span>
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
              <h3 className="text-blue-400 font-semibold mb-1">Survival Priorities</h3>
              <p className="text-sm text-gray-300">
                Balance is key: <span className="text-blue-300 font-medium">Warmth</span> prevents hypothermia,{' '}
                <span className="text-orange-300 font-medium">Fire</span> enables water purification and signaling,{' '}
                <span className="text-cyan-300 font-medium">Water containers</span> provide long-term hydration,{' '}
                and <span className="text-yellow-300 font-medium">Signaling tools</span> facilitate rescue.
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
              selectedCount={selectedCount}
              maxItems={maxItems}
            />
          ))}
        </div>

        {/* Selected Items Summary */}
        {selectedItems.length > 0 && (
          <div className="mb-6 p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Your Survival Kit</h3>
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
                    {item.isContainer && (
                      <span className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded">
                        Container
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

function EnvironmentalBriefing({ scenario }: { scenario: Scenario }) {
  const environmentInfo = {
    mountains: {
      name: 'Mountain Terrain',
      icon: '⛰️',
      color: 'from-blue-600 to-indigo-600',
      considerations: 'Altitude affects temperature. Hypothermia risk is high. Navigation is challenging on steep terrain.'
    },
    desert: {
      name: 'Desert Environment',
      icon: '🏜️',
      color: 'from-yellow-600 to-orange-600',
      considerations: 'Extreme heat during day, cold at night. Water scarcity is critical. Shelter from sun is essential.'
    },
    forest: {
      name: 'Forest Wilderness',
      icon: '🌲',
      color: 'from-green-600 to-emerald-600',
      considerations: 'Natural shelter available. Fire materials abundant. Navigation requires compass or landmarks.'
    },
    coast: {
      name: 'Coastal Area',
      icon: '🌊',
      color: 'from-cyan-600 to-blue-600',
      considerations: 'Wind exposure is constant. Salt water requires purification. Signaling opportunities from beaches.'
    },
    tundra: {
      name: 'Arctic Tundra',
      icon: '❄️',
      color: 'from-blue-400 to-cyan-400',
      considerations: 'Extreme cold is life-threatening. Shelter and fire are critical. Limited natural resources.'
    },
    'urban-edge': {
      name: 'Urban Outskirts',
      icon: '🏭',
      color: 'from-gray-600 to-slate-600',
      considerations: 'Some man-made shelter available. Materials for signaling present. Watch for hazards.'
    }
  };

  const weatherInfo = {
    clear: { name: 'Clear Skies', icon: '☀️', impact: 'Good visibility for signaling' },
    rain: { name: 'Rainy', icon: '🌧️', impact: 'Risk of getting wet and hypothermia' },
    wind: { name: 'Windy', icon: '💨', impact: 'Wind chill increases cold exposure' },
    snow: { name: 'Snowing', icon: '❄️', impact: 'Severe hypothermia risk, poor visibility' },
    heat: { name: 'Extreme Heat', icon: '🌡️', impact: 'Rapid dehydration, heat exhaustion risk' },
    storm: { name: 'Storm', icon: '⛈️', impact: 'Dangerous conditions, seek shelter immediately' }
  };

  const timeInfo = {
    dawn: { name: 'Dawn', icon: '🌅', detail: 'Early morning light' },
    morning: { name: 'Morning', icon: '🌄', detail: 'Mid-morning' },
    midday: { name: 'Midday', icon: '☀️', detail: 'Peak sun exposure' },
    afternoon: { name: 'Afternoon', icon: '🌤️', detail: 'Late afternoon' },
    dusk: { name: 'Dusk', icon: '🌆', detail: 'Light fading soon' },
    night: { name: 'Night', icon: '🌙', detail: 'Full darkness' }
  };

  const env = environmentInfo[scenario.environment];
  const weather = weatherInfo[scenario.weather];
  const time = timeInfo[scenario.timeOfDay];

  const getTempColor = (temp: number) => {
    if (temp < 0) return 'text-blue-400';
    if (temp < 10) return 'text-cyan-400';
    if (temp < 20) return 'text-green-400';
    if (temp < 30) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="mb-8 p-6 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 rounded-xl shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-100">Mission Briefing</h2>
      </div>

      <p className="text-gray-300 mb-6 text-lg leading-relaxed">
        You're planning a <span className="font-semibold text-white">wilderness expedition</span> into{' '}
        <span className={`font-bold bg-gradient-to-r ${env.color} bg-clip-text text-transparent`}>
          {env.name}
        </span>
        . Review the expected conditions and choose your gear wisely.
      </p>

      {/* Conditions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Environment */}
        <div className="p-4 bg-gray-900/60 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Mountain className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Environment</span>
          </div>
          <div className="text-3xl mb-1">{env.icon}</div>
          <div className="text-lg font-semibold text-gray-100">{env.name}</div>
        </div>

        {/* Weather */}
        <div className="p-4 bg-gray-900/60 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CloudRain className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Weather</span>
          </div>
          <div className="text-3xl mb-1">{weather.icon}</div>
          <div className="text-lg font-semibold text-gray-100">{weather.name}</div>
          <div className="text-xs text-gray-400 mt-1">{weather.impact}</div>
        </div>

        {/* Temperature */}
        <div className="p-4 bg-gray-900/60 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Temperature</span>
          </div>
          <div className={`text-4xl font-bold ${getTempColor(scenario.temperature)} mb-1`}>
            {scenario.temperature}°C
          </div>
          <div className="text-xs text-gray-400">
            Wind: {scenario.windSpeed} km/h
          </div>
        </div>

        {/* Time of Day */}
        <div className="p-4 bg-gray-900/60 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Time</span>
          </div>
          <div className="text-3xl mb-1">{time.icon}</div>
          <div className="text-lg font-semibold text-gray-100">{time.name}</div>
          <div className="text-xs text-gray-400 mt-1">{time.detail}</div>
        </div>
      </div>

      {/* Environment-Specific Considerations */}
      <div className="p-4 bg-amber-900/20 border border-amber-700/40 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-400 font-semibold mb-1">Key Considerations for {env.name}</h3>
            <p className="text-sm text-gray-300">{env.considerations}</p>
          </div>
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
  selectedCount: number;
  maxItems: number;
}

function ItemCard({ item, isSelected, canSelect, onClick, onHover, isHovered, selectedCount, maxItems }: ItemCardProps) {
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

      {/* Cannot Select Indicator - Clearer messaging */}
      {!canSelect && !isSelected && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-red-900/90 border border-red-600 rounded text-[10px] font-bold text-red-200 shadow-lg">
          🔒 Kit Full ({selectedCount}/{maxItems})
        </div>
      )}

      {/* Item Icon */}
      <div className="text-center mb-3">
        <div className="text-5xl mb-2">{item.icon}</div>
        <h3 className="font-bold text-gray-100 text-base">{item.name}</h3>
        {item.isContainer && (
          <div className="mt-1">
            <span className="inline-block px-2 py-0.5 bg-cyan-900/50 text-cyan-300 text-xs rounded font-medium">
              Container (Stays with you)
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

      {/* Uses Indicator */}
      {item.initialUses !== undefined && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <span className="text-xs text-yellow-400 font-medium">
            {item.isContainer ? '💧' : '⚡'} {item.initialUses}x use{item.initialUses > 1 ? 's' : ''}
            {!item.isPersistent && ' (consumable)'}
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
    tool: 'bg-purple-900/50 text-purple-300',
    food: 'bg-amber-900/50 text-amber-300'
  };
  return styles[category] || 'bg-gray-700 text-gray-300';
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    warmth: '🌡️ Warmth',
    fire: '🔥 Fire',
    water: '💧 Water',
    medical: '⚕️ Medical',
    signaling: '📡 Signal',
    shelter: '🏕️ Shelter',
    tool: '🔧 Tool',
    food: '🍫 Food'
  };
  return labels[category] || category;
}
