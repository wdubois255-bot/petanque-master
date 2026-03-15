# Recherche : Scene Petanque - Rendu Visuel et Atmosphere

## 1. DISPOSITION REELLE D'UN TERRAIN DE PETANQUE (vue top-down)

### Dimensions officielles (FIPJP)
- International/National : 15m x 4m (minimum)
- Regional : 12m x 3m (minimum)
- Pas de marquages internes (contrairement au tennis) - juste un rectangle de gravier

### Le cercle de lancer
- Diametre 35-50cm (gratte dans la terre traditionnellement)
- Cercle rigide plastique rouge (50cm, standard competition depuis 2005)
- Position : >1m de tout obstacle, >2m d'un autre cercle actif
- En menes suivantes : place ou le cochonnet s'est arrete

### Position du cochonnet
- 6-10m du cercle
- >50cm de tout obstacle
- Visible par le joueur debout dans le cercle
- Aspect : 30mm diametre, bois de buis (jaune pale), ou peint couleur vive

### Position des joueurs (CRITIQUE pour le jeu)
- **Lanceur** : debout dans le cercle, pieds au sol
- **Coequipiers du lanceur** : peuvent aller ou ils veulent
- **Adversaires** : doivent se tenir **au-dela du cochonnet**, a au moins 2m de la ligne de jeu
- **Entre les lancers** : joueurs vont et viennent entre cercle et cochonnet, inspectent les distances
- **Vue typique** : 3-5 personnes regroupees pres du cochonnet (accroupies, penchees), 1 personne seule au cercle

## 2. ATMOSPHERE VISUELLE

### Surface du terrain
- Gravier decompose / terre battue - PAS lisse, rugueux, avec petits cailloux visibles
- Couleur : ocre sable, brun chaud, gris-brun. Jamais blanc pur
- Details : traces de trainee, crateres d'atterrissage, marques de pas visibles

### Environnement provencal typique
- **Platanes** : arbres massifs avec ecorce tachetee (blanc/vert/brun), ombrage tachete
- **Bancs en bois** : simples, patines, le long du terrain avec spectateurs ages
- **Murets en pierre** : bordure du terrain, parfois avec fleurs
- **Terrasse de cafe** : tables et chaises, verres de pastis
- **Guirlandes/lanternes** : pour les parties du soir
- **Planches en bois** : bordure du terrain (toucher = hors jeu)
- **Arriere-plan** : batiments en pierre, toits terracotta, volets bleu/vert/lavande

### Eclairage
- Fin d'apres-midi = moment classique (apres dejeuner, avant diner)
- Lumiere doree mediterraneenne, longues ombres
- Ombre tachetee a travers les feuilles des platanes
- Temperature de couleur chaude

### Palette couleurs reelle
- Gravier : Ocre #CC9966, Sable #D4B896, Gris chaud #A89888
- Terracotta : #C75B39, #E2725B
- Troncs platane : #8B7D6B, #B5A88F, #6B7B5E
- Feuillage : Olive #556B2F, Vert chaud #7B8B3A
- Ciel : Bleu Provence #5B9BD5, plus clair #87CEEB
- Lavande : #9B72AA
- Murs pierre : Creme #F5E6D0, Ocre clair #E8D5B5
- Ombres : Brun chaud #3A2E28 (jamais noir pur)
- Boules acier : Argent #C0C0C0, highlight #E8E8E8, ombre #808080
- Cochonnet : Orange vif #FF8C00 ou bois #D4A574

## 3. JEUX DE PETANQUE EXISTANTS (benchmark)

### Power of Petanque (Steam)
- Twist druidique/magique avec pouvoirs
- 3D, camera premiere personne
- 100% avis positifs

### Bocce Revolution (Steam, 2015)
- Simulation 3D realiste, NVIDIA PhysX
- 85% avis positifs

### Constat
- **Tous en 3D** avec camera derriere le lanceur
- **PERSONNE n'a fait de bon jeu 2D top-down petanque** = opportunite unique
- **Personne n'a combine petanque + RPG/aventure** = notre concept est unique
- **Physique = critique** : chaque jeu avec mauvaise physique = avis negatifs
- **Controles = plainte #1** : drag-and-release doit etre naturel et predictible

## 4. TECHNIQUES VISUELLES TOP-DOWN POUR LES BOULES

### Rendu sphere en vue du dessus
- Cercle + gradient radial (highlight haut-gauche, ombre bas-droite) = illusion sphere
- **Ombre portee** : ellipse semi-transparente decalee en dessous = element #1 pour le "pop"
- Quand boule en vol : ombre plus petite et plus eloignee (parallaxe)
- Reflet metallique : petit point blanc (highlight speculaire) en haut-gauche

### Effets de roulement
- **Trainee de poussiere** : particules ocre qui s'estompent derriere la boule
- **Impact atterrissage** : burst de poussiere + assombrissement subtil au sol
- **Lignes de vitesse** : pour les tirs rapides, flou de mouvement
- **Deceleration** : la trainee s'amincit puis s'arrete

### Effets de collision
- **Flash** : eclair blanc au point de contact
- **Screen shake** : subtil, 1-2 pixels pour les gros tirs
- **Knockback** : boule touchee accelere visiblement
- **Burst de particules** : poussiere/etincelles au point de collision

## 5. MOMENTS EXCITANTS DE LA PETANQUE (pour game feel)

### Le "Pointer" (lent, tendu)
- Boule lancee en arc doux, atterrit avec thud sourd + poussiere
- Roule lentement vers le cochonnet... ralentit... ralentit...
- Camera zoom lent, possible ralenti
- La boule s'arrete. Est-elle plus proche ? Tout le monde se penche
- **Visuel** : roulement doux, peu de poussiere, landing soft. Tension dans l'attente

### Le "Tir" (rapide, dramatique)
- Boule lancee fort et rapide, trajectoire quasi-plate
- Frappe la boule cible avec un CLAC metallique sec
- Les deux boules volent. La boule touchee est projetee
- **Visuel** : lignes de vitesse, flash impact, explosion poussiere, screen shake, freeze-frame

### Le "Carreau" (le tir parfait)
- Le tir ou la boule lancee remplace EXACTEMENT la boule adverse
- La foule halète, puis acclame
- **Visuel** : impact, la boule touchee vole, la boule lancee reste parfaitement immobile. Eclat dore

### Le moment de mesure
- Quand on ne sait pas quelle boule est plus proche
- Joueurs accroupis autour du cochonnet avec metre/ficelle
- Camera zoom serre, lignes de mesure, pause dramatique

### Reactions des spectateurs
- Halètements quand une boule atterrit pres
- Groans quand elle va trop loin
- Acclamations pour un bon tir
- Le classique "ohhhhh" monte quand une boule roule vers le cochonnet
- Applaudissements pour un carreau
- Arguments sur qui est plus proche (tres francais)
