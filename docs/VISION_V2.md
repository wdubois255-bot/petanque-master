# VISION V2 — PETANQUE MASTER : LA PLACE DU VILLAGE

> **Date** : 25 mars 2026
> **Statut** : Direction validee, a implementer
> **Remplace** : La vision "fighting game" (Street Fighter/Tekken) de GAME_DESIGN.md
> **Ne remplace PAS** : Le moteur petanque, les stats, la physique, les terrains (tout est conserve)

---

## 1. LE CONCEPT EN UNE PHRASE

**Un jeu de petanque ou tu construis ton village, recrutes tes coequipiers, et montes jusqu'au tournoi national — en solo avec des PNJ, puis en multi contre d'autres villages.**

---

## 2. CE QUI CHANGE PAR RAPPORT A LA V1

| Avant (V1 "Fighting Game") | Apres (V2 "Place du Village") |
|---|---|
| Structure Street Fighter (select perso → match) | Village explorable comme hub central |
| Personnages = adversaires a battre | Personnages = habitants a recruter, coequipiers, relations |
| Arcade = 5 matchs enchaines | Concours de village → inter-villages → tournoi national |
| Aucune narration | Narrateur pagnolien + dialogues + profil joueur |
| Progression = stats Rookie | Progression = reputation, village, relations, equipe |
| Pas de multi | Multi 1v1 en ligne (puis village vs village) |
| Quick Play seul mode accessible | Quick Play conserve + Village comme mode principal |

## 3. CE QUI NE CHANGE PAS

- **Le moteur de petanque** : physique custom, Ball.js, PetanqueEngine.js, AimingSystem.js — intouchable
- **Les stats des personnages** : precision, puissance, effet, sang-froid — meme systeme
- **L'IA** : 4 archetypes, 3 difficultes, momentum — conserve
- **Les terrains** : 5 terrains avec physique unique — conserves
- **Les boules et le shop** : boules.json, shop.json, Galets — conserves
- **Le Quick Play** : partie rapide accessible depuis le menu — conserve
- **La resolution** : 832x480, pixel art, palette provencale — conserve
- **La stack** : Phaser 4, Vite, Vitest, pas de TypeScript — conserve

---

## 4. L'AME DU JEU

### 4.1 Pourquoi la petanque ?

La petanque n'est pas un sport comme les autres. C'est un **rituel social** :
- **Le silence avant le lancer** : micro-meditation collective, tension unique
- **Le jugement a l'oeil** : debat, mauvaise foi joyeuse, generateur de conversation
- **La cohabitation du precis et du nonchalant** : excellence en tongs
- **Le tir qui change tout** : le chaos est toujours a un lancer
- **Le terrain parle** : le sol est un troisieme joueur
- **L'intergenerationnel** : l'experience bat la jeunesse

### 4.2 L'heritage Pagnol

Les personnages s'inspirent des archetypes de Marcel Pagnol (trilogie marseillaise) :
- **Le Patriarche (Cesar)** : domine par la psychologie, gagne par la lecture des gens
- **Le Regulier (Escartefigue)** : toujours la, jamais brillant, pilier du village
- **La Matriarche (Honorine/Fanny)** : voit a travers la comedie, tient le village debout
- **Le Reveur (Marius)** : tente par ailleurs, mais revient toujours
- **Le Marchand (Panisse)** : sponsorise, organise, joue correctement

Le ton est **Pagnol en pixels** : humour provencal, mauvaise foi, drame pour des enjeux derisoires, tendresse sous la rudesse.

### 4.3 L'histoire vraie de la petanque

Le jeu honore l'histoire reelle :
- **Jules Lenoir (La Ciotat, 1907)** : souffrant de rhumatismes, ne pouvait plus courir pour le jeu provencal. On l'a laisse jouer "pieds tanques" (pieds ancres). La petanque est nee d'un acte de compassion.
- **La tradition Fanny** : perdre 13-0 = humiliation comique publique
- **La Marseillaise a Petanque** : 15 000 joueurs, le plus grand tournoi du monde
- **Les legendes** : Quintais, Suchaud, Foyot, Fazzino — les noms du roster

### 4.4 Ce que le joueur ressent

- **Appartenance** : c'est MON village, MES coequipiers, MA place
- **Fierte** : mon village est beau, mon equipe est forte, ma reputation grandit
- **Tension** : le silence avant le lancer crucial, le doute sur qui est devant
- **Mauvaise foi joyeuse** : les PNJ commentent, exagerent, font du drame
- **Nostalgie** : l'ete, les platanes, les cigales, le pastis — un art de vivre

---

## 5. STRUCTURE DU JEU

### 5.1 Le menu principal (Option B)

```
TITRE
├── Le Village (mode principal narratif)
│   ├── La Place (overworld 1 ecran)
│   ├── Concours du Village
│   ├── Defis Inter-Villages
│   └── Les Pieds Tanques (tournoi national)
├── Partie Rapide (QuickPlay existant)
├── Multi 1v1 (Supabase Realtime)
└── Options / Stats
```

Le Village est le mode principal mais le Quick Play reste accessible pour ceux qui veulent juste lancer une partie.

### 5.2 Le Village — un ecran, une place

La Place du Village tient sur **un seul ecran** (832x480 = 26x15 tiles de 32x32). Pas de scrolling. Camera fixe.

**Elements de la place :**
- Le boulodrome (entree vers les matchs)
- Le bar (hub social, dialogues, recrutement)
- La boutique (shop existant — boules, items, cosmetiques)
- Le banc sous les platanes (mentors, histoire)
- Les PNJ qui vivent sur la place
- Les sorties (carte des tournois, villages voisins)

**Navigation :** WASD (deja implemente dans Player.js). Approcher un PNJ + Espace = dialogue.

**Systemes existants reutilises :**
- OverworldScene (existe, reservee Phase D → activee maintenant)
- MapManager (gere tilemaps, collisions)
- NPCManager (spawn, positionnement, requetes)
- Player entity (mouvement 32x32, 4 directions)
- NPC entity (dialogue, types, ligne de vue)
- DialogBox (dialogue avec speaker name)

### 5.3 Premiere partie — "Les Premiers de la Place"

Au lancement d'une nouvelle partie, apres le tutoriel :
- Le joueur nomme son village
- Il choisit son blason (couleurs + symbole parmi une selection provencale)
- Il choisit la surface de son boulodrome (terre/gravier/sable → affecte la physique)
- Il choisit **2 habitants** parmi 4-5 proposes

Ce choix est **non-cosmetique** : les 2 habitants deviennent tes premiers coequipiers pour la triplette. Leur personnalite affecte les dialogues, l'ambiance du village, et la dynamique d'equipe.

### 5.4 Les personnages — habitants, pas adversaires

Les 12 personnages du roster deviennent des **habitants de villages** :

| Personnage | Role dans le village | Ce qu'il apporte |
|---|---|---|
| **Foyot** | Patron du bar, veteran sage | Mentoring, techniques avancees, dialogues |
| **Mamie Josette** | Doyenne du village | Histoire de la petanque, sagesse, moral |
| **Papi Rene** | Retraite sur le banc | Anecdotes, stabilite, regulier |
| **La Choupe** | Le costaud | Sparring intense, defi, puissance |
| **Rocher** | Le serieux | Competition, rigueur |
| **Sofia** | Tient la boutique | Shop, elegance, technique |
| **Rizzi** | Le flambeur | Risque, imprevus, fun |
| **Suchaud** | Le champion | Objectif a atteindre, respect |
| **Fazzino** | Le stratege | Courbes, reflexion, profondeur |
| **Ley** | La legende | Boss final, aspiration |
| **Robineau** | Le travailleur | Fiabilite, sans surprise |
| **Rookie** | Le joueur | TOI |

Les PNJ ne sont pas tous disponibles au debut. Ils arrivent au village progressivement (apres X victoires, apres un tournoi gagne, etc.).

### 5.5 Les affinites (systeme Fire Emblem) — A CREUSER

Quand deux personnages jouent souvent ensemble, leur **synergie** augmente :
- Dialogues de soutien pendant les menes
- Leger bonus de sang-froid sous pression
- Combos narratifs (un coequipier stabilise l'autre ou le decomplexe)

Incompatibilites aussi : deux fortes personnalites = tension, risque de tilt.

**Questions ouvertes :**
- Combien de niveaux d'affinite ? (3 comme FE : C/B/A ?)
- L'affinite est-elle purement narrative ou a-t-elle un impact mecanique ?
- Comment representer visuellement l'affinite dans le village ?

---

## 6. LA COMPETITION

### 6.1 Pyramide competitive

```
LES PIEDS TANQUES (tournoi national fictif)
         ▲
    Regional (top villages)
         ▲
    Departemental (qualifications)
         ▲
    Defis Inter-Villages (village vs village)
         ▲
    Concours du Village (local)
```

### 6.2 Concours du Village (solo)

- Matchs contre les PNJ du village
- Formats : tete-a-tete et doublette
- Enjeux narratifs : la tournee, le droit de choisir le terrain, la fierte
- Accessible des le debut, rejouable

### 6.3 Defis Inter-Villages (solo puis multi)

- Format **triplette** : toi + 2 coequipiers (PNJ en solo, humains en multi)
- Chaque village adverse a une identite (village de pecheurs = pointeurs, vignerons = tireurs, montagnards = lisent le terrain)
- Victoire = reputation du village augmente
- Defaite = PNJ depimes, Fernand boude

**Questions ouvertes :**
- Combien de villages adverses PNJ ? (5 ? 8 ? 10 ?)
- Chaque village a-t-il un terrain specifique ?
- Les villages adverses ont-ils des PNJ nommes avec des personnalites ?

### 6.4 Les Pieds Tanques (tournoi national)

Nom du tournoi fictif — hommage a l'etymologie de "petanque" (pieds tanques = pieds ancres, Jules Lenoir 1907).

- En solo : montee de la pyramide avec sa triplette PNJ
- En multi (futur) : qualification des meilleurs villages du classement
- Ambiance : on quitte le village, on arrive a Marseille (en pixels), foule, pression

**Questions ouvertes :**
- Le tournoi est-il une fin de partie ou un evenement saisonnier rejouable ?
- Combien de matchs dans le tournoi ? (4 ? 6 ? 8 ?)
- Y a-t-il un adversaire final iconique (Ley ?) ou un village rival ?

### 6.5 Le choix pointer/tirer comme revelateur — A CREUSER

Le jeu observe comment tu joues et en tire un **profil** :
- Ratio pointer/tirer → identite de joueur
- Carreaux reussis → respect des tireurs
- Points sous pression → sang-froid
- Fanny infligees/subies → legende locale

Ce profil se manifeste en jeu :
- Le narrateur commente ton style
- Les PNJ te traitent differemment
- Les adversaires s'adaptent a ta reputation

**Questions ouvertes :**
- Comment afficher le profil ? (page dediee ? texte du narrateur ? les deux ?)
- Le profil influence-t-il le gameplay ou est-ce purement narratif ?
- Peut-on choisir de "se reinventer" ou le profil est-il definitif ?

---

## 7. LE NARRATEUR PAGNOLIEN — A CREUSER

Une voix off textuelle, comme Pagnol narrant ses souvenirs d'enfance. Douce, nostalgique, parfois drole, jamais cynique.

**Quand intervient-il ?**
- Entre les parties (bilan de la journee)
- Apres un moment marquant (carreau spectaculaire, remontee impossible, Fanny)
- Quand un nouveau PNJ arrive au village
- Quand le village evolue

**Exemples de ton :**
- "Aujourd'hui, le Rookie a pointe 7 fois et tire 3 fois. On dit au village qu'il joue comme son grand-pere — avec la tete, pas avec le bras."
- "Mamie Josette a souri. C'est rare. Ca veut dire que le lancer etait bon — ou que le pastis etait fort."
- "Le village grandit. Ce n'est plus la meme place qu'en juin. Il y a des bancs, des gens, du bruit. C'est bien."

**Questions ouvertes :**
- Le narrateur a-t-il un nom ? (ou est-il anonyme, comme dans Pagnol ?)
- Combien de textes faut-il ecrire ? (estimation : 100-200 lignes contextuelles)
- Le narrateur est-il present en multi ? (probablement pas, mais a decider)

---

## 8. LE VILLAGE PERSONNALISABLE

### 8.1 Customisation du village

| Element | Quand | Impact |
|---|---|---|
| Nom du village | Creation | Affiche sur le panneau d'entree, visible en multi |
| Blason (couleurs + symbole) | Creation | Identite visuelle, visible en multi |
| Surface du boulodrome | Creation | **Affecte la physique** des matchs a domicile |
| Decorations de la place | Progression | Bancs, parasols, platanes, fontaine — Galets |
| Ameliorations du bar | Progression | Tables, terrasse, menu — affecte le moral PNJ |
| Ameliorations du boulodrome | Progression | Eclairage, tribunes, bordures — affecte le nombre de spectateurs |

### 8.2 Evolution visuelle — A CREUSER

Le village change visuellement selon la progression :

| Stade | Terrain | Bar | Spectateurs |
|---|---|---|---|
| Debutant | Terre battue, pas de bordure | 2 tables, parasol casse | 1-2 curieux |
| Confirme | Gravier dame, cercle trace | Terrasse, 5 tables | 8-10 reguliers |
| Veteran | Boulodrome propre, bancs | Bar complet, fanions | 20+ passionnes |
| Legende | Boulodrome mythique, eclairage soir | Institution locale, photos au mur | Foule |

**Questions ouvertes :**
- Combien de niveaux d'evolution ? (4 comme ci-dessus, ou plus progressif ?)
- Chaque amelioration est-elle individuelle (acheter un banc) ou par palier (tout change d'un coup) ?
- Le joueur choisit-il le placement des decorations ou c'est automatique ?

---

## 9. LE MULTIJOUEUR

### 9.1 Priorite : 1v1 ami

- Tech : **Supabase Realtime** (gratuit, zero serveur, ~50 lignes client)
- Systeme de code de salle (BOULE-XXXX)
- Tour par tour : Joueur A lance → resultat synchronise → Joueur B lance
- Le match se joue sur le terrain de l'un des deux (choix ou tirage)
- Les PNJ de ton village commentent le match en fond

### 9.2 Futur : Village vs Village

- 3 joueurs reels forment une triplette (ou 2 humains + 1 PNJ, ou 1 humain + 2 PNJ)
- Classement des villages
- Rivalites entre villages de joueurs
- Les Pieds Tanques comme evenement saisonnier

### 9.3 Questions ouvertes multi

- Le multi 1v1 est-il en tete-a-tete (3 boules) ou aussi en doublette ?
- Peut-on jouer avec un PNJ de son village en doublette multi ?
- Comment gerer la deconnexion ? (timeout 30s → perte du tour ?)
- Anti-triche : necessaire pour le 1v1 ami ? (probablement pas)
- Migration vers Colyseus si besoin d'un serveur autoritaire ?

---

## 10. ASSETS — CE QUI EXISTE DEJA

### 10.1 Sprites v2_new (PixelLab, 124x124, 8 rotations)

12 personnages complets :
- rookie, foyot, mamie_josette, papi_rene, la_choupe, rocher, sofia, rizzi, suchaud, fazzino, ley, robineau

Chaque personnage a :
- 8 rotations (N, NE, E, SE, S, SW, W, NW) — prets pour overworld
- 1 animation d'expression/greeting (GIF anime, face sud)
- 1 animation de lancer (GIF anime, vue de dos)

### 10.2 Autres assets prets

- 9 boules de selection (bronze, chrome, rouge variantes, noire)
- 12 items de shop (pastis, beret, coffret, medaillon, metre pliant, cochonnet, etc.)
- 16 trophees dores avec noms graves
- UI : parchemin/scroll, boutons bois, cadenas, icones de stats
- Test de tiling terrain terre battue

### 10.3 Asset manquant principal

**Le tileset du village** : sol de place (paves/terre), facades (bar, boutique, maisons), platanes, fontaine, bancs, bordures. A generer via PixelLab (1 session).

---

## 11. FEUILLE DE ROUTE

### Phase A — Le Village Solo (priorite immediate)

| # | Tache | Dependance |
|---|---|---|
| A1 | Tileset village provencal (joueur via PixelLab) | — |
| A2 | Activer OverworldScene, tilemap 26x15, camera fixe | A1 |
| A3 | Player avec sprites Rookie 8 rotations dans le village | A2 |
| A4 | 4-5 PNJ places sur la place avec dialogues | A2 |
| A5 | Flow : Place → Boulodrome → PetanqueScene → Resultat → retour Place | A3, A4 |
| A6 | Ecran "Premiers habitants" (choix 2 parmi 4-5) | A4 |
| A7 | Nom du village + blason + surface terrain | A2 |
| A8 | Narrateur pagnolien (textes entre les parties) | A5 |
| A9 | Profil joueur (ratio pointer/tirer) | A5 |
| A10 | Concours du village (mini-tournoi, trophee) | A5 |

### Phase B — Multi 1v1

| # | Tache | Dependance |
|---|---|---|
| B1 | Supabase Realtime : creer/rejoindre une partie (code salle) | — |
| B2 | Synchronisation des lancers (power, angle, spin) | B1 |
| B3 | UI : attente, tour de l'adversaire, resultat compare | B2 |
| B4 | PNJ spectateurs qui commentent le match multi | B3, A4 |

### Phase C — Profondeur Village

| # | Tache | Dependance |
|---|---|---|
| C1 | Evolution visuelle du village (4 stades) | A2 |
| C2 | Decorations achetables avec Galets | C1 |
| C3 | Nouveaux PNJ qui arrivent progressivement | A4 |
| C4 | Affinites entre coequipiers | A6 |
| C5 | Villages adverses PNJ (identites, terrains) | A10 |
| C6 | Defis inter-villages solo (triplette toi + 2 PNJ) | C5 |

### Phase D — Les Pieds Tanques + Multi Village

| # | Tache | Dependance |
|---|---|---|
| D1 | Pyramide solo : village → departement → regional → national | C6 |
| D2 | Village vs Village multi (triplette 3 joueurs) | B4, C6 |
| D3 | Classement des villages | D2 |
| D4 | Les Pieds Tanques : evenement saisonnier | D3 |

---

## 12. QUESTIONS OUVERTES — RECAPITULATIF

### Design (a trancher avant de coder)

1. **Noms des personnages** : Les noms (Foyot, Suchaud, Fazzino...) referencent de vrais joueurs. Hommage libre OK ou risque juridique ? Faut-il des pseudonymes proches ?
2. **Chai et La Loutre** : Ces 2 personnages du roster V1 ont-ils leur place dans le village V2 ? Ou sont-ils remplaces ?
3. **Le narrateur** : Anonyme ou nomme ? Quel volume de textes (100 ? 200 ? 500 lignes) ?
4. **Les affinites** : Impact mecanique (bonus stats) ou purement narratif (dialogues) ?
5. **Les villages adverses** : Combien ? Quel niveau de detail pour leurs PNJ ?
6. **La Fanny** : Comment implementer la tradition du 13-0 ? (Animation speciale ? Humiliation comique ? Statue au village ?)
7. **Le profil joueur** : Purement narratif ou influence-t-il le gameplay ?
8. **L'histoire de Jules Lenoir** : Prologue jouable ou reference culturelle dans les dialogues ?

### Technique (a valider)

9. **Sprites 124x124 en overworld** : Downscale a 32x32 ou 48x48 ? Lisibilite a tester
10. **Tilemap** : Generee par PixelLab puis placement manuel ? Ou editeur Tiled ?
11. **Supabase** : Compte a creer, projet a configurer. Gratuit confirme pour le scope
12. **Animations GIF** : Comment integrer les GIF d'expression/lancer dans Phaser 4 ? (Extraction frames → spritesheet)
13. **Sauvegarde village** : Schema SaveManager a etendre (nom, blason, surface, habitants choisis, reputation, decorations)
14. **Formats de match** : Le village utilise-t-il tete-a-tete, doublette, ET triplette ? Ou seulement triplette pour les inter-villages ?

### Scope (a decider)

15. **Quick Play V1** : Reste tel quel ou evolue pour integrer les PNJ du village ?
16. **Arcade V1** : Supprimee, conservee a cote, ou transformee en "concours du village" ?
17. **Transition V1 → V2** : Migration progressive (village ajoute a cote) ou refonte (village remplace l'arcade) ?

---

## 13. REFERENCES CULTURELLES

### Petanque
- **Jules Lenoir** (La Ciotat, 1907) — invention de la petanque par compassion
- **La Marseillaise a Petanque** (depuis 1961) — 15 000 joueurs, Parc Borely
- **La FIPJP** (1958) — federation internationale
- **Philippe Quintais** — 14 titres mondiaux, le GOAT
- **La tradition Fanny** — 13-0, baiser les fesses de la statuette

### Pagnol
- **Trilogie marseillaise** (Marius/Fanny/Cesar) — archetypes sociaux
- **La Gloire de mon pere** — nostalgie provencale, rituel de village
- **Fanny (1932)** — scene ou les joueurs de boules arretent un tramway

### Jeux (inspirations design)
- **Stardew Valley** — village comme ancrage emotionnel, relations PNJ
- **Fire Emblem** — affinites, choix de coequipiers, impact sur le gameplay
- **Pyre (Supergiant)** — competition comme moteur narratif
- **Moonlighter** — village qui evolue avec la progression
- **Dark Cloud 2 (Georama)** — construction de village avec contraintes significatives

### Ton et ecriture
- **Pagnol** — mauvaise foi joyeuse, drame pour enjeux derisoires, tendresse
- **Jean Giono** — Provence mythique, rapport au terroir
- **Fernandel** — humour provencal, expressivite

---

*Ce document est la nouvelle bible de direction. GAME_DESIGN.md sera mis a jour pour refleter cette vision.*
*Les constantes, stats, et donnees JSON restent dans leurs fichiers sources de verite respectifs.*
