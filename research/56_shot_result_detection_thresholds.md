# 56 — Shot Result Detection Thresholds

> Date : 24 mars 2026
> Auteur : Specification B1 (PLAN_PHASE3, AXE B)
> Code de reference : PetanqueEngine.js `_detectShotResult()` (ligne 1173), Constants.js, Ball.js
> Prerequis : research/30 (vocabulaire), research/04c (audit physique), docs/PLAN_PHASE3.md

---

## 1. TAXONOMIE DES RESULTATS DE TIR

8 resultats de tir a detecter apres qu'une boule lancee en mode "tirer" s'est immobilisee. Chaque resultat correspond a un terme reel de la petanque FIPJP.

| # | Resultat | Definition petanque reelle | Categorie |
|---|----------|---------------------------|-----------|
| 1 | **Contre** | Frapper une boule de sa propre equipe au lieu de la cible adverse. Faute tactique, l'adversaire en profite. | Erreur fatale |
| 2 | **Trou** | Tir completement rate. La boule atterrit a cote de toutes les cibles sans en toucher aucune. Laisse une marque dans le sol. | Echec total |
| 3 | **Ciseau** | Un seul tir qui frappe et chasse 2 boules adverses non alignees. Coup spectaculaire et rare. | Coup d'eclat |
| 4 | **Carreau** | La boule tiree prend la PLACE EXACTE de la boule chassee. Le tir parfait de la petanque. | Perfection |
| 5 | **Casquette** | La boule arrive sur le dessus de la cible, l'effleurement. La cible bouge a peine. Tir rate. | Echec partiel |
| 6 | **Blessee** | La cible est touchee mais pas suffisamment deplacee pour changer la situation. Entre casquette et tir reussi. | Echec partiel |
| 7 | **Palet** | Tir reussi ou la boule de frappe reste dans un rayon de ~50 cm autour du point d'impact. Similaire au carreau mais moins precis. | Bon tir |
| 8 | **Recul** | La boule tiree revient en arriere apres l'impact. Peut etre volontaire (backspin) ou naturel (COR). | Descriptif |

### Resultats hors taxonomie (deja geres separement)

| Resultat | Contexte | Gestion |
|----------|----------|---------|
| **Biberon** | Pointage uniquement (pas un tir). Boule posee qui touche le cochonnet. | Detecte dans le bloc `!isTir` de `_detectShotResult()`. Pas concerne par cette spec. |
| **Au cochonnet** | Tir qui touche le cochonnet sans toucher de boule adverse. | Detecte entre Contre et Ciseau. Pas modifie. |
| **Sautee** | Tir qui passe tres pres d'une cible sans la toucher. | Sous-cas de Trou (hitBalls.length === 0). Pas modifie. |

---

## 2. PRIORITE DE DETECTION

L'ordre est CRITIQUE car certains resultats sont mutuellement exclusifs. Un tir ne peut avoir qu'un seul label.

```
_checkCarreau()           ← Execute EN PREMIER, avant _detectShotResult()
  ↓                         Si carreau detecte → celebrateCarreau() → label "CARREAU !"
_detectShotResult()       ← Execute ensuite pour tous les autres cas
  ↓
  1. Biberon (pointage)   ← Sortie immediate si !isTir
  2. Trou / Sautee        ← hitBalls.length === 0
  3. Contre               ← hitAllied.length > 0
  4. Au cochonnet         ← hitCochonnet only
  5. Ciseau               ← hitEnemy.length >= 2
  6. Casquette            ← targetDisplacement < CASQUETTE_MAX_DISPLACEMENT
  7. Blessee              ← targetDisplacement < BLESSEE_MAX_DISPLACEMENT
  8. Palet                ← distFromImpact dans ]CARREAU_THRESHOLD, PALET_THRESHOLD]
  9. Recul                ← dot(velocity, throwDir) < 0
  10. (Bon tir sans label special)
```

### Pourquoi cet ordre

- **Contre** avant tout : un tir qui touche un allie est toujours un contre, meme s'il touche aussi un adversaire.
- **Trou** ne peut exister que si aucune collision n'a eu lieu (hitBalls vide).
- **Ciseau** avant les analyses single-target : il necessite hitEnemy >= 2, incompatible avec les tests qui supposent hitEnemy === 1.
- **Carreau** est detecte AVANT `_detectShotResult()` dans `_checkCarreau()`. Si un carreau est celebre, `_detectShotResult()` ne doit PAS afficher de label supplementaire (le label "CARREAU !" est deja affiche par `_celebrateCarreau()`).
- **Casquette** avant **Blessee** : une casquette est un cas extreme de blessure. Si la cible n'a quasi pas bouge → casquette. Si elle a un peu bouge → blessee. Si elle a bouge significativement, on continue.
- **Palet** avant **Recul** : un palet est un resultat positif (boule tiree reste pres de l'impact). Le recul est un descriptif supplementaire qui ne s'applique que si aucun resultat plus specifique n'a ete detecte.
- **Recul** en dernier : c'est le comportement PAR DEFAUT apres un tir au fer (COR 0.62 → la boule tiree conserve 19% de sa vitesse en arriere). On ne l'affiche que si le recul est significatif.

---

## 3. SPECIFICATION PAR RESULTAT

### 3.1 CONTRE

**Definition petanque** : Frapper une boule de sa propre equipe. Erreur strategique grave.

**Detection** :
```
hitAllied = hitBalls.filter(b => b.team === ball.team && b.team !== 'cochonnet')
SI hitAllied.length > 0 → CONTRE
```

**Condition** : Au moins une boule touchee appartient a la meme equipe que le tireur. Pas de seuil numerique — c'est binaire.

**Constantes** : Aucune nouvelle constante. La detection est purement logique (comparaison de teams).

**Feedback visuel** :
| Propriete | Valeur |
|-----------|--------|
| Texte | `'Contre !'` |
| Couleur | `#C44B3F` (rouge terracotta, pas rouge pur — pas de noir pur, pas de rouge criard) |
| Taille | 13px |
| SFX | `sfxContre()` — impact sourd + grondement bas |

**Cas limites** :
- Un tir qui touche un allie ET un adversaire → CONTRE. L'allie prime toujours.
- Un tir qui touche un allie ET le cochonnet → CONTRE.
- En 1v1, le tireur n'a que ses propres boules deja jouees comme allies potentiels.

---

### 3.2 TROU

**Definition petanque** : Tir completement rate. La boule s'enfonce dans le sol a cote de la cible sans en toucher aucune. Le tireur "fait un trou".

**Detection** :
```
SI hitBalls.length === 0 → TROU (ou SAUTEE si pres d'une cible)

// Sous-cas Sautee : tir passe a moins de 6 rayons d'une cible sans la toucher
enemyBalls = balls.filter(b => alive && enemy)
minDist = min(ball.distanceTo(eb) pour chaque eb)
SI minDist < BALL_RADIUS * 6 → "Sautee !" (label alternatif)
SINON → "Trou..."
```

**Constantes** :
| Constante | Valeur | Rationale |
|-----------|--------|-----------|
| `TROU_SAUTEE_RADIUS_MULT` | `6` | 6 * BALL_RADIUS (10px) = 60px. A cette distance, la boule est "passee pres". Deja utilise dans le code actuel (ball.radius * 6). |

**Feedback visuel** :
| Variante | Texte | Couleur | Taille | SFX |
|----------|-------|---------|--------|-----|
| Trou | `'Trou...'` | `#888888` (gris neutre) | 12px | `sfxTrou()` — impact terre mat, silence |
| Sautee | `'Sautee !'` | `#C4854A` (terracotta) | 13px | Pas de SFX specifique (collision standard) |

**Cas limites** :
- Un tir qui touche le sol et rebondit au-dessus d'une boule sans la toucher physiquement → Trou/Sautee, pas de collision enregistree.
- Si toutes les boules adverses sont mortes (hors terrain), un tir sans collision est quand meme un Trou.

---

### 3.3 CISEAU

**Definition petanque** : Un seul tir qui frappe et chasse 2 boules adverses non alignees. Coup spectaculaire, rare en competition.

**Detection** :
```
hitEnemy = hitBalls.filter(b => b.team !== ball.team && b.team !== 'cochonnet')
SI hitEnemy.length >= 2 → CISEAU
```

**Condition** : Le compteur `_shotCollisions` accumule TOUTES les boules touchees par `lastThrownBall` pendant le throw entier (du lancer jusqu'a l'arret). Si la boule tiree touche une premiere cible, rebondit, puis en touche une seconde → ciseau.

**Constantes** : Aucune nouvelle constante. Le seuil est `>= 2` boules adverses touchees, ce qui est la definition meme du ciseau.

**Feedback visuel** :
| Propriete | Valeur |
|-----------|--------|
| Texte | `'CISEAU !!'` |
| Couleur | `#FFD700` (or, meme famille que carreau — coup spectaculaire) |
| Taille | 16px |
| SFX | `sfxCiseau()` — double impact rapide (tac-tac) |
| Camera shake | `shake(120, 0.005)` — deja present dans le code |

**Cas limites** :
- Un tir qui touche 3 boules adverses → toujours CISEAU (pas de label special "triple").
- Un tir qui touche 1 adverse + 1 allie → CONTRE prime (priorite plus haute).
- Un tir qui touche 2 adverses + 1 allie → CONTRE prime.
- Ciseau + la boule tiree reste sur place → Le carreau est detecte dans `_checkCarreau()` AVANT. Si carreau + ciseau, les deux celebrations se declenchent (le carreau via `_celebrateCarreau`, le ciseau serait ecrase... Mais en pratique, si la boule s'arrete sur la position de la premiere cible apres avoir touche 2 boules, `_checkCarreau()` celebre le carreau, et `_detectShotResult()` affiche "CISEAU !!" — les deux labels coexistent). **A verifier en playtest.**

---

### 3.4 CARREAU

**Definition petanque** : La boule tiree prend la place exacte de la boule chassee. Le summum du tir. Variantes : carreau sur place (parfait), carreau allonge (avance un peu), carreau recul (recule un peu).

**Detection** (dans `_checkCarreau()`, PAS dans `_detectShotResult()`) :
```
Pour chaque pendingCarreauCheck :
  dx = thrownBall.x - targetOrigX
  dy = thrownBall.y - targetOrigY
  dist = sqrt(dx*dx + dy*dy)
  SI dist <= CARREAU_THRESHOLD → celebrateCarreau()
```

**Constantes** :
| Constante | Valeur actuelle | Statut | Rationale |
|-----------|----------------|--------|-----------|
| `CARREAU_THRESHOLD` | `28` px | ✅ Conserver | 28px ≈ 1.0m reel (28 * 0.036 m/px). En petanque reelle, le carreau tolere ~30 cm. Nos 28px sont genereux (jeu video) mais coherents avec les rayons de boules (10px). Le joueur doit "sentir" que la boule a pris la place. |
| `CARREAU_DISPLACED_MIN` | `32` px | ✅ Conserver | La cible doit avoir bouge d'au moins 32px pour qu'un carreau soit credible. Empeche un faux carreau sur un tap leger. |

**Feedback visuel** :
| Propriete | Valeur |
|-----------|--------|
| Texte | `'CARREAU !'` (24px, via `celebrateCarreau`) |
| Couleur | `#FFD700` (or) |
| Taille | 24px (plus grand que tous les autres labels) |
| SFX | `sfxCarreau()` — impact metallique resonant + eclat |
| Camera shake | `shake(CARREAU_SHAKE_DURATION=250, CARREAU_SHAKE_INTENSITY=0.012)` |
| Hitstop | `HITSTOP_CARREAU_MS = 150` ms |
| Sparks | `CARREAU_SPARK_COUNT=8`, `CARREAU_SPARK_RADIUS=36` |
| Glow filter | Phaser 4 WebGL glow sur le texte |

**Interaction avec _detectShotResult()** :
`_checkCarreau()` est appele AVANT `_detectShotResult()` dans le callback `_afterStopCallback`. Si un carreau est celebre, `_detectShotResult()` continuera son execution mais ne trouvera pas de condition supplementaire a afficher (la boule est immobile sur le point d'impact, donc aucune autre condition ne matche sauf "Palet" qui est exclu car dist <= CARREAU_THRESHOLD < PALET_THRESHOLD). **Pas de double-label.**

**Cas limites** :
- Carreau + recul (la boule s'arrete 25px derriere la position de la cible, dans le seuil de 28px) → Carreau. Le seuil est un cercle autour de targetOrig, pas une direction.
- Carreau + cible hors terrain → Toujours carreau. La cible est chassee, la boule tiree prend sa place.
- Boule tiree morte (hors terrain) apres collision → `!check.thrownBall.isAlive` → Pas de carreau.

---

### 3.5 CASQUETTE

**Definition petanque** : Tir rate ou la boule arrive sur le dessus de la cible sans la deplacer suffisamment. Simple effleurement. La cible n'a quasi pas bouge.

**Detection ACTUELLE (a corriger)** :
```javascript
// ACTUEL : mesure la vitesse de la cible au moment de la detection
if (targetSpeed < CASQUETTE_MAX_SPEED) → Casquette  // CASQUETTE_MAX_SPEED = 0.5
```

**Probleme** : `targetSpeed` est mesure au moment ou `_detectShotResult()` est appele, c'est-a-dire quand TOUTES les boules se sont arretees (`WAITING_STOP` → `_afterStopCallback`). A ce moment, `targetSpeed` est toujours ~0 car la cible s'est immobilisee. La detection est donc basee sur la vitesse residuelle au repos, pas sur le deplacement reel.

**Detection CORRIGEE** :
```
// Stocker la position de la cible au moment de la collision
targetOrigX, targetOrigY = position de la cible avant la collision (deja stocke dans _pendingCarreauChecks)

// Apres arret, mesurer le deplacement total de la cible
targetDisplacement = sqrt((target.x - targetOrigX)^2 + (target.y - targetOrigY)^2)

SI targetDisplacement < CASQUETTE_MAX_DISPLACEMENT → Casquette
```

**Constantes** :
| Constante | Valeur | Rationale |
|-----------|--------|-----------|
| `CASQUETTE_MAX_DISPLACEMENT` | `8` px | 8px ≈ 0.29m reel. Moins d'un rayon de boule (10px). La cible a a peine bouge — effleurement. Coherent avec la definition : la boule est "passee par-dessus". |

**Constante a deprecier** : `CASQUETTE_MAX_SPEED` (0.5) — remplacee par `CASQUETTE_MAX_DISPLACEMENT`. La mesure par vitesse au repos est incorrecte car toutes les boules sont a vitesse 0 quand `_detectShotResult()` s'execute.

**Implementation** : Recuperer `targetOrigX/targetOrigY` depuis `_pendingCarreauChecks[0]` ou `_lastImpactPoint` (qui stocke la position de la cible au moment de la collision). Calculer le deplacement comme `sqrt((target.x - targetOrigX)^2 + (target.y - targetOrigY)^2)`.

**Feedback visuel** :
| Propriete | Valeur |
|-----------|--------|
| Texte | `'Casquette...'` (avec variante `'Court... Casquette'` si tir devant) |
| Couleur | `#888888` (gris — echec) |
| Taille | 12px |
| SFX | `sfxCasquette()` — petit "tac" sec |

**Cas limites** :
- Casquette + la cible sort du terrain apres effleurement (poussee par inertie sur un terrain en pente) → La cible a bouge > 8px (elle est sortie du terrain) → Pas casquette. Logique : si la cible sort, c'est un tir reussi meme si l'impact etait leger.
- La cible etait deja sur le bord → Meme un tap la fait sortir → pas casquette (displacement > 8px).

---

### 3.6 BLESSEE

**Definition petanque** : La boule cible est frappee mais ne s'est pas suffisamment deplacee pour changer la situation. Elle a bouge un peu mais reste dangereusement pres de sa position initiale.

**Detection ACTUELLE (a corriger)** :
```javascript
// ACTUEL : meme probleme que casquette — mesure targetSpeed au repos
if (targetSpeed < BLESSER_MAX_SPEED) → Blessee  // BLESSER_MAX_SPEED = 1.5
```

**Detection CORRIGEE** :
```
targetDisplacement = sqrt((target.x - targetOrigX)^2 + (target.y - targetOrigY)^2)

SI targetDisplacement >= CASQUETTE_MAX_DISPLACEMENT
   ET targetDisplacement < BLESSEE_MAX_DISPLACEMENT → Blessee
```

**Constantes** :
| Constante | Valeur | Rationale |
|-----------|--------|-----------|
| `BLESSEE_MAX_DISPLACEMENT` | `32` px | 32px ≈ 1.15m reel. Environ 3 rayons de boule. La cible a bouge mais reste dans un rayon de ~1m — elle n'a pas ete "chassee". Au-dessus de 32px, le tir est considere comme reussi (la cible a ete significativement deplacee). Coherent avec CARREAU_DISPLACED_MIN (32px) : en dessous de 32px de deplacement, la cible n'a pas "vraiment bouge". |

**Constante a deprecier** : `BLESSER_MAX_SPEED` (1.5) — remplacee par `BLESSEE_MAX_DISPLACEMENT`.

**Feedback visuel** :
| Propriete | Valeur |
|-----------|--------|
| Texte | `'Blessee...'` (avec variante `'Court... Blessee'` si tir devant) |
| Couleur | `#AA8866` (ocre terne — echec modere) |
| Taille | 12px |
| SFX | Pas de SFX specifique — impact standard `sfxBouleBoule()` suffit |

**Cas limites** :
- Blessee + cible sort du terrain → displacement > 32px → pas blessee.
- Cible deplacee de 31px → Blessee. 33px → Tir reussi (pas de label special, ou Palet si la boule tiree reste pres de l'impact).

---

### 3.7 PALET

**Definition petanque** : Tir reussi ou la boule de frappe reste dans un rayon de ~50 cm autour du point d'impact. Similaire au carreau mais moins precis. Le tireur "fait un palet" — il a tire efficacement et sa boule n'est pas partie loin.

**Detection ACTUELLE (partiellement corrigee)** :
```javascript
// ACTUEL (dans le code apres corrections precedentes) :
// Mesure distance au _lastImpactPoint (position de la cible au moment de la collision)
const impactPoint = this._lastImpactPoint;
const distFromImpact = sqrt((ball.x - impactPoint.x)^2 + (ball.y - impactPoint.y)^2);
if (distFromImpact > CARREAU_THRESHOLD && distFromImpact < PALET_THRESHOLD) → Palet
```

**Statut** : La correction "distance au point d'impact" est DEJA implementee dans le code actuel. `_lastImpactPoint` est stocke correctement au moment de la collision (position de la cible, pas du tireur).

**Verification necessaire** : S'assurer que `_lastImpactPoint` est bien la position de la cible au moment de l'impact, PAS la position du tireur. Le code actuel (PetanqueEngine.js ~ligne 1013-1048) stocke `{ x: bx, y: by }` ou `{ x: ax, y: ay }` qui sont bien les positions de la cible. **Correct.**

**Condition supplementaire** : Le palet ne doit s'afficher que si la cible a ete significativement deplacee (sinon c'est une casquette/blessee). Le filtre est naturel : on arrive a la detection du palet APRES avoir verifie casquette et blessee. Si le code arrive ici, c'est que `targetDisplacement >= BLESSEE_MAX_DISPLACEMENT` (32px), donc la cible a bien ete chassee.

**Constantes** :
| Constante | Valeur actuelle | Statut | Rationale |
|-----------|----------------|--------|-----------|
| `PALET_THRESHOLD` | `50` px | ✅ Conserver | 50px ≈ 1.8m reel. En petanque reelle, le palet correspond a ~50 cm du point d'impact. Nos 50px sont genereux (les proportions du jeu l'exigent — le terrain fait 420px de haut pour 15m, soit 28px/m). Un rayon de 50px = ~1.8m, ce qui correspond a un "bon tir" dans le contexte du jeu. Le joueur doit sentir la recompense. |

**Feedback visuel** :
| Propriete | Valeur |
|-----------|--------|
| Texte | `'Palet !'` |
| Couleur | `#C0C0C0` (argent — bon mais pas parfait) |
| Taille | 13px |
| SFX | `sfxPalet()` — impact metallique + leger grattement |

**Cas limites** :
- Boule tiree a 27px du point d'impact → CARREAU (< 28px), pas palet.
- Boule tiree a 29px du point d'impact → PALET (entre 28 et 50px).
- Boule tiree a 51px du point d'impact → Pas palet, pas de label (ou Recul si direction oppose).
- Boule tiree morte (hors terrain) → `!ball.isAlive` → `_detectShotResult()` return en premiere ligne. Pas de palet.
- `_lastImpactPoint` est null (pas de collision enregistree) → Le code ne rentre pas dans le bloc palet. Correct.

---

### 3.8 RECUL

**Definition petanque** : La boule tiree revient en arriere apres l'impact. Naturel avec COR 0.62 (la boule conserve ~19% de sa vitesse en sens inverse). Amplifie par le backspin. Ce n'est pas un "resultat" au sens strict, mais un descriptif important que le joueur doit voir.

**Detection ACTUELLE (corrigee)** :
```javascript
// ACTUEL (apres corrections precedentes) :
if (throwerSpeed > 0.3) {
    const dx = target.x - ball.x;
    const dy = target.y - ball.y;
    const dot = ball.vx * dx + ball.vy * dy;
    if (dot < 0) → Recul
}
```

**Probleme avec la detection actuelle** : La methode `_detectShotResult()` est appelee quand TOUTES les boules sont arretees. A ce moment, `ball.vx` et `ball.vy` sont ~0. Le `throwerSpeed > 0.3` et le dot product ne fonctionnent pas au repos.

**Detection CORRIGEE** : Utiliser la direction du THROW (stockee au lancement) et la position finale de la boule par rapport au point d'impact.

```
// La boule tiree a-t-elle fini DERRIERE le point d'impact (par rapport a la direction du tir) ?
throwDirX = ball._throwDirX  // cos(angle), stocke au moment du lancer
throwDirY = ball._throwDirY  // sin(angle), stocke au moment du lancer
impactPoint = _lastImpactPoint  // position de la cible au moment de la collision

// Vecteur du point d'impact vers la position finale de la boule tiree
dxFromImpact = ball.x - impactPoint.x
dyFromImpact = ball.y - impactPoint.y

// Projection sur la direction du tir
projForward = dxFromImpact * throwDirX + dyFromImpact * throwDirY

SI projForward < -RECUL_MIN_BACKWARD_PX → RECUL
```

**Logique** : Si la projection est negative, la boule tiree a fini DERRIERE le point d'impact (par rapport a sa direction de lancer). C'est la definition meme du recul : la boule est "revenue en arriere".

**Constantes** :
| Constante | Valeur | Rationale |
|-----------|--------|-----------|
| `RECUL_MIN_BACKWARD_PX` | `5` px | 5px ≈ 0.18m reel. Seuil minimum pour considerer que la boule a "recule". En dessous, c'est juste un arret sur place (carreau potentiel). Coherent avec la physique : COR 0.62 entre masses egales → la boule tiree conserve 19% de sa vitesse et recule de ~5-6px (research/04c, section 1.2). Ce seuil capture les reculs naturels sans etre trop sensible. |

**Constantes a supprimer** : Aucune ancienne constante specifique au recul dans Constants.js (les anciennes bandes 0.8-5 etaient dans le code, pas dans les constantes).

**Feedback visuel** :
| Propriete | Valeur |
|-----------|--------|
| Texte | `'Recul'` |
| Couleur | `#D4A574` (ocre — descriptif neutre) |
| Taille | 12px |
| SFX | Pas de SFX specifique — le son d'impact standard suffit |

**Cas limites** :
- Recul + palet : la boule recule ET reste dans 50px du point d'impact → PALET prime (priorite plus haute). Le recul est un descriptif secondaire, le palet est un resultat positif.
- Recul + carreau : la boule recule ET reste dans 28px → CARREAU prime (detecte avant `_detectShotResult()`).
- Recul sans backspin : naturel avec COR 0.62. Le label s'affiche quand meme — le recul n'est pas reserve au backspin.
- Recul avec backspin : le recul est plus prononce (> 5px facilement). Le label s'affiche.
- `_lastImpactPoint` est null → Pas de calcul possible → Pas de label recul. Correct.
- `ball._throwDirX` est undefined → Pas de calcul possible. Ajouter un guard `if (ball._throwDirX === undefined) return`.

---

## 4. CORRECTIONS SPECIFIQUES REQUISES

### 4.1 Casquette et Blessee : remplacer la mesure par vitesse par une mesure par deplacement

**Probleme** : `targetSpeed` est mesure au repos (toutes boules arretees). La valeur est toujours ~0.

**Solution** : Stocker la position originale de la cible au moment de la collision (deja fait dans `_pendingCarreauChecks`) et mesurer le deplacement total apres arret.

**Code a modifier** : `_detectShotResult()`, lignes 1254-1266 de PetanqueEngine.js.

```javascript
// AVANT (bugge)
const targetSpeed = Math.sqrt(target.vx ** 2 + target.vy ** 2);
if (targetSpeed < CASQUETTE_MAX_SPEED) → Casquette
if (targetSpeed < BLESSER_MAX_SPEED) → Blessee

// APRES (corrige)
const carreauCheck = this._pendingCarreauChecks?.find(c => c.targetOrigX !== undefined);
const targetOrigX = carreauCheck?.targetOrigX ?? this._lastImpactPoint?.x ?? target.x;
const targetOrigY = carreauCheck?.targetOrigY ?? this._lastImpactPoint?.y ?? target.y;
const targetDisplacement = Math.sqrt(
    (target.x - targetOrigX) ** 2 + (target.y - targetOrigY) ** 2
);
if (targetDisplacement < CASQUETTE_MAX_DISPLACEMENT) → Casquette
if (targetDisplacement < BLESSEE_MAX_DISPLACEMENT) → Blessee
```

### 4.2 Palet : verification que _lastImpactPoint est bien la position de la cible

**Statut** : DEJA CORRIGE dans le code actuel. `_lastImpactPoint` stocke `{ x: bx, y: by }` (position du corps B quand corps A est `lastThrownBall`), ce qui est bien la position de la cible. Verifie aux lignes ~1013-1048 de PetanqueEngine.js.

**Pas de modification necessaire** pour le palet. La detection actuelle est correcte.

### 4.3 Recul : remplacer la detection par vitesse par une detection par position

**Probleme** : La detection actuelle utilise `ball.vx` / `ball.vy` qui sont ~0 au repos.

**Solution** : Utiliser `ball._throwDirX` / `ball._throwDirY` (stockes au lancer) et la position finale par rapport a `_lastImpactPoint`.

**Code a modifier** : `_detectShotResult()`, lignes 1286-1298 de PetanqueEngine.js.

```javascript
// AVANT (bugge — mesure vitesse au repos)
if (throwerSpeed > 0.3) {
    const dx = target.x - ball.x;
    const dy = target.y - ball.y;
    const dot = ball.vx * dx + ball.vy * dy;
    if (dot < 0) → Recul
}

// APRES (corrige — mesure position finale vs direction du tir)
const impactPt = this._lastImpactPoint;
if (impactPt && ball._throwDirX !== undefined) {
    const dxFromImpact = ball.x - impactPt.x;
    const dyFromImpact = ball.y - impactPt.y;
    const projForward = dxFromImpact * ball._throwDirX + dyFromImpact * ball._throwDirY;
    if (projForward < -RECUL_MIN_BACKWARD_PX) → Recul
}
```

### 4.4 Ciseau : s'assurer que le compteur accumule bien toutes les collisions du throw

**Statut** : DEJA CORRECT. `_shotCollisions` est un tableau qui accumule toutes les boules touchees par `lastThrownBall` pendant le throw. Le `includes()` check empeche les doublons. Si la boule tiree rebondit sur 2 cibles differentes, les deux sont ajoutees.

**Verification** : `hitEnemy.length >= 2` est le test correct pour le ciseau. Pas de modification necessaire.

### 4.5 Carreau : empecher un double-label avec _detectShotResult

**Probleme potentiel** : `_checkCarreau()` celebre un carreau, puis `_detectShotResult()` s'execute. Si la boule tiree est arretee exactement sur le point d'impact (dist <= 28px), le test palet (`distFromImpact > CARREAU_THRESHOLD`) exclut correctement le palet. Mais le code pourrait encore afficher "Recul" si la boule est legerement derriere.

**Solution** : Ajouter un flag `this._carreauDetected` dans `_celebrateCarreau()`, et sortir immediatement de `_detectShotResult()` si ce flag est vrai.

```javascript
_celebrateCarreau(ball) {
    this._carreauDetected = true; // NOUVEAU
    // ... reste du code existant
}

_detectShotResult() {
    if (this._carreauDetected) { // NOUVEAU
        this._carreauDetected = false;
        this._shotCollisions = [];
        return;
    }
    // ... reste du code
}
```

---

## 5. TABLE DES CONSTANTES

### 5.1 Constantes EXISTANTES (a conserver)

| Constante | Valeur | Fichier | Usage |
|-----------|--------|---------|-------|
| `CARREAU_THRESHOLD` | `28` px | Constants.js:105 | Distance max boule tiree ↔ position originale cible pour un carreau |
| `CARREAU_DISPLACED_MIN` | `32` px | Constants.js:106 | Deplacement min de la cible pour valider un carreau |
| `PALET_THRESHOLD` | `50` px | Constants.js:96 | Distance max boule tiree ↔ point d'impact pour un palet |
| `BALL_RADIUS` | `10` px | Constants.js:321 | Rayon physique d'une boule |
| `HITSTOP_CARREAU_MS` | `150` ms | Constants.js:159 | Duree du hitstop au carreau |
| `CARREAU_SHAKE_DURATION` | `250` ms | Constants.js:331 | Duree du screen shake au carreau |
| `CARREAU_SHAKE_INTENSITY` | `0.012` | Constants.js:332 | Intensite du screen shake au carreau |
| `CARREAU_SPARK_COUNT` | `8` | Constants.js:173 | Nombre de sparks au carreau |
| `CARREAU_SPARK_RADIUS` | `36` px | Constants.js:174 | Rayon des sparks au carreau |

### 5.2 Constantes NOUVELLES (a ajouter dans Constants.js)

| Constante | Valeur | Rationale |
|-----------|--------|-----------|
| `CASQUETTE_MAX_DISPLACEMENT` | `8` px | < 1 rayon de boule. Effleurement — la cible n'a quasi pas bouge. |
| `BLESSEE_MAX_DISPLACEMENT` | `32` px | ≈ 3 rayons de boule, ~1.15m reel. La cible a bouge mais pas assez pour changer la donne. Aligne sur CARREAU_DISPLACED_MIN. |
| `RECUL_MIN_BACKWARD_PX` | `5` px | Seuil minimum de recul mesure par projection sur l'axe du tir. Coherent avec physique COR 0.62 (recul naturel ~5-6px). |
| `TROU_SAUTEE_RADIUS_MULT` | `6` | Multiplicateur de BALL_RADIUS pour detecter une "sautee" (tir passe pres sans toucher). 6 * 10 = 60px. |

### 5.3 Constantes a DEPRECIER / SUPPRIMER

| Constante | Valeur actuelle | Raison |
|-----------|----------------|--------|
| `CASQUETTE_MAX_SPEED` | `0.5` | Remplacee par `CASQUETTE_MAX_DISPLACEMENT`. La mesure par vitesse au repos est incorrecte. |
| `BLESSER_MAX_SPEED` | `1.5` | Remplacee par `BLESSEE_MAX_DISPLACEMENT`. Meme raison. |

**Procedure de depreciation** : Supprimer les anciennes constantes en meme temps qu'on ajoute les nouvelles. Elles ne sont referecees que dans `_detectShotResult()` qui sera modifie dans la meme PR.

### 5.4 Bloc complet a ajouter dans Constants.js

```javascript
// Petanque - shot result detection (thresholds B1)
export const CASQUETTE_MAX_DISPLACEMENT = 8;   // Target displaced < 8px = barely grazed
export const BLESSEE_MAX_DISPLACEMENT = 32;     // Target displaced < 32px = hit but not enough
export const RECUL_MIN_BACKWARD_PX = 5;         // Thrower ended 5px+ behind impact point
export const TROU_SAUTEE_RADIUS_MULT = 6;       // Miss within 6 * BALL_RADIUS = "sautee"

// Petanque - shot result visual styles (B2)
export const SHOT_RESULT_STYLES = {
    carreau:   { text: 'CARREAU !',    color: '#FFD700', size: 24, duration: 2000 },
    ciseau:    { text: 'CISEAU !!',    color: '#FFD700', size: 16, duration: 2000 },
    palet:     { text: 'Palet !',      color: '#C0C0C0', size: 13, duration: 1500 },
    recul:     { text: 'Recul',        color: '#D4A574', size: 12, duration: 1000 },
    blessee:   { text: 'Blessee...',   color: '#AA8866', size: 12, duration: 1200 },
    casquette: { text: 'Casquette...', color: '#888888', size: 12, duration: 1200 },
    contre:    { text: 'Contre !',     color: '#C44B3F', size: 13, duration: 1500 },
    trou:      { text: 'Trou...',      color: '#888888', size: 12, duration: 1000 },
    sautee:    { text: 'Sautee !',     color: '#C4854A', size: 13, duration: 1200 },
    biberon:   { text: 'BIBERON !',    color: '#FFD700', size: 14, duration: 1800 },
    cochonnet: { text: 'Au cochonnet !', color: '#FFD700', size: 12, duration: 1200 },
};
```

---

## 6. DIAGRAMME DE FLUX COMPLET

```
Boules arretees (WAITING_STOP terminé)
  │
  ├─ _checkCarreau()
  │   ├─ dist <= 28px → _celebrateCarreau() → set _carreauDetected = true
  │   └─ dist > 28px → (rien)
  │
  └─ _detectShotResult()
      │
      ├─ _carreauDetected ? → reset flag, return
      │
      ├─ !ball.isAlive || !cochonnet.isAlive → return
      │
      ├─ !isTir (pointage)
      │   ├─ distToCoch <= radius+radius+2 → "BIBERON !"
      │   └─ return
      │
      ├─ hitBalls.length === 0 (aucune collision)
      │   ├─ minDist < BALL_RADIUS * TROU_SAUTEE_RADIUS_MULT → "Sautee !"
      │   └─ else → "Trou..."
      │
      ├─ hitAllied.length > 0
      │   └─ "Contre !"
      │
      ├─ hitCochonnet only (pas d'enemy, pas d'allied)
      │   └─ "Au cochonnet !"
      │
      ├─ hitEnemy.length >= 2
      │   └─ "CISEAU !!" + shake
      │
      └─ hitEnemy.length === 1 (analyse single target)
          │
          ├─ Calculer targetDisplacement (position finale - position originale)
          │
          ├─ targetDisplacement < CASQUETTE_MAX_DISPLACEMENT (8px)
          │   └─ "Casquette..."
          │
          ├─ targetDisplacement < BLESSEE_MAX_DISPLACEMENT (32px)
          │   └─ "Blessee..."
          │
          ├─ distFromImpact dans ]28, 50] px
          │   └─ "Palet !"
          │
          ├─ projForward < -RECUL_MIN_BACKWARD_PX (-5px)
          │   └─ "Recul"
          │
          └─ (aucun label special — bon tir standard)
              └─ Si tir_devant → "Court !"
```

---

## 7. SPECIFICATIONS DE TEST

Fichier : `tests/ShotResults.test.js`

Chaque test cree un scenario minimal en mockant les structures de donnees de `_detectShotResult()`. Le but n'est PAS de simuler la physique complete mais de verifier que la logique de detection produit le bon label pour un etat donne.

### Infrastructure de test commune

```javascript
import { describe, it, expect, vi } from 'vitest';
import {
    CARREAU_THRESHOLD, PALET_THRESHOLD,
    CASQUETTE_MAX_DISPLACEMENT, BLESSEE_MAX_DISPLACEMENT,
    RECUL_MIN_BACKWARD_PX, TROU_SAUTEE_RADIUS_MULT, BALL_RADIUS
} from '../src/utils/Constants.js';

// Helper : creer un objet ball minimal
function makeBall(x, y, team, opts = {}) {
    return {
        x, y, vx: 0, vy: 0,
        radius: BALL_RADIUS,
        team,
        isAlive: true,
        _throwDirX: opts.throwDirX ?? 0,
        _throwDirY: opts.throwDirY ?? -1, // tire vers le haut par defaut
        _isRecoiling: false,
        distanceTo(other) {
            return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
        },
        ...opts
    };
}
```

### Test 1 : CONTRE — Tir touchant une boule alliee

```javascript
it('should detect CONTRE when hitting an allied ball', () => {
    // Setup : boule tiree par 'player' touche une boule 'player'
    const ball = makeBall(200, 200, 'player');
    const allied = makeBall(200, 180, 'player');
    const shotCollisions = [allied];

    // Expected: hitAllied.length > 0 → "Contre !"
    const hitAllied = shotCollisions.filter(b => b.team === ball.team && b.team !== 'cochonnet');
    expect(hitAllied.length).toBeGreaterThan(0);
});
```

### Test 2 : TROU — Tir sans aucune collision

```javascript
it('should detect TROU when no balls were hit', () => {
    // Setup : la boule tiree n'a touche personne
    const ball = makeBall(200, 200, 'player');
    const shotCollisions = [];
    const enemyBalls = [makeBall(300, 100, 'opponent')]; // loin

    // Expected: hitBalls.length === 0
    expect(shotCollisions.length).toBe(0);

    // Verify: not a "sautee" (enemy too far)
    const minDist = Math.min(...enemyBalls.map(eb => ball.distanceTo(eb)));
    expect(minDist).toBeGreaterThanOrEqual(BALL_RADIUS * TROU_SAUTEE_RADIUS_MULT);
    // → Label: "Trou..."
});
```

### Test 3 : CISEAU — Tir touchant 2+ boules adverses

```javascript
it('should detect CISEAU when hitting 2+ enemy balls', () => {
    // Setup : boule 'player' touche 2 boules 'opponent'
    const ball = makeBall(200, 200, 'player');
    const enemy1 = makeBall(200, 180, 'opponent');
    const enemy2 = makeBall(210, 170, 'opponent');
    const shotCollisions = [enemy1, enemy2];

    const hitEnemy = shotCollisions.filter(b => b.team !== ball.team && b.team !== 'cochonnet');
    expect(hitEnemy.length).toBeGreaterThanOrEqual(2);
    // → Label: "CISEAU !!"
});
```

### Test 4 : CARREAU — Boule tiree sur position originale de la cible

```javascript
it('should detect CARREAU when thrower lands within threshold of target orig position', () => {
    // Setup : cible etait en (200, 150). Boule tiree finit en (205, 148).
    const targetOrigX = 200;
    const targetOrigY = 150;
    const ball = makeBall(205, 148, 'player');

    const dx = ball.x - targetOrigX;
    const dy = ball.y - targetOrigY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    expect(dist).toBeLessThanOrEqual(CARREAU_THRESHOLD); // 28px
    // dist = sqrt(25+4) = sqrt(29) ≈ 5.4px → bien < 28
});
```

### Test 5 : CASQUETTE — Cible deplacee de moins de 8px

```javascript
it('should detect CASQUETTE when target displaced < 8px', () => {
    // Setup : cible etait en (200, 150), maintenant en (203, 151).
    const targetOrigX = 200;
    const targetOrigY = 150;
    const target = makeBall(203, 151, 'opponent');

    const displacement = Math.sqrt(
        (target.x - targetOrigX) ** 2 + (target.y - targetOrigY) ** 2
    );

    expect(displacement).toBeLessThan(CASQUETTE_MAX_DISPLACEMENT); // 8px
    // displacement = sqrt(9+1) = sqrt(10) ≈ 3.2px → casquette
});
```

### Test 6 : BLESSEE — Cible deplacee entre 8 et 32px

```javascript
it('should detect BLESSEE when target displaced between 8px and 32px', () => {
    // Setup : cible etait en (200, 150), maintenant en (215, 155).
    const targetOrigX = 200;
    const targetOrigY = 150;
    const target = makeBall(215, 155, 'opponent');

    const displacement = Math.sqrt(
        (target.x - targetOrigX) ** 2 + (target.y - targetOrigY) ** 2
    );

    expect(displacement).toBeGreaterThanOrEqual(CASQUETTE_MAX_DISPLACEMENT); // >= 8
    expect(displacement).toBeLessThan(BLESSEE_MAX_DISPLACEMENT); // < 32
    // displacement = sqrt(225+25) = sqrt(250) ≈ 15.8px → blessee
});
```

### Test 7 : PALET — Boule tiree entre 28 et 50px du point d'impact

```javascript
it('should detect PALET when thrower lands between CARREAU_THRESHOLD and PALET_THRESHOLD from impact', () => {
    // Setup : point d'impact (cible) etait en (200, 150).
    // Boule tiree finit en (230, 165) = ~33px du point d'impact.
    const impactPoint = { x: 200, y: 150 };
    const ball = makeBall(230, 165, 'player');

    const dx = ball.x - impactPoint.x;
    const dy = ball.y - impactPoint.y;
    const distFromImpact = Math.sqrt(dx * dx + dy * dy);

    expect(distFromImpact).toBeGreaterThan(CARREAU_THRESHOLD);  // > 28
    expect(distFromImpact).toBeLessThan(PALET_THRESHOLD);       // < 50
    // distFromImpact = sqrt(900+225) = sqrt(1125) ≈ 33.5px → palet
});
```

### Test 8 : RECUL — Boule tiree finit derriere le point d'impact par rapport a la direction du tir

```javascript
it('should detect RECUL when thrower ends behind impact point relative to throw direction', () => {
    // Setup : tir vers le haut (throwDir = [0, -1]).
    // Point d'impact en (200, 150).
    // Boule tiree finit en (200, 158) → 8px DERRIERE (plus bas = en arriere du tir).
    const impactPoint = { x: 200, y: 150 };
    const throwDirX = 0;
    const throwDirY = -1; // vers le haut

    const ball = makeBall(200, 158, 'player', {
        throwDirX: throwDirX,
        throwDirY: throwDirY
    });

    const dxFromImpact = ball.x - impactPoint.x;  // 0
    const dyFromImpact = ball.y - impactPoint.y;  // 8
    const projForward = dxFromImpact * throwDirX + dyFromImpact * throwDirY;
    // projForward = 0 * 0 + 8 * (-1) = -8

    expect(projForward).toBeLessThan(-RECUL_MIN_BACKWARD_PX); // -8 < -5 → recul
});
```

### Test 9 (bonus) : Pas de recul si la boule avance apres l'impact

```javascript
it('should NOT detect RECUL when thrower ends in front of impact point', () => {
    // Setup : tir vers le haut (throwDir = [0, -1]).
    // Point d'impact en (200, 150).
    // Boule tiree finit en (200, 142) → 8px DEVANT (plus haut = en avant du tir).
    const impactPoint = { x: 200, y: 150 };
    const throwDirX = 0;
    const throwDirY = -1;

    const ball = makeBall(200, 142, 'player', {
        throwDirX: throwDirX,
        throwDirY: throwDirY
    });

    const dxFromImpact = ball.x - impactPoint.x;  // 0
    const dyFromImpact = ball.y - impactPoint.y;  // -8
    const projForward = dxFromImpact * throwDirX + dyFromImpact * throwDirY;
    // projForward = 0 * 0 + (-8) * (-1) = +8

    expect(projForward).toBeGreaterThanOrEqual(-RECUL_MIN_BACKWARD_PX); // +8 > -5 → pas recul
});
```

### Test 10 (bonus) : Priorite Contre > tout le reste

```javascript
it('should prioritize CONTRE over CISEAU when hitting allied AND enemy balls', () => {
    // Setup : boule 'player' touche 1 alliee + 2 ennemies
    const ball = makeBall(200, 200, 'player');
    const allied = makeBall(200, 190, 'player');
    const enemy1 = makeBall(200, 180, 'opponent');
    const enemy2 = makeBall(210, 170, 'opponent');
    const shotCollisions = [allied, enemy1, enemy2];

    const hitAllied = shotCollisions.filter(b => b.team === ball.team && b.team !== 'cochonnet');
    const hitEnemy = shotCollisions.filter(b => b.team !== ball.team && b.team !== 'cochonnet');

    // Contre takes priority even though we have 2 enemy hits (ciseau conditions met)
    expect(hitAllied.length).toBeGreaterThan(0);
    expect(hitEnemy.length).toBeGreaterThanOrEqual(2);
    // → Contre is checked FIRST → label: "Contre !", not "CISEAU !!"
});
```

---

## 8. RESUME DES MODIFICATIONS PAR FICHIER

| Fichier | Modifications |
|---------|--------------|
| `src/utils/Constants.js` | Ajouter `CASQUETTE_MAX_DISPLACEMENT`, `BLESSEE_MAX_DISPLACEMENT`, `RECUL_MIN_BACKWARD_PX`, `TROU_SAUTEE_RADIUS_MULT`, `SHOT_RESULT_STYLES`. Supprimer `CASQUETTE_MAX_SPEED`, `BLESSER_MAX_SPEED`. |
| `src/petanque/PetanqueEngine.js` | Dans `_detectShotResult()` : remplacer mesure par vitesse (casquette/blessee) par mesure par deplacement. Corriger recul (position finale vs direction tir). Ajouter guard `_carreauDetected`. Dans `_celebrateCarreau()` : set `_carreauDetected = true`. |
| `src/petanque/EngineRenderer.js` | Optionnel : utiliser `SHOT_RESULT_STYLES` dans `showShotLabel()` pour centraliser les styles. |
| `src/utils/SoundManager.js` | Ajouter `sfxPalet()`, `sfxCasquette()`, `sfxCiseau()`, `sfxContre()`, `sfxTrou()` (procedural Web Audio). |
| `tests/ShotResults.test.js` | Nouveau fichier. 10 tests couvrant les 8 resultats + 2 cas limites. |

---

## 9. RISQUES ET POINTS D'ATTENTION

1. **_pendingCarreauChecks est vide apres _checkCarreau()** : La methode `_checkCarreau()` fait `this._pendingCarreauChecks = []` a la fin. Si `_detectShotResult()` a besoin de `targetOrigX/targetOrigY`, il faut soit sauvegarder ces valeurs AVANT le clear, soit utiliser `_lastImpactPoint` comme fallback. **Recommandation** : Stocker `targetOrigX/targetOrigY` dans une variable d'instance `_lastTargetOrigPos` avant que `_checkCarreau()` ne vide le tableau.

2. **Timing de detection** : `_detectShotResult()` est appele quand TOUTES les boules sont arretees. Les vitesses sont ~0. Toute detection basee sur `vx/vy` est incorrecte a ce moment. Utiliser exclusivement des positions (deplacement, distance, projection).

3. **Collision cochonnet + boule dans le meme tir** : Le code actuel detecte "Au cochonnet" seulement si AUCUNE boule adverse n'a ete touchee. Si le tir touche le cochonnet ET une boule adverse, il tombe dans l'analyse single/multi target. C'est correct et coherent.

4. **Performance** : Les calculs sont negligeables (quelques sqrt + dot products, executes une seule fois par tir). Pas de risque FPS.

5. **Retro-compatibilite** : Le carreau existant ne doit PAS etre modifie. Son pipeline (`_checkCarreau()` → `_celebrateCarreau()`) reste inchange. Le flag `_carreauDetected` est un ajout non-intrusif.
