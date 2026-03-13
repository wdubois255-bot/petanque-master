# PLAN MVP v2 - PETANQUE MASTER
## Plan de developpement complet, valide, pret a executer

> Resultat du croisement de 11 recherches independantes + audit CDC + schemas de donnees.
> Derniere mise a jour : 13 mars 2026.

---

## DECISIONS TECHNIQUES (MISES A JOUR)

| Aspect | Decision | Justification |
|--------|----------|---------------|
| Framework | **Phaser 3.90.0** "Tsugumi" | Derniere version stable Phaser 3. Phaser 4 RC6 existe mais pas de rex-plugins ni migration guide. |
| Bundler | **Vite 6.3+** | Template officiel Phaser. `assetsInlineLimit: 0` OBLIGATOIRE. |
| Physique petanque | **Custom** (~100 lignes) | Consensus 11 recherches. Pas de Matter.js. |
| Physique exploration | **Phaser Arcade** | Standard RPG top-down. |
| Resolution | **416x240** (26x15 tiles) | Quasi 16:9, tiles entiers, scale x3=1248x720, x4=1664x960. |
| Tiles terrain | **16x16** | Standard Pokemon GBA. |
| Sprites persos | **16x24** | Standard Pokemon GBA (1 tile large, 1.5 tiles haut). |
| Maps | **Tiled -> JSON** (1 fichier/zone) | Integration Phaser native. |
| Audio | **Phaser built-in** | Suffisant. Howler.js en fallback si besoin. |
| UI/Dialogues | **phaser3-rex-plugins 1.80+** | Suite UI complete. Import individuel avec Vite. |
| Friction | **Lineaire constante** | `speed -= mu * g * dt`. Meilleur feel petanque. |
| Restitution | **0.85** (boule-boule), **0.7** (boule-cochonnet) | |
| Terrains | **4 types** : terre (1.0), herbe (1.8), sable (3.0), dalles (0.7) | CDC complet respecte. |
| Sauvegarde | **localStorage JSON** | < 100KB, suffisant. |
| Scaling | **Integer x3 ou x4** | Pixel art sans flou. |
| Assets sprites | **PixelLab MCP** (80%) + **Aseprite/Retro Diffusion** (20% hero) | Pipeline IA + retouche manuelle. |
| Assets audio | **ElevenLabs MCP** (SFX) + **jsfxr** (sons retro) + **Beepbox** (musique) | |
| Deploy | **GitHub Pages** via GitHub Actions | Statique, gratuit, CI/CD automatique. |
| Assets dir | **public/** pour tous les assets runtime | Phaser charge via son loader, pas via `import`. Utiliser `import.meta.env.BASE_URL`. |

---

## PREUVE DE FAISABILITE

1. **Physique simple** : ~70-100 lignes. Collision cercle-cercle elastique = algorithme standard.
2. **Phaser couvre 90%** : tilemaps Tiled natif, camera, scenes, sprites, input drag, audio.
3. **Monde petit** : 7 maps de 30x30 a 20x60 tiles. Performance zero-souci.
4. **IA graduable** : bruit aleatoire sur angle+puissance. 3 niveaux = 3 constantes.
5. **Template officiel** : `phaserjs/template-vite` -> setup en 2 min.
6. **Regles formalisees** : state machine complete, algorithme FIPJP, scoring. Zero ambiguite.
7. **Pipeline assets IA** : PixelLab MCP genere tilesets + sprites directement dans Claude Code.

---

## PLAN EN 5 SPRINTS

---

### SPRINT 0 : Setup & Tooling (NOUVEAU)
> Objectif : environnement de dev complet, MCP configures, pipeline assets pret.
> Rien ne se code sans un setup solide.

**Etape 0.1 - Projet Vite + Phaser (20 min)**
- [ ] Cloner `phaserjs/template-vite` ou `npm create vite@latest`
- [ ] `npm install phaser@3.90.0 phaser3-rex-plugins`
- [ ] Configurer vite.config.js :
```js
export default defineConfig({
    base: './',
    build: {
        assetsInlineLimit: 0,  // CRITIQUE: empeche Vite de casser les assets Phaser
        rollupOptions: {
            output: { manualChunks: { phaser: ['phaser'] } }
        }
    },
    optimizeDeps: { include: ['phaser3-rex-plugins'] },
    server: { port: 8080 }
});
```
- [ ] index.html avec CSS pixel art (`image-rendering: pixelated`)
- [ ] main.js avec config Phaser minimale (416x240, Arcade, pixelArt: true)
- [ ] `npm run dev` -> ecran vide Phaser = OK

**Etape 0.2 - Structure de fichiers (10 min)**
- [ ] Creer toute l'arborescence `/src` selon CLAUDE.md
- [ ] Creer `/assets/sprites/`, `/assets/tilesets/`, `/assets/maps/`, `/assets/audio/sfx/`, `/assets/audio/music/`
- [ ] Creer `/src/data/` avec boules.json, npcs.json, progression.json (schemas ci-dessous)
- [ ] Creer `/src/utils/Constants.js` avec toutes les constantes de jeu

**Etape 0.3 - MCP Servers (15 min)**
- [ ] Configurer PixelLab MCP (obtenir API key sur pixellab.ai)
- [ ] Configurer ElevenLabs MCP (cle existante dans restaupsycho)
- [ ] Tester : generer un sprite test avec PixelLab
- [ ] Tester : generer un SFX test avec ElevenLabs

**Etape 0.4 - Custom Skills Claude Code (15 min)**
- [ ] Creer `.claude/skills/sprite/SKILL.md` -> `/sprite [nom]`
- [ ] Creer `.claude/skills/tileset/SKILL.md` -> `/tileset [nom] [terrain]`
- [ ] Creer `.claude/skills/sfx/SKILL.md` -> `/sfx [description]`
- [ ] Creer `.claude/skills/playtest/SKILL.md` -> `/playtest`
- [ ] Tester chaque skill

**Etape 0.5 - Git + CI/CD (10 min)**
- [ ] `git init`, .gitignore (node_modules, dist, .env)
- [ ] Premier commit
- [ ] Creer repo GitHub
- [ ] GitHub Actions workflow pour deploy sur GitHub Pages
- [ ] Verifier que le deploy fonctionne (page vide Phaser en ligne)

**Livrable Sprint 0** : environnement complet, MCP fonctionnels, skills crees, CI/CD en place.
**Estimation : ~1h**

---

### SPRINT 1 : Moteur Petanque Standalone (LE COEUR)
> Objectif : une partie de petanque COMPLETE jouable en 1v1 dans le navigateur.
> C'est la brique critique. Si la petanque n'est pas fun, STOP.

**Etape 1.1 - Terrain et rendu (1h30)**
- [ ] PetanqueScene : terrain rectangulaire proportionnel (ratio 15:4 comme FIPJP)
- [ ] Fond colore selon type terrain (terre=ocre, herbe=vert, sable=creme, dalles=gris)
- [ ] Bordures du terrain (ligne blanche fine)
- [ ] Cercle de lancer en bas (rayon ~0.5m game units)
- [ ] Personnage placeholder dans le cercle
- [ ] Camera centree + zoom correct

**Etape 1.2 - Systeme de visee (2h30)**
- [ ] Detecter pointerdown dans la zone de lancer (pointer events = mouse+touch unifie)
- [ ] Calculer angle et puissance depuis le drag (slingshot inversee)
- [ ] Dessiner fleche de direction (longueur = puissance)
- [ ] Couleur fleche : vert < 33% puissance, jaune < 66%, rouge > 66%
- [ ] Dead zone 15px (annuler drags accidentels)
- [ ] Annulation par Escape ou drag retour
- [ ] Ligne pointillee trajectoire approximative (optionnel Sprint 1)

**Etape 1.3 - Physique des boules (3h)**
- [ ] Classe Ball : x, y, vx, vy, radius, mass, team, isAlive, isMoving
- [ ] Update loop frame-rate independent (`deltaTime` capped a 50ms)
- [ ] Friction lineaire constante : `speed -= frictionCoeff * terrain.friction_mult * dt`
- [ ] Stop si `speed < 0.3` (threshold dans Constants.js)
- [ ] Collision cercle-cercle : detection distance < r1+r2
- [ ] Resolution elastique avec restitution (masses egales pour boule-boule)
- [ ] Resolution masses differentes pour boule-cochonnet (700g vs 30g)
- [ ] Separation overlap (anti-sticking)
- [ ] Limites terrain : boule ENTIEREMENT sortie = **morte** (retiree, regle FIPJP)
- [ ] Boule SUR la ligne = vivante
- [ ] Classe Cochonnet : herite Ball, petit rayon, petite masse
- [ ] Cochonnet sort du terrain = **mene morte** (cas special)

**Etape 1.4 - Animation de lancer (2h)**
- [ ] Phase vol : tween du cercle vers le point d'atterrissage (~300ms)
- [ ] Ombre au sol grandissante pendant le vol
- [ ] Phase atterrissage : puff de particules, screen shake leger (2px, 150ms)
- [ ] Phase roulement : physique prend le relais
- [ ] Calcul landingPoint : `distance = power * landingFactor`
- [ ] Calcul rollingVelocity : `speed = power * (1 - landingFactor) * efficiency`
- [ ] LandingFactor configurable par type de boule (point vs tir)

**Etape 1.5 - Logique de jeu (4h) - REGLES FIPJP COMPLETES**
- [ ] PetanqueEngine : state machine
  - `COCHONNET_THROW` : equipe gagnante lance cochonnet (6-10m, >1m du bord)
  - `FIRST_BALL` : meme equipe lance 1ere boule
  - `SECOND_TEAM_FIRST` : autre equipe lance 1 boule
  - `PLAY_LOOP` : equipe la plus loin joue. Si plus de boules -> autre joue tout.
  - `ALL_STOPPED` : toutes boules arretees -> scoring
  - `SCORE_MENE` : compter points (boules gagnantes < meilleure perdante)
  - `MENE_DEAD` : cochonnet sorti -> regles speciales
  - `GAME_OVER` : score >= 13
- [ ] Algorithme "qui joue" (FIPJP) :
  - Calculer distance min de chaque equipe au cochonnet
  - Equipe plus loin joue
  - Si plus de boules : autre equipe joue ses restantes
  - Si distances egales : derniere equipe ayant joue rejoue
- [ ] Scoring fin de mene :
  - Equipe avec boule la plus proche = gagnante
  - Score = nb boules gagnantes plus proches que meilleure perdante
  - Si aucune boule perdante en jeu : toutes boules gagnantes comptent
- [ ] Mene morte (cochonnet sort) :
  - Si une equipe a des boules restantes et l'autre non -> 1 pt/boule restante
  - Sinon -> 0 points, meme equipe relance
- [ ] Detection "toutes boules arretees" (check velocities chaque frame)
- [ ] Victoire a 13 points

**Etape 1.6 - IA basique (2h)**
- [ ] IA facile : angle +-15deg, puissance +-20%, vise uniquement cochonnet
- [ ] IA moyen : angle +-8deg, puissance +-10%, vise cochonnet
- [ ] IA difficile : angle +-3deg, puissance +-5%, peut viser boules adverses (strategie tir)
- [ ] Decision IA : pointer (viser pres cochonnet) ou tirer (viser boule adverse)
  - Facile : toujours pointer
  - Moyen : tire si adversaire a boule < 2 unites du cochonnet
  - Difficile : tire si adversaire a le point et a la meilleure position
- [ ] Delai IA 1-2s (simule reflexion, empechement de spam)
- [ ] Animation "visee IA" : fleche qui apparait puis lancer

**Etape 1.7 - UI petanque (2h)**
- [ ] Panneau score lateral droit (rex-plugins ou custom)
  - Portraits placeholder (cercles colores)
  - Score equipe A / equipe B
  - Boules restantes (icones)
  - Indicateur "MENE X"
- [ ] Indicateur "BEST" dynamique (boule la plus proche brille)
- [ ] Message fin de mene avec score ("Joueur gagne 3 points !")
- [ ] Bouton Continuer
- [ ] Message victoire/defaite avec ecran dedie
- [ ] Indicateur "A vous de jouer" / "Tour de l'adversaire"

**Etape 1.8 - Ecran unlock audio + intro petanque (30 min)**
- [ ] Ecran "Cliquer pour jouer" (debloque AudioContext, obligatoire navigateurs)
- [ ] Transition vers PetanqueScene

**Livrable Sprint 1** : partie de petanque 1v1 complete, 4 terrains, 3 niveaux IA, regles FIPJP.
**Estimation : ~18h**

**GATE : playtester la physique. Si pas fun, iterer sur les constantes AVANT Sprint 2.**

---

### SPRINT 2 : Monde Ouvert Basique
> Objectif : un personnage qui explore une map, parle a des PNJ, declenche un combat.

**Etape 2.1 - Assets de base via PixelLab MCP (2h)**
- [ ] `/tileset provencal terre` : herbe, chemin terre, murs pierre, eau, maisons
- [ ] `/sprite joueur` : personnage 16x24, 4 directions x 4 frames walk
- [ ] `/sprite npc-villageois` : 2-3 variantes PNJ
- [ ] `/sprite npc-dresseur` : dresseur de petanque (casquette, beret)
- [ ] Retouche manuelle si necessaire (palette provencale)
- [ ] Export en spritesheets pour Phaser

**Etape 2.2 - Map village depart dans Tiled (1h30)**
- [ ] Creer tileset dans Tiled avec les PNG generes
- [ ] Map 30x30 tiles : village_depart
- [ ] Layers : ground, ground_detail, buildings, above_player, collisions, events
- [ ] Object layer : spawn_player, npc_maitre, npc_villageois, zone_sortie
- [ ] Exporter JSON dans `/assets/maps/`

**Etape 2.3 - OverworldScene (2h30)**
- [ ] BootScene : preload tous les assets (progress bar)
- [ ] Charger tilemap JSON + tileset PNG
- [ ] Creer layers dans le bon ordre (ground -> buildings -> player -> above_player)
- [ ] Layer collision invisible : `setCollisionByProperty({ collides: true })`
- [ ] Camera follow joueur : `camera.startFollow(player, true, 0.1, 0.1)`
- [ ] Camera bounds = taille map
- [ ] `camera.roundPixels = true` (anti-jitter pixel art)

**Etape 2.4 - Joueur (2h30)**
- [ ] Classe Player extends Phaser.Physics.Arcade.Sprite
- [ ] Mouvement grid-based : snap aux tiles, tween ~200ms entre positions
- [ ] Collision avec layer collision (Arcade Physics `collider`)
- [ ] Input clavier : fleches directionnelles + ZQSD
- [ ] Animations : walk_down, walk_up, walk_left, walk_right, idle_X
- [ ] Frame rate animation : 8 FPS walk, 4 FPS idle

**Etape 2.5 - PNJ et dialogues (3h30)**
- [ ] Classe NPC : position tile, facing, type (trainer/villager/master), viewDistance
- [ ] Charger PNJ depuis object layer Tiled + donnees npcs.json
- [ ] Detection line-of-sight (raycast facing direction, verifier collisions)
- [ ] Sequence detection dresseur : "!" -> PNJ marche vers joueur -> dialogue
- [ ] DialogBox (rex-plugins ou custom) :
  - Boite en bas de l'ecran (9-slice panel)
  - Typewriter effect 30ms/char
  - Avancer avec action key (Espace / Enter / clic)
  - Skip rapide si deja en typewriter
  - Fleche clignotante quand texte complet
- [ ] Interaction manuelle : action key face a un PNJ
- [ ] PNJ idle : timer 3-5s, change direction aleatoire

**Etape 2.6 - Transition exploration -> combat (2h)**
- [ ] Apres dialogue dresseur : `camera.flash()` puis `camera.fadeOut(300)`
- [ ] `scene.sleep('OverworldScene')` (persister etat)
- [ ] `scene.launch('PetanqueScene', { opponent, difficulty, terrain })`
- [ ] Retour : `scene.wake('OverworldScene')` apres victoire
- [ ] Marquer dresseur battu : `gameState.flags[npcId + '_defeated'] = true`
- [ ] Dresseur battu = dialogue different, plus de combat, sprite change (optionnel)
- [ ] Si defaite : retour a l'exploration, peut retenter

**Livrable Sprint 2** : explorer un village, parler a un PNJ, jouer une partie, revenir.
**Estimation : ~14h**

---

### SPRINT 3 : Contenu et Progression
> Objectif : jeu complet avec 7 maps, 4 arenes, badges, sauvegarde, doublettes.

**Etape 3.1 - Systeme de sauvegarde (1h30)**
- [ ] SaveManager.js :
```js
const saveData = {
    version: 1,
    player: { name, position: { map, x, y }, facing },
    boules: { type: "acier" },
    partners: [{ id, name, skill }],
    badges: [],
    flags: {},
    score_total: 0,
    playtime: 0
};
```
- [ ] `save()` : `localStorage.setItem('petanque_master_save', JSON.stringify(data))`
- [ ] `load()` : parse + validation version
- [ ] Auto-save : sur changement de map, apres combat, toutes les 5 min
- [ ] 3 slots de sauvegarde

**Etape 3.2 - Ecran titre (1h)**
- [ ] TitleScene : logo "PETANQUE MASTER" (pixel art)
- [ ] Menu : Nouvelle Partie / Continuer / Options
- [ ] Fond anime : scene de petanque en boucle ou parallax
- [ ] Musique titre (Beepbox chiptune provencal)
- [ ] "Cliquer pour jouer" integre (unlock audio)

**Etape 3.3 - Intro et choix des boules (1h30)**
- [ ] Sequence intro : dialogue avec le vieux maitre (3-4 pages)
- [ ] Lore : "Tu veux devenir le meilleur bouliste du canton ?"
- [ ] Choix entre 3 sets (Acier/Bronze/Chrome) avec stats visuelles
- [ ] Description de chaque set + preview sprite
- [ ] Confirmation du choix
- [ ] Le maitre offre les boules et donne un conseil

**Etape 3.4 - Toutes les maps (6h)**

| # | Map | Taille | Contenu | Terrain arene |
|---|-----|--------|---------|---------------|
| 1 | Village de depart | 30x30 | Maitre, 2 villageois, maison joueur | - |
| 2 | Route 1 | 20x60 | 3 dresseurs, arbres, chemin | - |
| 3 | Village Arene 1 | 30x30 | Maitre Marcel, villageois, arene | Terre battue |
| 4 | Route 2 | 20x60 | 3 dresseurs, riviere, pont | - |
| 5 | Village Arene 2 | 30x30 | Maitre Fanny, parc, arene | Herbe |
| 6 | Route 3 | 20x60 | 4 dresseurs, plage, rochers | - |
| 7 | Village Arene 3 / Place | 40x40 | Maitre Ricardo, place, arene | Sable |

- [ ] Generer tilesets avec `/tileset` pour chaque biome
- [ ] Creer chaque map dans Tiled avec layers complets
- [ ] Object layers : PNJ, spawn points, transitions zones
- [ ] Transitions entre maps : fade, spawn points correspondants
- [ ] PNJ roadblocks : "Tu dois battre Marcel avant d'aller plus loin"

**Etape 3.5 - Systeme d'arene + badges (2h30)**
- [ ] Arene = PNJ maitre avec dialogue special pre/post combat
- [ ] Terrain specifique par arene
- [ ] Victoire = badge obtenu (animation obtention)
- [ ] Menu badges (scene overlay, badges affiches visuellement)
- [ ] Gate progression : PNJ roadblock verifie flags badges
- [ ] Difficulte progressive : Marcel=facile, Fanny=moyen, Ricardo=difficile

**Etape 3.6 - 4 types de terrain dans PetanqueScene (1h)**
- [ ] Terre battue : friction 1.0, fond ocre, particules poussiere marron
- [ ] Herbe : friction 1.8, fond vert olive, particules brins herbe
- [ ] Sable : friction 3.0, fond creme, particules sable clair
- [ ] Dalles : friction 0.7, fond gris pierre, particules etincelles
- [ ] Terrain selectionne dynamiquement par le combat

**Etape 3.7 - Doublettes (2h30)**
- [ ] Partenaire recrute apres combat gagne (certains PNJ le proposent)
- [ ] Menu equipe : choisir partenaire avant un combat doublette
- [ ] En doublette : 2 joueurs/equipe, 3 boules chacun, 6 total
- [ ] IA joue le partenaire du joueur (meme niveau que l'adversaire le plus faible)
- [ ] Arene 2 (Fanny) et 3 (Ricardo) en doublette

**Etape 3.8 - Contenu PNJ et dialogues (2h)**
- [ ] Remplir npcs.json avec TOUS les PNJ :
  - 3 maitres d'arene (Marcel, Fanny, Ricardo)
  - 10 dresseurs sur les routes (dialogues pre/post combat)
  - 8-10 villageois (dialogues ambiance, indices, humour)
  - 3 partenaires recrutables (le touriste, la mamie, le kid)
- [ ] Dialogues courts, droles, avec du caractere (style CDC)
- [ ] Chaque dresseur a un nom, une personality, un dialogue unique

**Livrable Sprint 3** : jeu complet, 7 maps, 3 arenes, 10+ dresseurs, doublettes, sauvegarde.
**Estimation : ~18h**

---

### SPRINT 4 : Arene Finale + Polish + Game Feel
> Objectif : rendre le jeu beau, agreable, fini, et deploye.

**Etape 4.1 - Sprites et tilesets definitifs (4h)**
- [ ] `/sprite joueur-definitif` : 4 directions x 4 frames, palette provencale
- [ ] `/sprite marcel` `/sprite fanny` `/sprite ricardo` `/sprite marius` : maitres d'arene
- [ ] 5+ sprites PNJ distincts (dresseurs, villageois, partenaires)
- [ ] Tilesets definitifs provencaux : toits terracotta, platanes, lavande, terrasses
- [ ] Sprites petanque : boules metalliques realistes, cochonnet, terrain detaille
- [ ] Portraits personnages pour panneau score (32x32 ou 48x48)
- [ ] Retouche Aseprite sur tous les hero assets (palette, coherence)

**Etape 4.2 - Effets visuels (2h30)**
- [ ] Particules poussiere atterrissage (6-10 particules, cone, fade 400ms)
- [ ] Trainee roulement (1-2 particules toutes les 3 frames)
- [ ] Sparkle point parfait (8-12 particules radiales, jaune/blanc)
- [ ] Flash impact boule-boule (1 frame cercle blanc, expand)
- [ ] Screen shake : leger 2-3px sur impact, fort 4-6px sur carreau
- [ ] Freeze-frame 30ms sur gros impacts (optionnel)
- [ ] Zoom lancer : ease 1.0x -> 1.05x sur 300ms, retour 500ms
- [ ] Medaillon zoom cochonnet (MiniMap.js, coin haut gauche)
- [ ] Camera suit boule en vol (lerp 0.08)
- [ ] Object pooling particules (pre-allouer 100)

**Etape 4.3 - Audio complet (2h30)**
- [ ] SFX via `/sfx` et jsfxr :
  - Clac metallique (impact boule)
  - Roulement sur terrain (loop, pitch shift avec vitesse)
  - Atterrissage (thud + crunch)
  - Cochonnet touche (ping aigu)
  - Boule morte (bruit sourd)
  - UI clicks, transitions
- [ ] Musique via Beepbox :
  - Theme titre (joyeux, provencal)
  - Theme exploration (leger, ensoleille)
  - Theme combat (tension, rythme)
  - Theme victoire (fanfare courte)
- [ ] Ambiance : cigales (ESSENTIEL!), brise, oiseaux, cloches lointaines
- [ ] Reactions public : "ooh!", "aah!", applaudissements
- [ ] Volume settings dans Options

**Etape 4.4 - Arene finale + fin de jeu (2h30)**
- [ ] Map 8 : Arene Finale (30x30) - place du Grand Marius
- [ ] Terrain special : dalles de pierre (friction 0.7 = boules roulent loin)
- [ ] Le Grand Marius : combat epique, IA difficile, **triplette** (3v3, 2 boules chacun)
- [ ] 2 partenaires requis (le joueur doit avoir recrute)
- [ ] Dialogue Marius : epicque, dramatique, humoristique
- [ ] Sequence fin : "Tu es le PETANQUE MASTER !"
- [ ] Ecran credits avec stats (parties jouees, points marques, temps)
- [ ] Retour au titre apres credits

**Etape 4.5 - Responsive et mobile (1h30)**
- [ ] Scaling integer automatique : `Math.floor(Math.min(w/416, h/240))`
- [ ] Letterboxing fond sombre (#3A2E28) avec flexbox
- [ ] Touch controls : drag-to-aim = natif pointer events
- [ ] D-pad virtuel pour exploration mobile (optionnel, Phase 2)
- [ ] Page Visibility API : pause quand tab cachee, mute audio
- [ ] Forcer paysage si possible (Screen Orientation API)
- [ ] Tester Chrome, Firefox, Safari, Edge

**Etape 4.6 - Deploy final (30 min)**
- [ ] `npm run build` -> verifier dist/
- [ ] Push sur GitHub -> Actions deploie automatiquement
- [ ] Tester URL GitHub Pages
- [ ] Verifier : assets charges, audio fonctionne, sauvegarde OK
- [ ] Partager le lien !

**Livrable Sprint 4** : jeu complet, poli, 4 arenes, 8 maps, son, responsive, en ligne.
**Estimation : ~14h**

---

## ESTIMATION TOTALE

| Sprint | Contenu | Estimation |
|--------|---------|------------|
| Sprint 0 | Setup, tooling, MCP, CI/CD | ~1h |
| Sprint 1 | Moteur petanque jouable | ~18h |
| Sprint 2 | Monde ouvert basique | ~14h |
| Sprint 3 | Contenu et progression | ~18h |
| Sprint 4 | Polish, arene finale, deploy | ~14h |
| **TOTAL** | **MVP complet en ligne** | **~65h** |

---

## SCHEMAS DE DONNEES

### npcs.json
```json
{
  "npcs": [
    {
      "id": "maitre_vieux",
      "name": "Le Vieux Maitre",
      "type": "mentor",
      "map": "village_depart",
      "tile_x": 14, "tile_y": 10,
      "facing": "down",
      "sprite": "npc_maitre",
      "view_distance": 0,
      "dialogue_default": [
        "Ah, te voila ! Je t'attendais.",
        "Tu veux devenir le meilleur bouliste du canton ?",
        "Choisis bien tes boules, petit. C'est pour la vie !"
      ],
      "dialogue_after_intro": [
        "Va defier Marcel au village voisin.",
        "Et n'oublie pas : la petanque, c'est 80% de mental !"
      ],
      "triggers": { "gives_boules": true, "starts_intro": true }
    },
    {
      "id": "marcel",
      "name": "Maitre Marcel",
      "type": "arena_master",
      "map": "village_arene_1",
      "tile_x": 15, "tile_y": 8,
      "facing": "down",
      "sprite": "npc_marcel",
      "view_distance": 0,
      "difficulty": "easy",
      "terrain": "terre",
      "format": "tete_a_tete",
      "badge": "badge_marcel",
      "dialogue_before": [
        "Hé petit ! Tu crois pouvoir battre le Marcel ?",
        "J'ai 40 ans de terrain dans les pattes !",
        "Allez, montre-moi ce que tu sais faire !"
      ],
      "dialogue_after": [
        "Sacre nom d'une boule...",
        "Tu m'as eu, gamin. Tiens, prends ce badge.",
        "Mais attention, Fanny va pas te faire de cadeau !"
      ]
    },
    {
      "id": "route1_dresseur_1",
      "name": "Jean-Pierre",
      "type": "trainer",
      "map": "route_1",
      "tile_x": 10, "tile_y": 25,
      "facing": "left",
      "sprite": "npc_dresseur_1",
      "view_distance": 4,
      "difficulty": "easy",
      "terrain": "terre",
      "format": "tete_a_tete",
      "dialogue_before": ["Hé toi ! Tu joues a la petanque ?", "On fait une partie ?"],
      "dialogue_after": ["Pas mal du tout ! Continue comme ca."]
    }
  ]
}
```

### progression.json
```json
{
  "badges": [
    { "id": "badge_marcel", "name": "Badge Terre", "master": "marcel", "icon": "badge_terre", "order": 1 },
    { "id": "badge_fanny", "name": "Badge Herbe", "master": "fanny", "icon": "badge_herbe", "order": 2 },
    { "id": "badge_ricardo", "name": "Badge Sable", "master": "ricardo", "icon": "badge_sable", "order": 3 },
    { "id": "badge_marius", "name": "Badge Maitre", "master": "marius", "icon": "badge_maitre", "order": 4 }
  ],
  "gates": [
    { "map": "route_1", "tile_x": 10, "tile_y": 0, "requires": [], "npc_blocker": "gate_route1" },
    { "map": "route_2", "tile_x": 10, "tile_y": 0, "requires": ["badge_marcel"], "npc_blocker": "gate_route2" },
    { "map": "route_3", "tile_x": 10, "tile_y": 0, "requires": ["badge_fanny"], "npc_blocker": "gate_route3" },
    { "map": "arene_finale", "tile_x": 15, "tile_y": 28, "requires": ["badge_marcel", "badge_fanny", "badge_ricardo"], "npc_blocker": "gate_finale" }
  ],
  "partners": [
    { "id": "touriste", "name": "Bob le Touriste", "map": "route_1", "skill": 2, "dialogue_recruit": "Moi aussi je veux jouer ! On fait equipe ?" },
    { "id": "mamie", "name": "Mamie Rose", "map": "route_2", "skill": 3, "dialogue_recruit": "Ah la jeunesse ! Allez, je t'accompagne." },
    { "id": "kid", "name": "Le Petit Lucas", "map": "route_3", "skill": 4, "dialogue_recruit": "Je suis le meilleur de ma classe ! Prends-moi !" }
  ],
  "victory_score": 13
}
```

### boules.json
Deja cree dans `/src/data/boules.json` (3 sets + cochonnet + physics + 4 terrains).

---

## CONSTANTES DE JEU (Constants.js)

```javascript
// Resolution
export const GAME_WIDTH = 416;
export const GAME_HEIGHT = 240;
export const TILE_SIZE = 16;

// Mouvement joueur
export const PLAYER_MOVE_DURATION = 200; // ms pour traverser 1 tile
export const PLAYER_ANIM_FPS = 8;

// Petanque - terrain
export const TERRAIN_WIDTH = 300; // pixels game
export const TERRAIN_HEIGHT = 80;
export const COCHONNET_MIN_DIST = 96; // ~6m scale
export const COCHONNET_MAX_DIST = 160; // ~10m scale

// Petanque - physique
export const FRICTION_BASE = 0.15;
export const SPEED_THRESHOLD = 0.3;
export const RESTITUTION_BOULE = 0.85;
export const RESTITUTION_COCHONNET = 0.7;
export const MAX_THROW_SPEED = 12;
export const LANDING_FACTOR_POINT = 0.65;
export const LANDING_FACTOR_TIR = 0.3;

// Petanque - IA
export const AI_DELAY_MIN = 1000; // ms
export const AI_DELAY_MAX = 2000;
export const AI_EASY = { angleDev: 15, powerDev: 0.20, canShoot: false };
export const AI_MEDIUM = { angleDev: 8, powerDev: 0.10, canShoot: true, shootThreshold: 2 };
export const AI_HARD = { angleDev: 3, powerDev: 0.05, canShoot: true, shootThreshold: 4 };

// Victoire
export const VICTORY_SCORE = 13;

// Camera
export const CAMERA_LERP = 0.1;

// Dialogue
export const TYPEWRITER_SPEED = 30; // ms par caractere

// Palette provencale
export const COLORS = {
    OCRE: 0xD4A574,
    TERRACOTTA: 0xC4854A,
    LAVANDE: 0x9B7BB8,
    OLIVE: 0x6B8E4E,
    CIEL: 0x87CEEB,
    CREME: 0xF5E6D0,
    OMBRE: 0x3A2E28, // jamais de noir pur
    ACCENT: 0xC44B3F
};
```

---

## ARBORESCENCE FICHIERS COMPLETE

```
petanque-master/
  index.html
  vite.config.js
  package.json
  .gitignore
  CLAUDE.md
  PLAN_MVP.md
  CAHIER_DES_CHARGES.md
  /src
    main.js
    config.js
    /scenes
      BootScene.js
      TitleScene.js
      OverworldScene.js
      PetanqueScene.js
      DialogScene.js
      UIScene.js
    /entities
      Player.js
      NPC.js
    /petanque
      Ball.js
      Cochonnet.js
      PetanqueEngine.js
      PetanqueAI.js
      AimingSystem.js
    /world
      MapManager.js
      CollisionSystem.js
      NPCManager.js
    /ui
      DialogBox.js
      ScorePanel.js
      MiniMap.js
      BadgeMenu.js
    /data
      npcs.json
      progression.json
      boules.json
    /utils
      SaveManager.js
      Constants.js
  /assets
    /sprites
    /tilesets
    /maps
    /audio
      /sfx
      /music
  /public
  /.claude
    /skills
      /sprite/SKILL.md
      /tileset/SKILL.md
      /sfx/SKILL.md
      /playtest/SKILL.md
  /.github
    /workflows
      deploy.yml
  /research (11 fichiers de recherche)
```

---

## WORKFLOW ASSETS AVEC IA

```
1. PixelLab MCP (via /sprite ou /tileset)
   |-> PNG brut genere
   |
2. Verification visuelle
   |-> Si OK : copier dans /assets/
   |-> Si retouche : ouvrir dans Aseprite, corriger palette/grid
   |
3. Sprite sheets
   |-> Assembler frames dans Aseprite ou script Python
   |-> Export PNG + JSON atlas pour Phaser
   |
4. Import dans Phaser
   |-> this.load.spritesheet() ou this.load.atlas()
   |-> this.anims.create() pour animations
```

---

## CI/CD GITHUB ACTIONS

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: lts/*
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v4
        with: { path: dist }
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Config GitHub** : Settings > Pages > Source = "GitHub Actions"

## IMPORTANT : ASSETS DANS PUBLIC/

Tous les assets charges par Phaser a runtime vont dans `public/` (PAS `src/`) :
```
public/
  assets/
    sprites/
    tilesets/
    maps/
    audio/sfx/
    audio/music/
  data/
    npcs.json
    progression.json
    boules.json
```

Dans le code Phaser, toujours utiliser `import.meta.env.BASE_URL` :
```js
const BASE = import.meta.env.BASE_URL;
this.load.image('player', `${BASE}assets/sprites/player.png`);
this.load.json('npcs', `${BASE}data/npcs.json`);
this.load.audio('clac', [`${BASE}assets/audio/sfx/clac.ogg`, `${BASE}assets/audio/sfx/clac.mp3`]);
```

Audio : toujours fournir OGG + MP3 (Phaser choisit selon le navigateur).

---

## RISQUES ET MITIGATIONS

| Risque | Proba | Impact | Mitigation |
|--------|-------|--------|------------|
| Physique pas fun | Faible | CRITIQUE | Playtester fin Sprint 1. Iterer constantes. |
| PixelLab qualite insuffisante | Moyen | Moyen | Retouche Aseprite. Fallback assets CC0. |
| Rex plugins incompatible Vite | Faible | Moyen | Import individuel. Fallback custom UI. |
| Sprites 16x24 trop petits | Moyen | Faible | Upgrade 32x32 si besoin. |
| Performance mobile | Faible | Moyen | OffscreenCanvas, pooling, 60 FPS target. |
| Tiled maps complexes | Faible | Faible | Commencer simple, enrichir. |
| Audio autoplay bloque | Nul | Moyen | Ecran "Cliquer pour jouer" des Sprint 1. |
| localStorage plein | Nul | Faible | Save < 100KB, 5MB dispo. |

---

## ORDRE DE PRIORITE

1. **Sprint 0** : on ne code rien sans setup. 1h investie = des heures gagnees.
2. **Sprint 1 est NON-NEGOCIABLE en premier.** Le coeur. Si pas fun, on itere ou on arrete.
3. **Sprint 2** : la structure Pokemon. Le concept prend vie.
4. **Sprint 3** : le contenu. Le jeu devient interessant.
5. **Sprint 4** : le polish. Le jeu devient memorable et jouable en ligne.

**Gate Sprint 1 -> 2** : la petanque DOIT etre fun. Playtester avec 3 personnes.
**Gate Sprint 3 -> 4** : le contenu DOIT etre suffisant. 10+ combats differents.
