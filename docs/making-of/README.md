# Making Of — Petanque Master

> Tout le materiel pour raconter l'histoire de la creation du jeu.
> **181 commits en 8 jours** (13-21 mars 2026) — de zero a un jeu complet.

---

## Structure du dossier

```
docs/making-of/
  README.md                  ← CE FICHIER — index et mode d'emploi
  HISTOIRE.md                ← Recit editorial (9 parties, le coeur de la video)
  TIMELINE.md                ← Timeline technique des 181 commits (6 actes)
  CAPTURES.md                ← Guide pour capturer des screenshots manuellement
  IDEES_IMPLEMENTATION.md    ← 7 idees techniques a realiser (Gource, HTML, etc.)
  screenshots/               ← 24 screenshots + galerie web
    index.html               ← Galerie navigable (ouvrir dans un navigateur)
    01_premier_moteur_*.png  ← (manquant — commit trop ancien)
    02_monde_ouvert_*.png    ← Jour 1 : village, PNJs, dialogues
    03_migration_32x32_*.png ← Jour 3 : resolution doublee
    04_provence_*.png        ← Jour 3 : fond provencal, gravier, bois
    05_sprites_pipoya_*.png  ← Jour 4 : premiers vrais sprites PNG
    06_chibi_pixellab_*.png  ← (manquant — lock git temporaire)
    07_pivot_arcade_*.png    ← Jour 5 : le pivot vers arcade/versus
    08_refonte_visuelle_*.png← Jour 5 : style Pipoya unifie
    09_polish_complet_*.png  ← Jour 6 : hit stop, portraits, transitions
    10_etat_actuel_*.png     ← Jour 8 : etat final avec personnages HD
```

**Script de capture** : `scripts/capture-making-of.mjs`
```bash
node scripts/capture-making-of.mjs
```

---

## Comment utiliser ce dossier

### Pour preparer une video
1. Lire **HISTOIRE.md** — c'est le scenario editorial, structure en 9 parties
2. Regarder **screenshots/index.html** dans un navigateur — l'evolution visuelle
3. Consulter **IDEES_IMPLEMENTATION.md** — outils a creer (Gource, galerie HTML, etc.)

### Pour capturer plus de screenshots
1. Suivre **CAPTURES.md** — methode manuelle commit par commit
2. Ou relancer `node scripts/capture-making-of.mjs` pour tout refaire

### Pour comprendre la timeline technique
1. Lire **TIMELINE.md** — chaque commit important classe par acte narratif

---

## Chiffres cles

| Metrique | Valeur |
|----------|--------|
| Duree | 8 jours (13-21 mars 2026) |
| Commits | 181 |
| Code | ~22 000 lignes (JS ES6) |
| Scenes | 15 |
| Personnages jouables | 6 (26 prevus) |
| Terrains | 5 |
| Boules | 10 |
| Tests | 223 (138 unit + 85 E2E) |
| Assets visuels | 272 PNG |
| Audio | 14 SFX + 2 musiques |
| Research | 61 documents |
| Moteur physique | 380 lignes custom (pas de lib) |
| Outils IA | Claude (code) + PixelLab (sprites) + ElevenLabs (audio) |
| Budget | 0€ (hors abonnements IA) |

---

## Angles narratifs possibles

1. **"Un jeu de petanque serieux"** — physique basee sur de vraies donnees biomecaniques
2. **"L'IA comme co-createur"** — Claude, PixelLab, ElevenLabs : 3 IA, 1 jeu
3. **"Le pivot"** — de RPG monde ouvert a arcade versus (et pourquoi c'est mieux)
4. **"Les details obsessionnels"** — COR 0.62, cigales procedurales, confettis provencaux
5. **"223 tests en 8 jours"** — le jeu qui se teste lui-meme
6. **"Camera fixe"** — la decision de retirer une feature (et pourquoi c'est mieux)

---

## Prochaines etapes (a faire)

- [ ] Capturer les 2 screenshots manquantes (commits 01 et 06) manuellement
- [ ] Installer Gource et generer le timelapse git
- [ ] Creer la page HTML galerie interactive avec sprites animes
- [ ] Creer la grille comparative sprites v1 vs v2 (thumbnail YouTube)
- [ ] Enregistrer une partie complete commentee (OBS)
- [ ] Ecrire le script voix off base sur HISTOIRE.md
