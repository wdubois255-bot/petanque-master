# 45 — Systemes de Progression dans les Jeux de Sport Indies

> A lire quand : on travaille sur le Rookie, les stats, la boucle de progression, ou le rythme des deblocages.
> Complementaire a : research/38 (retention/engagement), SPRINT_FINAL.md (implementation)

---

## 1. ANALYSE DE CAS CONCRETS

### 1.1 Golf Story (Switch, 2017)

| Aspect | Detail |
|--------|--------|
| **Genre** | RPG + Golf, top-down pixel art |
| **Progression** | Stats (Power, Purity, Strike, Ability, Spin) augmentées par XP |
| **XP source** | Matchs, quêtes, mini-jeux |
| **Skill cap** | ~15h pour maxer le perso |
| **Ce qui marche** | Le golf EST le combat RPG. Chaque stat change réellement le gameplay |
| **Ce qui rate** | Les quêtes filler alourdissent le rythme |
| **Leçon PM** | Les stats du Rookie doivent avoir un impact **palpable** a chaque +1. Pas de stat cosmétique. |

**Rythme de progression Golf Story** :
- Debut : stats 40/100 → lancers courts, imprecis
- Mi-jeu : stats 70/100 → le joueur sent la puissance monter
- Fin : stats 95/100 → "power fantasy" atteint

### 1.2 Dodgeball Academia (2021)

| Aspect | Detail |
|--------|--------|
| **Genre** | RPG + Dodgeball, cartoon style |
| **Progression** | HP, ATK, SPD par level up + abilities equippables |
| **Particularite** | Chaque perso recrute a un arbre de talents unique |
| **Rythme** | 1 level up toutes les 30-45 min |
| **Ce qui marche** | Les abilities changent radicalement le gameplay (pas juste +1 stat) |
| **Leçon PM** | Les capacites du Rookie (Coup d'Oeil, Second Souffle) doivent etre **game-changing**, pas des bonus mineurs |

### 1.3 Windjammers 2 (2022)

| Aspect | Detail |
|--------|--------|
| **Genre** | Sport arcade competitif (frisbee) |
| **Roster** | 10 personnages, tous disponibles immediatement |
| **Progression** | Online ranked uniquement (pas de progression stats) |
| **Ranked** | Bronze → Argent → Or → Platine → Diamant → Champion |
| **Ce qui marche** | La progression est 100% skill-based, pas de grind artificiel |
| **Leçon PM** | Pour le **Quick Play/Online**, la progression doit etre du skill pur. Le Rookie RPG = mode Arcade uniquement |

### 1.4 Pyre (Supergiant, 2017)

| Aspect | Detail |
|--------|--------|
| **Genre** | RPG narratif + sport (3v3 basketball-like) |
| **Progression** | XP par match, arbres de talents par personnage |
| **Particularite** | Les persos que tu liberes (sacrifies) disparaissent — choix moral |
| **Rythme** | ~2 matchs pour 1 level up |
| **Ce qui marche** | Chaque level-up est une **decision** (quel talent?), pas automatique |
| **Leçon PM** | Le choix du stat point (+1 precision OU +1 puissance) est une micro-decision strategique. Bien le presenter |

### 1.5 Mario Tennis Aces (2018) — Adventure Mode

| Aspect | Detail |
|--------|--------|
| **Genre** | Sport + aventure |
| **Progression** | Stats (Agilite, Vitesse, Force, Precis) montent automatiquement |
| **Rythme** | +1 stat tous les 1-2 matchs |
| **Level max** | ~Level 30, atteignable en ~5h |
| **Ce qui marche** | La difficulte monte en parallele → le joueur ne se sent jamais OP |
| **Ce qui rate** | Pas de choix dans la repartition (automatique) → moins engageant |
| **Leçon PM** | Le choix libre des stats du Rookie est un **avantage** sur Mario. Garder ça. |

### 1.6 Inazuma Eleven (DS, 2008+)

| Aspect | Detail |
|--------|--------|
| **Genre** | RPG + Football, tour par tour |
| **Progression** | XP classique, level up, stats auto + techniques apprises |
| **Recrutement** | Recruter des joueurs dans le monde = collection |
| **Techniques** | Coups speciaux acquis par entrainement ou items |
| **Ce qui marche** | La collection de joueurs cree un attachement massif |
| **Leçon PM** | Les persos debloques en Arcade = mini-collection. Chacun doit etre desirable. |

---

## 2. SYSTEMES DE POINTS DE COMPETENCE

### 2.1 Comparaison des modeles

| Modele | Exemple | Avantage | Inconvenient |
|--------|---------|----------|-------------|
| **Points libres** | Diablo 2, Golf Story | Choix du joueur, builds uniques | Risque de "mauvais build" |
| **Arbre de talents** | LoL, Pyre | Decisions strategiques, branches | Complexe pour un jeu casual |
| **Paliers auto** | Mario Tennis | Simple, pas de mauvais choix | Pas engageant, passif |
| **Hybride** | Dark Souls (stats libres + scaling) | Profondeur + accessibilite | Plus dur a equilibrer |

**Recommandation PM** : **Points libres** (comme actuellement). C'est le modele le plus adapte pour 4 stats simples. Pas besoin d'arbre de talents — la petanque a 4 dimensions claires.

### 2.2 Rythme optimal de progression

**Donnees de reference** (jeux de sport/RPG indies) :

| Jeu | Temps pour maxer | Victoires necessaires | Feeling |
|-----|-----------------|----------------------|---------|
| Golf Story | 15h | ~60 matchs | Lent mais riche |
| Dodgeball Academia | 12h | ~40 combats | Bien rythme |
| Mario Tennis Aces | 5h | ~25 matchs | Rapide |
| Pokemon (badge 8) | 25h | ~200 combats | Tres long |
| Fire Emblem (max level) | 30h | ~100 chapitres | Marathon |

**Pour Petanque Master** :

| Palier | Points | Victoires arcade | Temps estime | Emotion |
|--------|--------|------------------|-------------|---------|
| Depart | 10/40 | 0 | 0 | "Je suis faible mais je vais grandir" |
| Premiers choix | 14/40 | 2 (1 run) | 30 min | "Je commence a me specialiser" |
| Capacite 1 | 20/40 | 5 (2-3 runs) | 1.5h | "NOUVEAU POUVOIR !" |
| Mi-parcours | 26/40 | 8 (3-4 runs) | 2.5h | "Je suis fort maintenant" |
| Capacite 2 | 34/40 | 12 (5-6 runs) | 4h | "POUVOIR ULTIME !" |
| Maxed | 40/40 | 15 (6-7 runs) | 5h | "Je suis le maitre" |

**~5h pour maxer = sweet spot** pour un jeu casual. Assez long pour creer de l'attachement, assez court pour que le joueur finisse.

### 2.3 Le "Power Fantasy" — Quand le joueur se sent fort

Le moment cle est **entre 50% et 75% de la progression** (20-30/40 pts).

Pourquoi :
- A 50% (20 pts), le joueur a assez de stats pour sentir la difference vs le debut
- A 75% (30 pts), il a la deuxieme capacite → moment "boss mode"
- A 100% (40 pts), c'est la cerise — satisfaction de completion, pas de power spike

**Danger** : si le joueur se sent fort a 100% seulement, la progression est trop lente. Si il se sent fort a 25%, elle est trop rapide.

---

## 3. STARTER CHARACTERS — POURQUOI ILS MARCHENT

### 3.1 Analyse des starters iconiques

| Personnage | Jeu | Pourquoi il marche |
|-----------|-----|-------------------|
| **Ryu** | Street Fighter | Simple (3 coups speciaux), efficace, design iconique |
| **Sol Badguy** | Guilty Gear | Puissant, direct, design cool ("pas ennuyeux d'etre basique") |
| **Kirby** | Smash Bros | Facile (vol, copie), mignon, non-intimidant |
| **Mario** | Mario Kart | Equilibre parfait, reconnaissable universellement |
| **Lucario** | Pokemon | Le "underdog" qui devient fort (commence faible, finit puissant) |
| **Zagreus** | Hades | Personnalite forte, humour, le joueur S'EST le perso |

### 3.2 Les 5 regles d'un bon starter

1. **Simple mais pas nul** : ses mecaniques de base doivent marcher sans explications
2. **Un look attachant** : le joueur doit VOULOIR jouer ce perso, pas le subir
3. **Un plafond de skill** : meme simple, il peut etre joue a haut niveau
4. **Une identite** : il n'est pas "le perso generique", il a une personnalite
5. **Progression visible** : le joueur voit son perso devenir fort (stats, visuels, abilities)

### 3.3 Le Rookie — Forces et risques

| Force | Risque | Solution |
|-------|--------|---------|
| Personnalisable (choix stats) | "Je ne sais pas quoi choisir" | Presets sugeres ("Tireur", "Pointeur", "Equilibre") |
| Progresse avec le joueur | "Pourquoi jouer les autres ?" | Les autres persos ont des capacites uniques et fun |
| Represente le joueur | "Il est ennuyeux" | Lui donner une personnalite (catchphrases, animations) |
| Commence faible | "Le debut est frustrant" | L'IA du match 1 est tres facile (compense) |

### 3.4 Progression visuelle du Rookie

Les jeux qui recompensent visuellement la progression :

| Jeu | Evolution visuelle |
|-----|-------------------|
| **Dark Souls** | L'armure change avec le loot |
| **Monster Hunter** | Armure = trophee du monstre vaincu |
| **Hades** | Zagreus gagne des accessoires (capes, couronnes) |
| **Fire Emblem** | Promotion de classe = nouveau sprite |

**Application PM — Le Rookie a 3 tenues** :

| Palier | Apparence | Changement visuel |
|--------|-----------|------------------|
| 10-19 pts | Tenue debutant | T-shirt, casquette, look "dimanche" |
| 20-29 pts | Tenue intermediaire | Polo, lunettes de soleil, posture plus assuree |
| 30-40 pts | Tenue pro | Maillot personnalise, headband, aura de confiance |

**Cout** : 3 variants du sprite 32x32 (12 frames chacun × 3 = 36 frames). Realisable via PixelLab en ~1h + retouche.

---

## 4. APPLICATION A PETANQUE MASTER — RECOMMANDATIONS

### 4.1 Rythme de progression — Analyse actuelle vs optimal

**Systeme actuel (SPRINT_FINAL.md)** :
- +2 pts par victoire Arcade
- +1 pt par victoire Quick Play (avec Rookie)
- 0 pt en defaite

**Probleme identifie** : a +2 par victoire Arcade (3 matchs/run), il faut 15 victoires = 5 runs completes pour atteindre 40/40. C'est **correct** (~5h).

**Mais** : si le joueur joue principalement Quick Play (+1 pt), il faut 30 victoires = ~10h. C'est **trop long pour du casual**.

**Recommandation** : ajuster les gains

| Source | Actuel | Recommande | Justification |
|--------|--------|-----------|---------------|
| Victoire Arcade | +2 pts | +2 pts | OK — Arcade = mode principal |
| Victoire Quick Play (Rookie) | +1 pt | +1 pt | OK — bonus pour jouer Rookie |
| Victoire Quick Play (autre perso) | 0 pt | 0 pt | OK — pas de XP |
| Carreau en match (Rookie) | 0 pt | +1 pt bonus | Recompense le skill |
| Run Arcade parfaite (3/3) | 0 pt bonus | +2 pts bonus | Incentive a ne pas perdre |

Avec ces ajustements : un joueur qui fait des carreaux et des runs parfaites atteint 40/40 en ~4h (plus rapide et plus satisfaisant).

### 4.2 Paliers de capacites — Analyse

**Systeme actuel** : 2 capacites (20 pts et 30 pts)

**Recommandation** : 3 capacites pour un meilleur rythme

| Palier | Pts | Capacite | Justification |
|--------|-----|----------|---------------|
| 18/40 | ~4 victoires | **Coup d'Oeil** (distance cochonnet 2s) | Reward rapide, utile pour apprendre |
| 26/40 | ~8 victoires | **Second Souffle** (relance si depasse >2m) | Mid-game power spike, change la strategie |
| 34/40 | ~12 victoires | **Zone de Confort** (le Rookie a -50% wobble pres du cercle de lancer) | Late-game mastery, reward la precision |

**Pourquoi 3 au lieu de 2** :
- Les paliers a 18/26/34 sont espaces de 8 pts = ~3-4 victoires chacun
- Le joueur ne passe jamais plus de 1.5h sans debloquer quelque chose
- 3 moments "WHOA" au lieu de 2 = plus de dopamine

### 4.3 Le Rookie comme personnage permanent

**Jeux ou le starter reste le perso principal** :

| Jeu | Starter | Reste-t-il pertinent ? | Comment ? |
|-----|---------|----------------------|-----------|
| **Pokemon** | Starter (Bulbi/Sala/Cara) | Oui — il est TOUJOURS dans l'equipe | Attachement emotionnel + puissance |
| **Hades** | Zagreus | Oui — c'est le seul jouable | Variete via les armes/dons |
| **Fire Emblem** | Lord (Marth, etc.) | Oui — souvent le plus fort late-game | Stats qui grandissent + arme legendaire |
| **Persona** | Joker | Oui — le seul a changer de Persona | Flexibilite unique |

**Pour PM** : le Rookie a 40/40 est **le perso le plus polyvalent** du roster (40 pts vs 24-31 pour les autres). C'est sa reward : il n'a pas de capacite flashy fixe comme Ley ou Choupe, mais il peut etre build comme le joueur veut.

### 4.4 Suggestions de presets de build

Pour aider les joueurs indecis :

| Preset | Stats (P/Pu/E/SF) a 40 pts | Style |
|--------|---------------------------|-------|
| "Le Tireur" | 6/10/6/8 = 30 + 10 libres | Puissance max, tire tout |
| "Le Pointeur" | 10/4/8/8 = 30 + 10 libres | Precision chirurgicale |
| "L'Equilibre" | 8/7/7/8 = 30 + 10 libres | Pas de faiblesse |
| "Le Flambeur" | 8/9/9/4 = 30 + 10 libres | Fort mais craque sous pression |

Ces presets sont **sugeres mais pas imposes** — le joueur peut toujours repartir librement.

---

## 5. ANTI-PATTERNS DE PROGRESSION

| Anti-pattern | Exemple | Pourquoi c'est mauvais | PM en est-il victime ? |
|-------------|---------|----------------------|----------------------|
| **Grind obligatoire** | MMOs (tuer 100 slimes) | Ennuyeux, pas de skill | Non — chaque match est un vrai match |
| **Pay-to-skip** | Jeux mobiles (acheter XP) | Detruit le sens du progres | Non — monnaie in-game uniquement |
| **Stats qui ne se sentent pas** | +0.5% damage | Increment invisible | Risque — tester que +1 Precision est tangible |
| **Progression inversee** | Le jeu devient plus facile en progressant | Plus de challenge = ennui | Risque — l'Arcade devrait rester challenging |
| **Plafond de verre** | Max level atteint, plus rien a faire | Le joueur quitte | Risque — prevoir du contenu post-40 pts |

### 5.1 Contenu post-max (40/40)

| Feature | Description | Phase |
|---------|------------|-------|
| Defis quotidiens | Objectifs varies chaque jour | Phase 2 |
| Records personnels | Meilleur tir, plus de carreaux, etc. | MVP |
| Arcade NG+ | Meme Arcade mais difficulte Expert | Phase 2 |
| Online ranked | Progression ELO infinie | Phase 3 |
| Skins Rookie | Cosmetiques achetables en boutique | Phase 2 |

---

## 6. BENCHMARKS — TABLEAU SYNTHESE

| Jeu | Temps max level | Choix stats | Abilities | Progression visuelle | Note fun |
|-----|----------------|------------|-----------|---------------------|----------|
| Golf Story | 15h | Auto + quelques choix | Non | Non | 7/10 |
| Dodgeball Academia | 12h | Auto | Oui (arbre) | Oui (equip) | 8/10 |
| Mario Tennis Aces | 5h | Auto | Non | Non | 6/10 |
| Inazuma Eleven | 40h+ | Auto | Oui (techniques) | Oui (equipement) | 8/10 |
| Pyre | 10h | Oui (talents) | Oui (2 par perso) | Non | 9/10 |
| **PM (cible)** | **~5h** | **Oui (libre)** | **Oui (3 capacites)** | **Oui (3 tenues)** | **?/10** |

PM se positionne entre Mario Tennis (rapide, simple) et Pyre (choix, profondeur) — c'est le bon creneau.
