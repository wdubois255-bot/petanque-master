# Idees d'implementation — Making Of

## 1. Timelapse Git (Gource)
**Effort** : 10 min | **Impact** : tres fort
```bash
# Installer gource puis :
gource -1920x1080 --seconds-per-day 2 --auto-skip-seconds 0.5 \
  --title "Petanque Master — 181 commits en 8 jours" \
  --font-size 18 --hide filenames \
  --background-colour 3A2E28 \
  -o - | ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - \
  -vcodec libx264 -preset medium -crf 18 gource_timelapse.mp4
```
Resultat : une animation 3D de l'arbo du projet qui grandit commit par commit.

## 2. Script de captures automatiques (Playwright)
**Effort** : 30 min | **Impact** : fort
Script qui checkout 10 commits cles, lance le jeu, prend un screenshot.
Genere un dossier `docs/making-of/screenshots/` avec l'evolution visuelle.

## 3. Page HTML galerie interactive
**Effort** : 2h | **Impact** : tres fort
Page standalone avec :
- Sprites animes (spritesheets existantes)
- Slider avant/apres (v1 vs v2)
- Compteurs animes (181 commits, 22k lignes...)
- Lecteur audio integre (nos 14 SFX + 2 musiques)
- Timeline scrollable

## 4. Compteurs animes (HTML/CSS)
**Effort** : 30 min | **Impact** : moyen
Overlay style "motion design" pour incrustation video :
- Chiffres qui s'incrementent en pixel art
- Palette provencale
- Exportable via capture OBS

## 5. Video de gameplay commentee
**Effort** : 1h | **Impact** : fort
Enregistrer via OBS une partie complete avec voix off.
Points a montrer : visee, tir, carreau, IA, boutique.

## 6. Diff visuel du code
**Effort** : 1h | **Impact** : moyen
Montrer l'evolution de Ball.js (le moteur physique) :
- Commit 1 : ~100 lignes basiques
- Final : ~380 lignes avec COR 0.62, sous-stepping, 4 techniques

## 7. Comparatif sprites (grille)
**Effort** : 30 min | **Impact** : fort
Image grille montrant tous les personnages :
- Ligne 1 : sprites v1 (generated/chibi)
- Ligne 2 : sprites v2 (PixelLab pro)
Ideale pour thumbnail YouTube.
