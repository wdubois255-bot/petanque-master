# Guide de Publication — Petanque Master

> Tout est pret. Suis ces etapes dans l'ordre.

---

## DOSSIER ASSETS COMPLET

Tout est dans `docs/lancement/assets/` :

```
assets/
  cover-art-630x500.png          <-- Cover itch.io (630x500, PNG)
  gif carreau/header.gif          <-- GIF carreau 5s (A CREER par toi)
  screenshots/
    01-title-screen.png           <-- Menu titre (1664x960)
    02-gameplay-village.png        <-- Gameplay village (1664x960)
    03-gameplay-plage.png          <-- Gameplay plage (1664x960)
    04-vsintro-personnages.png     <-- VS Intro (1664x960)
    05-shop-profondeur.png         <-- Boutique (1664x960)
    06-charselect.png              <-- Selection personnage (1664x960)
  social/
    marketing-texts.md             <-- Tous les textes (Reddit, devlog)
```

Build du jeu : `petanque-master-v1.0.0.zip` (racine du projet, 6.9 MB)

---

## ETAPE 1 — Creer la page itch.io (~30 min)

1. Aller sur https://itch.io/game/new
2. Remplir :

| Champ | Valeur |
|-------|--------|
| Title | Petanque Master |
| Short description | A provencal bocce ball game with 12 characters, 5 terrains, and opponents who've been playing longer than you've been alive. |
| Kind of project | HTML |
| Classification | Games |
| Release status | Released |
| Pricing | $0.00 (gratuit, PAS "pay what you want") |
| Uploads | `petanque-master-v1.0.0.zip` → cocher "This file will be played in the browser" |
| Embed options | 832 x 480, cocher "Mobile friendly", cocher "Fullscreen button" |
| Cover image | `assets/cover-art-630x500.png` |
| Screenshots | Upload les 6 fichiers de `assets/screenshots/` dans l'ordre 01 a 06 |
| Genre | Sports |
| Tags | `petanque, pixel-art, sports, arcade, casual, french, bocce, turn-based, singleplayer, cozy` |
| Community | Comments |
| Visibility | Draft (pour l'instant) |

3. **Description** : copier le bloc ci-dessous dans le champ description

---

### Description a copier (EN + FR)

> Coller directement dans le champ Description. Utiliser le bouton "---" de l'editeur pour les separateurs horizontaux.

---
BLOC EN ANGLAIS — copier tel quel :
---

A lazy Sunday afternoon in the south of France. It's 35°C. The cicadas won't shut up. And Papi René, who has been playing pétanque since before you were born, is about to make you look very bad.

Welcome to Pétanque Master.

You play as Rookie — a newcomer who dares challenge the locals at the boulodrome. Eleven opponents stand between you and the title. Each one has their own personality, their own way of playing, and their own very specific way of getting under your skin.

Papi René is calm, precise, unshakeable. Beating him feels genuinely earned.
Mamie Josette physically wobbles your aim — it's a game mechanic, and yes, it's as infuriating as it sounds.
La Choupe works the docks. Plays rough. Talks too much. You know someone like him.

Eight more characters are waiting.

Three ways to throw: the lob (low arc, lots of roll), the high lob (drops from above, higher risk), and the strike (straight and fast — knock their ball out, be surgical).

Five terrains, five different games. Village dirt is forgiving. The park mixes grass and gravel — watch the zones. Sand is where your ball goes to die. The hill makes you constantly misjudge your power. The docks have hard tiles that bounce off walls.

Earn Galets, unlock boules and cochonnets, upgrade your Rookie.

Playable in French and English. Free. No install. Open the page and play.

Made with Phaser 4 and a genuine love for the south of France.

---
BLOC EN FRANCAIS — coller en dessous du separateur :
---

Un dimanche après-midi dans le Midi. 35°C, des cigales, et Papi René qui joue à la pétanque depuis avant ta naissance, et qui s'apprête à te le rappeler.

Bienvenue dans Pétanque Master.

Tu incarnes le Rookie, un nouveau venu qui ose défier les habitués du boulodrome. Onze adversaires t'attendent, chacun avec son caractère, son style de jeu, et sa manière bien à lui de te mettre la pression.

Trois façons de lancer (demi-portée, plombée, tir au fer), cinq terrains avec une physique vraiment différente, une boutique pour améliorer tes boules et ton cochonnet, et un mode Arcade avec progression.

Gratuit. Sans installation. Tu ouvres la page, tu joues.

Développé avec Phaser 4 et une physique 100% custom. Pas de moteur tiers, chaque terrain se sent vraiment différent.

---

## ETAPE 2 — Ajouter le GIF (~5 min)

Quand ton GIF du carreau est pret :

1. Le sauver dans `assets/gif carreau/header.gif`
2. Verifier qu'il fait **< 3 MB** et **~832px de large**
3. Sur itch.io, l'ajouter dans les screenshots/medias **en premier** (il apparaitra en haut)

---

## ETAPE 3 — Verifier avant publication (~10 min)

- [ ] Jouer une partie complete sur la page itch.io en mode Draft
- [ ] Verifier que le fullscreen marche
- [ ] Tester sur mobile (telephone)
- [ ] Verifier que le son fonctionne
- [ ] Relire la description (pas de [LINK] oublie)

---

## ETAPE 4 — Publier (~2 min)

1. Sur itch.io : changer Visibility de "Draft" a **"Public"**
2. Copier l'URL du jeu (tu en auras besoin pour Reddit)

---

## ETAPE 5 — Poster sur Reddit (~30 min)

**Timing ideal** : mardi ou mercredi, 14h-16h UTC (15h-17h heure FR)

Les textes complets sont dans `assets/social/marketing-texts.md`.
Remplacer [LINK] par ton URL itch.io dans chaque texte.

### Post 1 — r/WebGames

**Titre** : `Petanque Master -- throw metal balls, outwit retired French people, it's free`

**Corps** : voir section "REDDIT -- r/WebGames" dans marketing-texts.md

**Joindre** : le GIF

### Post 2 — r/indiegames

**Titre** : `I made a petanque game set in the south of France. Papi Rene will humble you. Free browser game.`

**Corps** : voir section "REDDIT -- r/indiegames" dans marketing-texts.md

**Joindre** : le GIF + screenshot `04-vsintro-personnages.png`

### Post 3 — r/petanque

**Titre** : `I made a petanque video game. Real rules, real distances, real sand pain. Tell me what I got wrong.`

**Corps** : voir section "REDDIT -- r/petanque" dans marketing-texts.md

**Joindre** : screenshot `03-gameplay-plage.png`

### Post 4 — r/PixelArt (PAS de lien dans le post !)

**Titre** : `The VS intro screen from my petanque game -- pixel art characters ready to fight (politely, with metal balls)`

**Corps** : voir section "REDDIT -- r/PixelArt" dans marketing-texts.md

**Joindre** : screenshot `04-vsintro-personnages.png`

**IMPORTANT** : repondre a TOUS les commentaires dans les 6 premieres heures.

---

## ETAPE 6 — Devlog itch.io (~15 min)

1. Sur ta page itch.io → onglet "Devlog" → "New devlog post"
2. **Titre** : `My grandfather played petanque every Sunday for 40 years. I made a game about it.`
3. **Corps** : copier la section "ITCH.IO -- Devlog #1" de marketing-texts.md
4. Joindre 2-3 screenshots

---

## RESUME — Checklist finale

- [ ] GIF carreau pret (< 3 MB)
- [ ] Creer page itch.io (etape 1)
- [ ] Upload GIF (etape 2)
- [ ] Tester en Draft (etape 3)
- [ ] Publier (etape 4)
- [ ] 4 posts Reddit (etape 5)
- [ ] Devlog itch.io (etape 6)
- [ ] Repondre aux commentaires pendant 6h

**Temps total estime : ~1h30**
