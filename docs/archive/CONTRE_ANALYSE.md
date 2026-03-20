# CONTRE-ANALYSE — Audit externe de Petanque Master

> **Auditeur** : Game Designer Senior / Architecte Technique (regard externe, premiere lecture a froid)
> **Date** : 20 mars 2026
> **Version du code** : commit c188f4d
> **Methode** : lecture complete CLAUDE.md → GAME_DESIGN.md → CAHIER → SPRINT_FINAL → PLAN_MVP → research/ (54 fichiers) → code source → donnees JSON → toutes les scenes

---

## SCORE GLOBAL : 62/100

Un moteur de petanque solide et original, une architecture technique propre, un concept unique sans concurrent — mais un jeu qui n'est pas encore pret pour le joueur. L'ecart entre la documentation ambitieuse et l'experience joueur reelle est le probleme numero un.

---

## TOP 5 FORCES

### 1. Moteur de petanque exceptionnel
Le coeur physique (Ball.js ~380 lignes, PetanqueEngine.js ~550 lignes) est le meilleur asset du projet. COR 0.62 realiste, friction lineaire, sub-stepping anti-tunneling, loft 4 presets, retro 2-phase, pente, zones mixtes, rebonds murs — c'est un vrai simulateur. Aucun jeu HTML5 n'a ca. **A proteger absolument.**

### 2. Zero concurrent serieux
Le marche de la petanque video game est vide. "Power of Petanque" sur Steam = ~20 reviews. Le creneau "sport niche + pixel art + fighting game framework" est valide (cf. Windjammers, Lethal League). C'est une vraie opportunite.

### 3. Systeme de personnages bien concu
6 personnages avec des archetypes distincts (tireur, pointeur, equilibre, complet, adaptable), des stats qui impactent reellement le gameplay (wobble, puissance, pression), des capacites uniques, et une IA par personnalite. Le design est solide — chaque perso se joue differemment.

### 4. Architecture technique saine
Separation claire : PetanqueEngine (regles) / AimingSystem (input) / PetanqueAI (IA) / EngineRenderer (visuel). Constants.js centralise bien. SoundManager avec fallback procedural + fichiers audio. SaveManager v2 avec migration. 138 tests unitaires + 85 E2E Playwright. Le code est maintenable.

### 5. Profondeur de recherche
54 fichiers de recherche couvrant physique, game design, distribution, monetisation, UI/UX, audio, mobile, accessibilite, localisation, progression. Le projet est documnte comme un projet professionnel. La synthese (00_synthese) avec guide de lecture est un excellent pattern.

---

## TOP 5 FAIBLESSES

### 1. Le joueur ne sait pas quoi faire
Aucun tutoriel in-game pendant le premier match. TutorialScene est un menu a part avec 5 pages de texte — personne ne va lire ca avant de jouer. Le joueur CrazyGames/Poki ouvre le jeu, voit un menu, clique "Jouer", et se retrouve devant un terrain avec "lancez le cochonnet" sans comprendre le drag-and-release, les techniques de loft, ou le scoring. **C'est le probleme critique numero un.**

### 2. Le Rookie est punitif, pas fun
Stats de depart 4/4/3/3 = wobble enorme, puissance faible. Le premier match contre La Choupe (puissance 10, sang-froid 6) avec un Rookie a 14 points vs un adversaire a 24+ = frustrant. Le joueur ne sent pas qu'il "apprend" — il sent qu'il est injustement faible. Et il ne gagne rien s'il perd (0 XP, 0 Galets). Un joueur casual qui perd son premier match et n'obtient RIEN va fermer le jeu.

### 3. Le game feel est la en theorie, absent en pratique
Le slow-mo et le son de roulement sont codes, mais l'experience visuelle est pauvre : terrain = rectangle de couleur unie, pas de particules visibles, pas de camera dynamique (decision explicite de ne PAS avoir de camera follow — c'est la mauvaise decision pour le game feel). Le "clac" metallique est le moment cle du jeu, mais visuellement il n'y a qu'un flash blanc + cercle. Comparez avec Wii Sports Bowling : le ralenti + la camera + les pins + le son = un moment de pure satisfaction. Ici, la boule touche une autre boule et... c'est tout.

### 4. L'economie est desequilibree
50 Galets de depart + 20/victoire Quick Play + 50/victoire Arcade. Boule la moins chere = 150 Galets. Il faut 5-7 victoires pour acheter quoi que ce soit d'utile. Un joueur casual qui joue 2-3 matchs par session (15 min) et gagne 1 sur 2 = ~10-35 Galets/session = 5-15 sessions pour la premiere boule. C'est beaucoup trop lent. Et les boules retro a 200-250 Galets sont purement cosmetiques — pourquoi les acheter ?

### 5. Le code et la doc sont desynchronises
Nombreuses contradictions entre SPRINT_FINAL, CAHIER, characters.json, SaveManager et Constants.js (detail ci-dessous). Ca cree de la confusion et des bugs latents.

---

## PARTIE 1 — CONTRADICTIONS ET INCOHERENCES

### Tableau des contradictions majeures

| # | Element | Document | Valeur doc | Code | Valeur code | Severite |
|---|---------|----------|-----------|------|-------------|----------|
| 1 | Rookie stats depart | SPRINT_FINAL §1.1 | 3/3/2/2 (10 pts) | characters.json:23-27 + SaveManager.js:8-9 | 4/4/3/3 (14 pts) | **CRITIQUE** |
| 2 | Rookie abilities seuils | SPRINT_FINAL §1.4 | 18/26/34 | characters.json:31-33 | 18/24/32 | **CRITIQUE** |
| 3 | Rookie abilities seuils | SaveManager.js:139-142 | — | addRookiePoints() | 18/24/32 | Coherent avec characters.json, pas avec SPRINT_FINAL |
| 4 | Determination wobble | SPRINT_FINAL §1.4 | -50% wobble | characters.json:32 | -80% wobble | **IMPORTANT** |
| 5 | Docks friction | GAME_DESIGN.md:132 | 0.7 | terrains.json:129 | 0.4 | **CRITIQUE** |
| 6 | Docks friction | Constants.js:248 | — | TERRAIN_FRICTION.dalles | 0.7 | Incoherent avec terrains.json (0.4) |
| 7 | Sable friction | GAME_DESIGN.md:112, terrains.json:31 | 3.0 | Constants.js:247 | 3.5 | **IMPORTANT** |
| 8 | Reyes total stats | CAHIER §2.4 | 31 | characters.json:237-241 | 8+8+7+9 = 32 | MINEUR |
| 9 | Reyes sang-froid | CAHIER §2.4 | 8 | characters.json:241 | 9 | **IMPORTANT** |
| 10 | COR boule-boule | Constants.js:23 | 0.62 | boules.json:291 (physics section) | 0.85 | **CRITIQUE** |
| 11 | COR cochonnet | Constants.js:24 | 0.50 | boules.json:292 | 0.70 | **CRITIQUE** |
| 12 | Monnaie nom | SPRINT_FINAL (partout) | "Ecus" | Constants.js:299+ | GALET_* | Renomme mais doc pas mise a jour |
| 13 | Shop monnaie | shop.json, ShopScene.js | — | ShopScene.js affichage | "E" au lieu de "G" | **BUG** |
| 14 | Marcel IA precision | CAHIER §2.3 | 0.80x pointage / 0.85x tir | PetanqueAI.js:184-185 | 0.65x pointage / 0.85x tir | **IMPORTANT** — Marcel est plus fort que documente |
| 15 | Ombres couleur | GAME_DESIGN.md:254 | #3A2E28 | CAHIER §5.1 | #1A1510 | Incoherence, deux couleurs d'ombre utilisees |
| 16 | Sprites taille | CLAUDE.md | 32x32 (generes 64x64) | CAHIER §2.4 | 128x128 spritesheets | Confusion sur la taille reelle |
| 17 | Boules default save | SaveManager.js:12 | unlockedBoules | ["acier", "chrome"] | — | Chrome est deverrouille par defaut, mais le shop le vend aussi |
| 18 | Terrains tous unlock | terrains.json | unlocked: true (tous) | SPRINT_FINAL §3.4 | Docks apres R3, Plage apres R5 | terrains.json ignore les verrous |

### Decisions research non appliquees

| Research | Recommandation | Statut |
|----------|---------------|--------|
| research/51 (balancing) | XP de consolation en defaite (+0.5 pts Rookie) | **NON IMPLEMENTE** |
| research/45 (progression) | 3 tenues visuelles Rookie (10-19/20-29/30-40 pts) | **NON IMPLEMENTE** |
| research/49 (sound) | Layering 3+ couches pour le son de carreau | **NON IMPLEMENTE** (1 seul SFX) |
| research/36 (onboarding) | Tutoriel integre au premier match (5 etapes interactives) | **NON IMPLEMENTE** (TutorialScene est un menu separe) |
| research/34 (UI) | Migration BitmapText custom (perf) | **NON IMPLEMENTE** |
| research/37 (mobile) | Haptic feedback vibration sur lancer/impact | **NON IMPLEMENTE** |
| research/54 (portals) | Resolution 16:9 (836x470) pour Poki | **NON IMPLEMENTE** (832x480 = 1.73:1) |
| research/47 (camera) | Camera follow on ball during flight | **REFUSE** (decision explicite, mais c'est un tort) |
| research/51 (balancing) | Debug overlay Ctrl+D (FPS, wobble, AI decisions) | **NON IMPLEMENTE** |

### Fichiers research obsoletes ou contredits

| Fichier | Probleme |
|---------|----------|
| research/51 (balancing) | Seuils Rookie 18/26/34 — code utilise 18/24/32 |
| boules.json "physics" | Section physics avec COR 0.85/0.70 contredit Constants.js (0.62/0.50). **Quelle est la source de verite ?** Le code utilise Constants.js, donc boules.json.physics est mort/trompeur |
| SPRINT_FINAL | Entierement base sur "Ecus" (ancien nom), stats Rookie 3/3/2/2 (ancien), seuils 18/26/34 (ancien). Ce fichier n'a PAS ete mis a jour apres les changements du 18-20 mars |
| progression.json | Ne contient que 3 badges (Village, Parc, Colline) + victory_score 13. Pas de deblocages, pas de milestones. Quasi-inutile comparee a ce que SPRINT_FINAL promet |

### Features "faites" dans CAHIER mais potentiellement non fonctionnelles

| Feature | CAHIER dit | Doute |
|---------|-----------|-------|
| "Traces d'impact (verifier RenderTexture)" §3.3 | A verifier | Le CAHIER lui-meme dit "a verifier" — pas clairement fonctionnel |
| "Ambiance par terrain" §2.11 | Implemente | SoundManager a le mapping, mais les fichiers audio (sfx_vagues, sfx_oiseaux) sont-ils presents ? Fallback = cigales partout sauf cigales |
| "Retro (backspin) toggle" §2.1 | Implemente | Fonctionne, mais l'effet stat "effet" minimum est 1 (RETRO_MIN_EFFET_STAT=1) — tout le monde peut utiliser retro, meme avec effet=2 |
| Mode "une_boule" | Implemente (PetanqueEngine.js:58-61) | Victory score = 11, pas 7 comme sugere par le commit "victoire a 7 pts" |

---

## PARTIE 2 — CRITIQUE GAMEPLAY HONNETE

### Est-ce que je comprends quoi faire en 30 secondes ?

**Non.** Le flow est : TitleScene → "Arcade" → CharSelectScene (Rookie pre-selectionne) → VSIntroScene → PetanqueScene. Le joueur voit un terrain, un cercle de lancer, et le message "Lancez le cochonnet". Mais :

- Il ne sait pas ce qu'est un cochonnet
- Il ne comprend pas le drag-and-release (aucun indicateur visuel initial)
- Il ne sait pas pourquoi il y a 4 boutons (Roulette/Demi-portee/Plombee/Tirer)
- Le mot "Roulette" ne veut rien dire pour un non-initie

**Comparaison** : Wii Sports Bowling — le joueur voit un personnage, une piste, des quilles. Il comprend en 1 seconde. Ici, le concept de "placer sa boule pres d'une petite boule" n'est pas intuitif pour un public international.

**Solution** : Tutoriel interactif DANS le premier match. Pas un menu a part. 3 etapes : "1. Glissez pour viser → 2. Relachez pour lancer → 3. Placez-vous pres de la boule jaune". C'est tout. Pas de techniques de loft au premier match.

### Est-ce que le premier match est fun ou frustrant ?

**Frustrant.** Le Rookie a 4/4/3/3, La Choupe a 5/10/3/6. Le wobble du Rookie est enorme (precision 4 → la boule oscille beaucoup). Le joueur rate ses premiers tirs, ne comprend pas pourquoi, et perd. Il ne recoit rien (0 XP, 0 Galets en cas de defaite). Il doit "Retry" et refaire exactement le meme match.

**Comparaison** : Dans Pokemon, meme si vous perdez un combat, vous gardez vos XP et vos captures. Dans Hades, chaque run donne des ressources. Dans Golf With Friends, chaque trou est fun meme si vous perdez le match.

**Solution** :
1. Baisser le wobble du Rookie de depart (precision 5 au lieu de 4)
2. Donner des Galets meme en defaite (10 Galets + 1 XP)
3. Rendre La Choupe plus facile (angleDev 10 au lieu de 7, precision affichee de 5 mais IA avec bonus plus genereux)

### Apres 15 minutes, qu'est-ce qui me fait rester ?

**Ce qui me fait rester** : Le "clac" metallique + le slow-mo pres du cochonnet sont satisfaisants. Le mode Arcade raconte une mini-histoire. Les barks des personnages sont droles et bien ecrits. L'envie de debloquer le prochain perso.

**Ce qui me fait partir** :
- Le terrain est visuellement vide (rectangle colore)
- Les matchs se ressemblent tous (meme angle de vue, meme experience)
- Il n'y a pas de "moment wow" — pas de replay du meilleur tir, pas de zoom sur le carreau, pas de celebration exageree
- Le score 13 points = match trop long pour un joueur casual (5-8 minutes). Le mode "une_boule" est une bonne idee mais cache dans QuickPlay, pas propose par defaut
- Pas de feedback visuel clair de progression (barre XP ? compteur Galets ? badge ?)

### Le systeme de progression Rookie 14→40 est-il motivant ?

**Invisible.** Le joueur ne voit sa progression que dans LevelUpScene (apres victoire) ou PlayerScene (menu). Il n'y a pas de barre XP persistante en jeu, pas de notification "80% vers la prochaine capacite", pas de rappel visuel du chemin parcouru.

**+4 pts par victoire Arcade** = il faut 7 victoires pour aller de 14 a 40 (soit ~1.5 runs Arcade). C'est rapide — peut-etre trop rapide. En ~45 minutes de jeu, le Rookie est presque max. Il n'y a plus rien a faire apres.

**Solution** : Reduire a +2 pts par victoire Arcade (14 victoires = ~3 runs pour max), ajouter une barre de progression visible sur l'ecran de match, et debloquer les capacites a des moments plus espaces.

### Les capacites uniques sont-elles perceptibles ?

**L'Instinct (slow-mo 2s)** : Le joueur active un slow-mo pendant la visee. C'est subtil — le wobble est toujours la, on voit juste mieux. Utile ? Marginalement. Le joueur ne percoit pas un avantage clair. Ca devrait etre accompagne d'un effet visuel fort (aura, desaturation, son distinctif).

**Determination (-80% wobble apres mene perdue)** : Passif. Le joueur ne sait meme pas qu'il l'a. Aucun feedback visuel. **C'est la capacite la mieux concue mecaniquement** (comeback mechanic), mais elle est invisible.

**Le Naturel (wobble ~0)** : 1 charge. Tres puissant mais une seule utilisation par match. Ca sent le "je la garde pour le moment crucial" → le joueur la garde trop longtemps et ne l'utilise jamais.

**Capacites des adversaires** : Non perceptibles par le joueur. Quand Ley active "Carreau Instinct", le joueur ne voit pas de difference. Quand Reyes active "Le Mur", la boule est plus large visuellement mais le joueur ne comprend pas pourquoi.

### Le mode 1 Boule apporte-t-il quelque chose ?

**C'est un gadget.** 1 boule chacun, victoire a 11 points. Chaque mene = 1 tir par joueur, score 0 ou 1. C'est ultra-rapide (2-3 min) mais strategiquement vide — pas de "rejouer parce qu'on est plus loin", pas de tension sur les 3 boules, pas de choix tirer/pointer. Ca enleve tout ce qui fait la petanque.

**Paradoxe** : Le mode standard (3 boules, 13 points) est trop long pour un casual. Le mode 1 boule est trop court et trop vide. **Il manque un mode intermediaire** : 2 boules, 7 points, 4-5 minutes. C'est le sweet spot.

### L'economie (Galets) est-elle equilibree ?

| Scenario | Galets/heure | Temps pour 1ere boule (150G) | Temps pour Titane (800G) |
|----------|-------------|------------------------------|--------------------------|
| Casual (1 win/3 matchs, QP) | ~15-20 G/h | ~8h | ~45h |
| Moyen (1 win/2 matchs, Arcade) | ~40-60 G/h | ~3h | ~15h |
| Hardcore (win 80%, Arcade) | ~80-120 G/h | ~1.5h | ~8h |

Le casual met **8 heures** pour acheter sa premiere boule pas chere. C'est beaucoup trop. La Boule Titane a 800G est inaccessible pour la majorite. Le bonus run complete (100G) aide, mais seulement les joueurs qui battent les 5 rounds.

**Solution** : Diviser tous les prix par 2 OU doubler les gains, ajouter 10-15G par defaite, bonus 50G pour premier lancement quotidien.

### Quel personnage est OP ? Lequel est inutile ?

**OP : Reyes (8/8/7/9 = 32 pts total)** — Le "complet" est trop complet. Precision 8 + puissance 8 + sang-froid 9 + IA angleDev 2.5° + bonus 0.75x partout. Il est meilleur que Marcel dans tous les domaines sauf le nom. Son total de 32 est le plus eleve du roster. Sa capacite "Le Mur" (boule 2x rayon) est le meilleur bloqueur du jeu. **Il devrait avoir 28-29 pts max** (baisser precision a 7 ou sang-froid a 7).

**Inutile : La Choupe (5/10/3/6 = 24 pts total)** — Le "tireur bourrin" a 24 points, 7 de moins que Ley (31). Sa precision 5 le rend imprevisible, son effet 3 le rend incapable de retro correct, et son sang-froid 6 est moyen. Sa capacite "Coup de Canon" (+30% puissance, -20% precision) aggrave son defaut. Un joueur qui le debloque n'a aucune raison de le jouer — Ley est un tireur strictement superieur. **La Choupe devrait etre le perso le plus FUN, pas le plus faible.** Monter ses stats a 27-28 (precision 6, sang-froid 7) et rendre Coup de Canon visuellement spectaculaire.

**Sous-estime : Marcel (8/5/5/8 = 26 pts)** — Son IA est en realite plus precise que documentee (0.65x pointage dans le code vs 0.80x dans le CAHIER). En tant qu'adversaire, il est plus difficile que prevu. Mais en tant que perso jouable, sa capacite "Vieux Renard" (annule tremblement) est situationnelle — elle ne sert qu'a score 10-10+.

---

## PARTIE 3 — CE QUI MANQUE VRAIMENT

### Les 3 trucs qui feraient la plus grande difference

**1. Tutoriel interactif integre au premier match** (~4h de dev)
Pas une scene a part. Un overlay qui guide le joueur pendant ses 3 premiers lancers :
- Lancer 1 : "Glissez dans la direction souhaitee, puis relachez" (cochonnet)
- Lancer 2 : "Placez votre boule le plus pres possible de la boule jaune" (premiere boule, forcer roulette)
- Lancer 3 : "Bravo ! Continuez a jouer" (mode libre)
Les techniques avancees (plombee, tir, retro, focus) s'introduisent au round 2-3 de l'Arcade, pas au debut.

**2. Camera follow + zoom sur moments cles** (~3h de dev)
La decision de ne PAS avoir de camera est la pire decision du projet. Tous les jeux de sport a succes (Wii Sports, Golf With Friends, Pyre, Windjammers) ont des moments de camera dramatiques. Au minimum :
- Lerp camera pour suivre la boule en mouvement
- Zoom 1.5x quand la boule approche du cochonnet (slow-mo deja code)
- Mini-replay sur carreau (0.5s rewind + replay en slow-mo)

**3. Feedback visuel de progression persistant** (~2h de dev)
Barre XP Rookie en bas de l'ecran ArcadeScene. Compteur Galets visible sur TitleScene. Badge "NOUVEAU" sur les items debloques. Notification toast quand on approche d'un palier de capacite.

### Ce qu'un jeu concurrent fait bien que Petanque Master ne fait pas

| Jeu | Ce qu'il fait bien | Ce qui manque ici |
|-----|-------------------|-------------------|
| **Wii Sports Bowling** | Camera follow + slow-mo + reaction des Mii + replay | Pas de camera, reaction joueur invisible |
| **Golf With Friends** | Physics sandbox + chat + customisation visuelle absurde | Terrains trop "serieux", pas de folie visuelle |
| **Windjammers** | Arcade ultra-rapide + scoring spectaculaire + flashs | Matchs trop longs, pas assez de "spectacle" |
| **Hades** | Progression MEME en defaite + meta-progression | Rien en defaite |
| **Pyre** | Personnages avec arcs narratifs + le sport RACONTE une histoire | Barks sympas mais pas d'arc narratif |

### L'audio est-il suffisant ?

**Non.** 14 SFX + 2 musiques + ambiance terrain = le strict minimum. Le "clac" metallique est bon, mais il manque :
- **Layering sur le carreau** : 3 couches (impact + resonance + echo) au lieu d'une
- **Musique adaptative** : la musique devrait monter en intensite quand le score se rapproche (10-10+)
- **Sons d'ambiance manquants** : les fichiers sfx_vagues, sfx_oiseaux ne semblent pas tous exister (fallback = cigales ou silence)
- **Reaction foule insuffisante** : les applaudissements proceduraux (15 claps synthetiques) ne sont pas credibles. Il faut des vrais fichiers audio

### Le tutoriel enseigne-t-il vraiment a jouer ?

**Non.** TutorialScene est un diaporama de 5 pages avec du texte. C'est un manuel, pas un tutoriel. Personne ne lit un manuel avant de jouer a un jeu gratuit sur navigateur. Le taux de completion de ce tutoriel est probablement <5%.

**Ce qu'il faudrait** : un tutoriel "learn by doing" dans le premier match Arcade. Le jeu guide la main du joueur, il lance, il voit le resultat, il comprend. Pas de texte, que du visuel et de l'action.

### Feature simple (<2h) avec le plus d'impact

**Compensation de defaite** : donner 10 Galets + 1 pt XP Rookie par defaite. Ca change tout pour la retention du joueur casual. C'est 15 lignes de code dans ResultScene.js. Impact massif sur le "je ferme le jeu" → "je fais un match de plus".

---

## PARTIE 4 — LECONS APPRISES

### Meilleures decisions

1. **Physique custom au lieu de Matter.js** — Le moteur petanque est simple, performant, et parfaitement calibre pour le cas d'usage. ~380 lignes de Ball.js remplacent une lib de 200KB. Decision parfaite.

2. **Format fighting game** — Traiter la petanque comme un jeu de combat (roster, archetypes, stats, Arcade mode, VS screen) est une idee brillante. Ca transforme un sport niche en experience accessible et competitive.

3. **Pas de backend** — Tout en client-side pour le MVP. Pas de serveur a maintenir, pas de cout, deploiement sur GitHub Pages gratuit. Le online viendra quand il y aura des joueurs. Decision pragmatique.

4. **Donnees en JSON** — characters.json, terrains.json, boules.json, arcade.json, shop.json. Facile a modifier, facile a equilibrer, facile a etendre. Le code ne hardcode presque aucune donnee de contenu.

5. **SoundManager avec fallback procedural** — Si les fichiers audio manquent, le jeu genere du son procedurale (Web Audio API). Le jeu est TOUJOURS jouable. C'est elegant et resilient.

### Pires decisions

1. **Pas de camera follow** — Decision explicite documentee dans SPRINT_FINAL. C'est la plus grosse erreur du projet. Le "game feel" de la petanque = regarder la boule rouler vers sa cible. Sans camera, le joueur regarde un terrain fixe. C'est comme jouer au bowling sans que la camera suive la boule. **A reverter immediatement.**

2. **Tutoriel en scene separee** — TutorialScene devrait etre un overlay dans le premier match, pas un menu. C'est du contenu que 95% des joueurs ne verront jamais.

3. **Trop de documentation, pas assez de playtesting** — 54 fichiers de recherche, 4 documents de design, 0 session de playtesting documentee. Le projet a le syndrome "over-design, under-test". Chaque heure passee a ecrire de la recherche aurait du etre passee a faire jouer quelqu'un.

4. **Resolution 832x480** — Ni standard 16:9 (pour Poki/CrazyGames) ni standard 16:10. Choisi pour matcher 26x15 tiles de 32px, mais ca bloque la distribution sur les portails web les plus importants.

5. **SPRINT_FINAL non mis a jour** — Ce fichier est la "bible d'implementation" mais il contient les anciennes valeurs (Ecus, stats 3/3/2/2, seuils 18/26/34). Quiconque le lit sera trompe. Un document de reference obsolete est pire que pas de document.

### Ce que la structure research/ nous apprend

Le dossier research/ montre un developpeur **methodique et curieux** mais avec une tendance a **procrastiner par la recherche**. 54 fichiers de recherche pour un projet MVP, c'est disproportionne. Le pattern est : "avant de coder X, je fais une recherche exhaustive sur X". C'est une qualite en phase de conception, mais un piege en phase de livraison.

Le bon cote : chaque decision technique est documentee et justifiee. Le mauvais cote : l'analyse paralyse. Le jeu est "jouable" depuis des semaines mais n'est toujours pas publie.

### Si on recommencait de zero

1. **Commencer par le game feel** — Le premier commit devrait etre : une boule, un cochonnet, drag-and-release, camera follow, slow-mo, "clac". Pas de menu, pas de personnages, pas d'arcade. Juste le moment satisfaisant. Quand c'est fun en 10 secondes, on construit autour.

2. **Tutoriel interactif des le jour 1** — Pas de texte. "Glissez ici → relachez → bravo". En 3 interactions le joueur sait jouer.

3. **Publier en 2 semaines** — itch.io, version minimale, collecter des retours. Chaque semaine de dev sans feedback joueur est du risque.

4. **Moins de recherche, plus de playtesting** — 5 fichiers de recherche max. Faire jouer 10 personnes > lire 50 articles.

5. **Resolution 16:9 des le depart** — 854x480 ou 960x540. Compatible partout sans adaptation.

### Patterns de code solides et reutilisables

- **SoundManager avec fallback procedural** : pattern excellent pour tout jeu HTML5
- **SaveManager avec versioning et migration** : pattern professionnel
- **Separation Engine/Renderer/AI** : architecture propre et testable
- **Constants.js centralise** : facilite l'equilibrage
- **UIFactory** pour standardiser les elements UI : bon pattern DRY

### Patterns a eviter

- **window.__vsIntroCount** : etat global sur window = bug inevitable. Utiliser registry Phaser ou SaveManager
- **localStorage direct dans ResultScene** (clefs 'pm_star_ratings', 'pm_cumulative_stats', 'pm_cosmetic_unlocks') : contourne SaveManager, cree des donnees orphelines
- **Pas de init() dans TitleScene** : Phaser reutilise les scenes, les flags persistent. Toujours definir init() avec reset explicite
- **boules.json.physics avec des valeurs differentes de Constants.js** : source de verite ambigue = bugs garantis. Une seule source de verite, point.
- **54 fichiers de recherche sans index de pertinence** : devrait avoir un flag "OBSOLETE" ou "SUPERSEDED BY" sur les fichiers depasses

---

## PARTIE 5 — COMPLEMENT D'AUDIT TECHNIQUE (ajout post-analyse)

> **Source** : audit technique approfondi des scenes, du code, des tests et du build.
> Ces points n'etaient pas couverts dans l'analyse initiale.

### Bugs techniques critiques non mentionnes

#### 1. Memory leak : `_celebrateCarreau` wrap multiple (CRITIQUE)
**Location** : PetanqueScene.js (lignes 156-169)

A chaque creation de la scene, `this.engine._celebrateCarreau` est wrappee dans une nouvelle fonction sans restaurer l'originale au shutdown. Si le joueur enchaine 5 matchs, la fonction est wrappee 5 fois — chaque appel execute 5 callbacks en chaine. Ca degrade les performances et peut causer des comportements imprevisibles (flash blanc x5, son x5).

**Fix** : Sauvegarder l'original dans init(), restaurer dans shutdown.

#### 2. Event listeners non nettoyes dans ArcadeScene (CRITIQUE)
**Location** : ArcadeScene.js (lignes 166-168, 332-334, 487-488)

Les listeners clavier sont enregistres avec `this.input.keyboard.on()` mais jamais retires dans shutdown. Contrairement a ResultScene et LevelUpScene qui appellent `removeAllListeners()`, ArcadeScene ne le fait pas. En session longue (3+ runs Arcade), les listeners s'accumulent.

**Fix** : Ajouter `this.input.keyboard.removeAllListeners()` dans le handler shutdown.

#### 3. Tweens orphelins sur transition de scene (MOYEN)
**Location** : PetanqueScene.js (lignes 518-525), CharSelectScene.js (lignes 216-219)

Des tweens `repeat: -1` sont crees (pulse du curseur de selection, fleches joueur/adversaire). Le `tweens.killAll()` est appele dans shutdown — correct — mais si la transition se fait par camera fade avec callback, le callback peut fire apres le killAll, recreant un tween orphelin.

**Fix** : Verifier l'ordre shutdown → fade callback. Ajouter un flag `this._shuttingDown` pour bloquer les creations de tweens tardives.

#### 4. ESLint en echec : 3 erreurs bloquantes
**Location** :
- `PetanqueScene.js:295` — bloc catch vide (empty block statement)
- `ResultScene.js:171` — assignment inutile (`xpEarned` assigne mais jamais lu)
- `TitleScene.js:5` — import duplique de Constants.js

Ces 3 erreurs devraient bloquer le CI (`--max-warnings 0` dans deploy.yml utilise `continue-on-error`, donc ca passe en silence). Le pipeline donne un faux sentiment de securite.

**Fix** : Corriger les 3 erreurs, rendre ESLint bloquant dans le CI.

#### 5. Tests unitaires en echec : friction dalles (MOYEN)
**Location** : PetanqueAI.test.js (lignes 436, 444)

2 tests attendent `TERRAIN_FRICTION.dalles === 0.4` mais Constants.js definit `0.7`. C'est la meme contradiction Docks listee dans le tableau des incoherences, mais cote tests. Le CI passe quand meme (tests non-bloquants dans deploy.yml).

**Fix** : Mettre a jour les tests pour attendre 0.7, ou decider que 0.4 est la bonne valeur et corriger Constants.js.

### Problemes mobile non couverts

L'analyse initiale mentionne le haptic feedback (research/37) mais le probleme mobile est plus profond :

1. **Zone de drag trop petite** — Sur mobile 375px de large, la zone de visee (cercle de lancer → terrain) represente ~150px de drag. C'est insuffisant pour viser avec precision. Il faudrait un multiplicateur de sensibilite ou un mode "drag anywhere".

2. **Boutons loft non adaptes au touch** — 4 boutons (Roulette/Demi-Portee/Plombee/Tirer) en bas d'ecran 480px = zone tactile trop petite. Solution : swipe vertical pour changer de loft, ou menu radial.

3. **ScorePanel masque le terrain** — Sur petit ecran, le panneau de score en haut mange 15-20% de la surface visible. Il devrait etre retractable ou minimaliste sur mobile.

4. **Resolution 832x480 non standard** — Ni 16:9 (requis Poki/CrazyGames), ni 16:10. Sur iPhone (19.5:9), il y aura des bandes noires importantes. L'adaptation demande plus qu'un changement de resolution : il faut un responsive layout.

### Estimation de temps corrigee

L'analyse initiale estime 17h. Apres audit technique, les estimations realistes sont :

| Action | Estimation initiale | Estimation corrigee | Raison |
|--------|--------------------|--------------------|--------|
| Tutoriel interactif | 4h | **6-8h** | Integration avec le flow cochonnet→first ball→play loop, cas edge (skip, rate), detection "premier match" |
| Camera follow + zoom | 3h | **5-6h** | UI positionnee en absolu (ScorePanel, AimingSystem, loft buttons) → refactoring pour suivre la camera |
| Mode 2 boules / 7 pts | 1h | **2-3h** | Integration QuickPlay UI, Arcade JSON, tests, format selection |
| Visuel terrain tilesprite | 2h | **3-4h** | 5 terrains × texture + zones visuelles distinctes + tests |
| Fix bugs techniques (5 ci-dessus) | *non estime* | **3-4h** | Memory leaks, event listeners, ESLint, tests |
| **Total** | **~17h** | **~25-30h** | |

L'ordre de priorite reste le bon. Mais **les bugs techniques (partie 5) devraient etre fixes AVANT les features** — un jeu qui leak de la memoire apres 3 matchs ne retiendra personne, meme avec un tutoriel parfait.

---

## PLAN D'ACTION RECOMMANDE

| # | Action | Impact | Effort | Priorite |
|---|--------|--------|--------|----------|
| 0 | **Fix bugs techniques** (memory leaks, event listeners, ESLint, tests) | Stabilite en session longue, CI fiable | 3-4h | **BLOQUANT** |
| 1 | **Tutoriel interactif dans le premier match Arcade** | Retention x3 (le joueur comprend en 30s) | 6-8h | **CRITIQUE** |
| 2 | **Camera follow + zoom slow-mo** | Game feel x5 (le jeu devient spectaculaire) | 5-6h | **CRITIQUE** |
| 3 | **Compensation defaite** (10G + 1XP par defaite) | Retention casual x2 (on ne part jamais bredouille) | 30min | **CRITIQUE** |
| 4 | **Resoudre les contradictions doc/code** (tableau ci-dessus, choisir UNE source de verite) | Fiabilite developpement | 1h | **CRITIQUE** |
| 5 | **Reequilibrer La Choupe** (stats 27-28 pts, IA plus genereux en R1) et **nerf Reyes** (29 pts max) | Balance = fun pour tous les persos | 1h | **IMPORTANT** |
| 6 | **Diviser les prix shop par 2** OU doubler les gains + bonus quotidien 50G | Economie accessible aux casuals | 30min | **IMPORTANT** |
| 7 | **Ajouter mode "2 boules / 7 points"** comme format par defaut dans Arcade | Match 4-5 min = sweet spot casual | 2-3h | **IMPORTANT** |
| 8 | **Visuel terrain** : meme un simple tilesprite repete > un rectangle de couleur unie | Premiere impression visuelle | 3-4h | **IMPORTANT** |
| 9 | **Feedback progression visible** : barre XP + compteur Galets sur ecran Arcade + badges toast | Le joueur VOIT sa progression | 2h | **NICE-TO-HAVE** |
| 10 | **Adapter la resolution pour Poki** (836x470 ou 854x480 = 16:9) | Ouvre le plus gros portail web | 2h | **NICE-TO-HAVE** |

**Temps total estime corrige : ~25-30h pour transformer le jeu d'un prototype solide en un produit publiable.**
Les bugs techniques (action 0) doivent etre resolus AVANT les features — un jeu instable apres 3 matchs ne retiendra personne.

---

## VERDICT FINAL

Petanque Master a le meilleur moteur de petanque jamais code en JavaScript. L'architecture est propre, le concept est unique, le marche est vide. Mais le jeu n'est pas encore un produit — c'est un prototype bien documente.

Le probleme n'est pas technique, il est humain : **le joueur ne sait pas quoi faire, ne se sent pas recompense, et ne voit pas de spectacle.** Corrigez ces trois choses (tutoriel, compensation, camera) et vous avez un jeu publiable en quelques jours.

Mais avant les features, **stabilisez le code** : les memory leaks, les event listeners orphelins et le CI silencieusement casse sont des bombes a retardement. Un joueur qui enchaine 3 matchs Arcade et voit le jeu ramer ne reviendra pas.

Arretez de documenter. Arretez de rechercher. Faites jouer 10 personnes et regardez ou elles bloquent. C'est la seule recherche qui compte.

---

> *Ce document ne doit PAS etre pris comme une critique du travail accompli. Le moteur, l'architecture, et le concept sont remarquables. C'est justement parce que les fondations sont solides que le polish manquant est d'autant plus frustrant. Le jeu est a ~25-30h d'etre publiable.*
