# Petanque Master — Publication itch.io

## Infos de la page

**Titre** : Petanque Master
**Type** : HTML5
**Genre** : Sports, Strategy, Arcade
**Tags** : petanque, pixel-art, sports, french, arcade, strategy, turn-based

**Dimensions** : 832 × 480
**Fullscreen** : Oui (recommandé)
**Mobile friendly** : Oui (touch input)

---

## Description courte (pour la fiche itch.io)

```
Petanque Master — Le boulodrome provençal en pixel art !

Affrontez 12 personnages hauts en couleur sur 5 terrains authentiques.
Maîtrisez la roulette, la demi-portée et la plombée pour écraser vos adversaires.

✓ 12 personnages avec stats, abilities et barks uniques
✓ 5 terrains (Village, Parc, Colline, Plage, Docks)
✓ Mode Arcade avec progression narrative
✓ Boutique : 16 boules, 6 cochonnets
✓ Tutoriel intégré
✓ Physique pétanque authentique

Appuyez sur P pour mettre en pause. TAB pour voir le classement des boules.
```

---

## Description longue (corps de la fiche)

```
Petanque Master est un jeu de pétanque pixel art inspiré du Midi provençal.
Glissez pour viser, relâchez pour lancer. Simple à prendre en main, difficile à maîtrer.

** MODES DE JEU **
- Mode Arcade : Affrontez les légendes du boulodrome en 5 rounds.
  Chaque victoire débloque un nouveau personnage et une récompense en galets.
- Quick Play : Entraînez-vous contre n'importe quel adversaire,
  sur n'importe quel terrain, avec n'importe quelle boule.

** PERSONNAGES **
12 personnages jouables, chacun avec des statistiques uniques
(Précision, Puissance, Effet, Sang-froid) et une capacité spéciale :
Papi René le vétéran tranquille, La Choupe le bulldozer des docks,
Mamie Josette qui annule votre visée, Sofia la perfectioniste,
Fazzino l'artiste du carreau... et bien d'autres !

** TERRAINS **
- Village : Terre battue, terrain classique
- Parc : Herbe et gravier mélangés — attention aux zones !
- Colline : Pente naturelle, compensez en visant haut
- Plage : Sable mou, les boules ralentissent vite
- Docks : Dalles dures, les boules rebondissent sur les murs

** RÈGLES FIPJP **
1 contre 1, 3 boules chacun.
L'équipe la plus loin du cochonnet rejoue.
Score = nombre de boules plus proches que la meilleure adverse.
Premier à 13 points gagne !

** CONTRÔLES **
- Souris/Touch : Glisser-relâcher pour viser et ajuster la puissance
- R : Changer de technique (Roulette / Demi-portée / Plombée / Tir)
- ESPACE : Focus (Respire) — stabilise la visée
- TAB (maintenu) : Voir le classement des distances
- P : Pause

Développé avec Phaser 4 et beaucoup d'amour pour la pétanque.
Bonne partie, et que le meilleur gagne !
```

---

## Instructions de déploiement

### 1. Build

```bash
npm run build
```

Le dossier `dist/` contient le jeu complet.

### 2. Zipper

Zipper le **contenu** de `dist/` (pas le dossier lui-même) :
- Sur Windows : sélectionner tout dans `dist/`, clic droit → Envoyer vers → Dossier compressé
- Sur Mac/Linux : `cd dist && zip -r ../petanque-master.zip .`

### 3. Upload sur itch.io

1. Créer un projet HTML5 sur itch.io
2. Upload le ZIP
3. Cocher "This file will be played in the browser"
4. Dimensions : 832 × 480
5. Activer "Fullscreen button"
6. Activer "Mobile friendly"

### 4. Tags recommandés

`petanque`, `pixel-art`, `sports`, `french`, `arcade`, `strategy`, `turn-based`, `provence`

---

## Captures d'écran recommandées

1. TitleScene avec logo v2
2. Match en cours (terrain Village) — boules en jeu
3. ScorePanel visible + VS label
4. CharSelect avec personnages débloqués
5. ResultScene après victoire
