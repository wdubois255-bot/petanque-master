# Captures a realiser

## Methode
```bash
# Pour chaque commit ci-dessous :
git stash
git checkout <HASH>
npm run dev
# → Capturer dans le navigateur (F12 → responsive 832x480)
# → Sauver dans docs/making-of/screenshots/XX_description.png
git checkout master
git stash pop
```

## Commits cles a capturer

| # | Commit | Description | Quoi capturer |
|---|--------|-------------|---------------|
| 01 | `26ed760` | Sprint 0+1 : premier moteur | Ecran de jeu brut, premier lancer |
| 02 | `62fe7cd` | Sprint 2 : monde ouvert | Village, PNJ, dialogues |
| 03 | `681559d` | Migration 32x32 | Meme scene, resolution doublee |
| 04 | `6a3fa1c` | Sprint 4.0 etape 1 | Fond Provence + gravier |
| 05 | `e0f6eaa` | Boules 3D | Gradient radial CanvasTexture |
| 06 | `197b295` | Sprites Pipoya | Ecran titre + overworld PNG |
| 07 | `75b55cd` | 4 chibis PixelLab | Persos animes en jeu |
| 08 | `8356fff` | Pivot arcade | Selection perso, VS intro |
| 09 | `dd9d3c7` | Polish complet | Hit stop, iris wipe, portraits |
| 10 | `b8e0931` | Etat actuel | V2 avec 12 persos, UI bois+or |

## Captures supplementaires

- [ ] Ecran titre a 3 etapes differentes
- [ ] Le terrain a 5 etapes (gris → provence → enrichi → textures → v2)
- [ ] Pipeline PixelLab : screenshot de l'interface + resultat
- [ ] Les tests Playwright en action (terminal + navigateur)
- [ ] La page d'inventaire des assets (si elle existe encore)
- [ ] Chaque personnage en action (lancer de boule)
