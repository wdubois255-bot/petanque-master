# 46 — Shop UI/UX Patterns for Indie Games

> A lire quand : on cree la ShopScene, on calibre les prix des Ecus, ou on travaille sur l'economie in-game.
> Complementaire a : research/38 (retention), SPRINT_FINAL.md (shop.json)

---

## 1. EXEMPLES DE BOUTIQUES BIEN FAITES

### 1.1 Hollow Knight — Marchand (Geo)

| Aspect | Detail |
|--------|--------|
| **Layout** | Liste verticale avec icone + nom + prix |
| **Monnaie** | Geo (drops de monstres) |
| **Prix** | 100-800 Geo (1h de farm = ~500 Geo) |
| **Particularite** | Chaque item a une description evocatrice |
| **Animation achat** | Geo qui volent vers le marchand, son "clink clink" |
| **Ce qui marche** | Les items sont UTILES (pas cosmétiques). L'achat = power-up immediat |
| **Lecon PM** | Les boules en boutique doivent avoir un effet gameplay tangible |

### 1.2 Hades — Miroir de la Nuit (Darkness)

| Aspect | Detail |
|--------|--------|
| **Layout** | Liste verticale, chaque ligne = 1 upgrade permanent |
| **Monnaie** | Darkness (gagnee en run) |
| **Prix** | Croissants (10 → 50 → 100 → 500 → 1000) |
| **Particularite** | Chaque upgrade a 2 variantes (choix A ou B) |
| **Animation** | Remplissage progressif de la barre, son de "power up" |
| **Ce qui marche** | La progression est **visible** (barres qui se remplissent) |
| **Lecon PM** | Afficher la progression vers le prochain achat possible |

### 1.3 Stardew Valley — Magasins

| Aspect | Detail |
|--------|--------|
| **Layout** | Grille d'items avec icone + prix sous chacun |
| **Monnaie** | Pieces d'or |
| **Particularite** | Inventaire rotatif (saisons), items speciaux le vendredi |
| **Animation** | Discret — l'item apparait dans l'inventaire |
| **Ce qui marche** | La rotation cree du FOMO sain ("je reviens demain") |
| **Lecon PM** | Items en rotation hebdomadaire dans la boutique = raison de revenir |

### 1.4 Dead Cells — Collecteur (Cellules)

| Aspect | Detail |
|--------|--------|
| **Layout** | Grille avec items verrouilles (silhouette) vs debloques |
| **Monnaie** | Cellules (drops en run, perdues a la mort) |
| **Prix** | Varies (30-100 cellules) |
| **Animation** | L'item se "construit" piece par piece quand achete |
| **Ce qui marche** | Les items verrouilles (silhouettes) creent la curiosite |
| **Lecon PM** | Montrer les items non-achetes en silhouette, avec prix = motivation |

### 1.5 Animal Crossing — Nook's Cranny

| Aspect | Detail |
|--------|--------|
| **Layout** | "Etalage" visuel — les items sont poses sur des tables/etageres |
| **Monnaie** | Clochettes |
| **Particularite** | Inventaire change chaque jour |
| **Ce qui marche** | L'experience d'achat est spatiale, pas juste un menu |
| **Lecon PM** | Notre boutique pourrait etre une "scene" avec un marchand provencal |

---

## 2. PATTERNS UI BOUTIQUE

### 2.1 Layout : Grille vs Liste vs Carrousel

| Layout | Quand l'utiliser | Pour PM |
|--------|-----------------|---------|
| **Grille** | Beaucoup d'items (>10), items visuels (cosmetiques) | ✅ Boules et cochonnets |
| **Liste** | Peu d'items (<8), items avec description longue | Pour les capacites |
| **Carrousel** | Categories separees, mobile | Pas adapte a 832x480 |

**Recommandation PM** : Grille avec onglets de categorie.

### 2.2 Mockup ShopScene (832x480)

```
┌──── BOUTIQUE ──── [Ecus: 350 🪙] ──────────────┐
│                                                   │
│ [Boules]  [Cochonnets]  [Capacites]              │
│ ─────────────────────────────────────────────     │
│                                                   │
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │
│ │ 🟤   │  │ ⚪   │  │ 🟡   │  │ ⬛   │          │
│ │Bronze │  │Chrome│  │Doree │  │Noire │          │
│ │100 🪙│  │100 🪙│  │300 🪙│  │200 🪙│          │
│ └──────┘  └──────┘  └──────┘  └──────┘          │
│                                                   │
│ ┌──────────────────────────────────────┐         │
│ │ BOULE DOREE                          │         │
│ │ "Forgee par le soleil de Provence"   │         │
│ │ +2% toutes stats                     │         │
│ │ Prix : 300 Ecus                      │         │
│ │                                      │         │
│ │ [ACHETER]                            │         │
│ └──────────────────────────────────────┘         │
│                                                   │
│ [Retour]                                          │
└───────────────────────────────────────────────────┘
```

### 2.3 Affichage des prix

| Etat | Affichage | Couleur |
|------|----------|---------|
| Assez d'Ecus | "300 🪙" | Blanc/creme #F5E6CC |
| Pas assez | "300 🪙" | Rouge #E2725B + barré ou grise |
| Deja possede | "POSSEDE ✓" | Vert #4CAF50 |
| Nouveau ! | Badge "NEW" sur l'item | Dore #FFD700, pulse |

### 2.4 Preview avant achat

Quand le joueur selectionne un item :
- **Boule** : apercu 3D (rotation lente) + stats comparees (avant/apres)
- **Cochonnet** : apercu sur un mini-terrain
- **Capacite** : description + animation demo

```
┌─── COMPARAISON ────────────┐
│ Stats avec Boule Bronze :  │
│ Precision  ████████░░  -5% │   ← rouge, baisse
│ Puissance  ██████████  +5% │   ← vert, hausse
│ Effet      ██████░░░░      │
│ Sang-froid ████████░░      │
└────────────────────────────┘
```

### 2.5 Animation d'achat

**Sequence (1.5s total)** :

| Temps | Action | Feedback |
|-------|--------|---------|
| 0.0s | Bouton "ACHETER" pressed | Bouton scale 0.95, SFX "click" |
| 0.1s | Confirmation popup | "Acheter [item] pour [prix] Ecus ?" |
| 0.3s | Joueur confirme | Popup disparait |
| 0.3s | Pieces volent du compteur vers l'item | Animation particules dorees |
| 0.6s | Compteur Ecus decremente (anime) | SFX "coins clinking" |
| 0.8s | Item brille (glow pulse) | SFX "power up ding" |
| 1.0s | Badge "POSSEDE ✓" apparait | Vert, bounce animation |
| 1.2s | Notification "Equipe automatiquement !" | Si c'est la premiere boule |

### 2.6 Categories et filtres

```
[Boules (5)]  [Cochonnets (4)]  [Capacites (2)]
     ↑ actif      ↑ nb d'items dans la categorie
```

- **Onglet actif** : bordure doree #FFD700, fond plus clair
- **Badge sur l'onglet** : nombre d'items non-achetes
- **Indicateur "Nouveau !"** : point rouge sur l'onglet si nouvel item

---

## 3. ECONOMIE IN-GAME — CALIBRAGE

### 3.1 Principe du "temps-de-jeu / recompense"

Le joueur doit pouvoir acheter son **premier item** apres **3-5 matchs** (15-30 min).

| Item | Prix | Matchs necessaires | Temps | Perception |
|------|------|--------------------|-------|-----------|
| Cochonnet Bleu | 50 Ecus | 2-3 matchs | 10-15 min | "Facile, je peux me faire plaisir" |
| Cochonnet Vert | 50 Ecus | 2-3 matchs | 10-15 min | Idem |
| Boule Bronze | 100 Ecus | 4-5 matchs | 20-30 min | "Un petit investissement" |
| Boule Chrome | 100 Ecus | 4-5 matchs | 20-30 min | Idem |
| Cochonnet Dore | 150 Ecus | 6-8 matchs | 30-45 min | "Je travaille pour ça" |
| Cochonnet Noir | 100 Ecus | 4-5 matchs | 20-30 min | Raisonnable |
| Boule Noire | 200 Ecus | 8-10 matchs | 45-60 min | "Objectif moyen terme" |
| Boule Doree | 300 Ecus | 12-15 matchs | 1-1.5h | "Objectif sérieux" |
| Boule Titane | 500 Ecus | 20-25 matchs | 2-3h | "Objectif long terme" |
| Charge capacite +1 | 300 Ecus | 12-15 matchs | 1-1.5h | "Power-up rare" |

### 3.2 Sources d'Ecus (rappel)

| Source | Montant | Frequence |
|--------|---------|-----------|
| Victoire Arcade | 50 | Par match |
| Victoire Quick Play | 20 | Par match |
| Carreau | +10 bonus | Par carreau |
| Run Arcade complete | +100 bonus | Par run |
| Run parfaite | +200 bonus (remplace +100) | Par run parfaite |
| Premier lancement | 50 cadeau | Une fois |

**Revenu moyen par session** (30 min, 3 matchs) : **~100-200 Ecus**

### 3.3 Items gratuits vs boutique

| Principe | Application |
|----------|------------|
| **Gratuit = deblocage par achievement** | Persos (Arcade), terrains (victoires), badges |
| **Boutique = cosmetiques** | Boules, cochonnets, capacites bonus |
| **Jamais payant = gameplay** | Les 5 persos, les 5 terrains, le mode Arcade |

### 3.4 Rotation d'items (Phase 2)

Inspiration Animal Crossing/Fortnite :

- **Item du jour** : 1 item en promotion (-30%) chaque 24h
- **Item de la semaine** : 1 item rare disponible uniquement cette semaine
- **Affichage** : section speciale en haut de la boutique, timer de compte a rebours

```
┌──── OFFRE DU JOUR ─────────────┐
│ ⏰ Expire dans 14h 23min       │
│                                 │
│ Cochonnet Noir — 70 🪙 (100)   │
│                     ↑ barre    │
│ [ACHETER]                       │
└─────────────────────────────────┘
```

---

## 4. BUNDLES ET PROMOTIONS

### 4.1 Packs thematiques

| Pack | Contenu | Prix | Economie |
|------|---------|------|----------|
| "Pack Debutant" | Boule Bronze + Cochonnet Bleu | 120 Ecus (vs 150) | -20% |
| "Pack Prestige" | Boule Doree + Cochonnet Dore | 380 Ecus (vs 450) | -15% |
| "Pack Complet" | Toutes les boules + tous les cochonnets | 1200 Ecus (vs 1550) | -23% |

### 4.2 Psychologie des bundles

- Les bundles creent un sentiment de **"bonne affaire"**
- L'economie doit etre **reelle et visible** (prix barre + pourcentage)
- Ne pas mettre plus de 2-3 bundles (paralysie du choix)
- Le "Pack Complet" est pour les completionnistes — prix eleve mais tout inclus

---

## 5. FEEDBACK ET SATISFACTION

### 5.1 Les 3 moments de satisfaction d'un achat

1. **La decision** : "J'ai economise assez, je vais m'offrir ça"
2. **L'animation** : les pieces volent, l'item brille, le son est satisfaisant
3. **L'utilisation** : la boule apparait en jeu, elle est belle/differente

### 5.2 Post-achat

Apres un achat :
- L'item est **automatiquement equipe** (pas de friction)
- Notification : "Boule Doree equipee ! +2% toutes stats"
- Au prochain match : la boule est visible en jeu (feedback immediat)
- Le joueur voit la difference (meme si +2% est petit, l'aspect visuel change)

### 5.3 Eviter la "buyer's remorse"

| Probleme | Solution |
|---------|---------|
| "J'ai achete le mauvais item" | Pas de vente d'items (pas de "revendre a 50%") → preview claire avant achat |
| "C'est trop cher" | L'item du jour en promo → le joueur attend l'offre |
| "J'ai achete et c'est nul" | Chaque item a un effet visible et tangible |
| "J'ai tout achete, plus rien a faire" | Rotation + Phase 2 = nouveaux items reguliers |

---

## 6. MARCHAND / NPC PROVENCAL

### 6.1 Concept : "Le Père Fernand"

Au lieu d'un menu froid, la boutique est tenue par un **PNJ provençal** :

```
┌──── BOUTIQUE DU PÈRE FERNAND ────────────────────┐
│                                                    │
│  [Portrait]  "Ah, regarde-moi ces merveilles !"   │
│              "Tu vas pas regretter, peuchère !"    │
│                                                    │
│  [Grille d'items]                                  │
│  ...                                               │
└────────────────────────────────────────────────────┘
```

- **Dialogues** varies a chaque visite (pool de 10+ phrases)
- **Reactions** a l'achat : "Excellent choix !", "Tu vas les epater !"
- **Reactions** au manque d'Ecus : "Reviens quand t'auras les sous, fiston"
- **Atmosphere** : musique jazzy decontractee, ambiance marche provencal

### 6.2 Phrases du Père Fernand

```
// Accueil
"Ah, un client ! Regarde-moi ces merveilles !"
"Peuchère, tu vas pas en croire tes yeux !"
"Entre, entre ! Les prix sont doux comme le mistral !"
"Le meilleur materiel de petanque de la region !"

// Achat
"Excellent choix ! Tu vas faire des jaloux !"
"Ah celle-la, c'est ma preferee. Bon choix !"
"Tu vas les epater sur le terrain, garanti !"

// Pas assez d'Ecus
"Oh peuchère, il te manque quelques pieces..."
"Reviens quand t'auras les sous, sans rancune !"
"Tu veux que je te fasse credit ? ...Non j'rigole."

// Retour
"Merci, a bientot ! Et vise bien !"
"Allez, file sur le terrain maintenant !"
```

---

## 7. IMPLEMENTATION TECHNIQUE

### 7.1 Fichiers concernes

| Fichier | Role |
|---------|------|
| `src/scenes/ShopScene.js` | Scene de boutique (nouveau) |
| `public/data/shop.json` | Catalogue items et prix |
| `src/utils/SaveManager.js` | Ecus, achats, inventaire |
| `src/utils/Constants.js` | Prix par defaut, categories |

### 7.2 Structure shop.json

```json
{
  "categories": ["boules", "cochonnets", "capacites"],
  "items": [
    {
      "id": "boule_bronze",
      "category": "boules",
      "name": "Boule Bronze",
      "description": "Forgée dans le cuivre provençal",
      "price": 100,
      "effect": { "puissance_x": 1.05, "precision_x": 0.95 },
      "effect_description": "Puissance +5%, Précision -5%",
      "sprite": "boule_bronze",
      "rarity": "common"
    }
  ],
  "bundles": [
    {
      "id": "pack_debutant",
      "name": "Pack Débutant",
      "items": ["boule_bronze", "cochonnet_bleu"],
      "price": 120,
      "original_price": 150
    }
  ]
}
```

### 7.3 Estimation effort

| Composant | Effort |
|-----------|--------|
| ShopScene layout + navigation | 4h |
| Systeme achat + SaveManager | 2h |
| Animation achat | 2h |
| Preview items + comparaison | 3h |
| Dialogues Père Fernand | 1h |
| shop.json + donnees | 1h |
| **Total** | **~13h** |
