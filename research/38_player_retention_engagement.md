# 38 — Player Retention & Engagement

> A lire quand : on travaille sur la progression, les deblocages, la boucle de jeu, ou la monetisation.

---

## 1. POURQUOI LA RETENTION EST CRITIQUE

Un jeu peut etre excellent et mourir en 2 semaines si les joueurs n'ont pas de raison de revenir.

**Objectifs de retention** (benchmarks industrie casual/indie) :

| Metrique | Cible | Signification |
|----------|-------|--------------|
| D1 (jour 1) | > 40% | Le joueur revient le lendemain |
| D7 (jour 7) | > 15% | Le joueur revient apres une semaine |
| D30 (jour 30) | > 5% | Le joueur est "hook" |
| Session moyenne | > 8 min | Le jeu captive assez longtemps |
| Sessions/jour | > 1.5 | Le joueur y pense entre les sessions |

---

## 2. LES 4 PILIERS DE LA RETENTION

### Pilier 1 : Boucle de gameplay satisfaisante (Core Loop)

```
LANCER → OBSERVER (la boule roule) → RESULTAT (pres/loin) → EMOTION → RELANCER
```

**Ce qui rend la boucle addictive** :
- Le **moment de deceleration** (la boule ralentit pres du cochonnet = tension pure)
- Le **feedback immediat** (son + visuel + distance affichee)
- La **variabilite** (jamais deux lancers identiques = pas de lassitude)
- Le **skill ceiling** : facile a comprendre, difficile a maitriser

**Actions** :
- Travailler le game feel des 3 secondes de roulement (camera follow, son dynamique, slowmo)
- Varier les scenarios (terrains, adversaires, situations de score)

### Pilier 2 : Progression tangible

Le joueur doit **sentir qu'il avance** a chaque session.

| Type de progression | Implementation | Frequence |
|--------------------|---------------|-----------|
| **Skill progression** | Le joueur devient meilleur (invisible) | Continue |
| **Character progression** | Le Rookie gagne des stats | Chaque victoire arcade |
| **Collection progression** | Debloquer persos, boules, cochonnets | Tous les 3-5 matchs |
| **Currency progression** | Accumuler des Ecus | Chaque match |
| **Achievement progression** | Badges et titres | Milestones |

**Regle d'or** : le joueur doit debloquer quelque chose **a chaque session** (meme courte).

### Pilier 3 : Variete et fraicheur

| Source de variete | Implementation | Phase |
|------------------|---------------|-------|
| 5 terrains avec physiques differentes | Existant | MVP |
| 5 personnages avec styles differents | Existant | MVP |
| 10 types de boules | Existant | MVP |
| Mode Arcade (progression imposee) | Existant | MVP |
| Quick Play (choix libre) | Existant | MVP |
| Events saisonniers | Terrain/cochonnet special | Phase 2 |
| Defis quotidiens | "Gagne avec La Choupe sur la Plage" | Phase 2 |
| Classement en ligne | Matchmaking + leaderboard | Phase 3 |

### Pilier 4 : Engagement social

| Mecanisme | Implementation | Phase |
|-----------|---------------|-------|
| Versus local (meme ecran) | Existant | MVP |
| Partage de score (screenshot) | Bouton "Partager" en resultat | Phase 2 |
| Versus en ligne | Colyseus async | Phase 3 |
| Classement global | Leaderboard | Phase 3 |
| Defis entre amis | "Bats mon score sur la Colline" | Phase 3 |

---

## 3. SYSTEME DE PROGRESSION DETAILLE

### 3.1 Le Rookie : progression du personnage

C'est le coeur emotionnel du jeu. Le joueur s'investit dans SON Rookie.

```
Session 1  : Rookie 10/40 pts (faible)
Session 3  : Rookie 16/40 pts (debut de specialisation)
Session 5  : Rookie 20/40 pts → Capacite "Coup d'Oeil" debloquee !
Session 10 : Rookie 30/40 pts → Capacite "Second Souffle" debloquee !
Session 15 : Rookie 40/40 pts → Personnage complet, le plus polyvalent du roster
```

**Psychologie** : le joueur ne peut pas max toutes les stats a 10 (40 pts, 4 stats a 10 = 40 — c'est possible mais alors il est "equilibre" et pas specialise). Le **choix de build** cree de l'attachement.

### 3.2 Deblocages : la carotte

| Victoires totales | Deblocage | Emotion ciblee |
|-------------------|-----------|---------------|
| 1 | La Choupe jouable | "J'ai gagne mon premier match !" |
| 3 | Marcel jouable | "Je progresse !" |
| 5 | Le Magicien jouable + Cochonnet bleu | "La collection grandit" |
| 8 | Arcade complete + Reyes jouable | "J'ai fini le jeu... ou pas" |
| 10 | Boule Chrome gratuite | "Bonus surprise" |
| 15 | Terrain Plage en Quick Play | "Nouveau contenu !" |
| 20 | Titre "L'Artilleur" (3 carreaux/match) | "Reconnaissance de skill" |
| 50 | Cochonnet Dore + titre "Maitre Bouliste" | "Statut legendaire" |

**Espacement** : les premiers deblocages sont rapprochees (1, 3, 5) pour creer l'habitude. Les derniers sont espaces (20, 50) pour recompenser la loyaute.

### 3.3 Ecus : la monnaie de motivation

```
Match gagne = 20-50 Ecus
→ Apres 5 matchs : ~150 Ecus
→ Premier achat boutique (cochonnet 50 Ecus) : ACCESSIBLE
→ Boule speciale (300 Ecus) : ~15 matchs = investissement
→ Boule Titane (500 Ecus) : ~25 matchs = objectif long terme
```

**Piege a eviter** : si tout est trop cher, le joueur se decourage. Si tout est trop accessible, plus rien n'a de valeur. Equilibre = premier achat apres 3-5 matchs, item "dream" apres 20-30 matchs.

---

## 4. DEFIS ET OBJECTIFS (Phase 2)

### 4.1 Defis quotidiens

Renouvelés toutes les 24h (timer local, pas besoin de serveur) :

| Defi | Recompense | Difficulte |
|------|-----------|-----------|
| "Gagne un match sur la Plage" | 30 Ecus | Facile |
| "Fais 2 carreaux dans un match" | 50 Ecus | Moyen |
| "Gagne avec La Choupe" | 40 Ecus | Facile |
| "Gagne sans utiliser le Focus" | 80 Ecus | Difficile |
| "Finis une mene avec 3+ points" | 50 Ecus | Moyen |
| "Gagne avec max 1 point d'ecart" | 100 Ecus | Difficile |

**Implementation** : generateur aleatoire parmi un pool de 20+ templates. Stocke dans localStorage avec timestamp.

### 4.2 Succes / Achievements

| Categorie | Nom | Condition | Icone |
|-----------|-----|-----------|-------|
| Parcours | "Premier Pas" | Gagner son premier match | Boule bronze |
| Parcours | "Apprenti" | Finir l'Arcade | Etoile argent |
| Parcours | "Champion" | 50 victoires totales | Trophee or |
| Skill | "Chirurgien" | Boule a < 1cm du cochonnet | Scalpel |
| Skill | "Demolisseur" | 3 carreaux en 1 match | Marteau |
| Skill | "Perfectionniste" | Arcade sans defaite | Etoile parfaite |
| Fun | "David vs Goliath" | Gagner avec Rookie 10/40 vs IA difficile | Fronde |
| Fun | "Collecteur" | Posseder 5 boules differentes | Coffre |
| Fun | "All-Star" | Gagner avec les 5 persos | Medaille rainbow |
| Secret | "Fanny" | Gagner 13-0 | Fanny (lore) |
| Secret | "L'Inverse" | Gagner apres avoir ete mene 0-12 | Miracles |

---

## 5. PSYCHOLOGIE DU JOUEUR

### 5.1 Les 4 profils de Bartle appliques a la petanque

| Profil | % joueurs | Ce qu'il cherche | Comment le satisfaire |
|--------|----------|-----------------|----------------------|
| **Achiever** | 40% | Debloquer tout, max stats | Progression Rookie, badges, collection |
| **Explorer** | 20% | Decouvrir les terrains, tester les persos | Variete, Easter eggs, strategies cachees |
| **Socializer** | 25% | Jouer avec/contre des amis | Versus local/online, partage de scores |
| **Killer** | 15% | Dominer, etre le meilleur | Classement, difficulte elevee, leaderboard |

### 5.2 Flow theory (Csikszentmihalyi)

```
Difficulte
    ^
    |     ANXIETE     /
    |               /
    |     FLOW    /    ← Zone optimale
    |           /
    |    ENNUI /
    |        /
    +──────────────→ Skill du joueur
```

**Maintenir le joueur en flow** :
- L'Arcade a une difficulte croissante (facile → moyen → difficile)
- Le Rookie grandit en stats (le joueur se sent plus puissant)
- Les terrains introduisent de la complexite progressive
- La pression (sang-froid) cree du challenge a haut score

### 5.3 Variable ratio reinforcement

Le principe le plus addictif (utilise par les slot machines, mais ethiquement) :
- Les **carreaux** sont semi-aleatoires (skill + chance) = forte dopamine
- La **distance au cochonnet** varie a chaque lancer = suspense
- Les **Ecus bonus** (carreau = +10) recompensent l'exploit de facon imprevisible

---

## 6. BOUCLES D'ENGAGEMENT

### 6.1 Boucle courte (1 match = 5-10 min)

```
Lancer → Observer → Score → Mene → Lancers → Score → ... → Victoire/Defaite
→ Resultat (stats, ecus, XP) → ENVIE DE REJOUER
```

### 6.2 Boucle moyenne (1 session = 15-30 min)

```
Arcade Match 1 → Victoire → LevelUp → Match 2 → Victoire → LevelUp → Match 3
→ Fin Arcade → Deblocages → "Et si j'essayais Quick Play avec le nouveau perso ?"
```

### 6.3 Boucle longue (1 semaine+)

```
Session 1 : Decouvrir le jeu, finir le tutoriel
Session 2 : Finir l'Arcade, debloquer des persos
Session 3-5 : Maxer le Rookie, acheter en boutique
Session 6-10 : Tester tous les persos, tous les terrains
Session 11+ : Defis quotidiens, records personnels, online
```

### 6.4 Hooks de retour

| Hook | Mecanisme | Timing |
|------|----------|--------|
| "Ton Rookie a gagne 2 pts, repartis-les !" | Cliffhanger apres chaque session | Fin de session |
| "Nouveau defi quotidien !" | Notification (si mobile) | Chaque 24h |
| "Tu es a 80 Ecus de la Boule Titane" | Progression vers un objectif | Ecran boutique |
| "Record personnel : 2cm !" | Satisfaction de progres | Ecran resultat |
| "3 matchs de plus pour debloquer Marcel" | Proximity to goal | Menu principal |

---

## 7. ERREURS A EVITER

| Erreur | Pourquoi c'est toxique | Alternative |
|--------|----------------------|-------------|
| Pay-to-win | Detruit la confiance | Cosmetiques uniquement en payant |
| Grind excessif | Decourageant | Deblocages rapides au debut |
| Contenu cache derriere un mur de grind | Frustrant | Arcade finissable en 3 sessions |
| Lootboxes | Ethiquement problematique + illegal en Belgique/NL | Achats directs uniquement |
| Notifications agressives | Le joueur desinstalle | Max 1/jour, opt-in |
| FOMO (limited time only) | Stress, pas fun | Events saisonniers genereux |
| Energy system (vies limitees) | Bloque le joueur quand il veut jouer | Jeu illimite |

---

## 8. METRIQUES A SUIVRE

| Metrique | Ce qu'elle revele | Seuil d'alerte |
|----------|------------------|----------------|
| D1/D7/D30 retention | Est-ce que les joueurs reviennent | D1 < 30% |
| Session length | Le jeu captive-t-il assez | < 5 min |
| Matches per session | Le joueur enchaine-t-il | < 2 |
| Arcade completion rate | Le jeu est-il trop dur/facile | < 20% ou > 90% |
| Boutique conversion | Les Ecus motivent-ils | < 10% achètent |
| Rookie level moyen | La progression est-elle bien rythmee | Stagnation a 15/40 |
| Perso le plus joue | Equilibrage du roster | > 50% jouent le meme |
| Terrain le plus evite | UX terrain problematique | > 40% evitent un terrain |

voir `research/41_analytics_player_data.md` pour l'implementation technique.

---

## 9. MONETISATION ETHIQUE

### 9.1 Modele freemium respectueux

| Ce qui est gratuit | Ce qui est payant (Steam/mobile) |
|-------------------|--------------------------------|
| Jeu complet (Arcade, Quick Play) | Cosmetiques premium (boules brillantes, trails) |
| Tous les persos debloquables en jouant | Pack "Supporter" (tous les cosmetiques) |
| Tous les terrains | Terrains cosmetiques (nuit, neige, etc.) |
| Progression Rookie | Rien qui affecte le gameplay |

### 9.2 Tarification

| Item | Prix reel | Equivalent Ecus |
|------|----------|----------------|
| Pack 500 Ecus | 0.99€ | - |
| Pack 2000 Ecus | 2.99€ | +33% bonus |
| Pack "Supporter" (tout) | 4.99€ | - |
| Jeu complet (Steam) | 7.99€ | Tout inclus |

**Principe** : un joueur qui joue suffisamment debloque TOUT gratuitement. Payer = accelerer, pas debloquer.
