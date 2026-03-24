# PHASE 5 — Prompts pour agents Sonnet 4.6

> Chaque prompt est auto-suffisant. Copier-coller tel quel.
> Respecter l'ordre des vagues : V1 toutes en parallele, V2 apres V1, etc.

---

# VAGUE 1 — Fondations (toutes en parallele)

---

## PROMPT A1 — Constantes visuelles Phase 5

```
Lis CLAUDE.md puis src/utils/Constants.js en entier.

TACHE : Ajouter les constantes visuelles de la Phase 5 a la fin de Constants.js.

Ajouter ce bloc APRES la derniere constante existante (DUST_MAX_SIMULTANEOUS_MOBILE) :

// === PHASE 5 — Arcade Vivante ===

// Momentum indicator (visible on AI sprite)
export const MOMENTUM_INDICATOR_FIRE_COLOR = 0xFF6644;
export const MOMENTUM_INDICATOR_TILT_COLOR = 0x6688CC;
export const MOMENTUM_INDICATOR_THRESHOLD = 0.3;
export const MOMENTUM_INDICATOR_ALPHA = 0.4;
export const MOMENTUM_INDICATOR_RADIUS = 24;

// Pressure indicator (10-10+)
export const PRESSURE_INDICATOR_COLOR = 0xC44B3F;
export const PRESSURE_WOBBLE_AMPLITUDE = 3;
export const PRESSURE_WOBBLE_SPEED = 200;

// AI Tell (flash bref avant tir IA)
export const AI_TELL_DURATION = 400;
export const AI_TELL_POINTER_COLOR = 0x87CEEB;
export const AI_TELL_SHOOTER_COLOR = 0xC44B3F;
export const AI_TELL_ALPHA = 0.6;

// Map progression (ArcadeScene)
export const MAP_NODE_RADIUS = 14;
export const MAP_NODE_SPACING_X = 140;
export const MAP_PATH_COLOR = 0xD4A574;
export const MAP_PATH_DASH = 6;
export const MAP_NODE_PULSE_DURATION = 800;
export const MAP_STAR_SIZE = 12;                          // px taille etoile (lisible a 832x480)
export const MAP_ZONE_TOP = 60;
export const MAP_ZONE_BOTTOM = 240;
export const MAP_PREVIEW_Y = 270;

// Defi de mene
export const CHALLENGE_BANNER_DURATION = 2500;
export const CHALLENGE_REWARD_GALETS = 10;
export const CHALLENGE_PROBABILITY = 0.6;

// Zone doree
export const GOLDEN_ZONE_RADIUS = 18;
export const GOLDEN_ZONE_COLOR = 0xFFD700;
export const GOLDEN_ZONE_ALPHA = 0.25;
export const GOLDEN_ZONE_REWARD = 5;

// Shop express
export const SHOP_EXPRESS_ITEMS = 2;
export const SHOP_EXPRESS_DISCOUNT = 0.2;

// Crowd intensity per arcade round (1-5)
export const CROWD_INTENSITY_BY_ROUND = [0.03, 0.04, 0.05, 0.07, 0.10];

// Shop express budget gate
export const SHOP_EXPRESS_MIN_GALETS = 40;
export const DEFEAT_CONSOLATION_GALETS = 15;
export const DEFEAT_RETRY_ENABLED = true;
export const COMMENTATOR_COOLDOWN = 3000;

TESTS : Creer tests/unit/constants-phase5.test.js qui importe toutes ces constantes et verifie qu'elles sont des nombres (ou array pour CROWD_INTENSITY_BY_ROUND avec 5 entries). Verifier aussi SHOP_EXPRESS_MIN_GALETS > 0, DEFEAT_CONSOLATION_GALETS > 0, COMMENTATOR_COOLDOWN > 0.

VALIDATION : npx vitest run passe. Aucune constante existante modifiee. npm run build OK.
```

---

## PROMPT A2 — Enrichissement arcade.json

```
Lis CLAUDE.md puis public/data/arcade.json en entier.

TACHE : Enrichir arcade.json avec 3 ajouts sans casser la structure existante.

1. AJOUTER "time_of_day" a chaque objet match :
   Round 1 : "time_of_day": "matin"
   Round 2 : "time_of_day": "fin_matinee"
   Round 3 : "time_of_day": "midi"
   Round 4 : "time_of_day": "apres_midi"
   Round 5 : "time_of_day": "coucher_soleil"

2. AJOUTER "post_narrative" et "post_narrative_en" dans les objets match round 1 et 2 :

Round 1 :
"post_narrative": [
  "La Choupe te tape dans le dos.",
  "'Pas mal gamin !' Le cafe du village t'offre un pastis."
],
"post_narrative_en": [
  "La Choupe slaps you on the back.",
  "'Not bad, kid!' The village cafe offers you a pastis."
]

Round 2 :
"post_narrative": [
  "Mamie Josette t'offre un biscuit.",
  "'Ton grand-pere cachait ses boules dans la meme boite.'",
  "Les voisins commencent a se rassembler."
],
"post_narrative_en": [
  "Mamie Josette offers you a cookie.",
  "'Your grandfather hid his boules in the same box.'",
  "The neighbors start gathering."
]

3. AJOUTER a la racine du JSON (au meme niveau que "matches", "milestones") :

"match_challenges": [
  { "id": "carreau_match", "name": "Carreau !", "name_en": "Carreau!", "description": "Reussis au moins un carreau dans ce match", "description_en": "Score at least one carreau in this match", "condition": "carreaux >= 1", "reward": 25 },
  { "id": "no_tir", "name": "Tout en finesse", "name_en": "All finesse", "description": "Gagne sans utiliser de tir", "description_en": "Win without using any shooting", "condition": "shots === 0 && won", "reward": 30 },
  { "id": "domination", "name": "Domination", "name_en": "Domination", "description": "Gagne 13-5 ou mieux", "description_en": "Win 13-5 or better", "condition": "won && opponentScore <= 5", "reward": 20 },
  { "id": "comeback_king", "name": "Roi du comeback", "name_en": "Comeback king", "description": "Gagne apres avoir ete mene de 5+ points", "description_en": "Win after being behind by 5+ points", "condition": "won && maxDeficit >= 5", "reward": 35 },
  { "id": "fanny_master", "name": "Fanny !", "name_en": "Fanny!", "description": "Inflige un 13-0", "description_en": "Win 13-0", "condition": "won && opponentScore === 0", "reward": 50 }
],

"mene_challenges": [
  { "id": "mc_carreau", "text": "Defi : Fais un carreau !", "text_en": "Challenge: Score a carreau!", "stat": "carreaux", "target": 1, "reward": 10 },
  { "id": "mc_3pts", "text": "Defi : Marque 3+ points !", "text_en": "Challenge: Score 3+ points!", "stat": "meneScore", "target": 3, "reward": 10 },
  { "id": "mc_roulette", "text": "Defi : Gagne en roulette uniquement", "text_en": "Challenge: Win using only roulette", "stat": "onlyRoulette", "target": 1, "reward": 15 },
  { "id": "mc_biberon", "text": "Defi : Fais un biberon !", "text_en": "Challenge: Score a biberon!", "stat": "biberons", "target": 1, "reward": 15 }
]

TESTS : Creer tests/unit/arcade-data-phase5.test.js :
- Charger le JSON (import ou readFileSync)
- Verifier chaque match a time_of_day (string non vide)
- Rounds 1 et 2 ont post_narrative (array, length > 0) et post_narrative_en
- match_challenges est array de 5 objets avec id, condition, reward
- mene_challenges est array de 4 objets avec id, stat, target, reward
- Tous les milestones existants (6) sont preserves
- Le JSON est valide

VALIDATION : npx vitest run passe. npm run dev demarre sans erreur.
```

---

## PROMPT A3 — Textes i18n Phase 5

```
Lis CLAUDE.md puis public/data/lang/fr.json et public/data/lang/en.json en entier.

TACHE : Ajouter un bloc "arcade" a la racine de chaque fichier JSON, au meme niveau que "boot", "title", "shop", etc.

FR (fr.json) — ajouter cet objet :
"arcade": {
  "title": "MODE ARCADE",
  "subtitle": "Le Tournoi de La Ciotat",
  "next_fight": "PROCHAIN COMBAT",
  "fight_btn": "COMBATTRE !",
  "round": "Match {n}/{total}",
  "difficulty": "Difficulte : {level}",
  "terrain_label": "Terrain : {name}",
  "stars_total": "{n}/15 etoiles",
  "stars_bonus": "15/15 : +{galets} Galets !",
  "complete": "ARCADE TERMINEE !",
  "perfect": "PARCOURS PARFAIT !",
  "wins_label": "Victoires : {wins}/{total}",
  "champion": "Le Terrain des Quatre est a toi !",
  "continue": "CONTINUER",
  "retry": "REESSAYER",
  "menu": "MENU PRINCIPAL",
  "controls": "Espace Combattre     Echap Menu",
  "time_matin": "Matin",
  "time_fin_matinee": "Fin de matinee",
  "time_midi": "Midi",
  "time_apres_midi": "Apres-midi",
  "time_coucher_soleil": "Coucher de soleil",
  "challenge_title": "DEFI !",
  "challenge_complete": "Defi reussi ! +{galets} Galets",
  "challenge_failed": "Defi echoue...",
  "mene_challenge": "Defi de mene",
  "match_challenge": "Defi du match",
  "milestone_unlocked": "Objectif atteint !",
  "momentum_fire": "EN FEU !",
  "momentum_tilt": "Deconcentre",
  "pressure_warning": "Pression !",
  "shop_express_title": "BOUTIQUE RAPIDE",
  "shop_express_subtitle": "Avant le prochain match...",
  "golden_zone_bonus": "+{galets} Galets (zone doree !)",
  "defeat_title": "DEFAITE",
  "defeat_earned": "Galets gagnes : {galets}",
  "defeat_retry": "REJOUER CE MATCH",
  "defeat_continue": "CONTINUER",
  "defeat_consolation": "+{galets} Galets de consolation"
}

EN (en.json) — ajouter cet objet :
"arcade": {
  "title": "ARCADE MODE",
  "subtitle": "The Tournament of La Ciotat",
  "next_fight": "NEXT FIGHT",
  "fight_btn": "FIGHT!",
  "round": "Match {n}/{total}",
  "difficulty": "Difficulty: {level}",
  "terrain_label": "Terrain: {name}",
  "stars_total": "{n}/15 stars",
  "stars_bonus": "15/15: +{galets} Pebbles!",
  "complete": "ARCADE COMPLETE!",
  "perfect": "PERFECT RUN!",
  "wins_label": "Victories: {wins}/{total}",
  "champion": "The Four Courts are yours!",
  "continue": "CONTINUE",
  "retry": "RETRY",
  "menu": "MAIN MENU",
  "controls": "Space Fight     Esc Menu",
  "time_matin": "Morning",
  "time_fin_matinee": "Late morning",
  "time_midi": "Noon",
  "time_apres_midi": "Afternoon",
  "time_coucher_soleil": "Sunset",
  "challenge_title": "CHALLENGE!",
  "challenge_complete": "Challenge complete! +{galets} Pebbles",
  "challenge_failed": "Challenge failed...",
  "mene_challenge": "Round challenge",
  "match_challenge": "Match challenge",
  "milestone_unlocked": "Milestone reached!",
  "momentum_fire": "ON FIRE!",
  "momentum_tilt": "Off balance",
  "pressure_warning": "Pressure!",
  "shop_express_title": "QUICK SHOP",
  "shop_express_subtitle": "Before the next match...",
  "golden_zone_bonus": "+{galets} Pebbles (golden zone!)",
  "defeat_title": "DEFEAT",
  "defeat_earned": "Pebbles earned: {galets}",
  "defeat_retry": "RETRY THIS MATCH",
  "defeat_continue": "CONTINUE",
  "defeat_consolation": "+{galets} consolation Pebbles"
}

IMPORTANT : Ne pas modifier les cles existantes. Ajouter le bloc "arcade" apres le dernier bloc existant. Verifier que les JSON sont valides (pas de virgule en trop).

TESTS : Creer tests/unit/i18n-phase5.test.js :
- Charger les deux JSON
- Verifier que toutes les cles arcade.* existent dans les deux langues
- Verifier que chaque cle FR a un equivalent EN

VALIDATION : Les JSON sont valides (JSON.parse ne lance pas d'erreur). npx vitest run passe.
```

---

## PROMPT A4 — Barks contextuels characters.json

```
Lis CLAUDE.md puis public/data/characters.json en entier.

TACHE : Ajouter 6 nouvelles categories de barks pour les 6 personnages suivants : rookie, la_choupe, mamie_josette, fazzino, suchaud, ley.

Pour chaque personnage, ajouter ces cles dans l'objet "barks" ET "barks_en" :
- "pressure_tied" (quand les deux scores >= 10)
- "fanny_imminent_winning" (quand le joueur mene 12-0)
- "fanny_imminent_losing" (quand le joueur est mene 0-12)
- "comeback_self" (quand on remonte de 5+ points)
- "opponent_comeback" (quand l'adversaire remonte)
- "dominant_lead" (quand on mene 8-0 ou plus)

Chaque categorie est un array de 2-3 phrases courtes (< 60 caracteres chacune).

CONTENU FR :

Rookie :
  pressure_tied: ["Allez, calme... C'est le moment.", "Focus total. Respire."]
  fanny_imminent_winning: ["13-0 ? C'est possible la ?!", "FANNY ! J'y crois pas !"]
  fanny_imminent_losing: ["... Je refuse de finir a zero.", "Non non non, pas ca."]
  comeback_self: ["Je reviens ! J'abandonne jamais !", "Regarde ca !"]
  opponent_comeback: ["Non ! Pas maintenant !", "Il remonte..."]
  dominant_lead: ["Ca rentre tout seul !", "J'suis pas si mauvais finalement !"]

La Choupe :
  pressure_tied: ["C'est maintenant que ca se joue, gamin !", "ALLEZ ! On lache rien !"]
  fanny_imminent_winning: ["HAHA ! 13-0 ! LA FANNY !", "A genoux devant La Choupe !"]
  fanny_imminent_losing: ["... Ca va aller.", "La prochaine, je me reveille."]
  comeback_self: ["La Choupe est de retour !", "J'etais juste en echauffement !"]
  opponent_comeback: ["He, calme-toi la !", "T'emballe pas gamin !"]
  dominant_lead: ["Tu vois ca ? C'est ca, la puissance !", "Ecrase !"]

Mamie Josette :
  pressure_tied: ["Oh la la... Ca me rappelle la finale de 73.", "Du calme, du calme..."]
  fanny_imminent_winning: ["Oh mon petit... Pas de honte.", "13-0... comme le bon vieux temps."]
  fanny_imminent_losing: ["Hmm... j'ai oublie mes lunettes.", "Ah la jeunesse..."]
  comeback_self: ["L'experience, mon petit.", "Je me suis souvenue comment on fait."]
  opponent_comeback: ["Tiens tiens... tu te reveilles.", "Attention, il revient."]
  dominant_lead: ["Les biscuits portent chance.", "Comme sur des roulettes."]

Fazzino :
  pressure_tied: ["Probabilite de victoire : 50%.", "Les variables convergent."]
  fanny_imminent_winning: ["Erreur systematique de ton cote.", "13-0. Statistiquement improbable."]
  fanny_imminent_losing: ["Revoir les hypotheses de base.", "Anomalie statistique."]
  comeback_self: ["Correction des parametres effectuee.", "L'algorithme s'adapte."]
  opponent_comeback: ["Deviation inattendue.", "Bruit dans les donnees."]
  dominant_lead: ["Les chiffres ne mentent pas.", "Tout est sous controle."]

Suchaud :
  pressure_tied: ["...", "Concentre-toi."]
  fanny_imminent_winning: ["...", "Pas de pitie."]
  fanny_imminent_losing: ["...", "..."]
  comeback_self: ["Je me reveille.", "La."]
  opponent_comeback: ["Hmm.", "..."]
  dominant_lead: ["Normal.", "Continue."]

Ley :
  pressure_tied: ["C'est la qu'on voit les vrais.", "Ton grand-pere aurait adore ca."]
  fanny_imminent_winning: ["Pas de quartier. C'est le tournoi.", "Auguste m'a appris ca."]
  fanny_imminent_losing: ["...Impressionnant, gamin.", "Tu m'as eu. Pour l'instant."]
  comeback_self: ["Ley ne meurt jamais.", "Le tireur se reveille."]
  opponent_comeback: ["Tu as du sang Bertolini.", "Pas mal, pas mal..."]
  dominant_lead: ["Tu rappelles ton grand-pere.", "Le Carreau d'Or te tend les bras."]

CONTENU EN : Traduire naturellement chaque phrase (pas de traduction litterale). Garder le ton du personnage. Suchaud reste quasi-muet en EN aussi.

IMPORTANT :
- NE PAS supprimer les barks existants. AJOUTER les nouvelles cles dans chaque objet barks/barks_en.
- Garder le JSON valide.
- Les 6 personnages ci-dessus sont dans le roster. Les trouver par leur id.

TESTS : Creer tests/unit/characters-barks-phase5.test.js :
- Charger characters.json
- Pour chaque perso arcade (rookie, la_choupe, mamie_josette, fazzino, suchaud, ley) :
  - Verifier que les 6 nouvelles cles existent dans barks et barks_en
  - Verifier que chaque cle est un array non-vide
  - Verifier que les barks existants (good_shot, carreau, etc.) sont toujours la

VALIDATION : JSON valide, npx vitest run passe, npm run dev demarre.
```

---

# VAGUE 2 — Features core (apres V1)

---

## PROMPT B1 — Momentum IA visible

```
Lis CLAUDE.md, puis lis ces fichiers en entier :
- src/utils/Constants.js (chercher MOMENTUM_INDICATOR_*)
- src/petanque/PetanqueAI.js (propriete _momentum, methode updateMomentum)
- src/scenes/PetanqueScene.js (en entier — c'est gros, lis-le en 3 parties)
- src/utils/I18n.js (methode t())

TACHE : Afficher un feedback visuel (halo colore + texte) sur le sprite adversaire quand son momentum IA depasse le seuil.

MODIFICATIONS dans src/scenes/PetanqueScene.js uniquement :

1. Dans init(), ajouter :
   this._momentumGlow = null;
   this._momentumLabel = null;
   this._momentumShakeTween = null;

2. Ajouter une methode _updateMomentumIndicator() :
   - Si |this.ai._momentum| < MOMENTUM_INDICATOR_THRESHOLD (0.3) : detruire glow/label et return
   - Sinon :
     - isFire = momentum > 0
     - color = isFire ? MOMENTUM_INDICATOR_FIRE_COLOR (0xFF6644) : MOMENTUM_INDICATOR_TILT_COLOR (0x6688CC)
     - intensity = clamp((|momentum| - 0.3) / 0.7, 0, 1)
     - Dessiner un cercle rempli (fillCircle) sur this.opponentSprite position, rayon MOMENTUM_INDICATOR_RADIUS + intensity*8, alpha MOMENTUM_INDICATOR_ALPHA * intensity, depth 45
     - Afficher un texte I18n.t('arcade.momentum_fire') ou I18n.t('arcade.momentum_tilt'), font 8px monospace, couleur #FF6644 ou #6688CC, position au-dessus du sprite (-28px), depth 46
     - Si fire et intensity > 0.5 : ajouter un micro-tremblement du sprite (tween x +-1px, 80ms, yoyo repeat -1)
     - Si pas fire ou intensity <= 0.5 : detruire le tremblement tween

3. Appeler _updateMomentumIndicator() :
   - Dans le hook engine.onScore (il y en a deux chaines, ajouter dans le dernier)
   - Dans _animateReaction() (apres le trigger bark)

4. THROTTLE : Stocker this._lastMomentumValue = null dans init(). Dans _updateMomentumIndicator(), comparer Math.round(m*10) a this._lastMomentumValue. Si identique, ne rien redessiner. Sinon, mettre a jour et redessiner. Cela evite de recreer un fillCircle a chaque frame.

5. Dans _shutdown(), detruire _momentumGlow, _momentumLabel, et _momentumShakeTween.

IMPORTANT : Ne pas casser les hooks onScore existants (il y a une chaine de hooks).
IMPORTANT : Verifier que this.ai existe avant d'acceder a _momentum (pas d'AI en local multiplayer).

TESTS : Creer tests/unit/momentum-indicator.test.js — tester la logique de seuil et de couleur.

VALIDATION : En jeu arcade, apres 2-3 bons coups de l'IA, un halo orange apparait. Apres des mauvais coups, halo bleu. Sous le seuil, rien ne s'affiche. 60 FPS maintenu.
```

---

## PROMPT B2 — Indicateur de pression

```
Lis CLAUDE.md, puis lis :
- src/utils/Constants.js (chercher PRESSURE_*)
- src/scenes/PetanqueScene.js (hooks onScore, _shutdown)
- src/utils/I18n.js (methode t())

TACHE : Afficher un badge "Pression !" avec tremblement quand les deux scores >= 10.

MODIFICATIONS dans src/scenes/PetanqueScene.js uniquement :

1. Dans init(), ajouter :
   this._pressureActive = false;
   this._pressureBadge = null;
   this._pressureText = null;

2. Ajouter methode _showPressureIndicator() :
   - Si this._pressureActive est true, return (idempotent)
   - Mettre this._pressureActive = true
   - Creer un badge en haut-centre (GAME_WIDTH/2, y=18) :
     - graphics depth 92 : fillRoundedRect, fond PRESSURE_INDICATOR_COLOR (0xC44B3F) alpha 0.85, 100x18px, rayon 4
     - texte depth 93 : I18n.t('arcade.pressure_warning'), font 10px monospace, couleur #FFD700, ombre standard
   - Ajouter un tween de tremblement sur les deux : x += PRESSURE_WOBBLE_AMPLITUDE (3px), duration PRESSURE_WOBBLE_SPEED (200ms), yoyo true, repeat -1
   - Flash camera bref : this.cameras.main.flash(100, 196, 75, 63)

3. Dans le hook engine.onScore existant (le deuxieme, celui du commentateur vers ligne 211), ajouter apres les checks existants :
   if (scores.player >= 10 && scores.opponent >= 10) {
       this._showPressureIndicator();
   }

4. Dans _shutdown(), detruire _pressureBadge et _pressureText.

TESTS : Creer tests/unit/pressure-indicator.test.js — tester l'idempotence (appeler 2 fois ne cree qu'un badge).

VALIDATION : A 10-10, le badge "Pression !" apparait en haut avec tremblement. Ne se cree qu'une fois. Pas de crash si le match n'atteint jamais 10-10.
```

---

## PROMPT C1 — Carte de progression visuelle

```
Lis CLAUDE.md, puis lis en entier :
- src/scenes/ArcadeScene.js (TOUT le fichier)
- src/utils/Constants.js (MAP_*, COLORS, GAME_WIDTH, GAME_HEIGHT, CHAR_SCALE_ARCADE)
- public/data/arcade.json (matches, time_of_day)
- src/ui/UIFactory.js (methodes statiques disponibles)
- src/utils/I18n.js (methodes t, field)

TACHE : Remplacer _showProgressScreen() dans ArcadeScene.js par une map provencale visuelle.

MODIFICATIONS dans src/scenes/ArcadeScene.js uniquement :

Remplacer ENTIEREMENT le contenu de _showProgressScreen(). La methode _buildProgressScreen() qui appelle _showProgressScreen() reste inchangee.

LAYOUT (832x480) :

ZONE MAP (y: 0-250) :
- Fond : graphics.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xF5E6D0, 0xF5E6D0, 1) sur GAME_WIDTH x 250
- Titre : "MODE ARCADE" (x:16, y:20), font 16px monospace, couleur #FFD700, ombre lourde
- Sous-titre : I18n.t('arcade.subtitle') (x:16, y:40), font 11px, #D4A574
- Moment de la journee : lire nextMatch.time_of_day, afficher I18n.t('arcade.time_' + time_of_day) en haut a droite (x:GAME_WIDTH-16, y:20, origin 1,0.5), font 11px, #9E9E8E

5 noeuds en arc, positions fixes :
  const NODE_POSITIONS = [
    { x: 130, y: 130 },  // Village
    { x: 270, y: 100 },  // Parc
    { x: 416, y: 90 },   // Colline
    { x: 560, y: 110 },  // Docks
    { x: 700, y: 140 }   // Plage
  ];

Chemin pointille entre noeuds :
  Pour chaque paire de noeuds consecutifs, dessiner des tirets de 6px espaces de 4px, lineStyle 2px, couleur MAP_PATH_COLOR (0xD4A574), alpha 0.6.
  Utiliser une boucle qui calcule les points intermediaires et dessine des petits segments.

Noeuds :
  Pour chaque noeud i (0-4) :
  - match = this.arcadeData.matches[i]
  - result = this.matchResults.find(r => r.round === i + 1)
  - isCurrent = (i + 1 === this.currentRound)

  Si result && result.won :
    fillCircle vert #44CC44, rayon MAP_NODE_RADIUS(14), bordure #FFD700 1px
    Texte checkmark unicode \u2713 blanc au centre, font 14px
  Si isCurrent :
    fillCircle dore #FFD700, rayon 14, pulse alpha 0.5-1.0 (tween, 800ms, yoyo, repeat -1)
  Sinon (futur) :
    fillCircle #5A4A38 alpha 0.5, rayon 12

  Sous chaque noeud (+26px) : nom du terrain via _getTerrainById, font 9px, #D4A574
  Sous le noeud courant (+42px aussi) : nom adversaire, font 9px, #F5E6D0

ZONE PREVIEW (y: MAP_PREVIEW_Y soit 270 et plus) :
  Reprendre EXACTEMENT le code du panel "PROCHAIN COMBAT" existant (de l'ancienne _showProgressScreen), mais :
  - Le positionner a panelY = MAP_PREVIEW_Y
  - Garder le sprite adversaire, nom, titre, catchphrase, barres stats
  - Garder le terrain + difficulte
  - Garder le bouton COMBATTRE avec pulse
  - Garder les keyboard handlers (SPACE, ENTER, ESC)
  - Garder le hint controls en bas

IMPORTANT : _launchNextMatch() ne change PAS. _processRoundUnlocks() ne change PAS. _showNarrative() ne change PAS. _showArcadeComplete() ne change PAS. Seul _showProgressScreen() est reecrit.

TESTS : Creer tests/unit/arcade-map.test.js — tester que NODE_POSITIONS sont dans les limites 0-832 et 0-250.

VALIDATION : La map s'affiche avec fond bleu-creme, 5 noeuds, chemin pointille. Les noeuds gagnes sont verts, le courant pulse en or. Le panel preview en bas fonctionne. COMBATTRE lance le match. ESC retourne au menu. 60 FPS.
```

---

## PROMPT D1 — Systeme de defis de mene

```
Lis CLAUDE.md, puis lis en entier :
- src/petanque/PetanqueEngine.js (startMene, _scoreRound, matchStats, constructeur)
- src/scenes/PetanqueScene.js (create, hooks onScore, _shutdown)
- src/petanque/Commentator.js (methode say)
- src/utils/Constants.js (CHALLENGE_*)
- public/data/arcade.json (mene_challenges)
- src/utils/SaveManager.js (addGalets)

TACHE : Implementer un systeme de defis optionnels par mene en arcade.

MODIFICATIONS :

Fichier 1 — src/petanque/PetanqueEngine.js :
1. Dans le constructeur, ajouter : this.onMeneStart = null;
2. Dans startMene(), au tout debut (avant setState COCHONNET_THROW ou equivalent), ajouter :
   if (this.onMeneStart) { try { this.onMeneStart(this.mene); } catch(e) {} }

   Aussi dans _throwBall() ou la methode qui execute le lancer, ajouter :
   if (shotType !== 'roulette') this.matchStats._usedNonRoulette = true;
   (Initialiser _usedNonRoulette a false dans startMene())

Fichier 2 — src/scenes/PetanqueScene.js :

1. Dans init(), ajouter :
   this._currentChallenge = null;
   this._challengeCompleted = false;
   this._challengeBanner = null;
   this._challengePool = null;

2. Dans create(), apres la creation du commentateur, ajouter :
   // Defi de mene (arcade only)
   if (this.arcadeState) {
       const arcadeData = this.cache.json.get('arcade');
       this._challengePool = arcadeData?.mene_challenges || [];
   }

3. Ajouter le hook onMeneStart dans create() (apres engine.startGame()) :
   this.engine.onMeneStart = (meneNumber) => {
       if (!this.arcadeState || !this._challengePool?.length) return;
       if (meneNumber <= 1) return;
       if (Math.random() > CHALLENGE_PROBABILITY) return;
       const challenge = this._challengePool[Math.floor(Math.random() * this._challengePool.length)];
       this._currentChallenge = challenge;
       this._challengeCompleted = false;
       this._showChallengeBanner(I18n.field(challenge, 'text'));
   };

4. Ajouter _showChallengeBanner(text) :
   - Container depth 95, position (GAME_WIDTH/2, 55), alpha 0
   - Fond : graphics fillRoundedRect(-160, -14, 320, 28, 6), couleur 0x3A2E28 alpha 0.9, bordure #FFD700 1px alpha 0.5
   - Texte : font 11px monospace, couleur #FFD700, ombre standard
   - Tween : fade in 300ms, hold CHALLENGE_BANNER_DURATION (2500ms), fade out 400ms
   - this._commentator?.say('defi', true);

5. Ajouter la verification dans le hook onScore EXISTANT (chainer avec le hook existant, ne pas l'ecraser) :
   Apres les checks existants, ajouter :
   if (this._currentChallenge && !this._challengeCompleted) {
       const c = this._currentChallenge;
       const ms = this.engine.matchStats;
       let completed = false;
       if (c.stat === 'carreaux' && (ms.carreaux || 0) >= c.target) completed = true;
       if (c.stat === 'meneScore' && winner === 'player' && points >= c.target) completed = true;
       if (c.stat === 'biberons' && (ms.biberons || 0) >= c.target) completed = true;
       if (c.stat === 'onlyRoulette' && winner === 'player' && !ms._usedNonRoulette) completed = true;
       if (completed) {
           this._challengeCompleted = true;
           addGalets(c.reward || CHALLENGE_REWARD_GALETS);
           this._showChallengeResult(true, c.reward || CHALLENGE_REWARD_GALETS);
       }
   }

6. Ajouter _showChallengeResult(success, galets) :
   - Texte dore "+{galets} Galets (Defi!)" ou "Defi echoue", font 12px, couleur #FFD700 ou #C44B3F
   - Position : GAME_WIDTH/2, 75, depth 96
   - Tween : apparition 300ms, disparition apres 2000ms

7. Dans _shutdown(), detruire _challengeBanner.

TESTS : Creer tests/unit/mene-challenge.test.js :
- Tester que le callback onMeneStart est appele par PetanqueEngine
- Tester la logique de verification : carreaux >= 1 + stat carreaux = 1 → completed = true
- Tester que mene 1 ne declenche jamais de defi

VALIDATION : En arcade, un banner dore "Defi : Fais un carreau !" apparait ~60% du temps a partir de la mene 2. Si on reussit un carreau, "+10 Galets" s'affiche. Pas de defi en QuickPlay.
```

---

## PROMPT E1 — Micro-narratives + barks reactifs

```
Lis CLAUDE.md, puis lis en entier :
- src/scenes/ArcadeScene.js (create, _showNarrative, _buildProgressScreen)
- src/scenes/PetanqueScene.js (chercher _triggerScoreBark, _showBark, _animateReaction)
- public/data/arcade.json (post_narrative dans rounds 1 et 2)
- public/data/characters.json (nouvelles barks : pressure_tied, fanny_imminent_*, comeback_*, dominant_lead)

TACHE : 1) Afficher les micro-narratives apres R1 et R2. 2) Enrichir les barks reactifs au score.

MODIFICATIONS :

Fichier 1 — src/scenes/ArcadeScene.js :

Dans create(), APRES le bloc qui traite lastMatchResult (lignes ~81-99), et AVANT le check "if (!this.arcadeData.matches)" :

Ajouter ce bloc (attention a ne pas interferer avec le mid_narrative_after_3 existant) :

// Post-narrative after rounds that have one (rounds 1, 2)
if (this.lastMatchResult?.won) {
    const completedRound = this.currentRound - 1;
    const prevMatch = this.arcadeData.matches[completedRound - 1];
    if (prevMatch?.post_narrative) {
        const lines = I18n.fieldArray(prevMatch, 'post_narrative') || prevMatch.post_narrative;
        this._showNarrative(lines, () => {
            this._buildProgressScreen();
        });
        return;
    }
}

ATTENTION : Ce bloc doit etre AVANT le check "if (this.wins >= totalMatches)" et AVANT le mid_narrative_after_3 check. Mais APRES le traitement de lastMatchResult (qui incremente wins etc.). Placer juste avant la ligne "const totalMatches = this.arcadeData.matches.length;".

Fichier 2 — src/scenes/PetanqueScene.js :

REMPLACER _triggerScoreBark(scores, winner, points) par cette version enrichie :

_triggerScoreBark(scores, winner, points) {
    if (Math.random() > 0.6) return;
    const loser = winner === 'player' ? 'opponent' : 'player';
    const diff = Math.abs(scores[winner] - scores[loser]);
    const maxScore = Math.max(scores.player, scores.opponent);
    const minScore = Math.min(scores.player, scores.opponent);

    // Pression (10-10+)
    if (scores.player >= 10 && scores.opponent >= 10) {
        this._showBark(winner, 'pressure_tied');
        return;
    }
    // Fanny imminente (12-0)
    if (maxScore >= 12 && minScore === 0) {
        const lead = scores.player > scores.opponent ? 'player' : 'opponent';
        this._showBark(lead, 'fanny_imminent_winning');
        this.time.delayedCall(1200, () => {
            this._showBark(lead === 'player' ? 'opponent' : 'player', 'fanny_imminent_losing');
        });
        return;
    }
    // Domination (8-0+)
    if (diff >= 8 && minScore <= 2) {
        const lead = scores.player > scores.opponent ? 'player' : 'opponent';
        this._showBark(lead, 'dominant_lead');
        return;
    }
    // Comeback (5+ pts remontes)
    if (winner === 'player' && scores.player > scores.opponent && diff >= 5) {
        this._showBark('player', 'comeback_self');
        return;
    }
    if (winner === 'opponent' && scores.opponent > scores.player && diff >= 5) {
        this._showBark('opponent', 'comeback_self');
        this.time.delayedCall(1000, () => this._showBark('player', 'opponent_comeback'));
        return;
    }
    // Fallback existants
    if (scores.player >= 11 || scores.opponent >= 11) {
        this._showBark(winner, 'match_point');
    } else if (diff >= 6) {
        this._showBark(winner, 'taking_lead');
    }
}

IMPORTANT : _showBark() fait deja un fallback silencieux si la cle bark n'existe pas dans characters.json (il check charData?.barks?.[barkType]). Donc les nouvelles categories fonctionnent si elles existent, et sont ignorees sinon. Pas besoin de verification supplementaire.

TESTS : Creer tests/unit/barks-reactive.test.js :
- Tester la logique de selection : scores 10-10 → pressure_tied, scores 12-0 → fanny_imminent_winning

VALIDATION : Apres R1 victoire, la micro-narrative "La Choupe te tape dans le dos..." s'affiche. Apres R2 victoire, "Mamie Josette t'offre un biscuit...". En match, les barks reagissent (pression, fanny, comeback). Les barks existants (good_shot, carreau) continuent.
```

---

## PROMPT D3 — Soupape de defaite

```
Lis CLAUDE.md, puis lis :
- src/scenes/ArcadeScene.js (create, traitement de lastMatchResult, _buildProgressScreen)
- src/utils/SaveManager.js (addGalets, loadSave)
- src/utils/Constants.js (DEFEAT_CONSOLATION_GALETS, DEFEAT_RETRY_ENABLED, GAME_WIDTH, GAME_HEIGHT)
- src/utils/I18n.js (methodes t, field)

TACHE : Apres une defaite en arcade, afficher un ecran de consolation avec Galets gagnes et option de retry.

MODIFICATION dans src/scenes/ArcadeScene.js uniquement :

1. Dans create(), APRES le traitement de lastMatchResult (increment wins/losses), AVANT la build de la map, ajouter :
   if (this.lastMatchResult && !this.lastMatchResult.won) {
       this._showDefeatScreen(this.lastMatchResult);
       return;
   }

2. Ajouter methode _showDefeatScreen(result) :
   - Fond : plein ecran 0x1A1510 alpha 0.9, depth 50
   - Titre : I18n.t('arcade.defeat_title'), font 28px, couleur #C44B3F, centre y=80, depth 51
   - Si result.galetsEarned > 0 : afficher I18n.t('arcade.defeat_earned', { galets: result.galetsEarned }), font 14px, #FFD700, y=130
   - Consolation : addGalets(DEFEAT_CONSOLATION_GALETS), afficher I18n.t('arcade.defeat_consolation', { galets: DEFEAT_CONSOLATION_GALETS }), font 12px, #D4A574, y=165
   - Nom adversaire qui a gagne (lire depuis arcadeData.matches), font 16px, #F5E6D0, y=210

   - Bouton REJOUER (si DEFEAT_RETRY_ENABLED) :
     I18n.t('arcade.defeat_retry'), font 18px, fond #C44B3F, padding 16x8, y=280, depth 52, interactive
     Au clic : annuler la defaite (this.losses--, retirer le matchResult de defaite), cleanup overlay, appeler _buildProgressScreen()
     Keyboard : SPACE

   - Bouton CONTINUER :
     I18n.t('arcade.defeat_continue'), font 14px, #9E9E8E, fond #3A2E28, y=340, depth 52, interactive
     Au clic : cleanup overlay, appeler _buildProgressScreen()
     Keyboard : ESC

3. Pour tracker galetsEarned : dans PetanqueScene.js, ajouter this._matchGaletsEarned = 0 dans init(). Chaque fois que addGalets() est appele pendant le match, incrementer aussi this._matchGaletsEarned. Passer galetsEarned dans le resultData vers ArcadeScene.

TESTS : Creer tests/unit/defeat-screen.test.js :
- Tester que DEFEAT_CONSOLATION_GALETS est bien ajoute
- Tester que le retry remet le bon round

VALIDATION : Apres defaite, ecran "DEFAITE" avec Galets gagnes, +15 consolation, boutons REJOUER et CONTINUER. REJOUER relance le meme match. CONTINUER avance. En QuickPlay, rien ne change.
```

---

# VAGUE 3 — Features avancees (apres V2)

---

## PROMPT B3 — Tells IA avant tir

```
Lis CLAUDE.md, puis lis :
- src/petanque/PetanqueAI.js (methode _showAimingArrow, _throwBall)
- src/utils/Constants.js (AI_TELL_*)

TACHE : Ajouter un flash colore bref sur le sprite adversaire avant chaque lancer IA.

MODIFICATION dans src/petanque/PetanqueAI.js uniquement :

Dans _showAimingArrow(angle, power, color, callback), AVANT le delayedCall du callback, ajouter :

// Visual tell: brief color flash on opponent sprite
const opSprite = this.scene.opponentSprite;
if (opSprite) {
    const isTir = color === 0xFF6644; // arrowColor rouge = tir
    const tellColor = isTir ? AI_TELL_SHOOTER_COLOR : AI_TELL_POINTER_COLOR;
    const tellGfx = this.scene.add.graphics().setDepth(46);
    tellGfx.fillStyle(tellColor, AI_TELL_ALPHA);
    tellGfx.fillCircle(opSprite.x, opSprite.y, 18);
    this.scene.tweens.add({
        targets: tellGfx, alpha: 0, duration: AI_TELL_DURATION,
        ease: 'Sine.easeOut',
        onComplete: () => tellGfx.destroy()
    });
}

Importer les constantes en haut du fichier :
import { ..., AI_TELL_DURATION, AI_TELL_POINTER_COLOR, AI_TELL_SHOOTER_COLOR, AI_TELL_ALPHA } from '../utils/Constants.js';

TESTS : Creer tests/unit/ai-tell.test.js — tester que la couleur est bien SHOOTER pour arrowColor rouge et POINTER sinon.

VALIDATION : Avant chaque lancer IA, un flash bleu (pointer) ou rouge (tirer) apparait 400ms sur le sprite. Le flash se detruit proprement. Pas de leak.
```

---

## PROMPT C2 — Etoiles sur la map

```
Lis CLAUDE.md, puis lis :
- src/scenes/ArcadeScene.js (la methode _showProgressScreen actuelle — la version MAP de C1)
- src/utils/SaveManager.js (loadSave — structure save.starRatings)
- src/scenes/ResultScene.js (chercher _saveStarRating pour comprendre le format)
- src/utils/Constants.js (MAP_STAR_SIZE)

TACHE : Afficher les star ratings sous chaque noeud gagne de la map arcade + total en haut a droite.

MODIFICATION dans src/scenes/ArcadeScene.js uniquement :

1. Dans _showProgressScreen(), dans la boucle des noeuds, APRES avoir dessine un noeud gagne (apres le checkmark) :

const save = loadSave();
const oppId = match.opponent;
const stars = save.starRatings?.[oppId] || 0;
if (stars > 0) {
    const starY = NODE_POSITIONS[i].y + MAP_NODE_RADIUS + 16;
    for (let s = 0; s < 3; s++) {
        const sx = NODE_POSITIONS[i].x - 12 + s * 12;
        const filled = s < stars;
        this.add.text(sx, starY, '\u2605', {
            fontFamily: 'monospace', fontSize: `${MAP_STAR_SIZE}px`,
            color: filled ? '#FFD700' : '#5A4A38'
        }).setOrigin(0.5);
    }
}

2. Apres la boucle des noeuds, afficher le total :

const totalStars = Object.values(save.starRatings || {}).reduce((s, v) => s + v, 0);
this.add.text(GAME_WIDTH - 16, 55, I18n.t('arcade.stars_total', { n: totalStars }), {
    fontFamily: 'monospace', fontSize: '11px', color: '#FFD700',
    shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
}).setOrigin(1, 0.5);
if (totalStars >= 15) {
    this.add.text(GAME_WIDTH - 16, 68, I18n.t('arcade.stars_bonus', { galets: 100 }), {
        fontFamily: 'monospace', fontSize: '9px', color: '#44CC44'
    }).setOrigin(1, 0.5);
}

S'assurer que loadSave est importe (il l'est deja dans ArcadeScene).
S'assurer que MAP_STAR_SIZE est importe depuis Constants.js.

TESTS : Creer tests/unit/arcade-stars.test.js — mocker loadSave avec starRatings partiels, verifier le total.

VALIDATION : Chaque noeud gagne montre 1-3 etoiles dorees. Le total "X/15 etoiles" en haut a droite. Si 15/15, message vert bonus.
```

---

## PROMPT D2 — Defis de match

```
Lis CLAUDE.md, puis lis :
- public/data/arcade.json (match_challenges)
- src/scenes/PetanqueScene.js (init, create, les hooks, la transition vers ResultScene — chercher 'ResultScene')
- src/scenes/ResultScene.js (init, create, matchStats disponibles)
- src/utils/SaveManager.js (addGalets)
- src/utils/I18n.js (methode field)

TACHE : Au lancement d'un match arcade, attribuer un defi de match optionnel. Verifier a la fin dans ResultScene.

MODIFICATIONS :

Fichier 1 — src/scenes/PetanqueScene.js :

1. Dans init(), ajouter : this._matchChallenge = null;

2. Dans create(), apres le badge "Match X/Y" arcade (chercher arcadeRound), ajouter :
   if (this.arcadeState) {
       const arcadeData = this.cache.json.get('arcade');
       const challenges = arcadeData?.match_challenges || [];
       if (challenges.length > 0) {
           this._matchChallenge = challenges[Math.floor(Math.random() * challenges.length)];
           const cText = I18n.field(this._matchChallenge, 'name');
           this.time.delayedCall(3000, () => {
               const badge = this.add.text(4, 56, 'Defi: ' + cText, {
                   fontFamily: 'monospace', fontSize: '8px', color: '#FFD700',
                   backgroundColor: '#3A2E28', padding: { x: 4, y: 2 }
               }).setDepth(92).setAlpha(0);
               this.tweens.add({ targets: badge, alpha: 0.8, duration: 500 });
               this.time.delayedCall(5000, () => {
                   if (badge.active) this.tweens.add({ targets: badge, alpha: 0, duration: 500 });
               });
           });
       }
   }

3. Dans le hook onScore, tracker le deficit max :
   Ajouter dans le hook onScore existant (chaine) :
   if (!this.engine.matchStats._maxDeficit) this.engine.matchStats._maxDeficit = 0;
   const deficit = scores.opponent - scores.player;
   if (deficit > this.engine.matchStats._maxDeficit) this.engine.matchStats._maxDeficit = deficit;

4. Dans la methode qui transite vers ResultScene (chercher scene.start('ResultScene') ou le resultData), ajouter au resultData :
   matchChallenge: this._matchChallenge || null

Fichier 2 — src/scenes/ResultScene.js :

1. Dans init(), ajouter : this.matchChallenge = data.matchChallenge || null;

2. Dans create(), APRES l'affichage du panel stats et APRES le block "GALETS EARNED", ajouter :
   if (this.matchChallenge && this.won) {
       const c = this.matchChallenge;
       const ms = this.matchStats;
       let completed = false;
       if (c.condition === 'carreaux >= 1' && (ms.carreaux || 0) >= 1) completed = true;
       if (c.condition === 'shots === 0 && won' && (ms.shots || 0) === 0) completed = true;
       if (c.condition === 'won && opponentScore <= 5' && this.scores.opponent <= 5) completed = true;
       if (c.condition === 'won && maxDeficit >= 5' && (ms._maxDeficit || 0) >= 5) completed = true;
       if (c.condition === 'won && opponentScore === 0' && this.scores.opponent === 0) completed = true;
       if (completed) {
           addGalets(c.reward);
           const ctxt = this.add.text(GAME_WIDTH / 2, 395,
               I18n.t('arcade.challenge_complete', { galets: c.reward }), {
                   fontFamily: 'monospace', fontSize: '14px', color: '#FFD700',
                   shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
               }).setOrigin(0.5).setAlpha(0);
           this.tweens.add({ targets: ctxt, alpha: 1, duration: 500, delay: 1500 });
       }
   }

TESTS : Creer tests/unit/match-challenge.test.js — tester les 5 conditions d'evaluation.

VALIDATION : En arcade, un petit badge "Defi: Carreau!" apparait brievement en debut de match. Si reussi, "+25 Galets" dans l'ecran de resultat.
```

---

## PROMPT E2 — Commentateur enrichi

```
Lis CLAUDE.md, puis lis :
- src/petanque/Commentator.js (en entier)
- public/data/commentator.json (en entier)
- src/scenes/PetanqueScene.js (chercher _commentator, onShotResult, onMeneStart)

TACHE : Ajouter des categories de commentaires terrain + adversaire + mene dans commentator.json, et les declencher dans PetanqueScene.

MODIFICATIONS :

Fichier 1 — public/data/commentator.json :

Ajouter ces categories (au meme niveau que les existantes) :

"defi": ["Un defi est lance !", "Objectif bonus en vue !", "Defi accepte ?"],
"defi_en": ["A challenge appears!", "Bonus objective ahead!", "Challenge accepted?"],
"terrain_sable": ["Le sable est lourd ici...", "Attention, ca freine !"],
"terrain_sable_en": ["Heavy sand here...", "Watch out, it slows down!"],
"terrain_dalles": ["Les dalles, ca glisse !", "Terrain rapide, attention !"],
"terrain_dalles_en": ["Slippery tiles!", "Fast surface, watch out!"],
"terrain_herbe": ["L'herbe est traitre.", "Terrain mixte, adaptez-vous."],
"terrain_herbe_en": ["Tricky grass.", "Mixed terrain, adapt!"],
"adversaire_tireur": ["Attention, c'est un tireur !", "Il va viser vos boules !"],
"adversaire_tireur_en": ["Watch out, he's a shooter!", "He'll target your boules!"],
"adversaire_pointeur": ["Un pointeur de precision...", "Il va se coller au cochonnet."],
"adversaire_pointeur_en": ["A precision pointer...", "He'll stick close to the jack."],
"mene_debut_2": ["La partie s'installe...", "Les choses serieuses commencent."],
"mene_debut_2_en": ["The game settles in...", "Things get serious."],
"mene_debut_5": ["Cinquieme mene ! On entre dans le vif.", "Ca chauffe !"],
"mene_debut_5_en": ["Fifth round! Getting intense.", "Heating up!"]

Fichier 2 — src/scenes/PetanqueScene.js :

Dans create(), APRES le commentateur et ses hooks existants, ajouter :

// Sequenceur de commentaires (eviter superposition avec banners defi)
this._commentatorBusy = false;
this._safeCommentatorSay = (category) => {
    if (this._commentatorBusy || !this._commentator) return;
    this._commentatorBusy = true;
    this._commentator.say(category);
    this.time.delayedCall(COMMENTATOR_COOLDOWN, () => { this._commentatorBusy = false; });
};

// Commentaire terrain (une seule fois, apres 2s — avant le premier defi de mene)
this.time.delayedCall(2000, () => {
    const surface = this.terrainFullData?.surface || this.terrainType;
    if (surface === 'sable') this._safeCommentatorSay('terrain_sable');
    else if (surface === 'dalles') this._safeCommentatorSay('terrain_dalles');
    else if (surface === 'herbe') this._safeCommentatorSay('terrain_herbe');
});

// Commentaire adversaire (une seule fois, apres 6s)
this.time.delayedCall(6000, () => {
    const arch = this.opponentCharacter?.archetype;
    if (arch === 'tireur') this._safeCommentatorSay('adversaire_tireur');
    else if (arch === 'pointeur') this._safeCommentatorSay('adversaire_pointeur');
});

// Commentaires de mene (dans le hook onMeneStart si il existe)
// Si engine.onMeneStart est deja set (par D1), chainer :
const _origMeneStart = this.engine.onMeneStart;
this.engine.onMeneStart = (meneNumber) => {
    if (_origMeneStart) _origMeneStart(meneNumber);
    if (meneNumber === 2) this._safeCommentatorSay?.('mene_debut_2');
    if (meneNumber === 5) this._safeCommentatorSay?.('mene_debut_5');
};

IMPORTANT : Importer COMMENTATOR_COOLDOWN depuis Constants.js.
IMPORTANT : Si engine.onMeneStart n'existe pas encore (D1 pas encore fait), le chainer quand meme — la variable _origMeneStart sera null et c'est safe.

TESTS : Creer tests/unit/commentator-enriched.test.js — charger commentator.json, verifier les nouvelles categories existent (FR + EN).

VALIDATION : En match sur sable, le commentateur dit "Le sable est lourd ici..." apres 5s. Face a un tireur, il previent. Menes 2 et 5 ont des commentaires.
```

---

## PROMPT F1 — Milestones UI

```
Lis CLAUDE.md, puis lis :
- public/data/arcade.json (milestones)
- src/utils/SaveManager.js (isMilestoneUnlocked, unlockMilestone, addGalets, loadSave)
- src/scenes/ArcadeScene.js (create, flow apres lastMatchResult)
- src/utils/I18n.js (methode field)

TACHE : Verifier et afficher les milestones debloques dans ArcadeScene avec popup.

MODIFICATION dans src/scenes/ArcadeScene.js uniquement :

1. Ajouter methode _checkMilestones() :

_checkMilestones() {
    const save = loadSave();
    const milestones = this.arcadeData.milestones || [];
    for (const m of milestones) {
        if (isMilestoneUnlocked(m.id)) continue;
        let unlocked = false;
        if (m.condition === 'arcadeWins >= 1' && this.wins >= 1) unlocked = true;
        if (m.condition === 'arcadeWins >= 3' && this.wins >= 3) unlocked = true;
        if (m.condition === 'arcade_complete' && this.wins >= 5) unlocked = true;
        if (m.condition === 'arcade_perfect' && this.wins >= 5 && this.losses === 0) unlocked = true;
        if (m.condition === 'carreaux >= 1' && (save.cumulativeStats?.carreaux || 0) >= 1) unlocked = true;
        if (m.condition === 'match_fanny') {
            const lastResult = this.matchResults[this.matchResults.length - 1];
            if (lastResult?.won && lastResult?.opponentScore === 0) unlocked = true;
        }
        if (unlocked) {
            const isNew = unlockMilestone(m.id);
            if (isNew) {
                addGalets(m.reward);
                this._showMilestonePopup(m);
            }
        }
    }
}

2. Ajouter methode _showMilestonePopup(milestone) :
   - Overlay : graphics depth 100, fond 0x1A1510 alpha 0.6, plein ecran
   - Panel : graphics depth 101, fond 0x3A2E28 alpha 0.95, 360x100px centre, bords arrondis 10px, bordure #FFD700 2px alpha 0.6
   - Titre : I18n.t('arcade.milestone_unlocked'), font 14px, couleur #FFD700, depth 102
   - Nom : I18n.field(milestone, 'text'), font 18px, couleur #F5E6D0, depth 102
   - Reward : "+{reward} Galets", font 14px, couleur #FFD700, depth 102
   - Auto-dismiss apres 3000ms (tween alpha 0, 500ms, puis destroy all)

3. Dans create(), APRES le traitement de lastMatchResult (apres _processRoundUnlocks), appeler :
   this._checkMilestones();

Importer isMilestoneUnlocked et unlockMilestone depuis SaveManager si pas deja fait.

TESTS : Creer tests/unit/milestones-ui.test.js — tester la logique de conditions (wins >= 1 declenche first_win, etc.)

VALIDATION : Apres 1ere victoire arcade, popup "Premiere victoire ! +50 Galets". Apres 3 victoires, "Mi-parcours ! +75 Galets". Les milestones ne se declenchent qu'une fois.
```

---

# VAGUE 4 — Integration finale (apres V3)

---

## PROMPT F2 — Shop express

```
Lis CLAUDE.md, puis lis :
- src/scenes/ArcadeScene.js (en entier — la version avec map de C1)
- public/data/shop.json (structure categories, items, prix)
- src/utils/SaveManager.js (spendGalets, loadSave, saveSave)
- src/utils/Constants.js (SHOP_EXPRESS_ITEMS, SHOP_EXPRESS_DISCOUNT, GAME_WIDTH, GAME_HEIGHT)
- src/utils/I18n.js (methodes t, field)

TACHE : Apres une victoire arcade, proposer un overlay "boutique rapide" avec 2 items a -20% avant la map.

MODIFICATION dans src/scenes/ArcadeScene.js uniquement :

1. Modifier _buildProgressScreen() :
   _buildProgressScreen() {
       const save = loadSave();
       if (this.lastMatchResult?.won && this.currentRound <= 5
           && save.galets >= SHOP_EXPRESS_MIN_GALETS) {
           this._showShopExpress(() => this._showProgressScreen());
           return;
       }
       this._showProgressScreen();
   }

   Importer SHOP_EXPRESS_MIN_GALETS depuis Constants.js.

   ATTENTION : Si des micro-narratives (E1) ont deja modifie le flow en ajoutant un check post_narrative, le shop express doit venir APRES la narrative et AVANT la map. Verifier le flow complet de create() et s'adapter.

2. Ajouter _showShopExpress(onComplete) :
   - Charger shop.json via this.cache.json.get('shop')
   - Si pas de shopData ou pas de categories : appeler onComplete() et return
   - Charger save, lister items non-achetes (save.purchases || [])
   - Trier par prix, prendre les 2 plus abordables apres discount
   - Si aucun item : appeler onComplete() et return

   OVERLAY (depth 50-52) :
   - Fond : plein ecran 0x1A1510 alpha 0.85
   - Titre : I18n.t('arcade.shop_express_title'), font 24px, #FFD700, centre y=80
   - Sous-titre : I18n.t('arcade.shop_express_subtitle'), font 12px, #D4A574, y=110
   - Galets : "{save.galets} Galets", font 14px, #FFD700, y=135
   - 2 cartes (200x120px, gap 30px, centrees horizontalement) :
     - Fond 0x3A2E28 alpha 0.9, bords arrondis 8px
     - Bordure doree si achetable, grise sinon
     - Nom item (12px, #F5E6D0)
     - Prix barre (11px, #9E9E8E) + prix reduit (14px, #FFD700)
     - Bouton [ACHETER] si galets suffisants (fond #6B8E4E, font 12px)
     - Au clic : spendGalets(prix_reduit), sauver purchase, changer texte en "ACHETE !"
   - Bouton [PASSER] en dessous (font 16px, #9E9E8E, fond #3A2E28)
     - Au clic ou Espace/Echap : fade out overlay puis onComplete()

   Prix reduit = Math.floor(item.price * (1 - SHOP_EXPRESS_DISCOUNT))

3. Cleanup : stocker TOUS les elements crees dans un array shopElements = []. Au lieu de filtrer par depth (fragile), detruire les elements via cet array. Exemple :
   const shopElements = [];
   // A chaque creation d'element : shopElements.push(element);
   // Au cleanup : shopElements.forEach(el => { if (el?.active) el.destroy(); });

TESTS : Creer tests/unit/shop-express.test.js — tester le calcul de discount, tester le cas "aucun item" → onComplete direct.

VALIDATION : Apres victoire arcade, overlay "Boutique rapide" avec 2 items a -20%. Achat fonctionne. Passer ferme l'overlay et montre la map.
```

---

## PROMPT F3 — Zone doree

```
Lis CLAUDE.md, puis lis :
- src/scenes/PetanqueScene.js (create, hooks, _shutdown, terrain positions)
- src/petanque/PetanqueEngine.js (onMeneStart, getTeamBallsAlive)
- src/utils/Constants.js (GOLDEN_ZONE_*, TERRAIN_WIDTH, TERRAIN_HEIGHT)
- src/utils/SaveManager.js (addGalets)
- src/utils/I18n.js (methode t)

TACHE : Afficher un cercle dore sur le terrain pendant certaines menes. Boule joueur dedans = +5 Galets.

MODIFICATION dans src/scenes/PetanqueScene.js uniquement :

1. Dans init(), ajouter :
   this._goldenZone = null;
   this._goldenZoneActive = false;

2. Dans le hook onMeneStart (chainer avec l'existant) :
   const _origMeneStart2 = this.engine.onMeneStart;
   this.engine.onMeneStart = (meneNumber) => {
       if (_origMeneStart2) _origMeneStart2(meneNumber);
       // Zone doree (30% chance, mene 2+, arcade only)
       if (this.arcadeState && meneNumber >= 2 && Math.random() < 0.3) {
           this._spawnGoldenZone();
       }
   };

   ATTENTION : Le hook onMeneStart a peut-etre deja ete set par D1 et/ou E2. Chainer proprement.

3. Ajouter _spawnGoldenZone() :
   - Detruire la precedente si existe
   - Position aleatoire dans la moitie haute du terrain :
     x = Phaser.Math.Between(this.terrainX + 30, this.terrainX + TERRAIN_WIDTH - 30)
     y = Phaser.Math.Between(this.terrainY + 30, this.terrainY + TERRAIN_HEIGHT / 2)
   - Graphics depth 5 (sous les boules) :
     fillCircle(x, y, GOLDEN_ZONE_RADIUS) couleur GOLDEN_ZONE_COLOR alpha GOLDEN_ZONE_ALPHA
     strokeCircle(x, y, GOLDEN_ZONE_RADIUS) couleur GOLDEN_ZONE_COLOR alpha 0.5
   - Tween pulse : alpha entre GOLDEN_ZONE_ALPHA*0.5 et GOLDEN_ZONE_ALPHA, 1000ms, yoyo, repeat -1
   - Stocker : this._goldenZone = { x, y, gfx }; this._goldenZoneActive = true;

4. Dans le hook onScore (chainer), verifier la zone doree :
   if (this._goldenZoneActive && this._goldenZone) {
       const gz = this._goldenZone;
       const playerBalls = this.engine.getTeamBallsAlive('player');
       for (const ball of playerBalls) {
           const dx = ball.x - gz.x;
           const dy = ball.y - gz.y;
           if (Math.sqrt(dx*dx + dy*dy) <= GOLDEN_ZONE_RADIUS) {
               addGalets(GOLDEN_ZONE_REWARD);
               // Texte bonus
               const bonusTxt = this.add.text(gz.x, gz.y - 20,
                   I18n.t('arcade.golden_zone_bonus', { galets: GOLDEN_ZONE_REWARD }), {
                       fontFamily: 'monospace', fontSize: '10px', color: '#FFD700',
                       shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
                   }).setOrigin(0.5).setDepth(96);
               this.tweens.add({ targets: bonusTxt, y: gz.y - 40, alpha: 0, duration: 1500,
                   onComplete: () => bonusTxt.destroy() });
               break;
           }
       }
       this._clearGoldenZone();
   }

5. Ajouter _clearGoldenZone() : detruire gfx, reset flags.

6. Dans _shutdown(), appeler _clearGoldenZone().

TESTS : Creer tests/unit/golden-zone.test.js — tester la detection (boule a distance < radius = bonus, hors zone = pas de bonus).

VALIDATION : ~30% des menes (mene 2+) en arcade ont un cercle dore. Boule joueur dedans a fin de mene = "+5 Galets" flottant. Le cercle disparait apres chaque mene.
```

---

## PROMPT G1 — Ambiance progressive (DEPLACEE EN VAGUE 2)

```
Lis CLAUDE.md, puis lis :
- src/utils/SoundManager.js (fonction startCrowdAmbiance — trouver le gainNode avec valeur 0.04)
- src/scenes/PetanqueScene.js (chercher startCrowdAmbiance et _animateReaction)
- src/utils/Constants.js (CROWD_INTENSITY_BY_ROUND, CROWD_PROBABILITY)

TACHE : Augmenter le volume de la foule et la probabilite des reactions selon le round arcade.

MODIFICATIONS :

Fichier 1 — src/utils/SoundManager.js :
- Modifier la signature de startCrowdAmbiance : ajouter un parametre intensity = 0.04
  export function startCrowdAmbiance(intensity = 0.04) {
- Remplacer la valeur hardcodee 0.04 dans le gainNode par intensity :
  gainNode.gain.setValueAtTime(_effectiveVol(intensity), c.currentTime);

Fichier 2 — src/scenes/PetanqueScene.js :
1. Importer CROWD_INTENSITY_BY_ROUND depuis Constants.js
2. Remplacer l'appel startCrowdAmbiance(); par :
   const crowdIntensity = this.arcadeRound
       ? (CROWD_INTENSITY_BY_ROUND[this.arcadeRound - 1] || 0.04)
       : 0.04;
   startCrowdAmbiance(crowdIntensity);

3. Dans _animateReaction(), remplacer le "if (Math.random() < 0.6)" par :
   const crowdProb = this.arcadeRound
       ? Math.min(0.9, 0.5 + this.arcadeRound * 0.08)
       : 0.6;
   if (Math.random() < crowdProb) {

TESTS : Creer tests/unit/crowd-progressive.test.js :
- Tester que CROWD_INTENSITY_BY_ROUND a 5 valeurs croissantes
- Tester la formule : round 1 = min(0.9, 0.58) = 0.58, round 5 = min(0.9, 0.90) = 0.90

VALIDATION : Round 1 = foule discrete. Round 5 = foule bruyante. QuickPlay inchange.
```

---

## PROMPT C3 — Map polish

```
Lis CLAUDE.md, puis lis :
- src/scenes/ArcadeScene.js (la methode _showProgressScreen actuelle, les NODE_POSITIONS)

TACHE : Ajouter decorations (oliviers, vagues) et hover tooltip sur noeuds gagnes.

MODIFICATION dans src/scenes/ArcadeScene.js uniquement :

1. Ajouter methode _drawMapDecorations() appelee a la fin de _showProgressScreen() :

_drawMapDecorations() {
    const deco = this.add.graphics().setDepth(1);
    // Oliviers (cercles verts de tailles variees, entre les noeuds)
    const olives = [
        { x: 200, y: 125, s: 5 }, { x: 340, y: 80, s: 4 },
        { x: 480, y: 95, s: 6 }, { x: 620, y: 120, s: 4 }
    ];
    for (const o of olives) {
        deco.fillStyle(0x6B8E4E, 0.4);
        deco.fillCircle(o.x, o.y, o.s);
        deco.fillStyle(0x4A6B3A, 0.3);
        deco.fillCircle(o.x - 1, o.y + 1, o.s * 0.7);
    }
    // Vagues (cote gauche)
    deco.lineStyle(1, 0x87CEEB, 0.25);
    for (let w = 0; w < 3; w++) {
        deco.beginPath();
        const baseY = 160 + w * 12;
        for (let x = 20; x < 110; x += 4) {
            const y = baseY + Math.sin(x * 0.08 + w) * 4;
            if (x === 20) deco.moveTo(x, y);
            else deco.lineTo(x, y);
        }
        deco.strokePath();
    }
}

2. Ajouter le hover tooltip dans la boucle des noeuds gagnes de _showProgressScreen() :

Pour chaque noeud gagne (dans le if result && result.won), ajouter apres le dessin du noeud :
   const zone = this.add.zone(NODE_POSITIONS[i].x, NODE_POSITIONS[i].y, 30, 30).setInteractive();
   zone.on('pointerover', () => {
       if (this._mapTooltip) { this._mapTooltip.destroy(); this._mapTooltip = null; }
       const oppChar = this._getCharById(match.opponent);
       const tooltipText = oppChar ? I18n.field(oppChar, 'name') + ' - V' : 'Victoire';
       this._mapTooltip = this.add.text(
           NODE_POSITIONS[i].x, NODE_POSITIONS[i].y - 28, tooltipText, {
               fontFamily: 'monospace', fontSize: '9px', color: '#F5E6D0',
               backgroundColor: '#3A2E28', padding: { x: 4, y: 2 }
           }).setOrigin(0.5).setDepth(60);
   });
   zone.on('pointerout', () => {
       if (this._mapTooltip) { this._mapTooltip.destroy(); this._mapTooltip = null; }
   });

3. Dans init(), ajouter : this._mapTooltip = null;
4. Dans _shutdown(), detruire _mapTooltip.

PAS DE TESTS AUTOMATISES (feature purement visuelle).

VALIDATION : Les oliviers et vagues sont visibles sur la map. Hover sur un noeud gagne montre le nom de l'adversaire battu. Le tooltip disparait quand on quitte.
```

---

# ORDRE D'EXECUTION

```
VAGUE 1 (parallele) : A1, A2, A3, A4
  ↓ (attendre que tout V1 soit fini)
VAGUE 2 (parallele) : B1, B2, C1, D1, D3, E1, G1
  ↓ (attendre que tout V2 soit fini)
VAGUE 3 (parallele) : B3, C2, D2, E2, F1
  ↓ (attendre que tout V3 soit fini)
VAGUE 4 (parallele) : F2, F3, C3
```

Apres chaque vague : `npx vitest run` + `npm run build` pour valider.
