# 39 — Accessibilite & Inclusivite

> A lire quand : on travaille sur les options, les controles, les couleurs, ou qu'on veut s'assurer que le jeu est jouable par le plus grand nombre.

---

## 1. POURQUOI L'ACCESSIBILITE COMPTE

- **8% des hommes** sont daltoniens (1 joueur sur 12)
- **15% de la population mondiale** a un handicap
- L'accessibilite n'est pas un "bonus" : c'est un **multiplicateur d'audience**
- Les jeux accessibles ont de meilleures notes sur les stores
- **Celeste** est un modele : difficile mais accessible grace a ses options

---

## 2. ACCESSIBILITE VISUELLE

### 2.1 Daltonisme

3 types principaux (simulations a tester) :

| Type | Prevalence | Couleurs confondues | Impact jeu |
|------|-----------|-------------------|------------|
| Protanopie (rouge) | 1% hommes | Rouge ↔ vert | Boules rouges vs terrain herbe |
| Deuteranopie (vert) | 6% hommes | Vert ↔ rouge | Meme probleme |
| Tritanopie (bleu) | 0.01% | Bleu ↔ jaune | Boules bleues vs cochonnet dore |

### 2.2 Solutions implementables

| Solution | Effort | Impact |
|----------|--------|--------|
| **Mode daltonien** dans les options | Moyen | Fort |
| Ajouter des **formes/icones** en plus des couleurs | Faible | Fort |
| **Outlines contrastes** sur les boules (noir vs blanc) | Faible | Moyen |
| **Patterns/textures** differents par joueur | Moyen | Fort |
| Tester avec un simulateur daltonien | Faible | Preventif |

### 2.3 Mode daltonien

```
Options > Accessibilite > Mode Daltonien
  ○ Desactive
  ● Protanopie (rouge-vert)
  ○ Deuteranopie (vert-rouge)
  ○ Tritanopie (bleu-jaune)
```

**Implementation** :
- Remplacer les couleurs problematiques par des couleurs safe
- Palette daltonien-safe : bleu (#0072B2), orange (#E69F00), vert fonce (#009E73), jaune (#F0E442), rouge fonce (#CC79A7)
- Alternative plus simple : ajouter un **marqueur de forme** sur chaque boule (cercle pour J1, losange pour J2)

### 2.4 Marqueurs de forme (solution universelle)

```
J1 : ● (cercle plein) ou etoile a 4 branches
J2 : ◆ (losange) ou croix
Cochonnet : ▲ (triangle)
```

Ces marqueurs sont affiches **en plus** des couleurs. Un joueur daltonien peut distinguer les boules par leur forme.

### 2.5 Taille du texte

| Option | Taille par defaut | Mode "Grand texte" |
|--------|-------------------|-------------------|
| HUD | 12px | 16px |
| Menus | 14px | 18px |
| Titres | 24px | 32px |
| Dialogues | 12px | 16px |

### 2.6 Contraste

- **Ratio minimum** : 4.5:1 (WCAG AA) pour le texte
- **Ratio recommande** : 7:1 (WCAG AAA) pour les elements critiques (score, timer)
- **Outil de verification** : WebAIM Contrast Checker
- Notre palette est deja bien contrastee (creme #F5E6CC sur fond #1A1510 = ratio 11:1)

---

## 3. ACCESSIBILITE MOTRICE

### 3.1 Controles alternatifs

| Mode | Description | Pour qui |
|------|-----------|---------|
| Drag classique | Glisser pour viser, relacher pour lancer | Standard |
| Tap-to-aim | Taper pour choisir direction, slider puissance | Difficultes motrices legeres |
| Auto-puissance | Direction seule, puissance auto-calculee | Difficultes motrices moderees |
| Clavier complet | Fleches + Espace | Joueurs clavier-only |
| Souris un bouton | Click gauche pour tout | Souris adaptative |

### 3.2 Remappage des touches

```
Options > Controles > Remapper
  Viser    : [Souris drag]  / [Fleches]
  Lancer   : [Relacher]     / [Espace]
  Focus    : [F]             / [Shift]
  Mode tir : [Tab]           / [Q/E]
  Pause    : [Echap]         / [P]
```

### 3.3 Temps de reaction

- **Pas de QTE** (quick-time events) dans le gameplay
- **Pas de timer** pour lancer (le joueur prend son temps)
- Le jeu est **tour par tour** = naturellement accessible aux joueurs lents
- Exception : le wobble de precision est en temps reel, mais le Focus le reduit

### 3.4 Repetitive strain injury (RSI)

- Le drag-and-release est repete des dizaines de fois par match
- **Prevenir** : les matchs durent 5-10 min max, pas de marathon force
- **Option** : "confirmation avant lancer" ajoute un 2eme clic (reduit la precision du mouvement necessaire)

---

## 4. ACCESSIBILITE AUDITIVE

### 4.1 Sous-titres et indicateurs visuels

| Element audio | Indicateur visuel equivalent |
|--------------|---------------------------|
| Bruit d'impact (collision) | Flash blanc sur la boule + screen shake |
| Roulement (la boule roule) | Trainee visuelle derriere la boule |
| Musique de tension | Score qui pulse rouge |
| Son de victoire | Confettis + texte "VICTOIRE!" |
| Son d'erreur | Shake du panneau + bordure rouge |

### 4.2 Option "Indicateurs visuels renforces"

Quand cette option est ON :
- Les feedback sonores sont **doubles** par des effets visuels supplementaires
- Les impacts font apparaitre un **cercle d'onde** autour du point d'impact
- Le score clignote quand il change
- Les transitions ont des indicateurs textuels ("A votre tour !", "Fin de mene")

### 4.3 Vibrations comme alternative au son (mobile)

Sur mobile, les vibrations haptic peuvent remplacer partiellement les SFX pour les joueurs sourds :
- Impact = vibration courte
- Carreau = double vibration
- Victoire = vibration longue pattern

---

## 5. ACCESSIBILITE COGNITIVE

### 5.1 Simplification de l'information

| Complexite | Solution |
|-----------|---------|
| Regles de petanque | Tutoriel progressif (research/36) |
| Stats des personnages | Barres visuelles simples, pas de chiffres caches |
| Modes de tir (roulette/plombee/etc) | Icones descriptives + tooltip |
| Scoring | Animation claire de mesure des distances |

### 5.2 Options de difficulte

```
Options > Difficulte
  ● Accessible   — IA facile, prediction visible, pas de wobble
  ○ Normal       — IA moyenne, prediction visible
  ○ Competitif   — IA difficile, prediction limitee, wobble complet
  ○ Expert       — IA difficile, pas de prediction, wobble max
```

### 5.3 Indices visuels permanents

- **Icone du joueur actif** toujours visible (pas seulement du texte)
- **Boules restantes** affichees visuellement (pas un chiffre)
- **Zone du cochonnet** subtilement highlight (halo leger)
- **Derniere boule jouee** = outline highlight pendant 2s

---

## 6. OPTIONS D'ACCESSIBILITE — MENU COMPLET

```
┌──── ACCESSIBILITE ────────────────────────┐
│                                            │
│ VISUEL                                     │
│  Mode daltonien     [Desactive ▼]          │
│  Marqueurs de forme [ON / off]             │
│  Taille du texte    [Normal ▼]             │
│  Contraste renforce [on / OFF]             │
│  Clignotements      [ON / off]             │
│                                            │
│ CONTROLES                                  │
│  Mode de controle   [Drag classique ▼]     │
│  Sensibilite        [Medium ▼]             │
│  Confirmation lancer [on / OFF]            │
│                                            │
│ AUDIO                                      │
│  Indicateurs visuels [on / OFF]            │
│  Vibrations          [ON / off]            │
│                                            │
│ GAMEPLAY                                   │
│  Difficulte          [Normal ▼]            │
│  Screen shake        [ON / off]            │
│  Screen flash        [ON / off]            │
│                                            │
│ [Retour]                                   │
└────────────────────────────────────────────┘
```

---

## 7. MOTION SENSITIVITY

Certains joueurs sont sensibles aux :
- **Screen shake** (nausee, vertige)
- **Screen flash** (epilepsie photosensible)
- **Mouvements rapides de camera** (mal des transports)

### 7.1 Options

| Option | Defaut | Effet quand OFF |
|--------|--------|----------------|
| Screen shake | ON | Pas de camera.shake() |
| Screen flash | ON | Pas de camera.flash() |
| Camera follow rapide | ON | Lerp plus lent (0.02 au lieu de 0.08) |
| Slow-motion | ON | Desactive le slow-mo sur les carreaux |

### 7.2 Implementation

```javascript
// Verifier avant chaque effet
if (this.settings.screenShake) {
  this.cameras.main.shake(200, 0.003);
}
if (this.settings.screenFlash) {
  this.cameras.main.flash(100, 255, 255, 255);
}
```

**Regle** : ne jamais avoir de flash de plus de 3Hz (3 par seconde) = risque epileptique. Les guidelines W3C (WCAG 2.3.1) interdisent les flashs > 3/s.

---

## 8. INTERNATIONALISATION ET ACCESSIBILITE

- Les textes doivent supporter les **caracteres accentues** (francais, espagnol, portugais)
- Les textes doivent etre **externalisables** (voir research/44_localization_i18n.md)
- Les icones et couleurs doivent etre **culturellement neutres**
- Eviter le rouge pour "mauvais" et vert pour "bon" (daltonisme + culture)
- Alternative : forme (✓ vs ✗) + position (haut = bon, bas = mauvais)

---

## 9. CHECKLIST ACCESSIBILITE

### Avant chaque release

- [ ] Contraste texte : ratio >= 4.5:1 sur tous les ecrans
- [ ] Tous les boutons >= 44x44px de zone interactive
- [ ] Pas de texte < 10px
- [ ] Screen shake/flash desactivables
- [ ] Le jeu est jouable sans son (indicateurs visuels)
- [ ] Le jeu est jouable sans couleur (formes/textes alternatifs)
- [ ] Le jeu est jouable au clavier seul
- [ ] Pas de flash > 3/s (epilepsie)
- [ ] Taille de texte ajustable
- [ ] Tutoriel clair et progressif
- [ ] Pas de timer pressant sur le gameplay principal

### Tests a effectuer

- [ ] Jouer avec un simulateur daltonien (Chrome DevTools > Rendering > Emulate vision)
- [ ] Jouer sans son
- [ ] Jouer au clavier seul (pas de souris)
- [ ] Jouer avec une seule main (souris uniquement)
- [ ] Jouer sur un ecran 5" (mobile)
- [ ] Faire tester par un joueur non-gamer

---

## 10. REFERENCES

| Ressource | URL | Ce qu'on en retient |
|-----------|-----|-------------------|
| Game Accessibility Guidelines | gameaccessibilityguidelines.com | Checklist par niveau (basic/intermediate/advanced) |
| Xbox Accessibility Guidelines | learn.microsoft.com/gaming/accessibility | Standards industrie AAA |
| Celeste Assist Mode | celeste.ink/wiki/Assist_Mode | Modele exemplaire d'accessibilite sans stigmatisation |
| AbleGamers | ablegamers.org | Fondation pour l'accessibilite gaming |
| WCAG 2.1 | w3.org/WAI/WCAG21 | Normes web, applicables aux jeux web |
| Can I Play That? | caniplaythat.com | Reviews d'accessibilite de jeux |
