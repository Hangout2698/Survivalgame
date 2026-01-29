# Decision Chains Analysis

**Purpose:** Verify that the game has logical decision chains for all survival mechanics

---

## ✅ Fire Management System (COMPLETE)

### Chain 1: Starting Fire with Equipment
```
1. gather-tinder (energy > 20)
   └─> Adds "Tinder bundle" (1-2 qty) to equipment

2. start-fire-lighter (requires: hasLighter && hasTinder)
   └─> Creates fire (fireQuality = 75-95)
   └─> Consumes tinder bundle
   OR
   start-fire-matches (requires: hasMatches && hasTinder)
   └─> Creates fire (fireQuality = 65-85)
   └─> Consumes matches (lower success in bad weather)

3. gather-firewood (energy > 25)
   └─> Adds "Kindling sticks" (2-3 qty) to equipment
   └─> Adds "Fuel logs" (0-1 qty) to equipment [if lucky roll > 0.6]

4. add-fuel-small (requires: hasKindling && fireQuality > 0)
   └─> Adds +15 fireQuality
   └─> Consumes 1 kindling
   OR
   add-fuel-large (requires: hasFuelLogs && fireQuality > 0)
   └─> Adds +35 fireQuality
   └─> Consumes 1 fuel log
```

### Chain 2: Starting Fire without Equipment
```
1. start-fire-friction (energy > 30, NO equipment required)
   └─> 35-65% success rate depending on conditions
   └─> Creates fire (fireQuality = 65) if successful
   └─> High energy cost (25 energy)
   └─> Can cause injury (5 severity) on failure
```

### Missing Chain: None
**Status:** ✅ Fire system is complete and logical

---

## ✅ Water Management System (COMPLETE)

### Main Water Chain
```
1. collect-water (energy > 25)
   └─> Searches for water source (success rate varies by environment)
   └─> Adds "Water bottle (untreated)" to equipment on success
   └─> Desert: 30% success, Tundra: 60% success, Mountains: 80% success

2. boil-water (requires: hasUntreatedWater && fireQuality > 25)
   └─> Converts untreated water to clean water
   └─> Reduces fireQuality by -10
   └─> Safe to drink after purification

3. drink-clean-water (requires: hasCleanWater)
   └─> Restores +30 hydration
   └─> Restores +0.2°C body temperature
   └─> Consumes water bottle
```

### Emergency Water Option
```
drink-untreated-water (requires: hasUntreatedWater && hydration < 40)
   └─> Immediate +18 hydration
   └─> 40% chance of delayed illness (2-4 turns later)
   └─> Illness causes: -20 energy, -25 hydration
   └─> Risky but available when desperate
```

### Missing Chain: None
**Status:** ✅ Water system is complete and logical

---

## ✅ Shelter System (COMPLETE)

### Shelter Construction
```
1. shelter (environment-specific decision)
   └─> Builds basic shelter (+25 shelter)
   └─> Energy cost: 15
   └─> Time: 2 turns

2. improve-shelter (requires: shelter > 20)
   └─> Improves existing shelter (+20 shelter)
   └─> Energy cost: 20
   └─> Time: 2 turns

3. use-knife-shelter (requires: hasKnife && shelter > 0)
   └─> Knife-improved construction (+15 shelter)
   └─> Energy cost: 12
   └─> Unlocks knife maintenance decision
```

### Advanced Shelter Options
```
fortify (only available during storm/snow weather)
   └─> Reinforces shelter against severe weather
   └─> Energy cost: 30
   └─> Prevents weather damage

establish-base-camp (requires: hasShelter && hasFire && turn >= 5)
   └─> Creates permanent camp
   └─> Increases both shelter and fire effectiveness
```

### Missing Chain: None
**Status:** ✅ Shelter system is complete

---

## ✅ Food System (COMPLETE)

### Food Sources
```
1. eat-food (requires: hasFood in equipment)
   └─> Consumes food item from equipment
   └─> Restores +12-30 energy depending on food type
   └─> Works with starting equipment AND foraged food

2. forage-food (energy > 20) ✅ ADDED
   └─> Search for edible plants/berries
   └─> Environment-dependent success rate:
       • Forest: 70% success
       • Coast: 55% success
       • Mountains: 40% success
       • Desert: 15% success (25% poison risk!)
       • Tundra: 25% success
   └─> Adds 1-2 food items to equipment
   └─> Different food types by environment:
       • Berries (provide +2 hydration)
       • Mushrooms (+22 energy)
       • Roots (+22 energy)
       • Seaweed (+12 energy)
       • Lichen (+12 energy)
   └─> Poison risk varies by environment (5-25%)

3. scout (energy > 25)
   └─> Random chance to find food while scouting
   └─> Can find: Berries, Firewood bundle
   └─> 40% chance of finding berries (adds to equipment)
```

### Food Chain: Forage → Eat
```
Turn 1: forage-food in forest (-18 energy)
   └─> 70% success = +1-2 Wild mushrooms

Turn 2: eat-food (Wild mushrooms)
   └─> +22 energy, -1 hydration, +6 morale
   └─> Net gain: +4 energy over 2 turns
```

### ✅ Gap Closed: Dedicated foraging now implemented
- Players have renewable food source
- Environment matters for foraging strategy
- Risk-reward system (poison risk vs success rate)
- Integrates with critical decision priority

---

## ✅ Signaling System (COMPLETE)

### Visual Signals
```
1. signal-mirror (requires: hasSignalMirror && daytime)
   └─> 40-60% success rate depending on effectiveness
   └─> Works best in clear weather, midday
   └─> Energy cost: 10

2. signal-flashlight (requires: hasFlashlight)
   └─> Works day and night
   └─> Better at night
   └─> Energy cost: 8

3. signal-fire (requires: fireQuality > 30)
   └─> Uses existing fire to create smoke/beacon
   └─> +20 signal effectiveness bonus
   └─> Reduces fire quality by -15
   └─> Energy cost: 15
```

### Audio Signals
```
signal-whistle (requires: hasWhistle)
   └─> Sound-based signal
   └─> Works in all weather
   └─> 30-50% success rate
   └─> Energy cost: 5
```

### Advanced Signaling
```
signal-barrage (requires: 2+ signal items && turn >= 10)
   └─> Uses multiple devices simultaneously
   └─> Higher success rate
   └─> Energy cost: 30

emergency-flare (requires: hasFlare && turn >= 8)
   └─> ONE-TIME use, very high rescue probability
   └─> Energy cost: 15
```

### Missing Chain: None
**Status:** ✅ Signaling system is complete and varied

---

## ✅ Medical/Injury System (COMPLETE)

### Treatment Options
```
1. treat-injury-full (requires: hasFirstAidKit && injurySeverity > 0)
   └─> Heals -20 to -25 injury severity
   └─> Consumes first aid kit
   └─> Energy cost: 10

2. treat-injury-partial (requires: hasBandages || hasAntiseptic)
   └─> Heals -10 to -15 injury severity
   └─> Consumes bandages/antiseptic
   └─> Energy cost: 12

3. basic-injury-care (requires: injurySeverity > 40 && NO medical supplies)
   └─> Improvised treatment
   └─> Heals -3 to -12 injury severity
   └─> Uses natural materials
   └─> Energy cost: 8

4. rest (when shelter > 60)
   └─> PASSIVE healing: -5 injury per rest
   └─> No equipment needed
   └─> Energy recovery: +35
```

### Missing Chain: None
**Status:** ✅ Medical system has equipment-based AND improvised options

---

## ✅ Navigation System (COMPLETE)

### Environment-Specific Navigation
```
Mountains:
   - retrace-trail (energy > 40)
   - descend (energy > 45)
   - challenging-climb (morale > 60, energy > 40)

Forest:
   - search-trail (energy > 40)
   - scout (energy > 25)

Coast:
   - follow-coast (energy > 40)

Urban-edge:
   - find-exit (energy > 40)
   - backtrack-vehicle (energy > 35)
```

### High-Risk Navigation
```
panic-move (morale < 40, energy > 45, turn > 5)
   └─> Desperate navigation attempt
   └─> High injury risk
   └─> Energy cost: 50

desperate-rush (morale < 35, energy > 30)
   └─> Risky but fast movement
   └─> Energy cost: 45
```

### Missing Chain: None
**Status:** ✅ Navigation is environment-aware and has risk/reward options

---

## Summary of Gaps and Recommendations

### Critical Gaps: NONE ✅
All major survival systems have complete decision chains.

### Optional Enhancements:

#### 1. Food Foraging (Low Priority)
**Current:** Food from starting equipment + random scouting
**Enhancement:** Add dedicated `forage-food` decision
```typescript
{
  id: 'forage-food',
  text: 'Forage for edible plants and berries',
  energyCost: 18,
  riskLevel: 3,
  timeRequired: 2,
  environmentalHint: environmentSpecificForagingAdvice
}
```
**Benefit:** More player agency over food supply
**Risk:** Could make game too easy if food is too abundant

#### 2. Water Collection from Rain (Optional)
**Enhancement:** During rain/storm weather, add decision to collect rainwater
```typescript
{
  id: 'collect-rainwater',
  text: 'Set up container to collect rainwater',
  energyCost: 5,
  riskLevel: 1,
  timeRequired: 1
}
```
**Benefit:** Easier water in rainy environments
**Risk:** Already balanced; might make water TOO easy

#### 3. Shelter Materials Gathering (Optional)
**Enhancement:** Add explicit "gather shelter materials" before building
```typescript
{
  id: 'gather-shelter-materials',
  text: 'Collect branches, leaves, and debris for shelter',
  energyCost: 12,
  riskLevel: 1,
  timeRequired: 1
}
```
**Benefit:** More realistic progression
**Risk:** Adds extra step that may feel tedious

---

## Decision Flow Verification

### Example Playthrough: Fire-Based Survival

**Turn 1:** `shelter` - Build basic shelter (-15 energy, +25 shelter)
**Turn 2:** `gather-tinder` - Collect tinder (-8 energy, +1-2 tinder)
**Turn 3:** `start-fire-lighter` - Start fire with lighter (-5 energy, +75 fireQuality)
**Turn 4:** `gather-firewood` - Collect kindling/logs (-15 energy, +2-3 kindling, 0-1 logs)
**Turn 5:** `rest` - Recover energy (+35 energy, -5 injury if shelter > 60)
**Turn 6:** `add-fuel-large` - Add log to fire (-4 energy, +35 fireQuality)
**Turn 7:** `collect-water` - Find water (-12 energy, +1 untreated water)
**Turn 8:** `boil-water` - Purify water (-8 energy, -10 fireQuality, +1 clean water)
**Turn 9:** `drink-clean-water` - Drink purified water (-2 energy, +30 hydration)
**Turn 10:** `signal-fire` - Signal with fire smoke (-15 energy, -15 fireQuality)

**Result:** All decisions flow logically. No broken chains.

---

## Conclusion

✅ **ALL CRITICAL DECISION CHAINS ARE COMPLETE**

The game has logical progression for:
- Fire (gather → start → maintain)
- Water (collect → purify → drink)
- Shelter (build → improve → fortify)
- Food (consume starting equipment + scout)
- Signaling (multiple methods, equipment-based)
- Medical (equipment-based + improvised + passive healing)
- Navigation (environment-specific paths)

**No critical gaps exist.** The game is playable and logical from turn 1 through win conditions.

**Optional enhancements** listed above could add depth but are not necessary for a complete gameplay experience.
