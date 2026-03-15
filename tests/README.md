# Tests - Petanque Master

Tests end-to-end Playwright. Lancer le serveur dev avant : `npm run dev`

## Fichiers

| Test | Commande | Ce qu'il teste |
|------|----------|---------------|
| **test-sprint3.mjs** | `node tests/test-sprint3.mjs` | TitleScene → IntroScene → choix boules → OverworldScene → Route 1 → sauvegarde |
| **test-game.mjs** | `node tests/test-game.mjs` | Moteur petanque : menes, scoring, IA, lancers |
| **test-sprint35.mjs** | `node tests/test-sprint35.mjs` | Sprint 3.5 : loft, carreau, prediction trajectoire |
| **test-transition.mjs** | `node tests/test-transition.mjs` | Transitions de maps (fadeOut/fadeIn) |
| **test-e2e-playtest.mjs** | `node tests/test-e2e-playtest.mjs` | Playtest complet TitleScene → PetanqueScene |

## Usage rapide

```bash
npm run dev &          # Lancer le serveur
node tests/test-sprint3.mjs   # Test principal
node tests/test-game.mjs      # Test moteur petanque
```
