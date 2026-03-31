# Dossier Lancement — Petanque Master

> **Statut** : Assets prêts — il reste à créer la page itch.io et poster.

---

## CE QUI EST PRÊT (assets, scripts, build)

| Élément | Fichier | Note |
|---------|---------|------|
| Cover art 630×500 | `assets/cover-art-630x500.png` | Base VSIntro, titre + gradient |
| Thumbnail 315×250 | `assets/cover-art-thumb-315x250.png` | Aperçu listing itch.io |
| GIF header | `assets/gif carreau/header.gif` | 679 KB, < 3 MB ✓ |
| Screenshot 1 — Titre | `assets/screenshots/01-title-ambiance.png` | Écran titre provençal |
| Screenshot 2 — Village | `assets/screenshots/02-gameplay-village.png` | Gameplay propre, sans tuto |
| Screenshot 3 — Plage | `assets/screenshots/03-gameplay-plage.png` | Terrain sable, Mamie Josette |
| Screenshot 4 — VS Intro | `assets/screenshots/04-vsintro-personnages.png` | Rookie vs Papi René |
| Screenshot 5 — Shop | `assets/screenshots/05-shop-profondeur.png` | Boutique avec 250 Galets |
| Textes marketing | `assets/social/marketing-texts.md` | Reddit × 4 + Twitter + Devlog + description itch.io |
| Build production | `petanque-master-v1.0.0.zip` (racine) | 6.9 MB |
| Scripts de capture | `scripts/capture-itch-assets.mjs` | Pour regénérer si besoin |
| Script cover art | `scripts/generate-cover-art.mjs` | Pour regénérer si besoin |

---

## CE QUE TU DOIS FAIRE (humain)

### Étape 1 — Créer la page itch.io (30 min)

1. Ouvrir [itch.io/game/new](https://itch.io/game/new)
2. Remplir avec les paramètres de [ITCH_IO.md](ITCH_IO.md) (section 2)
3. **Description** : copier depuis `assets/social/marketing-texts.md` section "ITCH.IO — Description de la page"
4. **Tags** : `petanque, pixel-art, sports, arcade, casual, french, bocce, turn-based, singleplayer, cozy`
5. **Dimensions** : 832 × 480, Fullscreen activé
6. **Prix** : Gratuit (pas "pay what you want")

### Étape 2 — Uploader les assets (20 min)

1. **Cover art** → `assets/cover-art-630x500.png`
2. **GIF header** → `assets/gif carreau/header.gif` (mettre en premier dans les médias)
3. **5 screenshots** → dans l'ordre 01 à 05
4. **ZIP du jeu** → `petanque-master-v1.0.0.zip` (racine du projet)

### Étape 3 — Poster (Jour J, 14h-16h UTC)

Copier les textes depuis `assets/social/marketing-texts.md` :

| Plateforme | Texte | Screenshot à joindre |
|------------|-------|----------------------|
| r/indiegames | Section r/indiegames | GIF + 04-vsintro |
| r/WebGames | Section r/WebGames | GIF |
| r/petanque | Section r/petanque | 03-gameplay-plage |
| r/PixelArt | Section r/PixelArt | 04-vsintro (PAS de lien dans le post) |
| Twitter/X | Thread 5 tweets | GIF sur tweet 1 |
| itch.io Devlog | Section Devlog #1 | 2-3 screenshots |

---

## FICHIERS DE CE DOSSIER

| Fichier | À lire quand |
|---------|--------------|
| [ITCH_IO.md](ITCH_IO.md) | Pour créer la page itch.io (paramètres exacts, tags, description FR) |
| [LANCEMENT_ITCH_FINAL.md](LANCEMENT_ITCH_FINAL.md) | Checklist complète J-7 à J+30 (suivi semaine par semaine) |
| [ITCH_IO_quickwins_revenus.md](ITCH_IO_quickwins_revenus.md) | Après lancement — si tu vises CrazyGames ou monétisation |

---

## MÉTRIQUES À SURVEILLER (1er mois)

| Métrique | Moyen | Bon | Très bon |
|----------|-------|-----|----------|
| Vues page | 100-300 | 500-1000 | 2000+ |
| Parties lancées | 30-80 | 150-300 | 500+ |
| Session moyenne | 2-5 min | 5-15 min | 15+ min |
| Conversion vues → plays | — | > 30% | > 50% |

**Si conversion < 20%** : refaire le GIF ou la cover art en priorité.
**Si session < 3 min** : revoir l'onboarding (premier match trop difficile ?).

---

## POST-LANCEMENT

1. **Bonnes métriques itch.io** → soumettre à CrazyGames (voir `ITCH_IO.md` section 5)
2. **Revenus** → voir `ITCH_IO_quickwins_revenus.md` (rewarded ads, Mode Blitz, Daily Challenge)
3. **V2** → voir `docs/VISION_V2.md` (village hub, narrative, multijoueur)
