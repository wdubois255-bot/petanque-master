# 02 - Audit Gameplay & Game Feel

## Mecaniques implementees

### Systeme de tir (100% implementee)
| Mecanique | Statut | Qualite |
|-----------|--------|---------|
| Drag-and-release | OK | Intuitif, bien calibre |
| Puissance 0-100% | OK | Affichage clair |
| Direction libre 360° | OK | Precision suffisante |
| Prediction trajectoire | OK | ~40 points, fade alpha |
| Mode Roulette (loft 0) | OK | 15% vol, 85% roulement |
| Mode Demi-portee (loft 1) | OK | 50/50, choix par defaut |
| Mode Plombee (loft 2) | OK | 80% vol, peu de roulement |
| Mode Tir au fer | OK | 95% vol, vise les boules adverses |
| Stat Precision (tremor) | OK | Deviation selon stat PRE |
| Stat Puissance (portee) | OK | Force max selon stat PUI |
| Stat Sang-froid (pression) | OK | Trembles a score >10 |

### Physique des boules (100% implementee)
| Mecanique | Statut | Qualite |
|-----------|--------|---------|
| Friction lineaire | OK | Realiste, terrain-dependent |
| Collision boule-boule | OK | COR 0.62 (donnees reelles) |
| Collision boule-cochonnet | OK | COR 0.50, mass-weighted |
| Rebond murs | OK | COR 0.70 |
| Pentes/gravite | OK | Composante gravitaire directionnelle |
| Zones de friction | OK | Zones custom dans terrains.json |
| Boule hors terrain | OK | Retiree (morte, regle FIPJP) |
| Animation roulement | OK | Frames cycliques selon distance |
| Ombre dynamique | OK | S'etire avec la vitesse |
| Flash collision | OK | Blanc temporaire |

### Regles FIPJP (100% implementees)
| Regle | Statut | Notes |
|-------|--------|-------|
| Equipe perdante rejoue | OK | _determineNextTeam() |
| Score = boules plus proches | OK | calculateProjectedScore() |
| Victoire a 13 points | OK | Configurable dans progression.json |
| Cochonnet 6-10m du cercle | OK | Constraints dans Constants.js |
| Boule morte si hors terrain | OK | Ball.isOutOfBounds() |
| Mene morte si cochonnet sort | OK | Etat MENE_DEAD |
| 3 boules par joueur (1v1) | OK | Defini dans arcade.json |

### Detection carreau (100% implementee)
| Element | Statut |
|---------|--------|
| Detection deplacement >24px | OK |
| Texte "CARREAU!" | OK |
| Son special (chimes) | OK |
| Hitstop / freeze frame | A VERIFIER |
| Particules | A VERIFIER |

---

## Terrains et equilibrage

### 5 terrains avec identites uniques

| Terrain | Friction | Particularite | Equilibre |
|---------|----------|---------------|-----------|
| **Village** (terre) | 1.0 | Neutre, pur skill | EQUILIBRE - bon baseline |
| **Plage** (sable) | 3.0 | Tres freinant | FORT pour tireurs (force requise) |
| **Parc** (herbe) | 1.8 | Zones mixtes (gravier 1.2) | STRATEGIQUE - le plus interessant |
| **Colline** (terre+pente) | 1.0 | Pente -3° | UNIQUE - oblige a compenser |
| **Docks** (dalles) | 0.4 | Ultra glissant, murs rebondissants | CHAOTIQUE - favorise wildcard |

### Analyse d'equilibrage par archetype/terrain

| Perso \ Terrain | Village | Plage | Parc | Colline | Docks |
|-----------------|---------|-------|------|---------|-------|
| Rene (equilibre) | = | = | = | = | = |
| Marcel (pointeur) | ++ | -- | + | + | - |
| Fanny (tireur) | + | ++ | = | = | + |
| Ricardo (stratege) | = | - | ++ | + | = |
| Thierry (wildcard) | = | + | - | - | ++ |
| Marius (boss) | + | + | + | + | + |

**Observations :**
- Marcel (pointeur) souffre en plage : friction elevee neutralise ses roulettes
- Thierry brille aux docks : chaos = avantage pour le wildcard
- Ricardo a un edge au parc : zones variees = strategie
- Marius est fort partout mais pas dominant : bon equilibrage boss

### Points forts du game feel
1. **Physique credible** : les boules se comportent comme de vraies boules de petanque
2. **4 modes de loft** : choix strategique meaningful (roulette vs tir)
3. **Stat impact reel** : precision/puissance changent vraiment le gameplay
4. **Pression naturelle** : tremblement a score >10 = tension dramatique
5. **Carreau** : detection + celebration = moment "wow"

### Lacunes du game feel
1. **Pas de "juice" visuel au lancer** : le moment du tir manque d'impact
   - Manque : trails, motion blur, screenshake au lancer
   - Manque : animation de lancer du personnage (bras qui lance)
2. **Pas de ralenti dramatique** : quand la boule approche le cochonnet
   - Plan Sprint 4.0 mais pas encore implemente
3. **Pas de replay** : les beaux coups disparaissent sans celebration
4. **Reactions personnages faibles** : pas de sprites de reaction (joie/deception)
5. **Ambiance sonore plate** : SFX proceduraux fonctionnels mais pas immersifs
   - Pas de musique de fond
   - Pas de cigales reelles (seulement Web Audio oscillateurs)
   - Pas de reactions vocales ("Oh!", "Bravo!")
6. **Camera statique** : ne suit pas la boule (choix delibere, camera fixe)

---

## IA - Analyse de profondeur

### Niveaux de difficulte
| Niveau | Angle dev | Power dev | Shoot? | Feeling joueur |
|--------|-----------|-----------|--------|----------------|
| Facile | ±15° | ±20% | Non | Gagne facilement, decouvre les mecaniques |
| Moyen | ±8° | ±10° | Oui | Challenge equilibre, doit reflechir |
| Difficile | ±3° | ±5% | Oui | Punitif, oblige a jouer parfaitement |

### Archetypes de personnalite IA
| Perso | Style | Shoot% | Loft pref | Comportement unique |
|-------|-------|--------|-----------|---------------------|
| Marcel | Pointeur pur | 10% | Roulette | Offset du cochonnet pour bloquer |
| Fanny | Tireuse | 82% | Tir au fer | Cible la boule la plus proche |
| Ricardo | Stratege | 50% | Adaptatif | Vise aussi le cochonnet |
| Thierry | Wildcard | Variable | Aleatoire | Hot/cold streaks (+20%/-60%) |
| Marius | Complet | 50% | Adaptatif | S'adapte au score, haute baseline |

### Forces de l'IA
- Personnalites distinctes = matchups varies
- Analyse de situation (score, boules restantes, distance)
- Pression qui degrade la precision (sang-froid)
- Desespoir : change de strategie en derniere boule si en retard

### Faiblesses de l'IA
1. **Pas de memoire inter-menes** : l'IA ne s'adapte pas au style du joueur
2. **Pas de bluff/feinte** : l'IA ne fait jamais de faux tir pour perturber
3. **Cochonnet** : l'IA ne choisit pas strategiquement ou lancer le cochonnet
4. **Pas de cooperation** : en future doublette (2v2), l'IA devra coordonner
5. **Predictibilite** : Marcel pointe TOUJOURS, Fanny tire TOUJOURS = exploitable

---

## Systeme de progression

### Implemente
- Arcade : 5 matchs + boss, progression lineaire
- Deblocage Marius : apres completion arcade
- 5 types de boules selectionnables
- 3 cochonnets selectionnables
- 5 terrains selectionnables
- Quick Play : configuration libre

### Non implemente (prevu dans progression.json)
- **Badges** : 4 badges de maitres d'arene (scaffold JSON seulement)
- **Deblocages progressifs** : boules, terrains, cochonnets a debloquer
- **Statistiques joueur** : victoires, carreaux, meilleur score
- **Classement** : pas de leaderboard
- **Achievements** : pas de systeme de succes
- **Collection de boules** : pas de variantes a collectionner
- **Monnaie in-game** : pas de systeme economique

---

## UX / Flow du jeu

### Flow actuel
```
Titre -> Menu (Arcade / Quick Play)
  -> Arcade: Select Perso -> VSIntro -> Match -> Result -> (repeat x5) -> Boss -> Fin
  -> Quick Play: Config (7 options) -> VSIntro -> Match -> Result
```

### Points positifs UX
- **TitleScene magnifique** : premiere impression forte
- **VSIntro cinematique** : buildup avant chaque match
- **Quick Play complet** : 7 options clairement presentees
- **ResultScene informative** : score + stats + boutons contextuels
- **CharSelect style fighting game** : grille + stats + preview

### Points negatifs UX
1. **Pas de tutoriel** : le joueur decouvre seul les controles
   - Drag-and-release n'est pas intuitif sans explication
   - 4 modes de loft non expliques
   - Regles de petanque non presentees
2. **Pas d'ecran de pause** : impossible de quitter un match en cours
3. **Pas de parametre son** : volume non reglable
4. **Pas d'options** : pas de menu settings (controles, affichage, son)
5. **Feedback faible apres un point** : pas de celebration entre les menes
6. **Navigation clavier incomplete** : certaines scenes sont mouse-only
7. **Pas d'indication de qui joue** : turn indicator present mais subtil
8. **Loading screen basique** : BootScene sans barre de progression visible

---

## Equilibrage - Verdict

### Stats des personnages (sur 10)
| Perso | PRE | PUI | EFF | S-F | Total | Tier |
|-------|-----|-----|-----|-----|-------|------|
| Marius (boss) | 8 | 7 | 8 | 9 | 32 | S |
| Thierry (wildcard) | 7 | 8 | 7 | 3 | 25 | A (volatil) |
| Marcel (pointeur) | 9 | 4 | 6 | 7 | 26 | A |
| Rene (equilibre) | 6 | 6 | 6 | 6 | 24 | B |
| Ricardo (stratege) | 6 | 5 | 9 | 6 | 26 | A |
| Fanny (tireur) | 5 | 9 | 4 | 6 | 24 | B |

**Analyse :** Marius est clairement au-dessus (total 32 vs 24-26). C'est justifie pour un boss,
mais il faudra s'assurer qu'il reste battable. Le rang B de Rene et Fanny est compensable
par leur simplicite d'utilisation (Rene = starter, Fanny = fun a jouer).

**Risque d'equilibrage :** Effet (EFF) a 9 pour Ricardo - si le systeme d'effet n'est pas
assez impactant en jeu, sa stat signature ne sert a rien. Verifier que l'effet change
reellement les trajectoires de maniere perceptible.
