# Analyse Croisee - Resolution des Contradictions et Decisions

## 1. RESOLUTION DU JEU - Contradiction Agent 1 vs Agent 6

### Agent 1 (CLAUDE.md initial) : 480x320 (30x20 tiles de 16px)
### Agent 6 : 384x216 (16:9 natif, scale x4 = 1536x864)

### Decision : 384x216 a 16:9 - RETENU
**Pourquoi** :
- 16:9 est le ratio standard des ecrans modernes -> pas de letterboxing
- 384x216 x4 = 1536x864 = quasi 1080p
- 384x216 x3 = 1152x648 = bon pour ecrans plus petits
- 480x320 = ratio 3:2, entrainerait des barres noires
- 384/16 = 24 tiles en largeur, 216/16 = 13.5 -> arrondir a 24x14 tiles visibles
- Alternative : 400x224 (25x14 tiles a 16px, ratio ~16:9)

**Decision finale** : Canvas 400x225 (ratio 16:9 exact, 25x14.06 tiles)
Ou mieux : **416x240** (26x15 tiles a 16px, ratio 16:9.23, tres proche)
-> **Retenu : 416x240** car donne des tiles entiers (26x15) et ratio quasi 16:9.

## 2. TAILLE DES TILES - Contradiction Agent 2 vs Agent 6

### Agent 2 : 16x16 pour tout (authentique Pokemon GBA)
### Agent 6 : 32x32 sweet spot pour persos expressifs, 16x16 pour tiles sol

### Decision : MIXTE - tiles 16x16, personnages 16x24 ou 32x32
**Pourquoi** :
- Tiles de terrain 16x16 = classique, economique, plus de variete possible
- Personnages plus grands que 1 tile = standard Pokemon (perso fait 1x2 tiles)
- Pokemon GBA : tiles 16x16, personnages 16x24 (1 tile large, 1.5 tiles haut)
- Notre choix : **tiles 16x16, personnages 16x24**
- Si on veut plus de detail : personnages 32x32 sur grille 16x16 (2x2 tiles)

**Decision finale** : Tiles 16x16, personnages 16x24 (comme Pokemon GBA).
On peut upgrader a 32x32 pour les persos si le rendu n'est pas assez expressif.

## 3. PHYSIQUE PETANQUE - Consensus fort

Tous les agents s'accordent : **custom physics, PAS de Matter.js**.
- Agent 1 : "bulldozer pour planter une fleur"
- Agent 4 : ~70-100 lignes de code suffisent
- Friction lineaire (constante) > damping proportionnel
- Collision cercle-cercle elastique standard
- Restitution ~0.85

**VALIDE - Aucune contradiction.**

## 4. FRAMEWORK - Consensus fort

**Phaser 3** unanimement recommande par tous les agents.
- Agent 1 : comparaison detaillee, Phaser gagne sur tous les criteres
- Agent 2 : Tiled integration native
- Agent 3 : ecosysteme riche (rex plugins, etc.)
- Agent 5 : pattern scene-based standard pour RPG

**VALIDE - Aucune contradiction.**

## 5. AUDIO - Leger desaccord

- Agent 3 : recommande howler.js OU Phaser built-in
- Agent 6 : recommande howler.js pour la simplicite

### Decision : Phaser built-in audio d'abord
**Pourquoi** : Phaser a deja un bon systeme audio. Ajouter howler.js = dependance supplementaire inutile si Phaser suffit. On ajoute howler.js seulement si on rencontre des limitations.

## 6. DIALOGUE - Options multiples, besoin de trancher

- Agent 3 : yarn-bound ou inkjs
- Agent 5 : simple choice array suffit pour Pokemon-style
- Agent 3 : phaser3-rex-plugins a un dialog system

### Decision : Rex plugins dialog + custom simple
**Pourquoi** : Pour un jeu de petanque, les dialogues sont simples (pas de narratif branche complexe). Rex plugins + un simple systeme de file de texte + choix Oui/Non suffit. Pas besoin de Yarn/Ink.

## 7. POINTS NON COUVERTS - A RECHERCHER

### 7a. Setup concret Vite + Phaser 3
- Comment configurer exactement vite.config.js
- Imports ES modules de Phaser
- Rex plugins avec Vite
-> Agent supplementaire lance

### 7b. Regles exactes petanque pour le code
- Algorithme tour de jeu
- Comptage points exact
- Gestion hors-terrain
-> Agent supplementaire lance

### 7c. Phaser 3 derniere version
- Verifier sur npm
-> Agent supplementaire lance

## 8. DECISIONS TECHNIQUES FINALES

| Aspect | Decision | Justification |
|--------|----------|---------------|
| Framework | Phaser 3 (derniere stable) | Consensus 6/6 agents |
| Bundler | Vite | HMR rapide, ESM natif |
| Resolution canvas | 416x240 (26x15 tiles) | 16:9, tiles entiers, scale x3/x4 |
| Tile size | 16x16 | Pokemon GBA authentique |
| Sprite persos | 16x24 | Standard Pokemon GBA |
| Physique petanque | Custom (~100 lignes) | Consensus, pas besoin de Matter.js |
| Physique exploration | Phaser Arcade | Collisions grid-based simples |
| Friction | Lineaire (constante) | Meilleur feel petanque |
| Audio | Phaser built-in | Suffisant, pas de dep supplementaire |
| Dialogues | Rex plugins + custom | Dialogues simples, pas besoin Yarn/Ink |
| Maps | Tiled -> JSON | Standard, integration Phaser native |
| Maps separees | Oui (1 JSON/zone) | Plus facile a editer, style Pokemon |
| Sauvegarde | localStorage JSON | Suffisant, < 100KB |
| Pixel art | Piskel (en ligne) | Gratuit, animation support |
| Sons | jsfxr | Retro, gratuit, browser-based |
| Musique | Beepbox | Chiptune, gratuit |
| Scaling | Integer only (x3/x4) | Pas de flou pixel art |
