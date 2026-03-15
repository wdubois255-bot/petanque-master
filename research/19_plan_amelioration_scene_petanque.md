# Plan d'amelioration : Scene de Petanque

## ETAT ACTUEL vs CIBLE

### Ce qu'on a
- Terrain = rectangle plat d'une couleur avec 90 points de bruit
- Boules = cercles avec 1 highlight
- Camera statique (sauf zoom pres cochonnet)
- Personnages au cercle et en zone d'attente
- Pas de decor autour du terrain
- Pas d'ambiance sonore continue

### Ce qu'on veut
- Terrain texture avec details (gravier, traces, bordures en bois)
- Boules avec rendu 3D simule (gradient radial, reflet metallique, ombre portee)
- Camera qui suit la boule en vol + slow-mo sur moments tendus
- Joueurs positionnes comme en vrai (adversaires pres du cochonnet)
- Decor provencal autour (platanes, banc, muret, ciel)
- Ambiance cigales + musique legere

## AMELIORATIONS PAR PRIORITE

### PRIORITE 1 : Terrain riche (impact visuel ++)
- [ ] Fond de scene : ciel bleu Provence + arbres en arriere-plan
- [ ] Texture terrain : gravier dessine avec variation (pas juste bruit)
- [ ] Bordures en bois autour du terrain
- [ ] Ombre des arbres sur le terrain (taches de lumiere)
- [ ] Traces au sol apres impact boule (cercle sombre qui reste)
- [ ] Decor lateral : banc avec spectateur, muret en pierre, pots de fleurs

### PRIORITE 2 : Boules realistes (impact visuel ++)
- [ ] Gradient radial pour effet sphere 3D
- [ ] Ombre portee decalee (pas juste +2px)
- [ ] Reflet speculaire (point blanc haut-gauche)
- [ ] En vol : ombre au sol qui change de taille (parallaxe)
- [ ] Stries metalliques sur les boules (lignes fines)
- [ ] Cochonnet en bois (texture boisee au lieu de cercle jaune)

### PRIORITE 3 : Camera cinematique (game feel ++)
- [ ] Camera follow la boule pendant le vol (lerp 0.08)
- [ ] Slow-motion (0.5x) quand boule < 40px du cochonnet et speed < 2
- [ ] Zoom 1.05x sur la zone cochonnet quand boule ralentit
- [ ] Camera pan vers le cochonnet apres chaque lancer (montrer le resultat)
- [ ] Camera retour smooth vers le cercle quand c'est au joueur

### PRIORITE 4 : Positionnement joueurs realiste
- [ ] Adversaire se place PRES DU COCHONNET (pas en zone d'attente loin)
- [ ] Quand c'est son tour : il marche vers le cercle
- [ ] Quand c'est pas son tour : il est accroupi pres du cochonnet, regarde
- [ ] Reactions : joie (saut), deception (mains sur tete), celebration carreau
- [ ] Regard qui suit la boule (rotation frame)

### PRIORITE 5 : Ambiance sonore
- [ ] Cigales continues (boucle audio, volume bas)
- [ ] Brise legere (vent)
- [ ] Oiseaux occasionnels
- [ ] Musique legere chiptune en fond (tres bas volume)
- [ ] Reactions vocales : "Oh!", "Bien joue!", "Aie..."

### PRIORITE 6 : Effets visuels avances
- [ ] Ombre du soleil (lumiere venant du haut-gauche, coherente)
- [ ] Particules feuilles d'arbre qui tombent (2-3 en vol)
- [ ] Trainee de poussiere proportionnelle a la vitesse
- [ ] Impact au sol : marque permanente (sombre) qui reste tout le match
- [ ] Boule morte : tombe hors terrain avec rebond + son "clonk"

## DISPOSITION SCENE (plan)

```
+--------------------------------------------------+
|  CIEL BLEU PROVENCE (gradient)                    |
|  [platane]          [platane]         [platane]   |
|                                                   |
|  [banc]   +========================+   [muret]    |
|           |   TERRAIN GRAVIER      |              |
|           |                        |              |
|           |   [adversaire accroupi]|              |
|           |       o cochonnet      |              |
|           |     O O O (boules)     |              |
|           |                        |              |
|           |                        |              |
|           |                        |              |
|           |                        |              |
|           |    (cercle de lancer)  |              |
|           |      [joueur debout]   |              |
|           +========================+              |
|  [spectateur]                      [table cafe]   |
+--------------------------------------------------+
```

## QUESTIONS A RESOUDRE
- Faut-il un scrolling vertical (terrain plus grand que l'ecran) ?
- Ou garder tout visible (vue complete du terrain) ?
- Quel niveau de zoom par defaut ?
- Les spectateurs sont-ils animes ?
