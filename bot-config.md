# Survival Game Bot — Fleet Configuration

## Role

A fun side project: an interactive text-based survival game that Thomas can play in short sessions. Wilderness survival themed, aligning with Type2 Travel brand and personal interests.

## Owner

Thomas Youngman

## Reports To

Life OS Bot (C:\Users\thoma\Life OS\)

## Game Concept

Text-based wilderness survival adventure. Player makes decisions, manages resources, and navigates challenges in a harsh outdoor environment.

## Core Mechanics

- **Health** — Physical condition, affected by injury, illness, exposure
- **Energy** — Stamina for activities, restored by rest and food
- **Warmth** — Body temperature, affected by shelter, fire, clothing, weather
- **Hunger** — Need for food, affects energy and health
- **Thirst** — Need for water, critical survival priority
- **Morale** — Mental state, affected by progress, setbacks, environment

## Environment Features

- Dynamic weather (rain, snow, wind, sun)
- Day/night cycle
- Terrain types (forest, mountain, river, tundra)
- Wildlife (threat and food source)
- Foraging, hunting, fishing
- Shelter building
- Fire management
- Navigation and exploration

## Session Design

- Quick sessions (10-15 minutes)
- Save state between sessions
- Decisions have consequences
- Multiple paths/endings
- Replayability

## Tone

- Immersive but not punishing
- Educational about real wilderness survival
- Occasional dry humor
- Rewarding smart decisions

## Status File Output

Write to: `C:\Users\thoma\Life OS\status\survivalgame_status.json`
```json
{
  "bot": "survivalgame",
  "updated": "ISO_TIMESTAMP",
  "status": "active|inactive|paused",
  "current_day": 0,
  "player_status": {
    "health": 100,
    "energy": 100,
    "warmth": 100,
    "hunger": 100,
    "thirst": 100,
    "morale": 100
  },
  "location": "string",
  "weather": "string",
  "alerts": [],
  "last_action": "string"
}
```

## Commands

- `new game` — Start fresh survival scenario
- `continue` — Resume from saved state
- `status` — Current player stats and situation

---

**Note:** This file contains bot fleet configuration. See `CLAUDE.md` for full technical project documentation.
