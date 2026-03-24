# PLAN PHASE 4 — Polish, Completude & Publication

> **Objectif** : Couvrir TOUT ce que Phase 3 ne couvre pas pour un jeu publiable.
> **Prerequis** : PLAN_PHASE3 execute (6 axes : tirs, feedback, cleanup, tests, audio, mobile)
> **Estimation** : 8 axes, ~2-4h par axe
> **Priorite** : par blocage publication (P0 = bloquant, P1 = important, P2 = nice-to-have)

---

## CE QUE PHASE 3 COUVRE (ne pas refaire)

- AXE A : Techniques de tir (rafle, devant, cochonnet, spin lateral)
- AXE B : Feedback resultats (8 resultats, SFX, barks)
- AXE C : Nettoyage (dead code, leaks, duplication, bugs controles)
- AXE D : Tests (slopes, walls, match flow, AimingSystem, scene reuse)
- AXE E : Audio (ambiances terrain, crowd, commentateur)
- AXE F : Mobile (touch, responsive, portal SDK wrapper)

---

## AXE G — SPRITES & ANIMATIONS MANQUANTS (P0 — Bloquant)

> 3 personnages sans throw animation, 3 greeting manquantes, Marcel a regenerer.
> Un roster incomplet = impression de jeu inacheve.

### G1. Throw animations manquantes

**Fichier** : `src/utils/Constants.js` (CHAR_THROW_MAP)

3 personnages n'ont pas de spritesheet de lancer : **papi_rene, fazzino, rizzi**.
Ils utilisent le fallback squash/stretch.

- Option A (rapide) : Generer via `/sprite` les 3 spritesheets throw (4 frames 32x32)
- Option B (minimal) : Creer des throw animations 2-frame a partir des sprites existants
  (frame 1 = corps penche, frame 2 = bras etendu) par manipulation de pixels

Ajouter les 3 entrees dans CHAR_THROW_MAP une fois les sprites prets.

### G2. Greeting animations manquantes (3/12)

**Fichier** : `src/scenes/BootScene.js` (section greeting anims)

9/12 sont faites. Identifier les 3 manquantes (probablement papi_rene, fazzino, rizzi).
Generer ou creer des greeting frames pour chacun.

### G3. Marcel sprite a regenerer

**Memoire** : `project_marcel_sprite_issue.md`

Le sprite de Marcel a un probleme de qualite. Regenerer via PixelLab avec les memes
parametres que les autres personnages (32x32, 4 directions, palette provencale).

### G4. Portraits HD (128x128)

**Fichier** : `src/utils/PortraitGenerator.js`

Actuellement les portraits sont extraits des spritesheets (frame 0,0 = face sud).
C'est fonctionnel mais petit. Pour le character select et la boutique, des portraits
128x128 dedies seraient plus impactants.

- Generer 12 portraits 128x128 via PixelLab
- Les charger dans BootScene
- Les utiliser dans QuickPlayScene, ShopScene, PlayerScene

---

## AXE H — TUTORIEL MISE A JOUR (P0 — Bloquant)

> Phase 3 ajoute rafle, tir devant, spin lateral, ciblage cochonnet.
> Le tutoriel actuel ne couvre que les bases. Un joueur ne decouvre PAS les nouvelles mecaniques.

### H1. Mise a jour InGameTutorial.js

**Fichier** : `src/ui/InGameTutorial.js`

Ajouter Phase 4 et 5 au tutoriel in-game :

- **Phase 4 — MODES DE TIR** (apres 3e mene) :
  "Tu peux choisir entre 6 techniques ! Pointer (Roulette/Demi/Plombee) ou Tirer (Rafle/Fer/Devant)."
  Montrer les 6 boutons, auto-fermer quand le joueur en selectionne un.

- **Phase 5 — EFFETS** (apres 5e mene si jamais utilise) :
  "Appuie sur [E] pour ajouter un effet lateral ! [R] pour le retro !"
  "Plus ton stat Effet est eleve, plus l'effet est fort."

### H2. Hints contextuels

**Fichier** : `src/ui/InGameTutorial.js` (methode `showContextualHint()`)

Ajouter hints one-shot :
- Premier tir au fer : "Essaie la Rafle [touche 4] pour un tir rasant !"
- Premier match sur Plage : "Le sable ralentit les boules. La Plombee est ideale ici."
- Premier match sur Docks : "Les murs rebondissent ! Attention aux bandes."

---

## AXE I — LOCALISATION ANGLAIS (P0 — Bloquant pour portails)

> CrazyGames et Poki = audience anglophone majoritaire.
> Un jeu 100% francais perd 80%+ du marche.

### I1. Systeme i18n

**Nouveau fichier** : `src/utils/I18n.js`

```js
class I18n {
  static _locale = 'fr';
  static _strings = {};
  static async load(locale) { /* fetch public/data/lang/{locale}.json */ }
  static t(key, params) { /* return translated string with {param} interpolation */ }
}
```

### I2. Fichiers de langue

**Nouveaux fichiers** :
- `public/data/lang/fr.json` — Extraire TOUS les textes hardcodes du code
- `public/data/lang/en.json` — Traduction anglaise complete

Categories de textes a extraire :
- Menus (TitleScene, QuickPlayScene, ShopScene, PlayerScene)
- Gameplay (ScorePanel, AimingSystem labels, InGameTutorial)
- Resultats (ResultScene, LevelUpScene)
- Dialogues (arcade.json preMatchDialogue, postMatchDialogue)
- Barks (characters.json)
- Boutique (shop.json item names/descriptions)
- Tutoriel (toutes les phases)

### I3. Detection langue + selecteur

**Fichier** : `src/scenes/TitleScene.js`

- Detecter `navigator.language` au boot
- Ajouter toggle FR/EN dans les settings (TitleScene menu)
- Persister dans SaveManager

---

## AXE J — ACCESSIBILITE BASIQUE (P1 — Standard industrie)

> 8% des joueurs sont daltoniens. Les portails valorisent l'accessibilite.

### J1. Mode daltonien

**Fichier** : `src/utils/Constants.js` + `src/petanque/EngineRenderer.js`

- Ajouter 3 palettes alternatives (protanopie, deuteranopie, tritanopie)
- Boules joueur : ajouter marqueur forme (cercle plein vs cercle vide) en plus de la couleur
- Best ball glow : ajouter indicateur forme (fleche) en plus de la couleur

### J2. Options accessibilite

**Fichier** : `src/scenes/TitleScene.js` (settings)

- Toggle screen shake (on/off)
- Toggle slow-mo (on/off pour photosensibles)
- Taille texte (Normal / Grand / Tres Grand)
- Persister dans SaveManager

### J3. Audio unlock mobile

**Fichier** : `src/utils/SoundManager.js`

- Verifier que l'AudioContext est resume au premier input (tap/click)
- Afficher hint "Touchez l'ecran pour activer le son" si audio suspendu

---

## AXE K — EQUILIBRAGE & DIFFICULTE (P1 — Experience joueur)

> Aucun audit d'equilibrage n'a ete fait. Certains matchups pourraient etre injouables.

### K1. Audit equilibrage personnages

**Fichiers** : `public/data/characters.json`, `src/utils/Constants.js`

Pour chaque personnage, documenter :
- Total stats (precision + puissance + effet + sang_froid)
- Archetype et personnalite IA
- Points forts / faiblesses
- Matchups problematiques (ex: Rookie 14pts vs Ley 31pts en round 5)

Produire : `research/61_character_balance_audit.md`

### K2. Validation courbe difficulte Arcade

**Fichier** : `public/data/arcade.json`

Verifier que la progression est fluide :
- Round 1 (Facile) : Le joueur doit gagner 80%+ du temps
- Round 2 (Moyen) : 60-70%
- Round 3 (Difficile) : 40-50%
- Round 4 (Tres difficile) : 25-35%
- Round 5 (Expert) : 15-25%

Si les taux ne matchent pas, ajuster les stats IA ou la precision par difficulte.

### K3. Ajustements si necessaire

Si l'audit revele des desequilibres :
- Ajuster les stats dans characters.json (source de verite)
- Ajuster AI_PERSONALITY_MODIFIERS dans Constants.js
- Ne PAS toucher a la physique (Ball.js)

---

## AXE L — POLISH VISUEL (P1 — Game feel)

> Beaucoup de "MUST-HAVE" de research/50_cosmetic_overhaul_checklist.md ne sont pas couverts.

### L1. Transitions entre scenes

**Fichier** : Toutes les scenes (transition via `scene.start()`)

Ajouter un fade-out/fade-in entre chaque scene :
```js
this.cameras.main.fadeOut(300);
this.cameras.main.once('camerafadeoutcomplete', () => {
  this.scene.start('NextScene', data);
});
```

Et dans chaque scene.create() :
```js
this.cameras.main.fadeIn(300);
```

### L2. Score bounce feedback

**Fichier** : `src/ui/ScorePanel.js`

Quand le score change, ajouter un tween bounce sur le chiffre :
```js
this.tweens.add({ targets: scoreText, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true });
```

### L3. Confettis victoire

**Fichier** : `src/scenes/ResultScene.js`

Si le joueur gagne, ajouter des confettis (30-50 particules colorees qui tombent).
Utiliser les couleurs de la palette provencale.

### L4. Loading screen avec barre de progression

**Fichier** : `src/scenes/BootScene.js`

Ajouter une barre de progression pendant le chargement :
```js
this.load.on('progress', (value) => { /* update bar width */ });
```

---

## AXE M — CONTENU POST-ARCADE (P2 — Retention)

> Apres les 5 matchs Arcade, le joueur n'a plus rien a faire sauf Quick Play libre.

### M1. Defis quotidiens

**Fichiers** : `src/utils/SaveManager.js` (lastDailyDate, dailyCompleted existent deja)

Implementer :
- Seed quotidien (SaveManager.getDailyState() existe deja)
- Generation defi : personnage impose + terrain impose + contrainte
- UI : bouton "Defi du jour" dans TitleScene
- Recompense : 75 Galets (GAME_DESIGN.md)

### M2. Mode Boss Rush

Apres avoir complete l'Arcade, debloquer "Boss Rush" :
- Les 5 adversaires en sequence, difficulte maximale
- Pas de LevelUp entre les matchs
- Recompense speciale (titre + Galets)

---

## AXE N — LEGAL & PUBLICATION (P0 — Bloquant pour stores)

### N1. Credits screen

**Nouveau fichier** : Ajouter "Credits" dans TitleScene menu.
- Developpe par [nom]
- Sprites : PixelLab AI + retouche manuelle
- Audio : ElevenLabs + procedural Web Audio
- Moteur : Phaser 4.0.0-rc.6
- Police : Press Start 2P (OFL License)
- Inspiration : FIPJP, La Ciotat 1907

### N2. Privacy Policy

**Nouveau fichier** : `public/privacy.html`
- Le jeu utilise localStorage (pas de cookies)
- Pas de tracking (sauf si portal SDK ajoute)
- Pas de donnees personnelles collectees
- Contact : [email]

### N3. License

**Nouveau fichier** : `LICENSE` a la racine
- Le code du jeu (pas les assets)

---

## ORDRE D'EXECUTION RECOMMANDE

```
AXE G (Sprites manquants)      ← Bloquant visuel
  ↓
AXE H (Tutoriel mis a jour)    ← Bloquant UX
  ↓
AXE I (Localisation EN)        ← Bloquant portails
  ↓
AXE N (Legal & credits)        ← Bloquant publication
  ↓
AXE K (Equilibrage)            ← Important game feel
  ↓
AXE J (Accessibilite)          ← Standard industrie
  ↓
AXE L (Polish visuel)          ← Nice-to-have impactant
  ↓
AXE M (Contenu post-arcade)    ← Retention long terme
```

---

*Plan cree le 24 mars 2026 par Claude Opus 4.6.*
*Prerequis : PLAN_PHASE3 ✅*
*Complementaire a PLAN_PHASE3, ne duplique rien.*
