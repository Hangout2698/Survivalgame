# Survival Reference Materials

This directory contains reference materials used to extract survival principles for the game.

## Contents

- **SAS Survival Handbook_compressed-1-376.pdf** - First part of the SAS Survival Handbook (pages 1-376)
- **SAS Survival Handbook_compressed-377-752.pdf** - Second part of the SAS Survival Handbook (pages 377-752)

## Purpose

These PDFs serve as the authoritative source for survival knowledge used in the game. The principles, techniques, and advice from these handbooks are extracted and integrated into the game's decision-making system to ensure realistic and educational gameplay.

## Extraction Process

The survival principles are extracted from these PDFs using the script:
```bash
npm run extract-principles
```

This script:
1. Reads both PDF files
2. Extracts text content
3. Categorizes principles into topics (shelter, water, fire, food, navigation, etc.)
4. Saves structured data to `src/data/survivalPrinciples.json`

The extracted principles include over 200 key survival concepts covering:
- **Shelter** - Protection from elements, building techniques
- **Water** - Finding, purifying, and rationing water
- **Fire** - Starting and maintaining fires for warmth and signaling
- **Food** - Foraging, hunting, and energy conservation
- **Navigation** - Wayfinding and staying found
- **Signaling** - Rescue techniques and distress signals
- **First Aid** - Injury treatment and medical priorities
- **Priorities** - The Rule of 3s and survival decision-making
- **Psychology** - Mental resilience and panic management
- **Weather** - Understanding environmental hazards

## Integration

The extracted principles are used throughout the game via the `survivalPrinciplesService.ts` engine module. See `src/engine/principlesIntegrationExample.ts` for usage examples.

## Source Credit

**SAS Survival Handbook** by John "Lofty" Wiseman
- Comprehensive guide to wilderness survival
- Based on British Special Air Service (SAS) training
- Covers survival in all climates and environments

## Note

These files are for reference purposes only and should not be distributed. They are used to enhance the educational value and realism of the survival game.
