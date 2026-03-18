# 44 — Localisation & Internationalisation (i18n)

> A lire quand : on prepare le jeu pour d'autres langues/marches, ou qu'on structure les textes pour l'exportation.

---

## 1. POURQUOI LOCALISER

- La **France** est le marche primaire, mais la petanque est jouee dans **80+ pays**
- Les marches anglophones (US/UK/CA/AU) sont **10x plus grands** en gaming
- L'Espagne, l'Italie, le Portugal ont une forte culture petanque
- Le **Maghreb** et l'**Afrique subsaharienne francophone** sont des marches emergents pour le mobile
- La localisation multiplie l'audience potentielle par **3-5x** avec un effort minimal

---

## 2. LANGUES PRIORITAIRES

| Priorite | Langue | Code | Marche | Justification |
|----------|--------|------|--------|---------------|
| P1 | Francais | `fr` | France, Quebec, Afrique | Langue native du jeu |
| P1 | Anglais | `en` | US, UK, Global | Marche #1 mondial |
| P2 | Espagnol | `es` | Espagne, Amerique latine | Forte culture petanque |
| P2 | Italien | `it` | Italie | Bocce = cousin, marche receptif |
| P3 | Portugais | `pt` | Bresil, Portugal | Grand marche mobile |
| P3 | Allemand | `de` | Allemagne, Autriche | Marche PC fort |
| P4 | Arabe | `ar` | Maghreb | Culture petanque, RTL challenge |
| P4 | Japonais | `ja` | Japon | Marche indie receptif |

---

## 3. ARCHITECTURE I18N

### 3.1 Structure des fichiers

```
/public/data/i18n/
  fr.json       # Francais (langue de base)
  en.json       # Anglais
  es.json       # Espagnol
  it.json       # Italien
  ...
```

### 3.2 Format des fichiers de traduction

```json
// fr.json
{
  "meta": {
    "language": "Français",
    "code": "fr",
    "direction": "ltr",
    "author": "Equipe Petanque Master"
  },
  "menu": {
    "arcade": "Arcade",
    "quick_play": "Partie Rapide",
    "shop": "Boutique",
    "options": "Options",
    "quit": "Quitter"
  },
  "game": {
    "your_turn": "A vous de jouer !",
    "opponent_turn": "Tour de {name}",
    "mene": "Mène {current}/{total}",
    "score": "Score",
    "boules_remaining": "{count} boule(s) restante(s)",
    "throw_modes": {
      "roulette": "Roulette",
      "demi_portee": "Demi-portée",
      "plombee": "Plombée",
      "tir": "Tir"
    },
    "focus": "Focus",
    "focus_charges": "{remaining}/{total} charges"
  },
  "results": {
    "victory": "VICTOIRE !",
    "defeat": "DÉFAITE",
    "score_final": "Score final : {scoreA} - {scoreB}",
    "best_throw": "Meilleur tir : {distance}cm",
    "carreaux": "Carreaux : {count}",
    "avg_distance": "Distance moyenne : {distance}cm",
    "menes_played": "Mènes jouées : {count}",
    "ecus_earned": "+{amount} Écus",
    "xp_earned": "+{amount} XP",
    "continue": "Continuer",
    "replay": "Rejouer",
    "share": "Partager"
  },
  "characters": {
    "rookie": {
      "name": "Le Rookie",
      "title": "L'Apprenti du Boulodrome",
      "catchphrase": "J'apprends vite."
    },
    "ley": {
      "name": "Ley",
      "title": "Le Tireur Instinctif",
      "catchphrase": "Je vise pas, je sais."
    },
    "marcel": {
      "name": "Marcel",
      "title": "Le Vieux Renard",
      "catchphrase": "J'ai oublié plus que t'apprendras jamais."
    },
    "la_choupe": {
      "name": "La Choupe",
      "title": "Le Boulet de Canon",
      "catchphrase": "BOUM !"
    },
    "magicien": {
      "name": "Le Magicien",
      "title": "Le Maître du Terrain",
      "catchphrase": "Le terrain me parle."
    },
    "reyes": {
      "name": "Reyes",
      "title": "Le Mur",
      "catchphrase": "Tu ne passeras pas."
    }
  },
  "terrains": {
    "village": "Place du Village",
    "plage": "Plage de la Ciotat",
    "parc": "Parc Municipal",
    "colline": "Colline aux Oliviers",
    "docks": "Les Docks"
  },
  "tutorial": {
    "step1": "Le cochonnet est lancé. C'est la cible !",
    "step2": "Glissez pour viser, relâchez pour lancer",
    "step3": "Glissez plus ou moins loin pour doser la puissance",
    "step4": "Fin de la mène ! Vos boules les plus proches comptent",
    "step5": "Première à 13 points !"
  },
  "shop": {
    "title": "Boutique",
    "buy": "Acheter ({price} Écus)",
    "owned": "Possédé",
    "not_enough": "Pas assez d'Écus",
    "confirm_purchase": "Acheter {item} pour {price} Écus ?"
  },
  "accessibility": {
    "colorblind_mode": "Mode daltonien",
    "text_size": "Taille du texte",
    "screen_shake": "Secousse écran",
    "vibrations": "Vibrations"
  },
  "common": {
    "back": "Retour",
    "confirm": "Confirmer",
    "cancel": "Annuler",
    "yes": "Oui",
    "no": "Non",
    "loading": "Chargement..."
  }
}
```

### 3.3 Systeme de traduction (runtime)

```javascript
// src/utils/I18n.js
class I18n {
  static locale = 'fr';
  static strings = {};

  static async load(locale) {
    const response = await fetch(`data/i18n/${locale}.json`);
    this.strings = await response.json();
    this.locale = locale;
  }

  static t(key, params = {}) {
    // Naviguer dans l'objet : "game.your_turn" → strings.game.your_turn
    const value = key.split('.').reduce((obj, k) => obj?.[k], this.strings);
    if (!value) return `[${key}]`; // Fallback visible pour debug

    // Remplacer les variables : "{name}" → params.name
    return value.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
  }

  static getDirection() {
    return this.strings.meta?.direction || 'ltr';
  }
}

export default I18n;
```

### 3.4 Usage dans le code

```javascript
// Avant (hardcode)
this.add.text(400, 200, 'VICTOIRE !', style);

// Apres (i18n)
this.add.text(400, 200, I18n.t('results.victory'), style);
this.add.text(400, 300, I18n.t('results.score_final', { scoreA: 13, scoreB: 8 }), style);
this.add.text(400, 350, I18n.t('results.best_throw', { distance: 2 }), style);
```

---

## 4. DEFIS DE TRADUCTION

### 4.1 Noms propres et humour

Les noms des personnages et leurs catchphrases sont **culturellement francais**. Options :

| Strategie | Avantage | Inconvenient |
|-----------|----------|-------------|
| **Garder les noms francais** | Authenticite, exotisme | Prononciation difficile |
| **Traduire les noms** | Accessible | Perd le charme provencal |
| **Noms francais + traduction des titres** | Compromis | ✅ Recommande |

**Recommandation** : garder les noms ("Marcel", "La Choupe", "Le Magicien") dans toutes les langues. Traduire les titres et catchphrases.

### 4.2 Pluralisation

Le francais et l'anglais ont des regles de pluriel differentes. L'arabe en a 6.

```javascript
// Systeme de pluralisation simple
static tp(key, count) {
  const base = this.t(key);
  if (typeof base === 'object') {
    if (count === 0) return base.zero || base.other;
    if (count === 1) return base.one || base.other;
    return (base.other || '').replace('{count}', count);
  }
  return base.replace('{count}', count);
}

// fr.json
"boules_remaining": {
  "zero": "Plus de boules",
  "one": "1 boule restante",
  "other": "{count} boules restantes"
}
```

### 4.3 Direction RTL (arabe)

Si on supporte l'arabe (Phase 4) :
- Inverser le layout UI (miroir horizontal)
- Texte aligne a droite
- Menus scrollent de droite a gauche
- Les chiffres restent en LTR

```javascript
if (I18n.getDirection() === 'rtl') {
  // Inverser les positions X des elements UI
  element.x = GAME_WIDTH - element.x;
  element.setOrigin(1, 0); // Ancrage a droite
}
```

### 4.4 Longueur du texte

L'allemand est ~30% plus long que le francais. L'anglais est ~20% plus court.

| Langue | Longueur relative | Exemple "Partie Rapide" |
|--------|------------------|------------------------|
| Francais | 100% (base) | Partie Rapide |
| Anglais | ~80% | Quick Play |
| Allemand | ~130% | Schnelles Spiel |
| Espagnol | ~110% | Partida Rápida |
| Italien | ~115% | Partita Veloce |
| Japonais | ~60% | クイックプレイ |

**Solution** : tester l'UI avec les textes les plus longs (allemand) pour s'assurer que rien ne deborde.

---

## 5. LOCALISATION DES ASSETS

### 5.1 Texte dans les images

**Regle** : AUCUN texte dans les sprites ou les images. Tout texte doit etre rendu dynamiquement par Phaser. Sinon, il faudrait re-generer les images pour chaque langue.

Exceptions :
- Le logo "PETANQUE MASTER" peut rester en francais (c'est la marque)
- Les onomatopees ("BOUM!") peuvent rester universelles

### 5.2 Audio localise

Pour le MVP, pas de voix. Donc pas de localisation audio.

En Phase 3+ (si voix ajoutees) :
- Voix francaises par defaut
- Option sous-titres pour les autres langues
- Enregistrement anglais si budget le permet

---

## 6. DETECTION AUTOMATIQUE DE LA LANGUE

```javascript
// Detecter la langue du navigateur
function detectLocale() {
  const stored = localStorage.getItem('locale');
  if (stored) return stored;

  const browserLang = navigator.language?.split('-')[0] || 'fr';
  const supported = ['fr', 'en', 'es', 'it', 'pt', 'de'];

  return supported.includes(browserLang) ? browserLang : 'en'; // Fallback anglais
}

// Au demarrage
const locale = detectLocale();
await I18n.load(locale);
```

---

## 7. WORKFLOW DE TRADUCTION

### 7.1 Processus

```
1. Developper en francais (langue de base)
2. Extraire les nouvelles cles (diff fr.json)
3. Traduire en anglais (dev bilingue ou IA)
4. Faire relire par un natif (crowdsource ou freelance)
5. Traduire les autres langues (Phase 2+)
```

### 7.2 Outils

| Outil | Usage | Prix |
|-------|-------|------|
| **Fichiers JSON manuels** | MVP, controle total | Gratuit |
| **DeepL API** | Traduction IA de qualite | 5.49€/mo (500k chars) |
| **Crowdin** | Plateforme de traduction communautaire | Gratuit open-source |
| **Localazy** | Alternative Crowdin | Gratuit < 200 cles |
| **POEditor** | Simple, collaboratif | Gratuit < 1000 strings |

### 7.3 Contribution communautaire

Si le jeu a une communaute (Discord) :
- Partager les fichiers JSON de traduction
- Les joueurs natifs proposent des traductions
- Review par le dev avant integration
- Credit dans le jeu ("Traduction : Communaute Discord")

---

## 8. ADAPTATION CULTURELLE

### 8.1 Au-dela de la traduction

| Element | Adaptation necessaire |
|---------|----------------------|
| Monnaie (Ecus) | Garder "Ecus" partout (c'est un element de lore) |
| Format de date | FR: 18/03/2026, EN: 03/18/2026, ISO: 2026-03-18 |
| Separateur decimal | FR: 12,5cm, EN: 12.5cm |
| Couleurs | Vert = positif partout ? Non en Chine (mort). Mais notre public cible est occidental |
| Humour | Les catchphrases doivent etre droles dans chaque langue |
| References culturelles | "Fanny" (tradition petanque) → expliquer en anglais |

### 8.2 Store listings (App Store / Google Play)

Chaque langue a besoin de :
- Titre localise (mais garder "Petanque Master" partout)
- Description courte (80 chars)
- Description longue (4000 chars)
- Screenshots avec textes localises
- Mots-cles (ASO)

```
EN: "Competitive petanque with fighting game spirit. Choose your champion!"
FR: "La pétanque compétitive avec l'esprit jeu de combat. Choisis ton champion !"
ES: "¡Petanca competitiva con espíritu de juego de lucha. Elige tu campeón!"
IT: "Bocce competitive con spirito da picchiaduro. Scegli il tuo campione!"
```

---

## 9. IMPLEMENTATION PAR PHASE

### Phase 1 — MVP (francais uniquement)
- Structurer le code pour l'i18n (pas de texte hardcode)
- Creer `fr.json` avec toutes les cles
- Implementer `I18n.js` basique
- Effort : 4-6h de refactoring

### Phase 2 — Anglais
- Traduire `en.json` (dev bilingue)
- Tester l'UI avec les textes anglais
- Selector de langue dans Options
- Store listing en anglais
- Effort : 8-12h

### Phase 3 — Langues tier 2
- Espagnol, Italien (traduction IA + review)
- Tester les layouts (textes longs allemand)
- Crowdsourcing communautaire sur Discord
- Effort : 4h par langue

### Phase 4 — Langues tier 3+
- Portugais, Allemand, Arabe, Japonais
- Support RTL si arabe
- Effort : variable

---

## 10. CHECKLIST I18N

### Avant le lancement (meme en francais uniquement)

- [ ] Aucun texte hardcode dans le code (tout passe par I18n.t)
- [ ] Aucun texte dans les images/sprites
- [ ] Fichier `fr.json` complet avec toutes les cles
- [ ] `I18n.js` fonctionnel avec fallback
- [ ] Detection automatique de la langue du navigateur
- [ ] Selector de langue dans les Options
- [ ] Les noms de personnages sont dans le JSON (pas dans le code)
- [ ] Pluralisation geree pour les compteurs
- [ ] Caracteres speciaux affiches correctement (accents, ñ, ü)
- [ ] Police supportant les caracteres de toutes les langues cibles
