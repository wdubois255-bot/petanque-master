---
name: sfx
description: Generate a sound effect for Petanque Master using ElevenLabs MCP or create one with jsfxr parameters. Use for game audio (impacts, UI, ambiance).
user-invocable: true
argument-hint: "[sound-description]"
allowed-tools: Bash, Read, Write
---

# Generate Sound Effect

Generate a sound effect for **Petanque Master**.

## Input

Sound description: `$ARGUMENTS`

## Audio Constraints

- **Format** : WAV or OGG (Phaser compatible)
- **Duration** : < 3 seconds for SFX, can be longer for ambiance
- **Style** : retro/chiptune for UI sounds, realistic for petanque impacts
- **Sample rate** : 44100 Hz
- **Channels** : Mono (saves space, Phaser handles spatial)

## Sound Categories

### Petanque Impacts
- `boule-clac` : metallic clank, short, sharp, high frequency decay
- `boule-roulement` : rolling on gravel, continuous loop, pitch varies with speed
- `boule-atterrissage` : thud + crunch on landing
- `cochonnet-touche` : light ping, higher pitch than boule
- `boule-morte` : dull thud, low, sad

### Ambiance
- `cigales` : cicada sounds (ESSENTIAL for Provence feel), loop
- `brise` : light wind, loop
- `oiseaux` : bird chirps, occasional
- `foule-ooh` : small crowd "ooh!" reaction
- `foule-applaudissements` : light applause
- `cloches` : distant church bells

### UI
- `ui-click` : soft click for menu selection
- `ui-confirm` : positive confirmation sound
- `ui-cancel` : light negative sound
- `dialogue-blip` : typewriter blip for dialog text
- `badge-obtenu` : fanfare jingle, triumphant

### Music Cues
- `victoire` : short victory jingle (3-5 sec)
- `defaite` : short defeat jingle (3-5 sec)
- `mene-gagnee` : quick positive sting

## Steps

1. Try ElevenLabs MCP sound generation with the description
2. If not available, suggest jsfxr parameters for the sound
3. Save to: `assets/audio/sfx/$ARGUMENTS.wav` (or .ogg)
4. Report: file path, duration, description

## Example

```
/sfx boule-clac
/sfx cigales
/sfx ui-click
/sfx victoire
```
