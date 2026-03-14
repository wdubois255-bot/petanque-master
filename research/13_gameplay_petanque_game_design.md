# 13 - Gameplay Petanque : Game Design & Game Feel
> Recherche du 14 mars 2026. Synthese de ~15 sources sur le game design de jeux de sport/precision.

## Objectif
Comprendre ce qui rend un jeu de petanque video FUN et PROFOND, pour ameliorer le gameplay de Petanque Master.

---

## 1. Le moment critique : la deceleration pres du cochonnet

**80% du drame** se joue quand la boule ralentit pres du cochonnet. C'est le moment de tension maximale.

Techniques pour l'exploiter :
- Camera zoom subtil (1.0x -> 1.05x) quand la boule entre dans un rayon de 50px du cochonnet
- Son tendu (crescendo ou silence dramatique)
- Ralenti optionnel (0.3x) pour les moments serres (desactive dans notre cas pour l'instant)
- L'indicateur de point qui change en temps reel pendant ce moment = le vrai feedback

**Source** : Steve Swink "Game Feel", Wii Sports analysis, Blood Moon Interactive "Juice" article.

## 2. Game Feel et "Juice"

### Principes essentiels
- **Reponse temps reel < 100ms** : entre l'input du joueur et le retour visuel
- **Predictabilite avec subtilite** : meme input = meme resultat, mais assez de nuance pour rester interessant
- **Le son = 50% du game feel** dans un jeu de sport

### Techniques de juice pour la petanque
| Technique | Impact | Quand l'utiliser |
|-----------|--------|------------------|
| Screen shake | Fort | Collision boule-boule (2-4px, 100ms) |
| Hitstop (freeze frame) | Tres fort | Carreau, gros tir (2-4 frames = 30-60ms) |
| Squash & stretch | Moyen | Impact boule (scaleX 1.3, scaleY 0.7, 50ms) |
| Particules | Fort | Atterrissage (poussiere), roulement (trainee), score (confetti) |
| Flash blanc | Moyen | Tir reussi, carreau |
| Camera follow | Fort | Suivre la boule en vol (lerp 0.08) |

### Attention : le "Juice Problem"
L'over-juicing masque un mauvais gameplay. Le juice doit **echoer** le gameplay, pas le couvrir.
Pour la petanque : rester ancre dans l'ambiance provencale. Pas d'explosions, pas d'effets cosmiques.
Le clac metallique d'une bonne frappe EST le juice. Le silence avant la deceleration EST la tension.

**Sources** : Blood Moon Interactive, GameAnalytics, Wayline "The Juice Problem".

## 3. Ce que font les autres jeux de petanque/boules

### Power of Petanque (Steam, 100% positive reviews)
- Succes : garde le gameplay simple, ajoute une touche "magique" (pouvoirs speciaux)
- Le core est solide : visee intuitive, physique satisfaisante, progression
- Lecon : simplicite + une mecanique originale > complexite

### Bocce Revolution (Steam)
- Vend la "PhysX realism" comme argument
- Les joueurs veulent que la physique soit coherente et predictible
- Lecon : le joueur doit faire confiance au systeme physique

### Wii Sports Bowling (reference universelle)
- Genie : variations subtiles de l'input = resultats differents
- Vitesse du bras, angle du poignet, timing = spin sur la boule
- Lecon : minutes to learn, lifetime to master. L'interface doit etre immediate mais la maitrise profonde.

**Sources** : Steam reviews, Wikipedia Wii Sports, game feel analyses.

## 4. Profondeur strategique de la vraie petanque

### La decision fondamentale : Pointer ou Tirer ?
A CHAQUE lancer, le joueur doit evaluer :
- Puis-je battre la meilleure boule adverse en pointant ? -> Pointer
- Non, et tirer gagne plus de points ? -> Tirer
- La situation est desastreuse ? -> Tirer le cochonnet (desespere, haut risque)

### L'avantage de boules
Concept CLE que les debutants ignorent :
- L'equipe avec plus de boules non jouees a un avantage strategique
- Gaspiller 3 boules pour deloger 1 boule adverse = donner 2 lancers gratuits a l'adversaire
- Parfois mieux de tirer immediatement que de pointer 3 fois
- C'est une couche de **gestion de ressources** par-dessus le skill physique

### Le dernier lancer
Le dernier lancer d'une mene est toujours dramatique : pas de reponse possible.
Si tu places ta derniere boule bien, l'adversaire ne peut rien faire.

### Le tir au cochonnet
- Si la mene est catastrophique, tirer le cochonnet pour le deplacer
- Si le cochonnet sort : mene morte (regles speciales)
- Coup risque mais qui peut sauver une mene perdue

**Sources** : Brighton Petanque tactics, All About Petanque, PYC Petanque, Rules of Petanque blog, Decathlon guides.

## 5. Tension et comeback

- **L'equipe qui perd joue** : cree une pression constante, tu es toujours en reaction
- **Score a 13** : une equipe peut marquer 1 a 6 points par mene, donc comebacks massifs possibles
- **Le cochonnet comme reset** : option desespere pour repartir de zero
- **Le dernier lancer** : pas de reponse = moment de verite

### Application : montrer le score projete
Montrer "Si ca s'arrete la : +3 pour Bleu" rend chaque lancer visuellement impactant sur le score.
Le joueur VOIT l'enjeu de chaque boule.

## 6. IA par personnalite (pas par difficulte pure)

### Le probleme du rubber-banding
NE JAMAIS tricher pour equilibrer. Dans un jeu de precision, si l'IA devient plus precise quand tu gagnes, ca se sent et c'est injuste.

### L'approche personnalite
Au lieu de "meme IA mais plus precise", creer des **comportements distincts** :
- **Tireur** : tire des qu'il n'a pas le point, spectaculaire mais gaspilleur
- **Pointeur** : placement milimetrique, ne tire jamais, frustrant mais beatable en tirant
- **Stratege** : optimise l'avantage de boules, tire le cochonnet, impredictible
- **Complet** : fait tout bien, le boss

### Rendre lisible pour le joueur
Chaque adversaire doit avoir une "faiblesse" exploitable :
- Le pointeur = tirer ses boules bien placees
- Le tireur = pointer calmement pendant qu'il rate
- Le stratege = garder un avantage de boules

Les pertes doivent se sentir justes ("il est vraiment bon tireur") et non arbitraires.

**Sources** : Sonic All-Stars AI design, Game Wisdom rubber-banding article, Gamedeveloper.

## 7. Erreurs a eviter

| Erreur | Pourquoi c'est grave | Notre mitigation |
|--------|---------------------|------------------|
| Difficulte wall | 1er combat trivial, 2eme impossible | Courbe lisse, personnalites progressives |
| Strategie dominante | Pointer toujours mieux que tirer (ou inverse) | Les deux viables selon situation |
| Repetition | Chaque partie se ressemble | Terrains varies, personnalites IA, progression narrative |
| Mauvaise lisibilite | Le joueur ne comprend pas l'etat | Distances, score projete, indicateur de point |
| Ignorer le social | La petanque est sociale | Dialogues, taunts, reactions des PNJ |
| Over-juice | Effets masquent le gameplay | Rester provencal, le clac metallique suffit |

## 8. Techniques reelles de petanque a simuler

### Pointer (placement)
| Technique | Description | landingFactor | arcHeight | rollEfficiency |
|-----------|-------------|---------------|-----------|----------------|
| Roulette | Lancer bas, roule la majorite | 0.25 | -4 | 1.4 |
| Demi-portee | Mi-vol, mi-roulement | 0.50 | -18 | 0.9 |
| Portee/Plombee | Lob haut, peu de roulement | 0.75 | -35 | 0.5 |

### Tirer (attaque)
| Technique | Description | Difficulte |
|-----------|-------------|------------|
| Tir a la rafle | Rase le sol, balaie | Moyen |
| Tir au fer | Vol direct, frappe en l'air | Difficile |
| **Carreau** | Remplace exactement la boule adverse | Expert |

Le carreau est le strike de la petanque. Le moment "WOW" a celebrer.

**Sources** : Decathlon "Comment bien tirer", Boulipedia (pointer + tirer), ESM Petanque techniques.
