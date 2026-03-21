# Guide Complet : Améliorer Ton Jeu 2D en Pixel Art (Pétanque)

**Date** : Mars 2026 | **Pour** : Jeu de pétanque en 2D pixel art avec Phaser | **Présenté par** : William Dubois

---

## 📌 Résumé Exécutif

Ce document compile les meilleures sources pour améliorer ton jeu vidéo de pétanque en 2D. Il couvre :
- Chaînes YouTube spécialisées (pixel art, animation, game design)
- Ressources pédagogiques (cours, tutos, GDC talks)
- Communautés actives (Discord, Reddit, itch.io)
- Outils IA pour la génération d'assets (PixelLab, Mixboard, etc.)
- Techniques concrètes applicables à ton jeu

---

## 🎨 PARTIE 1 : CHAÎNES YOUTUBE POUR PIXEL ART & ANIMATION

### 1.1 Chaînes Spécialisées en Pixel Art

| Chaîne | Spécialité | Contenu clé | Lien |
|--------|-----------|-----------|------|
| **MortMort** | Pixel art + game dev | Tutoriels détaillés Aseprite, défis création, game mechanics | https://www.youtube.com/@MortMort |
| **AdamCYounis** | Pixel art + Unity | Animation personnages, character design, isométrique | https://www.youtube.com/@UC08QfQDLAd9D7aYPFgBUIng |
| **Brandon James Greer** | Pixel art avancé | Techniques pixel, color theory, tileset design | https://www.youtube.com/@UCC26K7LTSrJK0BPAUyyvtQg |
| **Pixel Architect** | Environnements pixel | Création de mondes, tilesets, décors cohérents | https://www.youtube.com/@UCo57r5geuOTZzu1CoHbGbtQ |
| **Davit Masia** | Pixel art + game dev | Tutoriels complets, processus de création, WIP updates | https://www.youtube.com/@DavitMasia |
| **SausToons** | Animation pixel art | Animation en Aseprite, 12 principes animation, techniques avancées | https://www.youtube.com/@SausToons |

**Recommandation pour ton jeu** : Commencer par **AdamCYounis** (character design) et **SausToons** (animation geste/lancer).

### 1.2 PixelLab AI Chaîne Officielle

**URL** : https://www.youtube.com/@PixelLab_AI

**Vidéos clés pour ton projet** :
- **3 Ways to Create Walk Cycles** - Animation de marche (12 mars 2026)
- **This Tool Generates Pixel Animations** - Génération rapide d'animations (17 mars 2026)
- **Creating characters and animations with PixelLab** - Pipeline personnage complet
- **Tutorial: How to use the Edit tool** - Correction locale d'assets
- **Creating pixel art tilesets** - Génération terrains
- **Animation to animation with PixelLab** - Transitions fluides entre poses

**Techniques à récupérer** :
- Character Creator : génération instant en 4/8 directions
- Skeleton Animation : animer bras/jambe pour lancer
- Animation-to-Animation : passer lisse de idle à lancer
- Edit tool : corriger localement une main/boule
- Tileset generation : terrains sable, herbe, bordures

---

## 🎯 PARTIE 2 : GAME DESIGN & MÉCANIQUE

### 2.1 Chaînes Game Design (GDC, GMTK)

| Source | Spécialité | Pertinence pour pétanque |
|--------|-----------|------------------------|
| **Game Maker's Toolkit** (Mark Brown) | Analyse game design | Fondamentaux design, feedback, UX — essentiels pour lisibilité du gameplay |
| **GDC Festival of Gaming** | Conférences pro | Rules of the Game, design uncommon techniques, industry standards |
| **Rules of the Game 2025** | Design techniques | Designers expérimentés partagent 10 techniques chacun — utile pour polish |

**Vidéos majeures** :
- "10 Game Design Lessons from 10 Years of GMTK" → Fondamentaux du design
- "Rules of the Game 2025" → Techniques avancées de designers professionnels
- GDC talks sur "Player Engagement" et "Core Mechanics"

**Application pétanque** :
- **Core Mechanics** : Lancer, trajectoire, collision, scoring
- **Player Feedback** : Visual feedback lancer (animation courbe boule, impact sable)
- **Difficulty Curve** : Progression adversaires, variabilité niveaux
- **UX/Lisibilité** : Affichage distance, gagnant apparent, interface intuitive

### 2.2 Concepts Clés pour Ton Jeu

**Mechanics** :
- Lancer (timing, angle, puissance)
- Trajectoire boule
- Collision avec autres boules
- Distance au cochonnet
- Système de points

**Juice & Gamefeel** (crucial pour 2D) :
- **Screenshake** : Impact lancer ou collision
- **Particles** : Poussière sable après lancer, impact
- **Feedback audio** : Son lancer, son collision, son victoire
- **Animations** : Geste joueur, rotation boule, effet impact
- **Timing** : Feedback immédiat après lancer

**Source** : "You can add satisfaction to your game with JUICE" → screenshake, particles, VFX, SFX

---

## 💻 PARTIE 3 : RESSOURCES PÉDAGOGIQUES (COURS)

### 3.1 Cours Complets Game Dev 2D

| Plateforme | Cours | Durée | Niveau | Lien |
|-----------|-------|-------|-------|------|
| **Codecademy** | Learn Game Development with Phaser.js | 7h | Débutant | https://www.codecademy.com/learn/learn-phaser |
| **Coursera** | Game Design and Development 2D | 16-30h | Intermédiaire | https://www.coursera.org/specializations/game-design-and-development |
| **Design+Code** | Introduction to Phaser | 2h | Débutant | https://designcode.io/phaser-course/ |
| **GameDev.tv** | Divers (Unity, Godot, Game Design) | Varie | Tous niveaux | https://www.gamedev.tv/ |

**Recommandé pour toi** :
- **Codecademy Phaser** : Directement compatible avec ton stack
- **Design+Code Phaser** : Vite et fondamental
- **GameDev.tv Game Design** : Concepts de design applicables

### 3.2 Tutoriels YouTube Gratuits Spécialisés

| Tutoriel | Auteur | Sujet | Lien |
|----------|--------|-------|------|
| Pixel Art Animation Aseprite | SausToons | Animation complète étape par étape | https://www.youtube.com/watch?v=iWvfaiiVuDI |
| 2D Movement in Unity | Brackeys | Physique 2D, mouvement, collision | https://www.youtube.com/watch?v=dwcT-Dch0bA |
| How to Build 2D Game Asset Pack with AI | Iris Ogli | AI tools pour génération assets | https://www.youtube.com/watch?v=vOvYazUBlpQ |
| Indie Game Dev Roadmap 2026 | Game Dev Career | Roadmap complet débutant à production | https://www.youtube.com/watch?v=kB_8851nJGk |
| Beginners Guide to Game Development | RETRODEAD | Overview engines & pipeline | https://www.youtube.com/watch?v=wBfc80Uvi_Q |

---

## 🛠️ PARTIE 4 : OUTILS AI POUR ASSETS PIXEL ART

### 4.1 Outils Principaux

| Outil | Utilité | Tarif | Lien |
|------|---------|-------|------|
| **PixelLab AI** | Génération personnages, animations, tilesets | Freemium | https://www.pixellab.ai |
| **Mixboard** | Character generation, assets | Gratuit trial | https://mixboard.ai |
| **Aseprite** | Édition pixel art, animation (semi-auto) | $20 | https://www.aseprite.org |
| **Pixelorama** | Open-source Aseprite alternatif | Gratuit | https://pixelorama.github.io |
| **OpenGameArt** | Assets gratuits communautaires | Gratuit | https://opengameart.org |
| **Kenney Assets** | Packs d'assets gratuits 2D | Gratuit | https://kenney.nl |

### 4.2 Workflow IA Recommandé pour Ton Jeu

**Étape 1** : Génération character
- Utilise **PixelLab** → Character Creator
- Génère en 4-8 directions
- Export sprite sheet

**Étape 2** : Animation actions
- **PixelLab** Animation-to-Animation pour transitions
- Lancer, idle, réaction, victoire
- Édite avec **Aseprite** si corrections nécessaires

**Étape 3** : Tilesets/Environnement
- **PixelLab** Tileset generation
- Terrain sable, bordures, obstacles
- Variations saisonnières si besoin

**Étape 4** : Édition fine
- **PixelLab Edit tool** pour corrections locales
- **Aseprite** pour ajustements manuels
- Homogénéisation palette couleurs

**Étape 5** : Assets secondaires
- Boules, cochonet, UI, particules
- Mix AI + manual si nécessaire
- Test in-game pour cohérence

---

## 👥 PARTIE 5 : COMMUNAUTÉS & RÉSEAUX

### 5.1 Discord Servers (Actifs 2026)

| Communauté | Focus | Taille | Utilité |
|-----------|-------|-------|---------|
| **Game Dev League** | Indie game devs | Grosse | Networking, partage projects |
| **Indie Game Developers** | Dev collaboration | Très grosse | Trouver collabs, feedback |
| **HowToMarketAGame** | Dev + Marketing | Grosse | Dev marketing + game design |
| **GameDev.tv Discord** | Courses + Community | Grosse | Support cours, Q&A live |
| **Alpha Beta Gamer** | Indie community | Moyenne | Communauté friendly, feedback |
| **Aarimous Discord** | Devs YouTube creator | Moyenne | Communauté active creator |
| **Godot Discord** | Engine-specific | Très grosse | Support technique Godot |
| **Phaser Discord** | Engine-specific | Moyenne | Support Phaser + networking |

**À rejoindre en priorité** :
1. **Indie Game Developers** (trouver collabs, feedback)
2. **HowToMarketAGame** (design + marketing)
3. **Phaser Discord** (support technique)

### 5.2 Reddit Communities

| Subreddit | Public | Utilité |
|-----------|--------|---------|
| **r/gamedev** | Devs tous niveaux | Discussions techniques, resources |
| **r/IndieDev** | Indie game devs | Promotion games, feedback |
| **r/IndieGaming** | Indies & players | Tests utilisateurs, retours |
| **r/PixelArt** | Pixel artists | Feedback art, inspiration |
| **r/Phaser** | Phaser users | Support technique Phaser |
| **r/godot** | Godot users | Si tu switches de framework |

**Stratégie** : Post ton prototype tôt pour feedback. Engage authentiquement plutôt que spam.

### 5.3 itch.io & Platforms

| Platform | Usage |
|----------|-------|
| **itch.io** | Upload game prototype, game jams, networking |
| **Game Jams** | Ludum Dare, Global Game Jam — immersion intensive |
| **Devlogs** | Post progress publiquement pour accountability + feedback |
| **Twitter/X** | #gamedev #indiedev hashtags pour visibilité |

**Recommandation** : Participating in 1-2 game jams par an = énorme pour la progression + networking.

---

## 📚 PARTIE 6 : RESSOURCES GRATUITES & OUTILS OPEN-SOURCE

### 6.1 Assets Gratuits 2D

| Source | Contenu | Licence |
|--------|---------|---------|
| **OpenGameArt.org** | Assets communautaires | CC0, CC-BY |
| **Kenney.nl** | Packs gratuits complets | CC0 |
| **CraftPix.net** | Assets commerciaux | Commercial |
| **GameArt2D.com** | Pixel art assets | Varie |
| **itch.io assets** | Community assets | Varie |
| **Unreal Engine Marketplace** | Assets gratuits UE | UE gratuit |
| **Unity Asset Store** | Assets Unity | Free & paid |

**Pour ton jeu** : Kenney pour éléments UI, OpenGameArt pour inspiration tilesets.

### 6.2 Code & Framework Open-Source

| Framework | Langage | Pertinence |
|-----------|---------|-----------|
| **Phaser** (JS) | JavaScript | ✅ **Ton choix actuel** |
| **Godot** (GDScript) | GDScript/C# | Open-source complet, 2D fort |
| **Pixi.js** (JS) | JavaScript | Rendu WebGL léger, no game loop |
| **Kaboom.js** (JS) | JavaScript | Haut niveau, game jam friendly |
| **HaxeFlixel** (Haxe) | Haxe | Cross-platform, pixel-focused |
| **LibGDX** (Java) | Java | Desktop/mobile, mature |

**Pour toi** : Reste sur **Phaser** (plus grosse communauté, meilleur support game dev).

### 6.3 GitHub Ressources

| Repo | Sujet | Utilité |
|------|-------|---------|
| **Kavex/GameDev-Resources** | Ressources gamedev compilées | Liste exhaustive engines, assets |
| **teamgravitydev/gamedev-free-resources** | Assets gratuits 2D/3D | Packs assets, musique, SFX |
| **Awesome-GameDev** | Curated gamedev list | Standards + best practices |

---

## 🎬 PARTIE 7 : TECHNIQUES SPÉCIFIQUES À TON JEU (PÉTANQUE)

### 7.1 Technique d'Animation Geste Lancer

**Source** : SausToons "Pixel Art Animation Tutorial" + PixelLab tutorials

**Étapes** :
1. **Key Poses** (frames principales)
   - Idle initial
   - Align position
   - Pre-throw tension
   - Launch moment
   - Follow-through

2. **Inbetweening** (frames intermédiaires)
   - Arm swing smooth
   - Body rotation
   - Weight shift

3. **Smear Frames** (optionnel)
   - Mouvement dynamique bras
   - Effect lancer puissant

4. **Timing** (important)
   - 8-12 frames pour geste naturel
   - 3-4 frames pour momentum

**Dans Phaser** :
```javascript
// Animation lancer
this.anims.create({
    key: 'throw',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 11 }),
    frameRate: 12,
    repeat: 0
});
this.sprite.play('throw');
```

### 7.2 Trajectoire Boule

**Physics** :
- Utilise **Phaser Physics** (Arcade ou Matter)
- Trajectoire arc parabolique
- Friction progressive au sol
- Collision avec bordures/autres boules

**Feedback visuel** :
- Particle trail pendant trajectoire
- Légère screenshake à impact
- Animation arrêt progressif

### 7.3 Système de Points & Distance

**Mécanique** :
- Détecte distance boule au cochonnet
- Points si plus proche que adversaire
- Système scoring: 1 point = 1 boule plus proche

**Affichage** :
- Distance en pixels affichée
- Indicateur couleur (vert/rouge selon qui gagne)
- Animation victoire/défaite round

### 7.4 Tileset Terrain Pétanque

**Types de tiles** :
- Sable/terrain principal
- Bordures bois
- Herbe côté
- Ligne début/fin
- Éléments décor (banc, scoreboard)

**Avec PixelLab** :
- Génère tileset cohérent
- Crée variations saisonnières
- Ajoute ombres/détails

---

## 🚀 PARTIE 8 : ROADMAP RECOMMANDÉE

### Phase 1 : Fondamentaux (Semaine 1-2)
- ✅ Study GDC "Rules of the Game" talk
- ✅ Rejoins Discord **Phaser** + **HowToMarketAGame**
- ✅ Crée liste complète des assets nécessaires
- ✅ Setup PixelLab trial + teste Character Creator

**Output** : Game Design Document détaillé + asset list

### Phase 2 : Prototype Visuel (Semaine 3-4)
- ✅ Génère joueur 4-8 directions avec PixelLab
- ✅ Crée animation lancer (8-12 frames)
- ✅ Génère tileset terrain
- ✅ Import dans Phaser + test affichage

**Output** : Prototype visuel jouable

### Phase 3 : Gameplay Core (Semaine 5-6)
- ✅ Système lancer + trajectoire boule
- ✅ Physics collision
- ✅ Système points/distance
- ✅ Win condition check

**Output** : Game loop fonctionnel

### Phase 4 : Polish & Feel (Semaine 7-8)
- ✅ Animations secondaires (idle, réaction, victoire)
- ✅ Juice: screenshake, particles, sounds
- ✅ UI clarity: affichage distance, score
- ✅ Édition fine assets avec Aseprite/PixelLab Edit

**Output** : Prototype polished, prêt feedback

### Phase 5 : Community Feedback (Semaine 9+)
- ✅ Post devlog r/IndieGaming + itch.io
- ✅ Récolte feedback gameplay + art
- ✅ Game jam pour tester + networking
- ✅ Iterate based on feedback

**Output** : Game itéré, communauté engagée

---

## 📖 PARTIE 9 : RÉFÉRENCES COMPLÈTES PAR SUJET

### Animation & Art
- SausToons pixel animation tutorial: https://www.youtube.com/watch?v=iWvfaiiVuDI
- AdamCYounis character design series: https://www.youtube.com/@UC08QfQDLAd9D7aYPFgBUIng
- MortMort Aseprite challenges: https://www.youtube.com/@MortMort
- Game Developer "Making 2D Art for Indie Game": https://www.gamedeveloper.com/art/making-2d-art-for-an-indie-game
- 3 Best Pixel Art Channels analysis: https://www.youtube.com/watch?v=a_qtHTOpvRg

### Game Design
- Game Maker's Toolkit "10 Lessons from 10 Years": https://www.youtube.com/watch?v=Cm2_drGLGbc
- GDC "Rules of the Game 2025": https://www.youtube.com/watch?v=UTE_bVUeHCQ
- Designing Games for Game Designers GDC: https://www.youtube.com/playlist?list=PLT5zJCMmhw5o9vh6ll8WJ0TMqXDdDXEhW
- Game Fundamentals blog: https://www.juegostudio.com/blog/game-design-fundamentals

### Phaser & JS Game Dev
- Codecademy Learn Phaser: https://www.codecademy.com/learn/learn-phaser
- Design+Code Phaser intro: https://designcode.io/phaser-course/
- Phaser official docs: https://phaser.io/

### 2D Mechanics & Juice
- JUICE: Satisfaction in Games Reddit: https://www.reddit.com/r/Unity3D/comments/raxjux/you_can_instantly_add_a_lot_of_satisfaction_to/
- Difficulty Curves paper: https://pmc.ncbi.nlm.nih.gov/articles/PMC8336693/
- Procedural Generation Tile-based: https://peerdh.com/blogs/programming-insights/procedural-generation-techniques

### Communities & Resources
- r/gamedev: https://www.reddit.com/r/gamedev/
- r/IndieGaming: https://www.reddit.com/r/IndieGaming/
- itch.io collaborations: https://itch.io/t/4830442/any-platform-suggestion-to-promote-indie-game
- Game Dev Communities guide: https://itch.io/blog/1038830/collaborating-with-other-game-devs-online
- Indie Dev Discord servers: https://www.reddit.com/r/gamedev/comments/1rgprel/looking_for_communities_to_get_in_touch_with/

### AI & Assets
- PixelLab official: https://www.pixellab.ai
- How to Build 2D Asset Pack with Free AI: https://www.youtube.com/watch?v=vOvYazUBlpQ
- Kenney free assets: https://kenney.nl
- OpenGameArt: https://opengameart.org
- GitHub GameDev Resources: https://github.com/Kavex/GameDev-Resources

### Framework Comparison
- Phaser vs Godot breakdown: https://stackshare.io/stackups/godot-vs-phaserio
- Godot vs JS Canvas discussion: https://www.reddit.com/r/godot/comments/1mef56h/godot_vs_js_canvas_for_very_simple_2d_games/
- Game Dev Roadmap 2026: https://www.youtube.com/watch?v=kB_8851nJGk

---

## ✅ CHECKLIST FINALE

- [ ] Study PixelLab chaîne YouTube (focus: animation lancer, character creator)
- [ ] Watch 3 videos GDC/GMTK sur game design
- [ ] Crée character pixel art draft (PixelLab ou Aseprite)
- [ ] Joins 2 Discord: Phaser + HowToMarketAGame
- [ ] Réserve asset list complète pour ton jeu
- [ ] Commande un game jam itch.io pour momentum
- [ ] Setup Aseprite trial pour édition fine
- [ ] Post devlog #1 r/IndieGaming dans 2 semaines
- [ ] Schedule 1 live-stream creation process
- [ ] Plan collaboration art/code (si besoin)

---

## 🎯 TL;DR : TOP 5 À FAIRE MAINTENANT

1. **Enroll**: Codecademy Phaser course (7h) — maîtrise ton framework
2. **Study**: SausToons animation tutorial (14 min) — technique lancer
3. **Join**: Indie Game Developers Discord — networking + feedback
4. **Generate**: PixelLab Character Creator — ton première asset
5. **Post**: Devlog #1 r/IndieGaming dans 2 semaines — accountability

---

**Document compilé** : Mars 2026 | **Framework** : Phaser | **Art** : Pixel 2D | **Game** : Pétanque