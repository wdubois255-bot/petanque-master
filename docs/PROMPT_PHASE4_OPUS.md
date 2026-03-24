# Prompt Opus — Phase 4 : Polish, Completude & Publication

> Copier-coller ce prompt ENTIER dans une session Claude Opus 4.6.
> Prerequis : PLAN_PHASE3 doit avoir ete execute AVANT.
> Duree estimee : session longue (~4-6h), peut etre decoupee en 2 sessions.

---

```
Tu es l'architecte et le developpeur senior de Petanque Master, un jeu de petanque 1v1 en pixel art.

=== CONTEXTE ===

Le jeu a traverse 4 plans :
- PLAN_100 (5 axes) : bugs, game feel, tutorial, narrative, publication → FAIT
- PLAN_PHASE2 (3 axes) : physique polish, terrains visuels, coherence → FAIT
- PLAN_PHASE3 (6 axes) : techniques de tir, feedback resultats, cleanup, tests, audio, mobile → EN COURS / FAIT

Phase 3 couvre la PROFONDEUR TECHNIQUE du jeu. Mais il reste ~40% de travail pour un jeu publiable de qualite :
- Sprites/animations manquantes (3 throw anims, 3 greetings, Marcel, portraits)
- Tutoriel pas mis a jour pour les nouvelles mecaniques Phase 3
- Pas de localisation anglaise (bloquant pour CrazyGames/Poki)
- Pas d'accessibilite (daltonisme, taille texte)
- Pas d'equilibrage verifie (matchups potentiellement injouables)
- Pas de transitions entre scenes (coupes seches)
- Pas de contenu post-arcade (rien apres les 5 matchs)
- Pas de credits, privacy policy, license

=== TON MANDAT ===

Tu dois executer docs/PLAN_PHASE4.md — 8 axes (G a N) qui couvrent TOUT ce que Phase 3 ne couvre pas.

=== ETAPE 0 — LECTURE OBLIGATOIRE ===

Lis ces fichiers DANS L'ORDRE avant de toucher a quoi que ce soit :

1. CLAUDE.md (regles, interdictions, structure)
2. GAME_DESIGN.md (bible game design — ne pas contredire)
3. docs/PLAN_PHASE4.md (ton plan d'execution — 8 axes)
4. docs/PLAN_PHASE3.md (ce qui a deja ete fait — ne pas dupliquer)
5. CAHIER_DES_CHARGES.md (etat actuel du projet)
6. src/utils/Constants.js (source de verite numerique)
7. public/data/characters.json (stats, barks, sprites)
8. src/scenes/BootScene.js (chargement assets, anims)
9. src/ui/InGameTutorial.js (tutoriel in-game)
10. research/50_cosmetic_overhaul_checklist.md (checklist polish)
11. research/39_accessibility_inclusivity.md (accessibilite)
12. research/44_localization_i18n.md (localisation)
13. research/57_scene_flow_map.md (carte transitions)
14. research/58_keybindings_reference.md (carte controles)

=== ETAPE 1 — AXE G : SPRITES & ANIMATIONS (bloquant) ===

1. Identifier les 3 personnages sans throw animation :
   - Lire CHAR_THROW_MAP dans Constants.js
   - Pour chaque personnage manquant, creer une animation 2-frame basique :
     Frame 1 = sprite idle modifie (bras leve)
     Frame 2 = sprite idle modifie (bras etendu)
   - Si PixelLab MCP est disponible, utiliser /sprite pour generer
   - Sinon, creer les frames par duplication + modification des pixels existants
   - Ajouter les entrees dans CHAR_THROW_MAP

2. Identifier les 3 greeting animations manquantes :
   - Lire BootScene.js section greeting anims
   - Meme approche : 2-frame ou PixelLab

3. Marcel sprite :
   - Lire project_marcel_sprite_issue.md dans la memoire
   - Regenerer si PixelLab disponible, sinon documenter comme TODO

4. Commit : "feat(sprites): AXE G — throw anims + greetings completes (#phase4)"

=== ETAPE 2 — AXE H : TUTORIEL MIS A JOUR ===

1. Lire src/ui/InGameTutorial.js
2. Ajouter Phase 4 (MODES DE TIR) :
   - Se declenche apres la 3e mene si le joueur n'a utilise que roulette/demi
   - Montre les 6 modes disponibles (Pointer: Roulette/Demi/Plombee, Tirer: Rafle/Fer/Devant)
   - Auto-ferme quand le joueur selectionne un nouveau mode
3. Ajouter Phase 5 (EFFETS) :
   - Se declenche apres la 5e mene si jamais utilise [E] ou [R]
   - Explique retro + spin lateral
4. Ajouter 3 hints contextuels one-shot :
   - Premier tir au fer : hint sur la rafle
   - Premier match Plage : hint sur la plombee
   - Premier match Docks : hint sur les murs
5. Persister tutorialPhasesDone dans SaveManager (ajouter phases 4 et 5)
6. Commit : "feat(tutorial): AXE H — phases tir + effets + hints contextuels (#phase4)"

=== ETAPE 3 — AXE I : LOCALISATION ANGLAIS ===

1. Creer src/utils/I18n.js :
   - Classe statique avec load(locale), t(key, params)
   - Charge public/data/lang/{locale}.json
   - Interpolation basique {param}
   - Fallback : si cle absente, retourne la cle elle-meme

2. Creer public/data/lang/fr.json :
   - Extraire TOUS les textes hardcodes du code (grep les strings francaises)
   - Categories : menu, gameplay, results, tutorial, shop, characters, dialogues

3. Creer public/data/lang/en.json :
   - Traduction anglaise complete de fr.json
   - Barks des personnages en anglais (adapter l'humour, pas traduire mot a mot)
   - Noms des techniques : Roulette, Half-Lob, Lob, Skim Shot, Iron Shot, Front Shot

4. Integrer I18n dans les scenes :
   - Remplacer les textes hardcodes par I18n.t('key')
   - Commencer par TitleScene, ResultScene, ShopScene (les plus visibles)
   - Puis PetanqueScene (ScorePanel, AimingSystem labels)
   - Puis InGameTutorial

5. Detection langue : navigator.language → 'fr' ou 'en', toggle dans settings

6. Commit : "feat(i18n): AXE I — systeme i18n + traduction anglaise (#phase4)"

=== ETAPE 4 — AXE N : LEGAL & CREDITS ===

1. Ajouter "Credits" dans TitleScene menu (entre "Boutique" et settings)
   - Scene simple avec scroll vertical
   - Contenu : developpeur, outils (Phaser 4, PixelLab, ElevenLabs), police (Press Start 2P OFL), inspirations

2. Creer public/privacy.html :
   - Le jeu utilise localStorage uniquement
   - Aucun cookie, aucun tracking, aucune donnee personnelle
   - Contact email

3. Ajouter fichier LICENSE a la racine (MIT ou custom)

4. Commit : "docs(legal): AXE N — credits, privacy policy, license (#phase4)"

=== ETAPE 5 — AXE K : EQUILIBRAGE ===

1. Lire characters.json et lister les stats de chaque personnage
2. Calculer les totaux et identifier les outliers :
   - Qui a le plus de stats total ? Le moins ?
   - Quels matchups sont desequilibres ?
3. Simuler mentalement les matchups Arcade :
   - Round 1 : Rookie (14pts) vs La Choupe (24pts, tireur) → facile ?
   - Round 5 : Rookie (~30pts) vs Ley (31pts, expert) → equilibre ?
4. Si desequilibre trouve : ajuster dans characters.json
   - Ne PAS toucher a la physique (Ball.js)
   - Ne PAS creer de nouveaux personnages
5. Produire research/61_character_balance_audit.md avec les resultats
6. Commit : "balance(chars): AXE K — audit equilibrage + ajustements (#phase4)"

=== ETAPE 6 — AXE J : ACCESSIBILITE BASIQUE ===

1. Constants.js : ajouter ACCESSIBILITY section
   - COLORBLIND_MARKERS: { player: 'circle_filled', opponent: 'diamond' }
   - TEXT_SCALE_OPTIONS: [1.0, 1.25, 1.5]

2. SaveManager.js : ajouter champs accessibilite
   - colorblindMode: 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia'
   - textScale: 1.0
   - screenShake: true
   - slowMoEffects: true

3. EngineRenderer.js : best ball indicator
   - Si colorblindMode actif, ajouter marqueur forme (fleche/losange) en plus de la couleur

4. TitleScene.js settings : ajouter section Accessibilite
   - Toggle daltonisme (4 options)
   - Toggle screen shake
   - Slider taille texte

5. SoundManager.js : verifier AudioContext.resume() au premier input

6. Commit : "feat(a11y): AXE J — mode daltonien, taille texte, screen shake toggle (#phase4)"

=== ETAPE 7 — AXE L : POLISH VISUEL ===

1. Transitions fade entre scenes :
   - Dans CHAQUE scene qui fait scene.start() : ajouter fadeOut(300) avant
   - Dans CHAQUE scene.create() : ajouter fadeIn(300) au debut
   - Exception : BootScene → TitleScene (pas de fade, la premiere fois)

2. Score bounce dans ScorePanel.js :
   - Quand le score change, tween scale 1.0→1.3→1.0 sur 150ms

3. Confettis victoire dans ResultScene.js :
   - 40 particules colorees (palette provencale) qui tombent si victoire
   - Pas de librairie externe — Graphics circles avec tweens

4. Loading bar dans BootScene.js :
   - this.load.on('progress', value => { /* barre largeur proportionnelle */ })
   - Texte "Chargement..." + pourcentage

5. Commit : "feat(polish): AXE L — transitions, score bounce, confettis, loading bar (#phase4)"

=== ETAPE 8 — AXE M : CONTENU POST-ARCADE ===

1. Defis quotidiens :
   - SaveManager : getDailyState() existe deja, l'exploiter
   - Nouveau : generateDailyChallenge(seed) → { character, terrain, constraint }
   - TitleScene : bouton "Defi du jour" (visible apres 1er arcade win)
   - PetanqueScene : afficher contrainte en haut ("Gagnez avec max 2 carreaux !")
   - Recompense : 75 Galets (GAME_DESIGN.md)

2. Boss Rush (si le temps le permet) :
   - Deblocable apres arcade complete
   - 5 matchs en sequence, difficulte max, pas de LevelUp entre
   - Recompense : titre "Champion des Champions" + 500 Galets

3. Commit : "feat(content): AXE M — defis quotidiens + boss rush (#phase4)"

=== VERIFICATION FINALE ===

Apres TOUS les axes :

1. `npx vitest run` → TOUS les tests passent
2. `npm run build` → Build OK
3. Tester manuellement :
   - Arcade complet (5 matchs) en francais
   - 1 match Quick Play en anglais
   - Verifier credits, settings accessibilite
   - Verifier tutoriel phases 4+5
   - Verifier defi quotidien
4. Mettre a jour CAHIER_DES_CHARGES.md avec le nouvel etat

=== REGLES ABSOLUES ===

- Lis CLAUDE.md — TOUTES les interdictions s'appliquent
- PAS de Matter.js, PAS de TypeScript, PAS de console.log, PAS de noir pur #000
- Toutes les valeurs dans Constants.js ou les JSON de public/data/
- Phaser reuse les scenes : TOUJOURS reset dans init()
- Commit apres CHAQUE axe (pas de mega-commit)
- Ne duplique PAS le travail de Phase 3 (tirs, feedback, audio, mobile)
- Si un axe est trop long, decoupe-le en 2 commits
- Teste dans le navigateur apres chaque changement significatif (npm run dev)

=== LIVRABLES ATTENDUS ===

- 8 commits (1 par axe : G, H, I, N, K, J, L, M)
- research/61_character_balance_audit.md (produit par AXE K)
- public/data/lang/fr.json + en.json (produit par AXE I)
- src/utils/I18n.js (produit par AXE I)
- CAHIER_DES_CHARGES.md mis a jour
- Tous les tests passent, build OK
```
