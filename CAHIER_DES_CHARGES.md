# Cahier des Charges - PETANQUE MASTER
## Jeu web 2D : Monde ouvert Petanque x Pokemon

---

## 1. CONCEPT GENERAL

**Petanque Master** est un jeu web 2D en vue du dessus (style Pokemon Game Boy / DS) ou le joueur explore un mini monde ouvert, se deplace de ville en ville, et affronte des "maitres de petanque" dans des arenes. Les combats sont des parties de petanque jouees en temps reel, reproduisant la mecanique du jeu flash "La Petanque" de Zebest-3000.

### L'histoire
Le joueur debute comme un jeune passione de petanque. Au debut du jeu, il choisit son **set de boules** (equivalent du choix du starter Pokemon) parmi 3 options avec des caracteristiques differentes :
- **Boules d'Acier** : equilibrees (precision moyenne, puissance moyenne)
- **Boules de Bronze** : lourdes (moins de precision, plus de puissance - ideales pour le tir/carreau)
- **Boules de Chrome** : legeres (plus de precision, moins de puissance - ideales pour le point)

Une intro humoristique plante le decor : le joueur vit dans un petit village provencal et reve de devenir le meilleur bouliste du canton. Son voisin, un vieux maitre de petanque, lui offre son premier set de boules et l'encourage a aller defier les maitres des villages voisins.

**En resume** : l'exploration de Pokemon + les combats remplaces par des parties de petanque. On s'entraine, on rencontre des gens sur les chemins pour faire des parties, et on affronte les maitres d'arene pour devenir le Petanque Master.

---

## 2. PARTIE EXPLORATION (Style Pokemon)

### 2.1 Vue et deplacements
- Vue top-down 2D avec tiles (tuiles) de 16x16 ou 32x32 pixels
- Le joueur deplace son personnage avec les fleches directionnelles ou ZQSD
- Scroll de la camera qui suit le joueur
- Collisions avec les elements du decor (arbres, murs, eau, etc.)

### 2.2 La carte / le monde
- Un monde compose de plusieurs zones connectees :
  - **Villages/villes** : avec des PNJ, des arenes, des boutiques
  - **Routes** : chemins entre les villes avec des dresseurs a affronter
  - **Zones speciales** : plage, parc, place du village, terrain vague
- Taille modeste mais suffisante pour donner une impression d'exploration (5-8 zones)

### 2.3 Les PNJ (Personnages Non Joueurs)
- **Joueurs de petanque** : places sur les routes et les places de village, declenchent un combat quand le joueur passe dans leur champ de vision (comme les dresseurs Pokemon). Ce sont des rencontres d'entrainement.
- **PNJ de ville** : villageois qui donnent des dialogues, des indices, de l'ambiance ("Tu devrais t'entrainer avant d'aller defier le maitre de l'arene du port...")
- **Maitres d'arene** : les boss de chaque lieu, les meilleurs boulistes de la region
- **Le vieux maitre** : le mentor du joueur, present au debut pour donner les boules et des conseils

### 2.4 Les arenes
- 3 a 5 arenes reparties sur la carte
- Chaque arene a un theme et un terrain different :
  - **Arene du Village** : terrain terre battue (tutoriel / premiere arene)
  - **Arene du Parc** : terrain herbe
  - **Arene de la Plage** : terrain sable
  - **Arene de la Place** : terrain mixte (dalles)
  - **Arene Finale** : terrain special, le maitre ultime
- Il faut battre le maitre pour obtenir un **badge de maitre**
- Progression : les arenes suivantes ont une IA plus forte

### 2.5 Systeme de progression
- Le joueur collecte des **badges de maitre** en battant les champions
- Rencontrer des joueurs sur les routes permet de **s'entrainer** et de s'ameliorer
- Deblocage de nouvelles zones au fur et a mesure (un PNJ bloque le passage tant qu'on n'a pas le badge precedent)
- Objectif final : battre tous les maitres et devenir le **Petanque Master**
- **Choix des boules** en debut de jeu (influence les stats de jeu)

---

## 3. PARTIE PETANQUE (Mecanique de combat)

La mecanique de petanque reproduit fidelement le jeu flash analyse.

### 3.1 Terrain de jeu
- Vue top-down sur un terrain rectangulaire
- 3 types de terrain avec comportements differents :
  - **Terre battue** : roulement moyen, comportement standard
  - **Herbe** : roulement ralenti, les boules s'arretent plus vite
  - **Sable** : roulement tres freine, les boules s'arretent rapidement
- Le type de terrain est determine par l'arene/le lieu du combat

### 3.2 Regles de petanque
- **Formats de jeu** (debloques au fil de la progression) :
  - **Tete-a-tete** (1v1) : chaque joueur a 3 boules - format de depart
  - **Doublette** (2v2) : le joueur + un partenaire PNJ recrute en route, 3 boules chacun
  - **Triplette** (3v3) : le joueur + 2 partenaires, 2 boules chacun (arenes avancees)
- Les partenaires sont des PNJ rencontres sur la route qui proposent de faire equipe (comme recruter des Pokemon). On peut en avoir plusieurs et choisir qui emmener.
- Chaque joueur a **3 boules** par manche (2 en triplette)
- Un **cochonnet** (petit, jaune/blanc) est lance en debut de manche
- Le joueur qui n'a PAS la boule la plus proche du cochonnet doit rejouer
- Quand toutes les boules sont lancees : fin de manche
- **Comptage des points** : l'equipe gagnante marque autant de points qu'elle a de boules plus proches du cochonnet que la meilleure boule adverse
- **Victoire** : premier a 13 points

### 3.3 Systeme de lancer
- Le personnage est affiche en bas du terrain dans un cercle
- **Visee** :
  1. Le joueur clique et maintient le bouton de la souris sur le personnage
  2. Il deplace la souris pour orienter la **fleche de direction** (rouge)
  3. Il tire la souris vers le bas pour augmenter la **puissance** (la fleche s'allonge)
  4. Il relache pour lancer
- La direction est determinee par l'angle de la fleche
- La puissance est determinee par la distance du drag

### 3.4 Physique des boules
- Les boules ont une trajectoire balistique simplifiee (vue du dessus = on voit le point d'impact puis le roulement)
- Apres l'atterrissage, la boule **roule** dans la direction du lancer avec deceleration
- **Collisions boule-boule** : les boules se poussent mutuellement (tir/carreau)
- **Collision boule-cochonnet** : le cochonnet peut etre deplace
- Les boules ne sortent pas du terrain (rebond ou arret sur les bords)

### 3.5 Interface en jeu (petanque)
- Terrain de jeu au centre
- **Medaillon/loupe** en haut a gauche : zoom sur la zone du cochonnet
- **Panneau lateral** a droite : portraits des joueurs, score, boules restantes
- Indicateur **"BEST"** : montre qui a la boule la plus proche
- Animation du personnage : idle, visee, lancer, celebration

### 3.6 Intelligence artificielle
- L'IA des adversaires a plusieurs niveaux de difficulte :
  - **Facile** : visee imprecise, puissance aleatoire
  - **Moyen** : bonne direction, puissance approximative
  - **Difficile** : visee precise, capable de faire des carreaux (tirs sur les boules adverses)
- Difficulte progressive selon l'avancement dans le jeu

---

## 4. FLOW DU JEU

1. **Ecran titre** : "Petanque Pokemon" avec Nouvelle Partie / Continuer
2. **Introduction** : petit dialogue de contexte (le joueur debute comme apprenti bouliste)
3. **Exploration** : le joueur se deplace dans le monde
4. **Rencontre dresseur** : un PNJ repere le joueur -> transition vers le combat
5. **Combat de petanque** : partie complete jusqu'a 13 points
6. **Victoire/Defaite** : retour a l'exploration. Si defaite, le joueur peut reessayer
7. **Arene** : meme principe mais contre un champion + obtention d'un badge
8. **Fin du jeu** : tous les badges obtenus -> ecran de victoire finale

---

## 5. STACK TECHNIQUE

### 5.1 Technologies
- **HTML5 / CSS3 / JavaScript** pur (ou TypeScript)
- **Canvas 2D** (API native du navigateur) pour le rendu du jeu
- Pas de framework lourd -> le jeu doit rester leger et rapide
- **Optionnel** : une lib legere comme Phaser.js si besoin d'accelerer le dev

### 5.2 Pourquoi ces choix
- Jouable directement dans le navigateur, aucune installation
- Compatible desktop et mobile (responsive)
- Hebergeable sur n'importe quel serveur statique (GitHub Pages, Netlify, etc.)
- Pas besoin de backend (jeu solo)

### 5.3 Structure du projet
```
/
  index.html          -> Point d'entree
  /src
    /engine           -> Moteur de jeu (game loop, input, camera, renderer)
    /world            -> Carte, tiles, collisions, PNJ
    /petanque         -> Mecanique de petanque (physique, IA, scoring)
    /ui               -> Interface, dialogues, menus
    /data             -> Donnees de la carte, des PNJ, des arenes
  /assets
    /sprites          -> Personnages, tiles, boules, terrain
    /maps             -> Fichiers de carte (JSON tilemaps)
    /audio            -> Musiques et effets sonores
  /styles             -> CSS
```

### 5.4 Assets graphiques
- Style pixel art 16-bit (style Pokemon GBA/DS)
- Tilesets pour la carte du monde
- Sprites animes pour les personnages (marche 4 directions, idle)
- Sprites pour le mode petanque (personnage, boules, cochonnet, terrain)
- Tout peut etre genere en pixel art ou utiliser des assets libres

---

## 6. CONTENU MINIMUM VIABLE (MVP)

Pour une premiere version jouable :

### Phase 1 - Moteur de petanque
- [ ] Terrain de jeu avec rendu Canvas
- [ ] Systeme de lancer (clic + drag -> direction + puissance)
- [ ] Physique des boules (roulement, deceleration, collisions)
- [ ] Cochonnet
- [ ] Comptage des points et regles de manche
- [ ] IA basique pour l'adversaire
- [ ] 1 type de terrain

### Phase 2 - Monde ouvert
- [ ] Moteur de tilemap (rendu de la carte)
- [ ] Deplacement du joueur avec collisions
- [ ] Camera qui suit le joueur
- [ ] Systeme de dialogue (boites de texte)
- [ ] PNJ avec detection du joueur
- [ ] Transition exploration -> combat de petanque

### Phase 3 - Contenu
- [ ] Carte complete avec 3-5 zones
- [ ] 3 arenes avec champions
- [ ] 10+ dresseurs sur les routes
- [ ] Systeme de badges
- [ ] Ecran titre et fin de jeu
- [ ] 3 types de terrain pour la petanque

### Phase 4 - Polish
- [ ] Animations des personnages
- [ ] Effets sonores et musique
- [ ] Medaillon zoom en mode petanque
- [ ] Sauvegarde locale (localStorage)
- [ ] Equilibrage de la difficulte de l'IA

---

## 7. CONTRAINTES

- **Web uniquement** : doit tourner dans Chrome, Firefox, Safari, Edge
- **Pas de serveur** : tout en client-side, hebergeable en statique
- **Performance** : doit tourner a 60 FPS sur un PC moyen
- **Poids** : garder le jeu leger (< 10 MB total)
- **Simple** : pas de systeme de combat complexe, juste de la petanque bien faite
- **Responsive** : jouable sur desktop (clavier + souris) et tablette (tactile)

---

## 8. PERSONNAGES PARODIQUES (exemples)

Des maitres d'arene et PNJ inspires de cliches humoristiques de la petanque :
- **Maitre Marcel** (1ere arene) : le vieux du village, casquette et pastis, facile a battre mais plein de sagesse
- **Maitre Fanny** (2eme arene) : la terreur du parc municipal, ne fait jamais "fanny" a personne
- **Maitre Ricardo** (3eme arene) : le beau gosse de la plage, lance ses boules avec style
- **Le Grand Marius** (boss final) : la legende vivante de la petanque, invaincu depuis 20 ans
- **Partenaires recrutables** : des personnages rigolos rencontres en chemin (le touriste perdu, la mamie energique, le kid prodige, etc.)

---

## 9. REFERENCES VISUELLES

- **Exploration** : Pokemon Rouge/Bleu/Emeraude (vue top-down, tiles, PNJ)
- **Petanque** : Jeu flash "La Petanque" de Zebest-3000/TF1 (Concept & Design by DAD)
  - Personnages caricaturaux provencaux
  - Terrain vu du dessus
  - Systeme de drag pour viser et doser la puissance
  - Medaillon zoom, panneau de score lateral

---

## 10. APPROCHE TECHNIQUE - POURQUOI C'EST FAISABLE EN WEB

Le jeu est 100% jouable dans un navigateur grace a :
- **HTML5 Canvas** : suffisant pour du pixel art 2D, 60 FPS sans probleme
- **Aucun serveur necessaire** : tout tourne cote client (JavaScript)
- **Hebergement gratuit** : deployable sur GitHub Pages, Netlify, ou Vercel
- **Leger** : pixel art = fichiers tres petits, le jeu entier fera < 5 MB
- **Pas de plugin** : contrairement au jeu Flash original, ca tourne nativement
- **Sauvegarde** : localStorage du navigateur pour la progression
- **Compatibilite** : fonctionne sur tous les navigateurs modernes + tablettes
