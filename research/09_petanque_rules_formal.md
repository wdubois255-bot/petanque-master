# Recherche Agent 8 : Regles Officielles Petanque (FIPJP) - Spec Programmeur

## 1. Nombre de boules par format

| Format | Joueurs/equipe | Boules/joueur | Total boules/equipe |
|--------|---------------|--------------|-------------------|
| Tete-a-tete (1v1) | 1 | 3 | 3 |
| Doublette (2v2) | 2 | 3 | 6 |
| Triplette (3v3) | 3 | 2 | 6 |

## 2. Lancer du cochonnet

- Equipe gagnante de la mene precedente lance le cochonnet (1ere mene: tirage au sort)
- Distance: **6 a 10 metres** du cercle
- Au moins **1 metre** de tout bord de terrain
- 3 tentatives, puis l'equipe adverse a 3 tentatives
- Si toutes echouent: deplacer le cercle et recommencer

## 3. Algorithme tour de jeu (QUI JOUE)

```
function determineNextTeam(state):
    // Debut de mene:
    // L'equipe qui a marque a la mene precedente lance le cochonnet et joue en premier.
    // Apres le cochonnet + premiere boule de l'equipe A:
    // L'equipe B doit jouer.

    // Regle fondamentale:
    // L'equipe dont la boule la plus proche est la PLUS LOIN du cochonnet joue.
    // (l'equipe qui "perd" joue toujours)

    teamA_closest = min(distance de chaque boule team A au cochonnet)
    teamB_closest = min(distance de chaque boule team B au cochonnet)

    if teamA_closest > teamB_closest:
        next = Team A  // A perd, A joue
    else if teamB_closest > teamA_closest:
        next = Team B  // B perd, B joue
    else:
        // Distance EGALE: la derniere equipe a avoir joue rejoue
        next = lastTeamThatPlayed

    // EXCEPTION: si l'equipe "perdante" n'a plus de boules,
    // l'autre equipe joue toutes ses boules restantes.
    if next n'a plus de boules:
        next = l'autre equipe

    return next
```

**Detail cle** : une equipe continue de lancer jusqu'a "prendre le point" (devenir plus proche) ou epuiser ses boules. Plusieurs lancers consecutifs possibles.

**Dans une equipe (doublette/triplette)** : n'importe quel joueur peut lancer, pas d'ordre impose.

## 4. Algorithme de scoring (fin de mene)

```
function scoreMene(balls, cochonnet):
    // Calculer distance de chaque boule au cochonnet
    for each ball:
        ball.distance = euclideanDistance(ball.position, cochonnet)

    // Trouver la boule la plus proche -> cette equipe gagne la mene
    closestBall = ball avec distance minimum
    winningTeam = closestBall.team
    losingTeam = autreEquipe

    // Trouver la meilleure boule de l'equipe PERDANTE
    losingBest = min(distance des boules de losingTeam)
    // Si aucune boule perdante en jeu: losingBest = Infinity

    // Compter les points: chaque boule gagnante PLUS PROCHE que losingBest = 1 point
    points = 0
    for each ball where ball.team == winningTeam:
        if ball.distance < losingBest:
            points += 1

    winningTeam.score += points
    return winningTeam, points
```

**Score max par mene** : 3 (tete-a-tete), 6 (doublette/triplette)

## 5. Condition de victoire

- Premier a **13 points** gagne
- Pas besoin de gagner par 2
- Points cumules a travers les menes
- Variantes possibles : 11 points (casual), 15 points (etendu)

## 6. Hors limites

### Boule hors terrain
- Boule qui franchit ENTIEREMENT la ligne = **morte** (retiree de la mene)
- Ne compte PAS pour le scoring
- Boule SUR la ligne = toujours vivante
- Si une boule est poussee hors limites par une autre: la boule sortie est morte, l'autre reste la ou elle s'arrete

### Cochonnet hors terrain
- Mene declaree **morte** (nulle)
- EXCEPTION: si une seule equipe a encore des boules, elle marque 1 point par boule restante

## 7. Mene nulle

### Cas A: Cochonnet sort du terrain
- Mene annulee (0 points), SAUF si une equipe a des boules restantes et l'autre non
- Mene suivante: meme cercle, meme equipe lance le cochonnet

### Cas B: Distance egale (boules plus proches des 2 equipes equidistantes)
```
// Les 2 equipes ont encore des boules:
//   -> la derniere equipe a avoir joue rejoue
// Une seule equipe a des boules:
//   -> elle joue ses boules restantes, puis scoring normal
// Plus de boules des 2 cotes ET toujours egal:
//   -> mene NULLE (0 points)
//   -> meme equipe relance le cochonnet
```

## 8. State machine complete d'une mene

```
MENE_START:
    -> equipe_cochonnet lance le cochonnet (valider 6-10m)
    -> equipe_cochonnet lance premiere boule
    -> autre_equipe lance une boule
    -> PLAY_LOOP

PLAY_LOOP:
    -> determiner quelle equipe est plus loin (perdante)
    -> si perdante a des boules: elle lance
    -> si perdante n'a plus de boules: l'autre lance toutes ses restantes
    -> si les 2 n'ont plus de boules: SCORE_MENE
    -> si cochonnet sort: MENE_DEAD
    -> repeter PLAY_LOOP

SCORE_MENE:
    -> compter boules gagnantes plus proches que meilleure perdante
    -> ajouter au score
    -> si score >= 13: GAME_OVER
    -> sinon: nouvelle mene (gagnant lance le cochonnet)

MENE_DEAD:
    -> si une equipe a des boules restantes et l'autre non:
        marquer boules restantes comme points
    -> sinon: 0 points, rejouer mene depuis meme cercle
```

## 9. Regles pour le moteur de jeu (simplifications)

### Pour le MVP, on peut simplifier:
- Pas de limite de temps (1 min officiel)
- Cochonnet lance automatiquement a une distance valide
- Pas de spectateurs/obstacles
- Terrain rectangulaire fixe par arene
- Distance de lancer du cochonnet adaptee a la taille du terrain du jeu

### Terrain standard
- Officiel: 15m x 4m (minimum 12m x 3m)
- Pour le jeu: adapter proportionnellement a la zone de jeu Canvas
