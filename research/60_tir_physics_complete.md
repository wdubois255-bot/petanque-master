# Recherche : Physique des Types de Tir en Petanque

## Sources
- carreauenpetanque.wordpress.com (TPE analyse experimentale)
- forums.futura-sciences.com (TPE physique carreau parfait)
- boulipedia.com, conseilsport.decathlon.fr, twikado.fr, facileacomprendre.fr
- esmpetanque.sportsregions.fr (techniques)
- petanque.wordpress.com (All About Petanque)
- Wikipedia: Elastic collision, Impact parameter, Coefficient of restitution
- phys.libretexts.org (oblique collisions)
- hypertextbook.com (COR measurements)
- proceeding.unesa.ac.id (biomechanics study)
- ScienceDirect (steel ball oblique impact)
- obut.com, boulipedia.com (hardness/bounce)

---

## 1. Rappels physiques fondamentaux

### 1.1 Collision de deux spheres de masse egale

La petanque est un probleme de collision entre deux spheres d'acier de masse quasi-egale (~700g, diametre ~71mm).

**Equations de base (collision 2D) :**
- La quantite de mouvement se decompose en deux composantes :
  - **Normale** (le long de la ligne des centres) : soumise au COR
  - **Tangentielle** (perpendiculaire) : INCHANGEE pour des spheres lisses

**Formules post-collision (le long de la ligne des centres) :**
```
v1n' = ((m1 - e*m2) * v1n + (1+e) * m2 * v2n) / (m1 + m2)
v2n' = ((m2 - e*m1) * v2n + (1+e) * m1 * v1n) / (m1 + m2)
```

Avec m1 = m2 et v2n = 0 (cible immobile) :
```
v1n' = v1n * (1 - e) / 2
v2n' = v1n * (1 + e) / 2
```

Avec e = 0.62 (acier petanque) :
- **Tireur garde : (1 - 0.62) / 2 = 19% de la vitesse normale**
- **Cible recoit : (1 + 0.62) / 2 = 81% de la vitesse normale**

### 1.2 Parametre d'impact et geometrie

Le **parametre d'impact** (b) est la distance perpendiculaire entre la trajectoire du centre du tireur et le centre de la cible.

Pour deux spheres de rayon R :
- **b = 0** : collision frontale (head-on) → transfert maximal le long de la ligne des centres
- **0 < b < 2R** : collision oblique → transfert partiel, deviation laterale
- **b >= 2R** : pas de collision (rate)

L'angle de contact (alpha) entre la ligne des centres et la trajectoire du tireur :
```
sin(alpha) = b / (2R)
```
- b = 0 → alpha = 0° (frontal)
- b = R → alpha = 30° (moitie decale)
- b = R*sqrt(3) → alpha = 60° (tres rasant)
- b → 2R → alpha → 90° (tangent)

**Fraction d'energie transferee a la cible (collision elastique parfaite) :**
```
Fraction = cos²(alpha)
```
- alpha = 0° → 100% transfere (carreau)
- alpha = 30° → 75% transfere
- alpha = 45° → 50% transfere
- alpha = 60° → 25% transfere
- alpha = 80° → 3% transfere (casquette)

### 1.3 Regle des 90 degres

Pour deux spheres de masse egale en collision parfaitement elastique (e=1) :
- Les vitesses de sortie des deux spheres font **toujours 90 degres** entre elles
- Avec e < 1 (reel), cet angle diminue (les deux boules partent un peu plus "en avant")

### 1.4 Coefficient de restitution (COR)

**Valeurs mesurees :**
| Materiau | COR | Source |
|----------|-----|--------|
| Acier sur acier (petanque) | 0.60 - 0.65 | Multiple sources |
| Bille acier sur beton | 0.597 | hypertextbook.com (mesure experimentale) |
| Acier a basse vitesse (~1 m/s) | ~0.65 | ScienceDirect |
| Acier a haute vitesse (~10 m/s) | ~0.55 | ScienceDirect (deformation microplastique) |
| Boule tendre (35 HRC) | ~0.50-0.55 | Estimation basee sur les descriptions |
| Boule dure (50+ HRC) | ~0.65-0.70 | Estimation basee sur les descriptions |

**IMPORTANT** : Le COR diminue avec la vitesse d'impact ! Un tir rapide (10+ m/s) a un COR plus bas qu'un choc lent. Cela aide naturellement le carreau sur place en tir.

**Effet de la durete des boules :**
- Boule **tendre** (110 kg/mm², 35 HRC) : rebondit MOINS, favorise le carreau sur place
- Boule **dure** (140+ kg/mm², 50+ HRC) : rebondit PLUS, risque de recul/casquette
- La durete affecte le COR mais PAS la friction de surface
- Acier inox vs carbone : rebond IDENTIQUE, c'est la durete qui compte

---

## 2. Les types de tir en detail

### 2.1 CARREAU (tir au fer + boule prend la place)

**Definition :** La boule tiree prend la place exacte de la boule ciblee.

**Condition physique :**
- Le vecteur vitesse du tireur DOIT passer par le centre de gravite de la cible
- Parametere d'impact b ≈ 0 (collision frontale ou quasi-frontale)
- Angle alpha < 15° environ

**Ce qui se passe :**
1. Le tireur arrive a grande vitesse (8-12 m/s)
2. Collision frontale : 81% de l'energie transferee a la cible (avec COR 0.62)
3. Le tireur garde 19% → vitesse residuelle ~1.5-2.3 m/s
4. La friction du sol arrete le tireur en quelques centimetres
5. La cible est ejectee loin

**Trois variantes :**

#### 2.1a CARREAU SUR PLACE (parfait)
- Le tireur s'arrete a moins de ~50cm de l'impact
- **Conditions supplementaires** :
  - Arc HAUT (plombee) : angle d'arrivee plus vertical → composante horizontale reduite
  - Backspin (retro) : le poignet imprime une rotation arriere qui freine la boule au sol
  - Terrain souple (terre, sable) : absorbe l'energie residuelle
  - Boule tendre : COR plus bas → moins d'energie residuelle
- **Le sol joue un role CRITIQUE** : "Le carreau est un jeu a trois : boule en mouvement, boule tiree, sol"
- Un tir PARFAITEMENT vertical (plombee extreme) avec backspin sur terrain souple donne le meilleur carreau sur place

#### 2.1b CARREAU DEVANT / ALLONGE
- Le tireur continue a rouler vers l'avant apres l'impact
- **Cause** : vitesse residuelle trop elevee + friction insuffisante
- Se produit quand :
  - Arc trop tendu (composante horizontale elevee)
  - Terrain dur (dalles) : la boule glisse
  - Pas de backspin
  - Boule dure (COR eleve)
- Reste un carreau si la boule du tireur est dans la zone utile

#### 2.1c CARREAU RETRO
- Variante rare : le tireur RECULE apres l'impact grace a un backspin extreme
- **Physique** : le backspin cree une friction "inversee" au contact du sol
  - La boule glisse sur le sol avec rotation arriere
  - Quand la vitesse de glissement tombe a zero, la rotation arriere prend le dessus
  - La boule repart legerement en arriere
- Necessite : haute maitrise du poignet + terrain granuleux (sable, terre)

### 2.2 RECUL

**Definition :** La boule tiree frappe la cible puis RECULE (repart en arriere).

**Physique :**
- Avec COR 0.62 et collision frontale, le tireur garde 19% de sa vitesse dans la direction OPPOSEE a son mouvement initial (la formule donne un signe negatif pour v1n')
- Attends : v1n' = v1n * (1 - 0.62) / 2 = 0.19 * v1n. Le signe depend de la convention mais la boule 1 repart VERS L'ARRIERE dans le referentiel de la ligne des centres
- CORRECTION IMPORTANTE : Pour deux masses egales avec une cible immobile :
  ```
  v1' = v1 * (1 - e) / 2   (vers l'avant, mais tres lent)
  ```
  En fait, le tireur NE recule PAS naturellement dans une collision 1D ideale. Il CONTINUE vers l'avant mais tres lentement.

  **Alors pourquoi le recul existe-t-il en pratique ?**

  Le recul en petanque est cause par :
  1. **L'angle d'arrivee** : la boule arrive avec un arc (composante verticale). Au contact du sol pres de l'impact, le rebond peut avoir une composante arriere
  2. **Le backspin** : rotation arriere → friction inversee apres collision → la boule repart en arriere
  3. **La geometrie 3D** : la boule ne frappe pas exactement au centre mais legerement AU-DESSUS du centre de la cible, creant un moment de rotation qui la renvoit vers l'arriere
  4. **Le contact sol-boule** au moment de l'impact : si la boule touche le sol JUSTE AVANT la cible (palet), le rebond combinee au choc cree un recul

**Conditions favorisant le recul :**
- Arc haut (plombee forte)
- Backspin prononce
- Impact legerement au-dessus du centre de la cible
- Terrain souple (terre grasse, sable)
- Boule tendre

**Distance typique de recul :** 5-30 cm en arriere de la position d'impact

### 2.3 CASQUETTE

**Definition :** La boule tiree effleure le sommet de la cible sans la deloger. La cible reste quasiment en place. Le tireur passe par-dessus.

**Physique :**
- Parametre d'impact eleve : la boule ne touche la cible que par le haut
- La ligne des centres fait un angle eleve (alpha > 60-70°) avec la trajectoire
- Tres peu d'energie transferee : cos²(70°) ≈ 12%, cos²(80°) ≈ 3%
- La cible ne recoit presque pas de quantite de mouvement → a peine deplacee (<8px dans le jeu, <25cm reel)
- La boule du tireur continue sa route presque inchangee, devie legerement vers le bas

**Conditions provoquant une casquette :**
- Mauvaise "donnee" : la boule atterrit trop pres ou trop loin
- Terrain dur qui fait rebondir la boule → elle passe AU-DESSUS
- Arc trop tendu sans suffisamment de portee
- Visee legerement haute

**En termes de geometrie de collision :**
```
                    tireur
                      |  \  ← trajectoire descendante
                      |   \
                      |    * ← point de contact (sommet)
                  ----O----  ← cible (vue de cote)
                 /         \
                sol
```
Le tireur touche la cible tres haut. La ligne des centres est quasi-verticale. La composante de vitesse le long de cette ligne est faible. Tres peu de transfert.

### 2.4 TIR DE COTE (sur l'oreille)

**Definition :** La boule tiree frappe le cote de la cible. Terme: "tirer sur l'oreille".

**Physique :**
- Parametre d'impact intermediaire : b ≈ R a 1.5R
- Angle alpha entre 30° et 60°
- La cible part lateralement (perpendiculaire a la trajectoire du tireur)
- Le tireur est devie dans le sens oppose

**Trajectoires post-impact :**
```
    tireur →  → → * ← impact
                  |
                  O cible
                  |
                  ↓ cible part sur le cote
    tireur continue ↗ (devie vers le haut)
```

Pour collision elastique de masses egales, regle des 90° :
- L'angle entre les directions de sortie ≈ 90° (exactement 90° si e=1)
- Avec e=0.62, l'angle est un peu inferieur a 90°

**Fraction d'energie transferee :**
- b = R (alpha=30°) : 75% transferee → cible bien ejectee lateralement
- b = 1.4R (alpha=45°) : 50% → les deux boules partent a ~45° de part et d'autre
- b = 1.7R (alpha=60°) : 25% → le tireur est peu devie, cible part faiblement sur le cote

**Usage tactique :**
- Intentionnel : ejecter une boule dans une direction specifique
- Ou rate : on visait le centre mais on a touche le cote
- "Ciseau" / "Sifflet" : tir delibere sur le cote pour toucher deux boules d'un coup par ricochet

### 2.5 PALET

**Definition :** La boule tiree atterrit DEVANT la cible (a ras du sol) et la percute apres un roulement/rebond. Le tireur reste dans un rayon de ~50cm de l'impact.

**Technique :** Tir devant (la boule atterrit 10-30cm avant la cible) ou raspaille (roule au sol depuis le depart).

**Physique :**
- La "donnee" (point d'atterrissage) est a 10-30cm avant la cible
- La boule perd de l'energie au contact du sol AVANT de frapper la cible
- La vitesse au moment du contact est donc INFERIEURE a un tir au fer pur
- Le COR sol-boule est plus bas (~0.35-0.50) que boule-boule (0.62)
- Resultat : moins d'energie de rebond, la boule reste plus facilement sur place

**Conditions favorables :**
- Terrain plat et regulier (la boule doit rouler droit)
- Surface pas trop dure (sinon la boule rebondit et passe au-dessus = casquette)
- Distance suffisante pour jauger le roulement

**Difference avec le carreau au fer :**
| Aspect | Tir au fer | Palet |
|--------|-----------|-------|
| Contact sol avant impact | NON | OUI |
| Vitesse a l'impact | Elevee (8-12 m/s) | Moyenne (3-7 m/s) |
| Precision requise | Tres haute | Moderee |
| Risque de casquette | Oui (terrain dur) | Non |
| Terrain ideal | Tout terrain | Plat, regulier |
| Prestige | Maximum | Moindre ("raspaille") |

**Variante - Tir devant :**
- La boule parcourt ~90% de sa trajectoire en l'air
- Atterrit a 20-30cm AVANT la cible
- Termine en roulant jusqu'a la cible
- A eviter sur terrain dur ou caillouteux (rebond imprevisible)

---

## 3. Point d'impact sur la boule cible

L'endroit ou la boule tiree frappe la cible determine TOUT le resultat :

### 3.1 Impact CENTRAL (plein fer)
- b ≈ 0, alpha ≈ 0°
- Transfert maximal : 81% de l'energie (COR 0.62)
- Cible ejectee droit devant
- Tireur s'arrete ou continue lentement → CARREAU
- C'est le tir ideal

### 3.2 Impact HAUT (dessus)
- La ligne des centres est quasi-verticale
- Tres peu de transfert horizontal
- Le tireur "coiffe" la cible → CASQUETTE
- La cible vibre/tourne sur place mais ne bouge pas significativement

### 3.3 Impact BAS (dessous du centre)
- Difficile en pratique (le sol est la)
- Possible si la boule arrive en roulant (palet) et frappe le bas
- Tend a soulever legerement la cible
- Peut creer un effet de "cuillere" qui lance la cible en l'air

### 3.4 Impact LATERAL (cote / oreille)
- b ≈ R, alpha ≈ 30°
- Transfert partiel, la cible part sur le cote
- Le tireur devie dans le sens oppose
- Regle des 90° (approximative avec e=0.62)

### 3.5 Impact LEGEREMENT DECENTRE (quasi-carreau)
- b = 0.1R - 0.5R, alpha = 3° - 15°
- Transfert presque complet (95-99%)
- La cible part presque droit devant avec une legere deviation
- Le tireur s'arrete mais legerement decale → quasi-carreau

### Schema recapitulatif (vue de face de la cible)
```
          casquette (alpha > 70°)
              |
         [  haut  ]     ← peu de transfert
        /           \
       | quasi-       |
   cote|   CENTRE    |cote  ← transfert partiel + deviation
       | carreau      |
        \           /
         [  bas   ]      ← souleve la cible
              |
```

---

## 4. Le role du spin (rotation)

### 4.1 Backspin (retro / rotation arriere)

**Comment le creer :** Le poignet se deroule vers le haut au lacher. Les doigts "grattent" le dessous de la boule, imprimant une rotation contraire au sens de deplacement.

**Effets physiques :**
1. **Au contact du sol** : la boule GLISSE d'abord (rotation et deplacement opposes), creant une friction superieure qui la freine brutalement
2. **Phase de transition** : la vitesse de glissement tombe a zero, la rotation arriere prend le dessus
3. **Resultat** : la boule s'arrete plus vite (carreau sur place) ou meme recule (carreau retro)

**En chiffres dans le jeu actuel :**
- Phase 1 (glissement) : friction x5.0 pendant 30 frames
- Phase 2 (transition) : friction progressive pendant 18 frames
- Intensite depend de la stat Effet du personnage (8=70%, 9=85%, 10=100%)

### 4.2 Topspin (rotation avant)

**Rare en petanque** mais existe :
- Paume vers le haut au lacher → la boule roule PLUS vite apres atterrissage
- Utilise pour le pointage en portee (roulement long)
- JAMAIS utilise en tir (contraire au but)

### 4.3 Spin lateral (effet gauche/droite)

**Comment le creer :** Mouvement lateral des doigts au lacher, imprimant une rotation sur un axe vertical.

**Effets physiques :**
- La boule devie lateralement APRES atterrissage
- Permet de contourner une boule obstacle
- L'effet prend sa direction prevue au contact avec le sol
- Plus efficace sur terrain souple (sable x1.8) que dur (dalles x0.3)

**En chiffres dans le jeu actuel :**
- Force de base : 0.15 (par frame)
- Duree : 35-49 frames selon stat Effet
- Minimum stat Effet : 8 pour activer

### 4.4 Interaction spin + collision

Le spin n'affecte PAS directement la collision boule-boule dans le modele simplifie (spheres lisses). En realite :
- Un faible transfert de spin existe par friction de surface
- Negligeable pour des boules d'acier lisses
- Le spin affecte surtout le comportement APRES collision (roulement)

---

## 5. Vitesses de jeu

### 5.1 Donnees biomechaniques mesurees

| Type de lancer | Vitesse (m/s) | Vitesse (km/h) | Source |
|----------------|---------------|-----------------|--------|
| **Pointage** | ~5.3 ± 0.4 | ~19 km/h | Etude biomecaniques |
| **Tir** | ~10.9 ± 3 | ~39 km/h | Etude biomecaniques |
| **Tir pro max** | ~12-14 | ~43-50 km/h | Estimation |
| **Pointage doux** | ~3.0 | ~11 km/h | Estimation |

### 5.2 Vitesse et distance

A partir de v0 et angle theta (angle avec l'horizontale), la portee horizontale est :
```
portee = v0² * sin(2*theta) / g
```
Pour un pointage a 8m de distance, angle ~45° :
```
v0 = sqrt(8 * 9.81 / sin(90°)) = sqrt(78.5) ≈ 8.9 m/s (vitesse initiale)
```
Mais la boule ne fait pas un projectile pur — le bras est a ~1.5m de haut et la trajectoire est arretee par le sol.

### 5.3 Vitesse au moment de l'impact

Pour un **tir au fer** a 8m, la boule arrive presque horizontalement :
- vitesse horizontale ≈ 8-12 m/s
- vitesse verticale ≈ 3-6 m/s (composante de chute)
- vitesse totale a l'impact ≈ 9-13 m/s

Pour un **pointage plombe** a 6m, la boule arrive plus verticalement :
- vitesse horizontale ≈ 2-4 m/s
- vitesse verticale ≈ 4-6 m/s
- vitesse totale a l'impact ≈ 5-7 m/s

### 5.4 Correspondance avec le jeu actuel

Dans Constants.js :
- MAX_THROW_SPEED = 12 (unite de jeu)
- TIR_IMPACT_SPEED = 9.0 (seuil pour qualifier un tir)
- MIN_IMPACT_SPEED = 2.0 (vitesse minimale pour un impact significatif)

---

## 6. Tableau recapitulatif des tirs

| Type | Parametre b | Angle alpha | Transfert energie | Tireur apres | Cible apres | Conditions |
|------|-------------|-------------|-------------------|--------------|-------------|------------|
| **Carreau sur place** | ≈ 0 | < 10° | ~81% | S'arrete sur place | Ejectee loin | Arc haut, backspin, terrain souple, boule tendre |
| **Carreau devant** | ≈ 0 | < 10° | ~81% | Roule en avant | Ejectee loin | Arc tendu, pas de backspin, terrain dur |
| **Carreau retro** | ≈ 0 | < 10° | ~81% | Recule | Ejectee loin | Backspin extreme, terrain granuleux |
| **Recul** | ≈ 0 - 0.5R | < 15° | ~70-81% | Recule 5-30cm | Ejectee | Arc haut + backspin + impact haut |
| **Casquette** | > 1.7R | > 60° | < 12% | Continue | Reste en place | Arc trop court/long, terrain dur |
| **Tir de cote** | 0.5R - 1.5R | 15-50° | 25-75% | Devie | Part lateralement | Visee desaxee (volontaire ou non) |
| **Palet** | ≈ 0 (apres roulement) | < 10° | ~60-70% (reduit par sol) | S'arrete pres | Deplacee | Terrain plat, regulier |
| **Raspaille** | variable | variable | variable | S'arrete pres | Deplacee | Terrain roulant |

---

## 7. Implications pour le moteur de jeu

### 7.1 Ce qui est deja bien gere
- COR 0.62 pour boule-boule : **CORRECT** (acier reel 0.60-0.65)
- Collision le long de la ligne des centres : **CORRECT**
- Resolution d'impulse avec masses : **CORRECT**
- Retro/backspin a 2 phases : **BON MODELE**
- Spin lateral : **IMPLEMENTEE**
- Detection carreau (15px seuil) : **RAISONNABLE**
- Detection casquette (8px deplacement max) : **CORRECT**

### 7.2 Ce qui pourrait etre ameliore (suggestions)
1. **COR variable selon la vitesse** : COR diminue a haute vitesse (0.65 a basse vitesse, 0.55 a haute vitesse). Actuellement fixe a 0.62. Impact : les tirs violents produiraient plus facilement des carreaux.
2. **COR variable selon la durete de boule** : les boules tendres (shop.json) pourraient avoir un restitutionMult < 1.0 et les boules dures > 1.0.
3. **Composante verticale du tir** : le tir au fer a une composante verticale significative qui affecte le point de contact. Pas modelise en 2D top-down.
4. **Palet explicite** : detecter quand la "donnee" est juste avant la cible, reduire la vitesse d'impact (absorption sol). Deja partiellement gere par PALET_THRESHOLD = 50.

### 7.3 Ce qu'il ne faut PAS changer
- Le modele 2D top-down est un choix de design, pas un bug. La 3D des trajectoires est simulee visuellement (arc, ombre) mais la physique reste 2D.
- Le COR fixe a 0.62 fonctionne bien pour le gameplay. Le varier compliquerait sans benefice evident.
- Les seuils de detection (carreau 15px, casquette 8px) sont equilibres pour le fun.

---

## 8. Glossaire technique

| Terme | Definition |
|-------|-----------|
| **COR** | Coefficient Of Restitution — ratio des vitesses relatives apres/avant collision |
| **Parametre d'impact (b)** | Distance entre la trajectoire du tireur et le centre de la cible |
| **Ligne des centres** | Droite joignant les centres des deux boules au moment du contact |
| **Plombee** | Lancer haut, chute quasi-verticale |
| **Demi-portee** | Lancer moyen, la boule atterrit a mi-chemin |
| **Portee** | Lancer ras, la boule roule longuement |
| **Donnee** | Point exact d'atterrissage de la boule |
| **Fer** | La boule tiree frappe directement sans toucher le sol |
| **HRC** | Hardness Rockwell C — echelle de durete des metaux |
