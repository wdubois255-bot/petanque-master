---
name: playtest
description: Launch the Vite dev server and open Petanque Master in the browser for testing. Manual only.
user-invocable: true
disable-model-invocation: true
allowed-tools: Bash
---

# Playtest Petanque Master

Launch the game in development mode for testing.

## Steps

1. Check if a dev server is already running on port 8080:
   ```bash
   curl -s http://localhost:8080 > /dev/null 2>&1 && echo "RUNNING" || echo "STOPPED"
   ```

2. If not running, start the Vite dev server:
   ```bash
   cd "c:/Users/wdubo/OneDrive/Bureau/Projets/Projet jeux web petanque Pokémon"
   npm run dev
   ```

3. Open in browser:
   ```bash
   start http://localhost:8080
   ```

4. Report: "Game running at http://localhost:8080 — Ctrl+C to stop"

## Quick Checks After Launch

- [ ] No console errors in browser DevTools
- [ ] Game renders at correct resolution (832x480 scaled)
- [ ] Pixel art is crisp (no blurring)
- [ ] Audio plays after first click
- [ ] 60 FPS in Performance tab
