# Recherche Agent 4 : Physique Petanque - Simulation Complete

## 1. Modele de friction / deceleration

### Deux approches viables
1. **Friction lineaire (deceleration constante)** - RECOMMANDE
   - `speed -= mu * g * dt`
   - Physiquement correct pour boule roulant sur surface
   - Deceleration reguliere, arret propre
   - Meilleur "feel" pour la petanque

2. **Damping proportionnel**
   - `speed *= dampingFactor` chaque frame
   - Plus simple mais arret asymptotique (jamais vraiment 0)
   - Mieux pour billard, moins naturel pour petanque

### Implementation friction lineaire
```javascript
speed = Math.sqrt(vx*vx + vy*vy);
if (speed > threshold) {
    frictionForce = frictionCoefficient * mass * gravity;
    deceleration = frictionForce / mass; // = frictionCoefficient * gravity
    newSpeed = Math.max(0, speed - deceleration * deltaTime);
    vx = vx * (newSpeed / speed);
    vy = vy * (newSpeed / speed);
} else {
    vx = 0; vy = 0; // boule arretee
}
```

### Coefficients de friction par terrain
| Terrain | Multiplicateur | Effet gameplay |
|---------|---------------|----------------|
| Terre battue | 1.0 (baseline) | Roulement standard, distance moyenne |
| Herbe | 1.5 - 2.0 | Boules s'arretent plus vite |
| Sable | 2.5 - 4.0 | Boules s'arretent tres vite |
| Dalles (pierre) | 0.6 - 0.8 | Boules roulent plus loin, plus de precision requise |

## 2. Collisions cercle-cercle (elastiques)

### Detection (brute force OK - max 14 objets = 91 checks)
```javascript
dx = b2.x - b1.x;
dy = b2.y - b1.y;
dist = Math.sqrt(dx*dx + dy*dy);
if (dist < b1.radius + b2.radius) // -> collision
```

### Resolution - masses egales (boule vs boule ~700g)
```javascript
// Normale de collision
nx = dx / dist;
ny = dy / dist;

// Vitesse relative
dvx = b1.vx - b2.vx;
dvy = b1.vy - b2.vy;

// Vitesse relative selon la normale
dvn = dvx * nx + dvy * ny;

// Ne pas resoudre si les boules s'eloignent
if (dvn > 0) return;

// Scalaire d'impulse (masses egales, restitution e)
impulse = -(1 + restitution) * dvn / 2;

// Appliquer l'impulse
b1.vx += impulse * nx;
b1.vy += impulse * ny;
b2.vx -= impulse * nx;
b2.vy -= impulse * ny;

// Separer les boules qui se chevauchent (anti-sticking!)
overlap = (b1.radius + b2.radius) - dist;
b1.x -= overlap/2 * nx;
b1.y -= overlap/2 * ny;
b2.x += overlap/2 * nx;
b2.y += overlap/2 * ny;
```

### Resolution - masses differentes (boule ~700g vs cochonnet ~30g)
```javascript
impulse = -(1 + restitution) * dvn / (1/m1 + 1/m2);
b1.vx += (impulse / m1) * nx;
b1.vy += (impulse / m1) * ny;
b2.vx -= (impulse / m2) * nx;
b2.vy -= (impulse / m2) * ny;
```
Ratio masse ~1:23 => le cochonnet vole quand frappe, physiquement correct et satisfaisant.

### Restitution recommandee
- **~0.85** pour boule-boule (acier, quasi-elastique)
- Permet les carreaux naturels dans le systeme physique
- Un tir parfaitement centre transfere quasi toute la vitesse = carreau automatique

## 3. Trajectoire de lancer (3 phases)

### Phase 1 - Vol
- Boule "vole" du cercle de lancer vers le point d'atterrissage
- Rendu: ombre au sol grandissante, sprite boule legerement au-dessus
- Optionnel: animation de scale (plus gros "en l'air", retrecit a l'atterrissage)

### Phase 2 - Atterrissage
- Au point calcule (direction + puissance)
- Effet d'impact (puff de poussiere)
- Transition instantanee au niveau du sol

### Phase 3 - Roulement
- Vitesse = fraction de la puissance originale, dans la direction du lancer
- Soumis a la friction du terrain

### Calcul du point d'atterrissage
```javascript
landingDistance = throwPower * landingFactor; // landingFactor < 1, ex: 0.6
landingX = originX + Math.cos(angle) * landingDistance;
landingY = originY + Math.sin(angle) * landingDistance;

// Energie restante -> vitesse de roulement
rollingSpeed = throwPower * (1 - landingFactor) * rollingEfficiency;
rollingVx = Math.cos(angle) * rollingSpeed;
rollingVy = Math.sin(angle) * rollingSpeed;
```

### LandingFactor
- **Pointeur** (precision) : arc haut, landingFactor eleve = plus d'atterrissage, moins de roulement
- **Tireur** (tir) : arc plat, landingFactor bas = plus de vitesse a l'impact

## 4. Techniques speciales

### Tir (shooting)
- Puissance elevee, landingFactor bas
- Boule atterrit pres du lanceur, roule vite vers la cible
- La formule de collision gere le deplacement de la cible automatiquement
- Pour l'IA: viser directement une boule adverse avec haute puissance

### Carreau (perfect shot)
- Tir centre parfaitement sur la boule adverse
- Physiquement: collision along exact line of centers, boule frappante transfere TOUTE sa vitesse
- Se produit naturellement dans le systeme physique quand le tir est parfaitement centre
- Avec restitution < 1.0 (~0.85), la boule frappante garde un tiny recul = carreaux rares mais possibles

### Spin / Backspin (PHASE 4 - PAS MVP)
```javascript
// Backspin reduit la vitesse apres atterrissage
if (backspin > 0) {
    rollingSpeed *= (1 - backspin * 0.5);
}
// Sidespin ajoute une composante perpendiculaire
if (sidespin !== 0) {
    perpX = -Math.sin(angle) * sidespin * spinFactor;
    perpY = Math.cos(angle) * sidespin * spinFactor;
    rollingVx += perpX;
    rollingVy += perpY;
}
```
**Skip pour MVP**, ajouter en Phase 4.

## 5. Systeme de visee / lancer

### Pattern "Slingshot" - RECOMMANDE (comme Zebest-3000 et Angry Birds)
1. Click/touch sur le personnage (cercle de lancer)
2. Drag LOIN de la direction cible (vers le bas)
3. Fleche dessinee du personnage VERS la cible (oppose au drag)
4. Longueur fleche = puissance
5. Relacher = lancer

### Calcul direction + puissance depuis le drag
```javascript
// mousedown: enregistrer position depart
dragStartX = mouseX;
dragStartY = mouseY;

// mousemove: calculer direction et puissance
dx = dragStartX - mouseX; // inverse: drag bas-gauche = lancer haut-droite
dy = dragStartY - mouseY;
angle = Math.atan2(dy, dx);
distance = Math.sqrt(dx*dx + dy*dy);
power = Math.min(distance / maxDragDistance, 1.0); // normaliser 0-1

// mouseup: lancer la boule
launchVx = Math.cos(angle) * power * maxThrowSpeed;
launchVy = Math.sin(angle) * power * maxThrowSpeed;
```

### Details importants
- **Clamp puissance** a un maximum
- **Dead zone** : ignorer drags < 10-20px (clics accidentels)
- **Annulation** : drag retour au depart ou Escape
- **Touch/mobile** : utiliser pointer events (unifie mouse+touch)

### Feedback visuel par phase

**MVP (essentiel) :**
- Fleche de direction coloree, longueur proportionnelle a la puissance
- Indicateur puissance (couleur: vert=leger, jaune=moyen, rouge=max)

**Phase 2 :**
- Ligne pointillee trajectoire approximative
- Marqueur point d'atterrissage (cercle subtil)

**Phase 4 :**
- Prediction du roulement (pointilles plus fins)
- Boule fantome a la position estimee d'arret
- Affichage angle en degres

## 6. Code total estime

| Composant | Lignes estimees |
|-----------|----------------|
| Ball state (x, y, vx, vy, radius, mass) | ~10 |
| Update loop (velocity + friction + stop) | ~15 |
| Collision detection (pairwise distance) | ~10 |
| Collision response (elastic impulse) | ~20 |
| Overlap separation (anti-sticking) | ~5 |
| Boundary check (terrain rectangle) | ~10 |
| **Total physique** | **~70-100 lignes** |

## 7. References a etudier
- Jeux de billard open-source JS/Canvas (physique identique)
- CodePen "billiards canvas" : exemples minimaux de collision cercle
- The Coding Train (Daniel Shiffman) : circle collision en p5.js
- Recherches GitHub: `petanque javascript`, `boules game canvas`, `bocce ball html5`, `billiards javascript canvas`, `circle collision elastic javascript`
