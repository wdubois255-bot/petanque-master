# 25 - Cahier des charges : Realisme de la petanque dans Petanque Master

> Document de reference du 16 mars 2026.
> Sources : FIPJP, Boulipedia, Decathlon, Obut, All About Petanque, Brighton Petanque,
> PYC Petanque, Sport Coach VIP, ESM Petanque, Gazette Petanque, Wikipedia,
> etudes biomecaniques, banques de sons (Universal Soundbank, Soundsnap, Epidemic Sound).

---

## TABLE DES MATIERES

- A. Physique des boules
- B. Techniques de lancer
- C. Systeme de visee (la "donnee")
- D. Deroulement d'une mene
- E. Ambiance et game feel
- F. Ecarts actuels et priorites de correction

---

## A. PHYSIQUE DES BOULES

### A.1 Specifications reelles des boules

| Propriete | Boule de competition | Cochonnet |
|-----------|---------------------|-----------|
| Diametre | 70.5 - 80.0 mm (norme FIPJP) | 25 - 35 mm |
| Poids | 650 - 800 g (typique : 700 g) | 10 - 18 g (bois de buis) ou 25-35 g (synthetique) |
| Materiau | Acier au carbone, acier inox, ou alliage carbone special | Bois de buis (traditionnel), epoxy/synthetique (competition) |
| Durete | 110-140 kg/mm² (Rockwell HRC). Tendre ≤115, semi-tendre 120-135, dure ≥140 |  |

**Preferences par role :**
- Tireur : boule legere (680-700 g), tendre (110-115). Absorbe mieux l'impact = favorise le carreau.
- Pointeur : boule lourde (710-800 g), dure (135-140). Roule moins apres l'atterrissage = plus de precision.
- Milieu : boule intermediaire (690-710 g), semi-tendre (120-130).

**Dans le jeu :** Actuellement `BALL_MASS = 700` (correct pour un usage general), `COCHONNET_MASS = 30` (correct pour synthetique). Le ratio de masse ~23:1 est physiquement juste et produit un comportement satisfaisant en collision (le cochonnet "vole" quand il est frappe).

### A.2 Vitesses reelles par technique

| Technique | Vitesse a la main (m/s) | Vitesse (km/h) | Ratio vs pointage |
|-----------|------------------------|-----------------|-------------------|
| Roulette | 4 - 5 | 14 - 18 | 1.0x (baseline) |
| Demi-portee | 5 - 6 | 18 - 22 | ~1.2x |
| Plombee | 5 - 6 | 18 - 22 | ~1.2x (mais en cloche) |
| Tir au fer | 13 - 16 | 47 - 58 | **2.5 - 3.0x** |
| Tir devant | 13 - 16 | 47 - 58 | 2.5 - 3.0x |
| Tir a la rafle | 13 - 16 | 47 - 58 | 2.5 - 3.0x |

**Point critique :** Le tir est 2.5 a 3 fois plus rapide que le pointage. C'est un fait fondamental qui doit etre respecte dans le jeu.

### A.3 Comportement au sol par technique

#### Roulette
- **En l'air :** 15% de la distance, arc tres bas (0.3-0.5 m, a peine au-dessus du genou)
- **Atterrissage :** Quasi nul, la boule touche le sol a ~1 m du joueur
- **Roulement :** 85% de la distance, long et regulier
- **Arret :** Progressif, la boule decelere lentement par friction
- **Sensible a :** Irregularites du terrain, petits cailloux, pentes. Sur terrain mou (sable/herbe), s'arrete trop vite.

#### Demi-portee
- **En l'air :** 50% de la distance, arc moyen (1.5-2.0 m, hauteur d'epaule/tete)
- **Atterrissage :** Petit "thud" sourd, micro-rebond (1-3 cm), legere poussiere
- **Roulement :** 50% de la distance restante
- **Arret :** Deceleration reguliere
- **Technique la plus polyvalente :** Fonctionne sur tous les terrains. C'est le "pain quotidien" du bouliste.

#### Plombee (Portee)
- **En l'air :** 90% de la distance, arc tres haut (2.5-4.0 m, "en cloche")
- **Atterrissage :** Gros impact, la boule descend quasi verticalement. Cree un **cratere visible** dans le sol meuble. Poussiere importante.
- **Roulement :** 10% MAXIMUM. La boule ne "meurt" PAS completement : elle roule encore un peu (20-50 cm typiquement). Avec backspin (main retournee), la boule peut s'arreter presque net.
- **Arret :** Tres rapide grace a l'energie absorbee par le sol
- **Usage :** Indispensable sur terrain mou/sableux, ou quand il y a des obstacles (boules adverses) entre le cercle et le cochonnet

**ERREUR COURANTE A EVITER :** La plombee n'est PAS une boule morte qui s'arrete pile ou elle tombe. Elle roule encore ~10% de sa trajectoire totale. Seul un backspin parfait (technique de haut niveau) peut reduire ce roulement a quasi zero.

#### Tir au fer
- **En l'air :** 100% de la distance (la boule NE TOUCHE PAS le sol avant la cible)
- **Arc :** Moyen-haut (2.0-3.0 m) pour retomber sur la boule cible
- **Impact :** CLAC metallique sec et violent. Transfert d'energie type "berceau de Newton"
- **Apres impact :** Depend de l'angle d'attaque :
  - Carreau parfait : la boule lancee remplace exactement la cible (angle d'impact = 0°, centre-a-centre)
  - Carreau imparfait : la boule lancee reste proche mais pas exactement a la place
  - Tir simple : les deux boules partent dans des directions differentes
- **Difficulte :** Elevee. C'est LA technique prestigieuse de la petanque.

#### Tir devant
- **En l'air :** 90% de la distance
- **Atterrissage :** 20-30 cm devant la boule cible, puis rebond sur la cible
- **Impact :** Moins propre que le tir au fer. Les deux boules se dispersent de maniere moins controlee.
- **Usage :** Plus facile que le tir au fer car la zone d'atterrissage est plus grande
- **NE PAS UTILISER sur sol dur :** La boule rebondit et passe au-dessus de la cible

#### Tir a la rafle (raspaille)
- **En l'air :** 15% de la distance, arc tres bas (0.2-0.5 m)
- **Roulement :** 85% de la distance, a GRANDE vitesse (13-16 m/s)
- **Trainee au sol :** Visible, la boule laisse une marque sur le gravier
- **Impact :** Chaotique. La boule arrive avec beaucoup d'energie cinetique horizontale.
- **Resultat :** Imprevisible. Les boules partent dans tous les sens.
- **Reputation :** Considere comme "non sportif" par les puristes. Ne marche que sur terrain parfaitement plat.

### A.4 Collisions : ce qui se passe vraiment

#### Boule contre boule (acier sur acier)
- **Coefficient de restitution (COR) reel :** 0.55 - 0.70 selon la durete des boules
  - Boules tendres (110 kg/mm²) : COR ~0.55 (absorbe plus d'energie)
  - Boules semi-tendres (125 kg/mm²) : COR ~0.62
  - Boules dures (140 kg/mm²) : COR ~0.70 (plus de rebond)
- **Masses egales :** Le transfert d'energie est quasi symetrique. Avec COR 0.62, la boule lancee conserve ~19% de son energie et la cible recoit ~81%.
- **Son :** "CLAC" metallique sec, resonance courte (100-200ms), harmonique 2-4 kHz dominant
- **Visuel :** Micro-deformation temporaire, etincelle quasi invisible (sauf au ralenti), poussiere si collision basse

#### Boule contre cochonnet (acier sur bois/synthetique)
- **COR reel :** 0.40 - 0.55 (beaucoup d'energie absorbee par le bois mou)
- **Ratio de masse 23:1 :** Le cochonnet est PROJETE violemment (physique correcte dans notre jeu)
- **Son :** "Toc" plus sourd que le clac boule-boule, moins metallique, plus mat
- **Visuel :** Le cochonnet part comme une bille, peut traverser tout le terrain

#### Boule contre bordure du terrain
- **En vrai :** Planches de bois en bordure. La boule rebondit mollement (COR ~0.3) ou s'arrete
- **Regle :** Si la boule sort ENTIEREMENT = morte (retiree du jeu)
- **Boule SUR la ligne :** Toujours vivante

### A.5 Le carreau en detail

#### Conditions reelles
- La boule lancee doit frapper la boule cible **parfaitement au centre** (angle d'impact ~0°)
- L'angle est LE facteur determinant, PAS le poids ou la durete (meme si les boules tendres le favorisent)
- Avec un COR de 0.62 et un impact centre, la boule lancee transfere ~81% de son energie a la cible et s'arrete dans un rayon de ~15 cm

#### Rarete
- En competition pro : un tireur d'elite reussit le carreau environ **1 tir sur 5 a 8** (tir au fer reussi, pas forcement carreau)
- Pour un joueur amateur : extremement rare, presque accidentel
- Record mondial : Christian Fazzino, 992 tirs reussis sur 1000 (mais pas 992 carreaux)

#### Ce que ca donne visuellement
1. La boule lancee arrive a grande vitesse (13-16 m/s)
2. Impact : flash instantane, CLAC puissant
3. La boule cible est EJECTEE dans la direction opposee a pleine vitesse
4. La boule lancee s'arrete presque instantanement (ou recule de quelques cm)
5. Les spectateurs marquent un temps d'arret puis acclament

#### Variantes
- **Carreau parfait :** La boule lancee reste EXACTEMENT a la place de la cible. Extremement rare.
- **Carreau imparfait :** La boule lancee reste dans un rayon de 20-30 cm de la position originale de la cible. Plus frequent.
- **Carreau sur place :** La boule lancee ne bouge absolument pas. Quasi mythique.

### A.6 Influence du terrain

| Terrain | Friction relative | Effet sur roulette | Effet sur plombee | Effet sur tir | Remarques |
|---------|-------------------|--------------------|--------------------|---------------|-----------|
| Terre battue (gravier) | 1.0x (reference) | Optimal, longue roulee | Cratere moyen, bon arret | Standard | Terrain classique de petanque |
| Herbe | 1.5 - 2.0x | Mediocre, s'arrete trop vite | Bon, peu de roulement residuel | Boule glisse apres impact | Trajectoire imprevisible (irregularites cachees) |
| Sable | 2.5 - 4.0x | Impossible (s'arrete dans les premiers metres) | Excellent, boule "meurt" a l'impact | Boule s'enfonce apres impact | La plombee est OBLIGATOIRE sur sable |
| Dalles (pierre) | 0.4 - 0.7x | Tres long roulement, difficile a doser | Gros rebond, la boule repart | Rebond violent, imprevisible | Terrain tres technique |

**Facteurs supplementaires en vrai :**
- Pentes : meme legeres, changent completement la trajectoire de roulement
- Irregularites : cailloux, racines, rigoles = deviations aleatoires
- Humidite : terrain mouille = plus de friction, boule s'arrete plus vite
- Soleil : terrain sec et chaud = plus "roulant", moins de friction
- Vent : effet negligeable sur les boules (trop lourdes), mais affecte le cochonnet si lance haut

---

## B. TECHNIQUES DE LANCER

### B.1 Roulette

**Description :** Lancer tres bas, la boule quitte la main pres du sol et roule sur 80-90% de la distance. Le joueur est souvent accroupi.

| Parametre | Valeur reelle | Valeur jeu actuelle | Correct ? |
|-----------|---------------|---------------------|-----------|
| % vol | 15% | landingFactor: 0.15 (= 15% vol) | OUI |
| % roulement | 85% | 1 - 0.15 = 85% roulement | OUI |
| Arc | 0.3-0.5 m (tres bas) | arcHeight: -6 | OK (proportionnel) |
| Vitesse | 4-5 m/s | MAX_THROW_SPEED * rollEfficiency: 0.7 | A verifier |

**Quand l'utiliser :**
- Terrain plat et dur (terre battue, dalles)
- Pas d'obstacles entre le cercle et le cochonnet
- Quand la precision de roulement est plus importante que le placement aerien

**Quand NE PAS l'utiliser :**
- Terrain mou (sable, herbe epaisse) : la boule s'arrete trop vite
- Obstacles au sol (boules adverses sur le chemin)
- Terrain en pente ou irregulier

### B.2 Demi-portee

**Description :** La technique standard. La boule fait un arc a hauteur d'epaule/tete, atterrit a mi-distance et roule le reste du chemin.

| Parametre | Valeur reelle | Valeur jeu actuelle | Correct ? |
|-----------|---------------|---------------------|-----------|
| % vol | 50% | landingFactor: 0.50 | OUI |
| % roulement | 50% | 1 - 0.50 = 50% | OUI |
| Arc | 1.5-2.0 m | arcHeight: -40 | OK |
| Vitesse | 5-6 m/s | rollEfficiency: 0.6 | A verifier |

**La technique la plus polyvalente :** Fonctionne sur tous les terrains. C'est le lancer par defaut que tout joueur de petanque maitrise.

**En competition :** Les pros utilisent la demi-portee comme technique de base, puis ajustent vers la roulette (terrain dur) ou la plombee (terrain mou, obstacles) selon la situation.

### B.3 Plombee (Portee)

**Description :** Lancer "en cloche" tres haut (3-4 m). La boule monte haut et retombe quasi verticalement. Technique difficile qui demande precision, force et dexterite.

| Parametre | Valeur reelle | Valeur jeu actuelle | Correct ? |
|-----------|---------------|---------------------|-----------|
| % vol | 90% | landingFactor: 0.90 | OUI |
| % roulement | **10%** (PAS 0%) | rollEfficiency: 0.15 | OK mais... |
| Arc | 2.5-4.0 m (tres haut) | arcHeight: -80 | OK |
| Vitesse | 5-6 m/s | | A verifier |
| Roulement residuel | **20-50 cm reels** | Depend du rollEfficiency | A calibrer |

**POINT CRUCIAL :** La plombee roule quand meme environ 10% de sa trajectoire. Ce n'est PAS une "boule morte". Avec un backspin parfait (technique avancee), on peut reduire a ~5%, mais jamais 0%.

**Visuel :** Le plus spectaculaire des lancers de pointage :
- La boule monte tres haut (au-dessus de la tete du lanceur)
- Elle semble "flotter" un instant au sommet de l'arc
- La descente est quasi verticale
- A l'impact : GROS nuage de poussiere, cratere visible dans le sol meuble
- Apres : courte roulee puis arret

**Quand l'utiliser :**
- Terrain mou (sable) : OBLIGATOIRE, la roulette est impossible
- Obstacles au sol (boules adverses alignees entre cercle et cochonnet)
- Quand on veut poser la boule "pres du cochonnet" sans risquer de le toucher

### B.4 Tir au fer

**Description :** LA technique de tir prestigieuse. La boule vole directement sur la boule adverse SANS toucher le sol avant. Impact direct, metal sur metal.

| Parametre | Valeur reelle | Valeur jeu actuelle | Correct ? |
|-----------|---------------|---------------------|-----------|
| % vol | 100% | landingFactor: 0.95 | **PROBLEME: devrait etre ~1.0** |
| Arc | 2.0-3.0 m | arcHeight: -65 | OK |
| Vitesse | 13-16 m/s (2.5-3x pointage) | rollEfficiency: 10.0 (hack) | **PROBLEME** |
| COR impact | 0.55-0.70 (acier) | RESTITUTION_BOULE: 0.62 | OUI |

**Probleme dans le jeu actuel :** Le tir au fer utilise `landingFactor: 0.95` au lieu de ~1.0. En vrai, la boule ne touche PAS le sol avant la cible. Le `rollEfficiency: 10.0` est un hack pour compenser. L'ideal serait un systeme ou le tir au fer "atterrit" directement sur la boule cible, pas sur le sol.

**Ce qui se passe apres l'impact :**
- **Carreau** (1 sur 5-8 tirs) : la boule lancee reste, la cible part
- **Tir reussi, pas carreau** : les deux boules partent en s'ecartant selon l'angle d'impact
- **Tir rate** : la boule lancee atterrit a cote de la cible et roule loin (perte seche)

### B.5 Tir devant

**Description :** La boule atterrit 20-30 cm devant la boule cible puis rebondit dessus. Plus facile que le tir au fer car la zone de tolerance est plus grande.

| Parametre | Valeur reelle | Valeur jeu actuelle | Correct ? |
|-----------|---------------|---------------------|-----------|
| % vol | ~90% | Non implemente separement | **MANQUANT** |
| Atterrissage | 20-30 cm devant la cible | | **MANQUANT** |
| Vitesse | 13-16 m/s | | |
| Resultat | Moins propre, dispersion | | |

**ERREUR A EVITER :** Sur sol tres dur (dalles), la boule rebondit et passe AU-DESSUS de la cible. Le tir devant ne fonctionne que sur sol meuble.

**Non implemente dans le jeu.** Pourrait etre un mode de tir intermediaire entre pointer et tirer (moins precis mais plus tolerant).

### B.6 Tir a la rafle

**Description :** Tir rasant a grande vitesse. La boule roule au sol des les premiers metres et "rafle" tout sur son passage.

| Parametre | Valeur reelle | Valeur jeu actuelle | Correct ? |
|-----------|---------------|---------------------|-----------|
| % vol | 15% | Non implemente | **MANQUANT** |
| % roulement | 85% a grande vitesse | | |
| Vitesse | 13-16 m/s | | |
| Resultat | Chaotique, imprevisible | | |

**Reputation :** Considere comme "non sportif" par les puristes. Ne fonctionne que sur terrain parfaitement plat et roulant.

**Non implemente dans le jeu.** Pourrait etre un lancer "desespere" ou un trait de personnalite d'un PNJ particulier.

---

## C. SYSTEME DE VISEE : LA "DONNEE"

### C.1 Comment on vise en vrai

En petanque reelle, le joueur ne vise PAS le cochonnet directement. Il utilise la methode des **trois points** :

1. **Le cochonnet** : ou il se trouve (objectif final)
2. **La "place de parking"** : ou le joueur veut que sa boule s'arrete (souvent DEVANT le cochonnet, pas a cote, car "boule devant, boule d'argent")
3. **La donnee** : le point d'impact au sol ou la boule va atterrir, AVANT la place de parking, pour que le roulement l'amene a destination

**La donnee est le coeur de la visee.** Le joueur fixe intensement un point precis au sol (un caillou, une marque) et lance pour y atterrir. "Target focus" : les pros fixent un point minuscule au sol, pas la zone generale.

### C.2 Ce que le jeu devrait montrer (et ne pas montrer)

#### A MONTRER (feedback du joueur) :
- Fleche de direction (obligatoire)
- Indicateur de puissance (% ou couleur)
- Point d'impact estime (la "donnee") = cercle au sol
- Type de lancer selectionne (roulette/demi-portee/plombee/tir)

#### A NE PAS MONTRER (trop facile) :
- ~~Trajectoire complete avec point d'arret final~~ (actuellement montre dans le jeu via les dots de prediction)
- ~~Ligne pointillee du vol~~ (actuellement montree dans le jeu)

#### PROBLEME ACTUEL :
Le jeu montre actuellement :
1. La fleche de direction (OK)
2. Le point d'atterrissage (OK - c'est la "donnee")
3. **La trajectoire de roulement en pointilles** (TROP d'aide)
4. **La trajectoire de vol en tirets** (TROP d'aide)

**En vrai :** Le joueur doit DEVINER ou la boule va s'arreter en se basant sur :
- Sa connaissance du terrain (friction, pente, irregularites)
- Sa calibration de puissance (experience)
- Son choix de technique (roulette/demi-portee/plombee)

**Proposition :** Garder la prediction en mode "facile" (tutoriel, debut de jeu), mais la retirer ou la reduire en mode "realiste" ou contre les adversaires de haut niveau. La difficulte de la petanque vient de la CALIBRATION de la puissance, pas du choix de direction.

### C.3 Comment le choix de technique affecte la visee

| Technique | Ce que le joueur choisit | Ce qui est incertain |
|-----------|--------------------------|----------------------|
| Roulette | Direction + puissance | Deviations par le terrain pendant le roulement |
| Demi-portee | Direction + puissance | Rebond a l'atterrissage + roulement residuel |
| Plombee | Direction + puissance | Distance de roulement residuel (meme faible, peut tout changer) |
| Tir au fer | Direction + puissance | Angle d'impact exact (carreau ou non) |

**La difficulte augmente avec la technique :**
- Roulette = facile a calibrer (long roulement = marge d'erreur), mais sensible au terrain
- Plombee = difficile a calibrer (presque pas de roulement = tres peu de marge)
- Tir au fer = tres difficile (il faut toucher une cible de 7 cm a 8-10 m de distance)

---

## D. DEROULEMENT D'UNE MENE

### D.1 Lancer du cochonnet

**Regles reelles :**
- L'equipe qui a gagne la mene precedente lance le cochonnet (1ere mene : tirage au sort)
- Distance : **6 a 10 metres** du cercle de lancer
- Au moins **1 metre** de tout bord de terrain
- Le lanceur a **3 tentatives** pour un lancer valide
- Si 3 echecs : l'equipe adverse a 3 tentatives
- Si les 6 tentatives echouent : deplacer le cercle et recommencer

**Aspect strategique du lancer du cochonnet :**
- Lancer a une distance ou son tireur est a l'aise / le tireur adverse ne l'est pas
- Lancer pres d'un obstacle (mur, bordure) pour compliquer le pointage adverse
- Varier la distance entre les menes pour destabiliser

**Dans le jeu actuel :** Le lancer du cochonnet est simplifie (1 seul essai, pas de validation stricte de distance, joueur lance toujours en premier). C'est acceptable pour le MVP mais manque la dimension strategique.

### D.2 Premiere boule

**Regle :** L'equipe qui a lance le cochonnet lance TOUJOURS la premiere boule.

**Dans le jeu actuel :** Correct (`STATES.FIRST_BALL` → player, puis `STATES.SECOND_TEAM_FIRST` → opponent).

### D.3 La regle fondamentale : "l'equipe qui perd rejoue"

Apres la premiere boule de chaque equipe, la regle est simple :
- Mesurer quelle equipe a la boule la **plus loin** du cochonnet
- Cette equipe doit jouer
- Elle continue a jouer JUSQU'A ce qu'elle "prenne le point" (sa meilleure boule soit plus proche que la meilleure adverse) OU qu'elle n'ait plus de boules

**Consequence strategique :** Une equipe peut jouer 2, 3 ou meme 6 boules de suite si elle n'arrive pas a prendre le point. Cela cree une pression enorme et un "avantage de boules" pour l'equipe qui garde ses boules en reserve.

**Dans le jeu actuel :** Implemente correctement dans `_determineNextTeam()`.

### D.4 Quand une equipe n'a plus de boules

Si l'equipe "perdante" (la plus loin) n'a plus de boules, l'equipe gagnante joue TOUTES ses boules restantes. Chaque boule placee plus pres que la meilleure adverse rapporte 1 point supplementaire.

**Consequence strategique :** C'est le moment des "boules gratuites". Un bon joueur profite de ce moment pour empiler les points.

**Dans le jeu actuel :** Implemente correctement.

### D.5 Egalite de distance

Trois cas :
1. **Les deux equipes ont encore des boules :** La derniere equipe a avoir joue rejoue.
2. **Une seule equipe a des boules :** Elle joue ses boules restantes, scoring normal.
3. **Plus de boules des deux cotes ET toujours egal :** Mene NULLE (0 points). Meme equipe relance le cochonnet.

**Dans le jeu actuel :** Cas 1 et 3 geres. Le cas 2 meriterait une verification.

### D.6 Comptage des points

A la fin de la mene :
1. Trouver la boule **la plus proche** du cochonnet → son equipe gagne la mene
2. Trouver la **meilleure boule** de l'equipe perdante (la plus proche parmi les perdantes)
3. Compter toutes les boules gagnantes qui sont **plus proches** que cette meilleure boule perdante
4. Chaque boule gagnante = **1 point**

**Score maximum par mene :**
- Tete-a-tete (1v1) : 3 points (3 boules/joueur)
- Doublette (2v2) : 6 points (3 boules × 2 joueurs)
- Triplette (3v3) : 6 points (2 boules × 3 joueurs)

**Si aucune boule perdante en jeu** (toutes sorties ou pas encore lancees) : toutes les boules gagnantes comptent.

**Dans le jeu actuel :** Implemente correctement dans `_scoreMene()`.

### D.7 Victoire a 13 points

- Premier a **13 points** gagne. Pas besoin d'ecart de 2.
- Points cumules a travers les menes.
- Une partie dure typiquement 4 a 8 menes (15-40 min en vrai, 3-4 min dans le jeu).

### D.8 Cochonnet sorti = mene morte

Si le cochonnet sort du terrain :
- **Mene morte** (annulee)
- **Exception :** Si une equipe a des boules restantes et l'autre non, l'equipe avec des boules marque 1 point par boule restante
- Meme equipe relance le cochonnet a la mene suivante

**Dans le jeu actuel :** Implemente dans `_handleMeneDead()`. Correct.

### D.9 Boule hors terrain

- Boule qui sort ENTIEREMENT = **morte** (retiree)
- Boule SUR la ligne = vivante
- Si une boule pousse une autre hors du terrain : la boule sortie est morte, celle qui l'a poussee reste ou elle s'est arretee

**Dans le jeu actuel :** Implemente dans `_checkBoundsAll()`. La verification utilise `checkOutOfBounds()` avec les rayons, ce qui est correct.

---

## E. AMBIANCE ET GAME FEEL

### E.1 Catalogue des sons essentiels

#### Sons de boules (priorite CRITIQUE)

| Son | Description | Frequence dominante | Duree | Declencheur |
|-----|-------------|---------------------|-------|-------------|
| **Clac boule-boule** | Impact metal sur metal, sec, resonnant | 2-4 kHz + sub harmonique | 150-300 ms | Collision boule-boule |
| **Toc boule-cochonnet** | Impact metal sur bois, plus sourd et mat | 800 Hz - 2 kHz | 100-200 ms | Collision boule-cochonnet |
| **Roulement gravier** | Crissement continu, granuleux, s'attenue | 500 Hz - 3 kHz, bruit rose | Continu (loop pendant le roulement) | Boule en mouvement au sol |
| **Atterrissage terre** | Thud sourd + petit crunch de gravier | 200-800 Hz | 100-200 ms | Boule touche le sol |
| **Atterrissage plombee** | Thud lourd + explosion de gravier + echo | 100-500 Hz (plus grave) | 200-400 ms | Plombee atterrit |
| **Carreau** | Clac puissant + resonance metallique prolongee | 2-5 kHz (plus aigu que normal) | 300-500 ms | Carreau detecte |
| **Lancer** | Swoosh d'air court | 1-4 kHz, bruit passe-haut | 100-200 ms | Boule quitte la main |

#### Sons d'ambiance (priorite IMPORTANTE)

| Son | Description | Volume | Declencheur |
|-----|-------------|--------|-------------|
| **Cigales** | Chirp continu, typiquement provencal | 10-15% du mix | Loop permanent en scene petanque |
| **Oiseaux** | Gazouillis legers, intermittents | 5-10% du mix | Aleatoire, toutes les 10-20 sec |
| **Vent leger** | Souffle doux dans les arbres | 5% du mix | Loop permanent, subtil |
| **Foule murmure** | Murmures indistincts de spectateurs | 5-8% du mix | Loop permanent, basse quand boule roule |

#### Sons de reactions (priorite IMPORTANT)

| Son | Description | Declencheur |
|-----|-------------|-------------|
| **"Ohhhhh" monte** | Exclamation collective croissante | Boule s'approche du cochonnet (deceleration) |
| **Applaudissements** | Clapping court (3-5 sec) | Bon point, tir reussi |
| **"CARREAU !" cri** | Exclamation enthousiaste | Carreau detecte |
| **Grognement/soupir** | Deception collective | Boule sortie ou tres loin |
| **Rires** | Rire bref | Situation comique (boule qui va n'importe ou) |

### E.2 Moments de tension et drama

#### Le "moment de verite" : deceleration pres du cochonnet

**80% du drame** d'une mene se joue dans les 2-3 secondes ou une boule ralentit pres du cochonnet. C'est le moment ou tout le monde retient son souffle.

**Ce que le jeu devrait faire :**
- Zoom camera subtil (1.0x → 1.05x) quand la boule entre dans un rayon de 40-50 px du cochonnet
- Ralenti optionnel (0.4x) quand la boule est dans ce rayon ET sa vitesse < 2
- Son : silence ou crescendo tendu
- Indicateur de point qui change en temps reel
- "Ohhhhh" croissant de la foule si la boule roule vers le cochonnet

**Dans le jeu actuel :** Le zoom dramatique est implemente (`_updateDramaticZoom` mentionne dans le code). Le slow-motion n'est pas encore la.

#### La derniere boule

Le dernier lancer d'une mene est TOUJOURS dramatique : l'adversaire ne peut plus repondre.

**Ce que le jeu devrait faire :**
- Indicateur visuel "DERNIERE BOULE" avec couleur differente
- Musique ou ambiance differente
- Camera plus serree
- Pause dramatique avant le lancer

#### Le tir decisif

Quand l'adversaire a le point et que le joueur decide de tirer pour ejecter la boule adverse.

**Ce que le jeu devrait faire :**
- Changement de musique/ambiance (tension ++)
- Camera centree entre la boule lancee et la cible
- Hitstop de 2-4 frames (30-60 ms) a l'impact
- Screen shake calibre (2-4 px, 100ms)
- Flash blanc au point de contact

**Dans le jeu actuel :** Le hitstop, flash et screen shake sont implementes pour le carreau. Les tirs normaux ont aussi des effets (flash, shake) mais moins intenses.

#### Le carreau

Le "strike" de la petanque. Le moment WOW ultime.

**Ce que le jeu devrait faire :**
- TOUT ce qui est fait pour le tir decisif, mais PLUS intense
- Hitstop plus long (80-100 ms)
- Flash dore/blanc
- Particules dorees en etoile
- Texte "CARREAU !" anime
- Possible cri de foule "CARREAU !"
- Freeze-frame pour laisser le joueur savourer

**Dans le jeu actuel :** Bien implemente dans `_celebrateCarreau()` (hitstop 100ms, flash, shake, texte anime, particules dorees). A affiner avec le son.

### E.3 Reactions des personnages

#### En vrai
- **Lanceur content :** Petit geste de satisfaction (poing serre, hochement de tete)
- **Lanceur deceu :** Secoue la tete, hausse les epaules, grimace
- **Adversaire impressionne :** Recule d'un pas, leve les sourcils
- **Adversaire soulage :** Souffle, se redresse
- **Moment de mesure :** Tous accroupis autour du cochonnet, discussions animees

#### Dans le jeu
**Implemente (basique) :** Petit saut (bon coup) ou secouement de tete (rate). A enrichir avec :
- Bras en l'air pour le carreau
- Animation d'accroupissement pour mesurer les distances
- Dialogue-bulle court ("Peuchère !", "Pas mal...", "Oh la la !")

### E.4 Rythme de jeu

**En vrai, une mene de petanque dure 3 a 8 minutes.** Le rythme est lent et delibere :
1. Le joueur marche vers le cercle (~5 sec)
2. Il etudie le terrain (~5-15 sec)
3. Il se concentre, fixe sa donnee (~3-5 sec)
4. Il lance (~2 sec)
5. La boule vole/roule (~3-5 sec)
6. Tout le monde regarde le resultat (~2-3 sec)
7. Discussion / mesure si necessaire (~5-10 sec)

**Pour le jeu :** Comprimer a ~30-45 sec par boule (3-4 min par mene de 6 boules). L'important est de NE PAS PRESSER les moments de tension (deceleration, mesure, reaction).

**Temps d'attente recommandes :**
| Moment | Duree min | Duree max |
|--------|-----------|-----------|
| Avant le lancer de l'IA | 1.0 sec | 2.0 sec (deja implemente) |
| Apres l'arret d'une boule | 0.5 sec | 1.0 sec |
| Mesure dramatique (boules proches) | 1.0 sec | 2.0 sec |
| Affichage score de mene | 2.0 sec | 3.0 sec |
| Celebration carreau | 1.5 sec | 2.5 sec |

---

## F. ECARTS ACTUELS ET PRIORITES DE CORRECTION

### F.1 Ecarts CRITIQUES (affectent le realisme fondamental)

| # | Ecart | Valeur actuelle | Valeur correcte | Impact | Correction |
|---|-------|-----------------|-----------------|--------|------------|
| C1 | **Prediction de trajectoire trop genereuse** | Montre le vol + roulement complet en pointilles | Montrer seulement la "donnee" (point d'atterrissage) + direction de roulement | La petanque est un jeu de **calibration**, pas de visee assistee. Montrer la trajectoire complete retire la difficulte principale. | Retirer les prediction dots en mode normal. Les garder en mode tutoriel/facile. |
| C2 | **Tir au fer : landingFactor 0.95 au lieu de ~1.0** | `landingFactor: 0.95`, `rollEfficiency: 10.0` | La boule ne touche pas le sol. Elle devrait "atterrir" sur la boule cible directement. | Le hack rollEfficiency=10 produit un comportement peu naturel (roulement ultra-rapide sur 5% de la distance). | Refactorer le tir pour qu'il soit un vol direct vers la cible, avec collision calculee a l'arrivee, pas un atterrissage au sol + roulement. |
| C3 | **Pas de "tir devant" ni "tir a la rafle"** | Un seul mode de tir | 3 modes de tir (au fer, devant, rafle) | Reduit la profondeur tactique du tir. Le tir devant est la technique la plus utilisee par les tireurs amateurs. | Ajouter au minimum le tir devant (atterrit 20-30 cm avant la cible puis rebondit). La rafle est nice-to-have. |
| C4 | **Pas de son de roulement continu** | SFX de roulement throttle (une impulsion toutes les 120ms) | Son continu granuleux qui suit la vitesse de la boule (pitch + volume proportionnels a la vitesse) | Le roulement sur le gravier est le "texture sonore" de la petanque. Sans lui, le jeu est trop silencieux entre les impacts. | Creer un loop de roulement continu avec volume et pitch dynamiques. |

### F.2 Ecarts IMPORTANTS (ameliorent significativement l'experience)

| # | Ecart | Valeur actuelle | Valeur correcte | Impact | Correction |
|---|-------|-----------------|-----------------|--------|------------|
| I1 | **Pas de slow-motion** | `slowMotionFactor` n'est pas utilise | 0.3-0.4x quand boule < 40px du cochonnet et speed < 2 | Manque le moment de tension principal (deceleration pres du cochonnet) | Implementer le delta scaling (research/22) |
| I2 | **Pas de sons d'ambiance** | Aucun son d'ambiance | Cigales (loop 15%), oiseaux (intermittent 5%), murmures foule (5%) | La scene est "morte" entre les lancers. Manque l'immersion provencale. | Generer via ElevenLabs MCP ou sons proceduraux |
| I3 | **Pas de reactions sonores de la foule** | Aucune | "Ohhh" pendant la deceleration, applaudissements apres un bon coup, grognements apres un rate | Le son = 50% du game feel. Les reactions de foule rendent chaque lancer significatif. | 4-6 echantillons sonores courts |
| I4 | **Pas d'indicateur "derniere boule"** | Rien de special pour la derniere boule | Indicateur visuel + audio special | C'est un moment cle de tension que le jeu ne signale pas | Ajouter un label anime + effet sonore |
| I5 | **Pas de mesure dramatique** | Passage direct au scoring | Pause + zoom + animation de mesure quand les boules sont a <5px | En vrai, le moment de mesure (accroupis, ficelle) est un grand moment de suspense | Animation de 1-2 sec avec zoom et comparaison visuelle |
| I6 | **Lancer du cochonnet sans dimension strategique** | 1 seul essai, pas de choix strategique | 3 tentatives, choix de distance/position intentionnel | En vrai, le lancer du cochonnet EST une decision strategique (distance, position) | Ajouter un feedback sur la validite (6-10m) et permettre de viser un endroit precis |
| I7 | **Camera statique pendant le roulement** | Camera fixe (vue complete du terrain) | Camera follow douce (lerp 0.08) pendant le vol, pan vers cochonnet apres atterrissage | Manque le dynamisme cinematique qui rend chaque lancer visuellement engageant | Implementer le camera follow (research/22) |

### F.3 Ecarts NICE-TO-HAVE (polish, pas essentiels)

| # | Ecart | Description | Correction |
|---|-------|-------------|------------|
| N1 | Pas de vent | En vrai le vent affecte le cochonnet lance haut et les plombees | Ajouter un indicateur de vent leger, applique comme biais sur le point d'atterrissage |
| N2 | Pas de pente de terrain | En vrai les terrains ont des micro-pentes | Ajouter un biais directionnel sur le roulement (configurable par arene) |
| N3 | Pas de backspin | La plombee avec backspin s'arrete plus vite | Ajouter un parametre spin dans les lancers avances |
| N4 | Pas de sidespin | Permet de courber la trajectoire | Post-MVP, mecanique avancee |
| N5 | Durete de boule non modelisee | Soft=plus de carreau, hard=plus de rebond | Integrer dans boules.json comme stat affectant le COR |
| N6 | Pas de "boule devant, boule d'argent" | Pas de bonus pour une boule placee devant le cochonnet | L'IA pourrait viser devant le cochonnet plutot qu'a cote |
| N7 | Pas de tir au cochonnet par le joueur | Seule l'IA stratege peut tirer le cochonnet | Ajouter une option "Tirer le cochonnet" dans le menu de lancer |
| N8 | Irregularites du terrain | Terrain parfaitement lisse | Ajouter un bruit aleatoire sur la direction de roulement (amplitude configurable par type de terrain) |
| N9 | Differentiation son par terrain | Meme son sur tous les terrains | Atterrissage sur herbe = thud sourd, sur dalles = clac dur, sur sable = pff mou |
| N10 | Usure du terrain | Pas de changement du terrain au fil des menes | Les crateres sont dessines (impactLayer) mais n'affectent pas la physique |

### F.4 Resume des priorites

```
SPRINT IMMEDIAT (physique + sons coeur) :
  C1 - Retirer/reduire la prediction de trajectoire
  C4 - Son de roulement continu
  I2 - Sons d'ambiance (cigales minimum)
  I3 - Reactions sonores de la foule

SPRINT SUIVANT (game feel + tension) :
  I1 - Slow-motion pres du cochonnet
  I5 - Mesure dramatique (pause + zoom)
  I7 - Camera follow pendant le vol
  I4 - Indicateur derniere boule

SPRINT ULTERIOR (profondeur tactique) :
  C2 - Refactorer le tir au fer (vol direct, pas sol + roulement)
  C3 - Ajouter le tir devant
  I6 - Lancer du cochonnet strategique
  N7 - Tir au cochonnet par le joueur

LONG TERME (polish avance) :
  N1-N10 - Vent, pente, spin, durete, irregularites, etc.
```

---

## ANNEXE : CONSTANTES NUMERIQUES DE REFERENCE

### Distances et tailles (echelle jeu)

| Element | Reel | Pixels (jeu) | Conversion |
|---------|------|---------------|------------|
| Terrain longueur | 15 m | 420 px | 28 px/m |
| Terrain largeur | 4 m | 180 px | 45 px/m |
| Boule diametre | 71-80 mm | 20 px (rayon 10) | ~250 px/m |
| Cochonnet diametre | 25-35 mm | 8 px (rayon 4) | ~230 px/m |
| Cercle de lancer | 35-50 cm | 32 px (rayon 16) | ~64 px/m |
| Distance cochonnet | 6-10 m | 200-340 px | ~33 px/m |

**Note :** Les echelles ne sont pas parfaitement coherentes (le terrain est plus compresse que les boules). C'est acceptable pour le gameplay : les boules doivent etre visibles, le terrain doit tenir dans l'ecran.

### Vitesses (echelle jeu)

| Technique | Vitesse reelle (m/s) | Vitesse jeu (px/frame a 60fps) | MAX_THROW_SPEED = 12 |
|-----------|----------------------|-------------------------------|----------------------|
| Roulette | 4-5 | ~3-4 | power ~0.3 |
| Demi-portee | 5-6 | ~4-5 | power ~0.4 |
| Plombee | 5-6 | ~4-5 | power ~0.4 |
| Tir au fer | 13-16 | ~10-13 | power ~0.8-1.0 |

### Friction (echelle jeu)

| Terrain | Friction reelle (mu) | FRICTION_BASE * mult | mult actuel |
|---------|---------------------|---------------------|-------------|
| Terre battue | ~0.02-0.04 (roulement acier) | 0.15 * 1.0 = 0.15 | 1.0 |
| Herbe | ~0.04-0.08 | 0.15 * 1.8 = 0.27 | 1.8 |
| Sable | ~0.08-0.15 | 0.15 * 3.5 = 0.525 | 3.5 |
| Dalles | ~0.01-0.02 | 0.15 * 0.4 = 0.06 | 0.4 |

### Restitution (COR)

| Collision | COR reel | COR jeu | Correct ? |
|-----------|----------|---------|-----------|
| Boule-boule (acier semi-tendre) | 0.55-0.65 | 0.62 | OUI |
| Boule-cochonnet (acier-bois) | 0.40-0.55 | 0.50 | OUI |
| Boule-bordure (acier-bois) | 0.20-0.40 | Non implemente | MANQUANT |

---

*Document genere a partir de 11 fichiers de recherche, 5 fichiers d'implementation, et recherche web complementaire.*
*Derniere mise a jour : 16 mars 2026.*
