# L'Histoire de Petanque Master
## Comment (et pourquoi) on a cree un jeu de petanque en 8 jours

---

## Le Pitch

> Un developpeur solo et une IA construisent un jeu de petanque competitif
> en pixel art — de zero a un jeu jouable avec 6 personnages, physique realiste,
> et IA strategique — en 8 jours, 181 commits, et 22 000 lignes de code.

---

## PARTIE 1 : L'Idee

### Pourquoi la petanque ?

La petanque, c'est un sport que tout le monde connait mais que personne n'a
transforme en vrai jeu video competitif. Les rares jeux de petanque existants
sont soit des simulations ennuyeuses, soit des mini-jeux mobiles jetables.

L'idee : **et si on traitait la petanque comme un jeu de combat ?**
Comme Street Fighter, mais avec des boules. Chaque personnage a des stats,
un style de jeu, des repliques. On choisit son perso, on affronte l'IA ou
un pote, et on grimpe dans un mode arcade.

### Pourquoi maintenant ?

2026, c'est le moment ideal :
- **Phaser 3** est mature et performant pour le web
- **Les IA generatives** (PixelLab, ElevenLabs, Claude) permettent a un
  developpeur solo de produire des assets de qualite pro
- **Le pixel art** est plus populaire que jamais
- **Les portails web** (CrazyGames, Poki) offrent de la monetisation

### Le pari

Construire le jeu entierement avec l'aide de l'IA :
- **Claude** pour coder (architecture, moteur physique, IA, UI)
- **PixelLab** pour les sprites pixel art (personnages, terrains, UI)
- **ElevenLabs** pour l'audio (SFX, musiques)
- **Le developpeur** pour la vision, les decisions, les tests, et la direction artistique

---

## PARTIE 2 : Les Fondations (Jour 1-2)

### Le moteur physique — la decision la plus importante

Premier reflexe : utiliser Matter.js, un moteur physique tout fait.
**On l'a refuse.** Pourquoi ?

La petanque a une physique tres specifique :
- Une boule d'acier sur du gravier ne rebondit pas comme un ballon
- Le roulement depend de la surface (sable, terre, herbe, dalles)
- Le "carreau" (chasser une boule adverse) demande une physique de collision precise
- La plombee (lancer en cloche) doit atterrir et rouler naturellement

On a ecrit **380 lignes de physique maison** dans Ball.js. Pas de raccourci.
La formule cle : `v0 = sqrt(2 * friction * distance)` pour le roulement.

Plus tard, on ira chercher les vraies donnees : coefficient de restitution
(COR) de l'acier = 0.62, etude biomecanique des lancers, physique du sous-stepping
pour les collisions rapides. Le carreau est devenu possible **naturellement**,
sans aucun hack — juste de la physique correcte.

### Le premier lancer

Le moment ou la boule a roule pour la premiere fois sur l'ecran.
Pas de sprite, pas de decor, juste un cercle qui suit une trajectoire.
Et pourtant, ca donnait deja envie de jouer.

---

## PARTIE 3 : Le Monde (Jour 2-3)

### L'ambition RPG

Au debut, le concept etait plus ambitieux : un monde ouvert a la Pokemon.
Un village provencal, des PNJs a defier, des badges a collecter.
On a construit tout ca — village, dialogues, sauvegarde, 3 maps.

### La migration 32x32

Le jeu etait en 16x16 pixels. Trop petit, pas lisible.
Audit complet, puis migration : chaque sprite et chaque tile doubles.
Resolution finale : 832x480. Un vrai jeu, pas un prototype.

---

## PARTIE 4 : Le Game Feel (Jour 3-4)

### Rendre la Provence vivante

Le terrain est passe de "rectangle gris" a un vrai boulodrome provencal :
- Fond de ciel bleu avec collines
- Gravier texture avec des variations
- Bordures en bois
- Oliviers et pins en decoration
- **Cigales procedurales** — oui, les cigales sont generees par code

### Le "juice"

Les details qui font la difference entre "ca marche" et "c'est satisfaisant" :
- **SFX proceduraux** a chaque impact
- **Particules** de poussiere quand la boule atterrit
- **Traces d'impact** permanentes sur le terrain
- **Boules 3D** avec gradient radial (CanvasTexture Phaser)

### La camera — et pourquoi on l'a retiree

Sprint 4.0 : on ajoute une camera cinematique qui suit la boule.
Ca avait l'air cool. En playtest : **c'etait insupportable.**
La petanque est un jeu de precision — tu dois voir TOUT le terrain
en permanence. La camera qui bouge, ca empeche d'evaluer les distances.

**Decision : camera fixe. Definitive.** Une des meilleures decisions du projet.

---

## PARTIE 5 : Le Pivot (Jour 5)

### De RPG a Arcade

Le jour le plus productif : **56 commits**.

Realisation : le monde ouvert, c'est ambitieux, mais le coeur du jeu
c'est le **match de petanque**. Le format RPG dilue l'experience.

Pivot radical : on passe au format **versus / arcade**.
- Ecran de selection de personnage (comme un jeu de combat)
- Ecran VS cinematique avec les deux adversaires
- Mode Arcade en 5 rounds avec difficulte croissante
- La partie petanque devient le SEUL centre d'attention

Ce pivot a **transforme le jeu**. En une journee, Petanque Master est
passe de "RPG avec mini-jeu" a "jeu de sport competitif".

---

## PARTIE 6 : Les Personnages (Jour 5-6)

### Le pipeline IA

Creer un personnage, de A a Z :

1. **Game design** : stats, style de jeu, personnalite, repliques
2. **PixelLab** : generer le sprite en pixel art 64x64
3. **Retouche** : Piskel ou Aseprite pour corriger les details
4. **Upscale** : Scale4x + Lanczos → 128x128 avec contours nets
5. **Integration** : spritesheet 4x4 frames, chargement Phaser
6. **Animation** : idle, marche, lancer (handmade dans Pixelorama)
7. **IA** : comportement de jeu specifique (pointeur, tireur, stratege)

### Le roster

6 personnages, chacun avec sa personnalite :
- **Rookie** : le debutant customisable, stats equilibrees
- **La Choupe** : la brute, puissance max, precision faible
- **Marcel** : le veteran provencal, technique et regulier
- **Ley** : l'artiste, precision chirurgicale
- **Le Magicien** : effets speciaux et tricks
- **Reyes** : le champion du monde, IA strategique avancee

### L'IA qui joue vraiment

L'IA n'est pas un hasard deguise. Trois archetypes :
- **Pointeur** : joue la precision, vise pres du cochonnet
- **Tireur** : analyse s'il vaut mieux pointer ou tirer
- **Stratege** (Reyes) : evaluate la position, le score, et decide

Le marker de visee **oscille** selon la precision du personnage.
Un perso avec 90% de precision a un marker quasi-stable.
Un perso avec 60% a un marker qui tremble — stress visible.

---

## PARTIE 7 : Le Polish (Jour 6-7)

### L'identite visuelle

Palette provencale strict : ocres, terracotta, olive, lavande, ciel, creme.
**Interdiction du noir pur** (#000) — toutes les ombres en marron chaud.
Ca donne cette ambiance chaude et solaire, meme sur les menus.

### Les details obsessionnels

- **Confettis de victoire** aux couleurs provencales
- **Iris wipe** (transition en cercle qui se ferme) entre les scenes
- **Hit stop** : micro-pause de 100ms a l'impact d'un tir
- **Barks** : chaque personnage a des repliques contextuelles
- Monnaie du jeu : les **"Galets"** (pas des ecus, pas des pieces)

### L'audio

14 SFX generes via ElevenLabs MCP :
- Atterrissage, collision, roulement, carreau, cochonnet touche
- Brise, cigales, victoire, defaite
- 2 musiques : theme titre + theme de match

---

## PARTIE 8 : La Robustesse (Jour 7-8)

### 223 tests automatises

- **138 tests unitaires** (Vitest) : physique, IA, calculs de score
- **85 tests E2E** (Playwright) : navigation, gameplay, terrains

Le jeu **se teste lui-meme**. Playwright lance le navigateur, joue des
parties, verifie que tout fonctionne. Si un changement casse quelque chose,
on le sait immediatement.

### Les bugs memorables

- **Boule invisible** : une variable utilisee avant sa declaration (TDZ error)
- **2 joueurs dans le cercle** : bug de z-ordering + timing de transition
- **Boules deformees au match 2** : spritesheet re-creee inutilement
- **Camera qui rend malade** : retiree (cf. Partie 4)

---

## PARTIE 9 : La Vision (et la suite)

### D'ou on est parti
Un fichier `main.js` vide et l'idee de "faire un jeu de petanque".

### Ou on en est
Un jeu jouable avec :
- 6 personnages charismatiques avec stats et IA
- 5 terrains avec proprietes physiques uniques
- Physique realiste basee sur de vraies donnees
- Mode Arcade, Quick Play, Versus local
- Boutique, progression, deblocages
- 223 tests automatises
- 22 000 lignes de code propre

### Ou on va
- **26 personnages** (12 deja generes en v2)
- **Refonte visuelle complete** (UI bois+or, sprites HD)
- **Mode en ligne** (tour par tour asynchrone)
- **Publication** sur itch.io, CrazyGames, Poki
- **Version mobile**

### La lecon

Un developpeur solo + IA peut creer en 8 jours ce qui prenait des mois.
Pas parce que l'IA fait tout — mais parce qu'elle debloque les blocages :
- Pas graphiste ? PixelLab genere des sprites pro.
- Pas sound designer ? ElevenLabs cree les SFX.
- Pas sur de l'architecture ? Claude propose et implemente.

Le developpeur reste essentiel : c'est lui qui a la **vision**, qui fait
les **choix de design**, qui **teste** et qui dit "non, la camera fixe
c'est mieux". L'IA est un multiplicateur de force, pas un remplacant.

---

## Les Chiffres

| | |
|---|---|
| **Duree** | 8 jours (13-21 mars 2026) |
| **Commits** | 181 |
| **Code** | ~22 000 lignes (JS ES6) |
| **Scenes** | 15 |
| **Personnages** | 6 jouables (26 prevus) |
| **Terrains** | 5 |
| **Boules** | 10 |
| **Tests** | 223 (138 unit + 85 E2E) |
| **Assets visuels** | 272 PNG |
| **Audio** | 14 SFX + 2 musiques |
| **Research** | 61 documents |
| **Moteur physique** | 380 lignes custom |
| **Outils IA** | Claude + PixelLab + ElevenLabs |
| **Frameworks** | Phaser 3, Vite, Vitest, Playwright |
| **Budget** | 0€ (hors abonnements IA) |
