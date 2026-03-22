# PETANQUE MASTER — Bible Narrative & Progression

> **Date** : 22 mars 2026 | **Version** : 3 (definitive)
> **Recherche** : `research/55_tournament_culture_narrative_design.md`
> **Pas d'overworld.** Tout se raconte via cutscenes, carte de progression, et matchs.

---

## 1. L'EXPERIENCE COMPLETE — VUE D'ENSEMBLE

Le joueur vit l'ascension du Rookie, de l'inconnu au village jusqu'au
champion du Grand Carreau d'Or. Trois phases, trois formats, trois
transformations. Chaque phase change la facon de jouer ET ce que
le Rookie comprend de la petanque.

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   PHASE 1 — LE DEFI          Solo (tete-a-tete, 3 boules)   ║
║   "Fais ta place."           5 matchs + rival                ║
║   Theme : prouver qu'on      Le Rookie arrive, inconnu.      ║
║   existe                     Il bat les reguliers un par un. ║
║                              Il rencontre Le Fennec.         ║
║                                                              ║
║   ──── Le Papet : "La vraie petanque, c'est a deux." ─────  ║
║                                                              ║
║   PHASE 2 — L'EQUIPE         Doublette (2v2, 3 boules/j.)   ║
║   "Apprends a faire          5 matchs en duo                 ║
║   confiance."                Recrute un partenaire.          ║
║   Theme : la confiance       Decouvre le jeu d'equipe.       ║
║                              Crise + reconciliation.         ║
║                                                              ║
║   ──── Foyot : "Le Grand Carreau d'Or. En triplette." ────  ║
║                                                              ║
║   PHASE 3 — LE GRAND         Triplette (3v3, 2 boules/j.)   ║
║   CARREAU D'OR               5 matchs + demi + finale        ║
║   "Ecris ta legende."        Le grand tournoi regional.      ║
║   Theme : l'heritage         Fennec → allie. Boss = Ley.     ║
║                              Le Rookie devient champion.     ║
║                                                              ║
║   ──── POST-GAME ─────────────────────────────────────────   ║
║   Circuit des Legendes, defis, teaser Aventure               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Duree totale estimee** : 4-6 heures (premiere run)
**Rejouabilite** : 12 persos x 12 endings, defis, Circuit des Legendes

---

## 2. LE ROOKIE — PERSONNALISATION COMPLETE

Le Rookie est un personnage que le joueur **fait sien**. Pas juste
visuellement — son equipement raconte son histoire.

### 2.1 Trois couches de customisation

```
┌─────────────────────────────────────────────────┐
│ COUCHE 1 — LES STATS (progression RPG)          │
│ Le Rookie gagne des points a chaque victoire.   │
│ Il les repartit dans Precision/Puissance/        │
│ Effet/Sang-froid. Total max : 40 pts.           │
│ C'est le joueur qui decide QUI le Rookie        │
│ devient : tireur, pointeur, milieu.             │
│                                                  │
│ Seuils d'ability :                               │
│   18 pts → L'Instinct (slow-mo 2s)              │
│   24 pts → Determination (resilience)            │
│   32 pts → Le Naturel (tir quasi-parfait)        │
│                                                  │
│ CHANGEMENT VISUEL du sprite aux seuils :         │
│   18 pts → Rookie serre le poing (confiance)     │
│   24 pts → Nouveau bandeau / accessoire          │
│   32 pts → Aura subtile / pose differente        │
│   40 pts → Sprite "Legende" (complet)            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ COUCHE 2 — LES BOULES (equipement actif)        │
│                                                  │
│  A. Boules de boutique (Galets)                  │
│     Acier, Bronze, Chrome, Noire, Rouge, etc.    │
│     → Variete, trade-offs, style                 │
│     → Le "bling-bling" est ici : Doree, Titane   │
│                                                  │
│  B. Boules d'heritage (histoire)                 │
│     Les boules d'Auguste. 3 sets dans le coffret.│
│     Chacun a un gameplay UNIQUE que l'argent     │
│     ne peut pas acheter.                         │
│     → Voir section 2.2                           │
│                                                  │
│  C. Boules de maitre (recompenses)               │
│     Gagnes en battant des adversaires cles.      │
│     Effets speciaux lies au terrain/style.       │
│     → Voir section 2.3                           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ COUCHE 3 — LES KEEPSAKES (objets passifs)       │
│                                                  │
│ Un slot "keepsake" = un objet equipe qui donne   │
│ un bonus passif. Chaque keepsake vient d'un      │
│ personnage de l'histoire. On en equipe UN seul.  │
│                                                  │
│ C'est le systeme "Keepsake" de Hades :           │
│ chaque objet = un lien avec quelqu'un.           │
│ L'inventaire du Rookie raconte ses rencontres.   │
│ → Voir section 2.4                               │
└─────────────────────────────────────────────────┘
```

### 2.2 Les Boules d'Auguste (heritage — 3 sets)

Trouvees dans le coffret au tout debut. Le Papet les reconnait :
"Les boules d'Auguste... Bon sang. Y'en a trois jeux. Chacun
pour un style different. C'etait un joueur complet, ton grand-pere."

| Set | Nom | Style | Stats | Ability unique |
|-----|-----|-------|-------|---------------|
| 1 | **Le Pointeur d'Auguste** | Placement | Pre 5, Pui 2, Masse 680 | **Heritage** : 1x par match, la prochaine boule se place exactement ou le joueur vise (zero dispersion). "Le geste parfait." |
| 2 | **Le Tireur d'Auguste** | Tir | Pre 3, Pui 5, Masse 820 | **Carreau Fantome** : 1x par match, tir auto-guide vers la boule adverse la plus proche du cochonnet. "Le carreau qui a rendu Auguste legendaire." |
| 3 | **Le Milieu d'Auguste** | Polyvalent | Pre 4, Pui 3, Masse 720 | **Adaptation** : 1x par match, la boule s'adapte au terrain (annule les effets de pente/friction pendant 1 lancer). "Auguste lisait le terrain comme personne." |

**Regle fondamentale** : ces boules sont plus fortes AVEC le Rookie qu'avec
n'importe quel autre personnage. Les autres persos peuvent les equiper mais
n'ont pas acces a l'ability Heritage. C'est le sang qui parle.

**Evolution** : les boules d'Auguste **gagnent en puissance** au fil de l'histoire :
- Phase 1 terminee → ability utilisable 1x par match
- Phase 2 terminee → ability 2x par match
- Phase 3 terminee → ability 2x + les boules brillent visuellement (aura doree subtile)

### 2.3 Boules de Maitre (recompenses de victoire)

Chaque adversaire battu peut offrir ses boules au Rookie (a debloquer
via un defi specifique, pas automatique).

| Adversaire | Boules | Defi pour obtenir | Effet special |
|-----------|--------|-------------------|---------------|
| La Choupe | **Boules Canon** | Battre La Choupe sans qu'il score 1 carreau | Knockback +30% (les boules adverses volent plus loin) |
| Mamie Josette | **Boules Zen** | Battre Josette sans utiliser d'ability | Aucun wobble pendant les 2 premieres menes |
| Sofia | **Boules Stratege** | Battre Sofia avec 3+ carreaux | Affiche la trajectoire prevue 1s avant le lancer |
| Rizzi | **Boules Eleganza** | Battre Rizzi sur la colline sans boule hors terrain | Effet lateral double (courbes amplifiees) |
| Le Fennec | **Boules Fennec** | Battre Le Fennec 13-0 (Fanny) | Boost de pression : l'adversaire wobble 20% de plus |
| Suchaud | **Boules Champion** | Battre Suchaud sans perdre de mene | Pre +1 permanent quand equipees |
| Fazzino | **Boules du Siecle** | Battre Fazzino en difficulte Expert | Distance exacte au cochonnet toujours visible |
| Ley | **Boules du Carreau Vivant** | Battre Ley (boss) | Carreaux 50% plus puissants en ejection |

### 2.4 Les Keepsakes (objets passifs)

Un slot keepsake = un objet qu'on equipe. Bonus passif + souvenir.

| Keepsake | Qui le donne | Quand | Bonus passif |
|----------|-------------|-------|-------------|
| **Beret du Papet** | Le Papet | Debut du jeu | -10% wobble. "Il sent le pastis et la lavande." |
| **Bandana de La Choupe** | La Choupe | Apres Phase 1 | +5% puissance. "Rouge, comme sa tete quand il perd." |
| **Lunettes de Josette** | Mamie Josette | Apres match 2 | Sang-froid +1 en situation de pression. "Elles voient tout." |
| **Carnet de Sofia** | Sofia | Apres match 3 | Affiche la distance au cochonnet. "Page 1 : toi." |
| **Mouchoir de Rizzi** | Rizzi | Apres match 4 | +5% effet. "Brode 'Eleganza' en or." |
| **Lunettes du Fennec** | Le Fennec | Apres Phase 3 | -15% wobble adverse. "Il te les donne sans un mot." |
| **Medaille de Foyot** | Foyot | Apres Phase 2 | +5% toutes stats le 1er tour. "En or, bien sur." |
| **Sifflet de Robineau** | Robineau | Apres match 6 | 1er tir de chaque mene: precision +10%. "Sec." |
| **Montre de Suchaud** | Suchaud | Demi-finale battue | Precision +1 permanent. "14 titres dans ce boitier." |
| **Regle de Fazzino** | Fazzino | Finale battue | Trajectoire visible 0.5s. "Tout est calcul." |
| **Pierre de Ley** | Ley | Boss battu | Carreau damage +20%. "Un caillou de la plage. C'est tout." |

**Regle de design** : aucun keepsake n'est achetable. Ils viennent TOUS
d'un personnage, d'un moment, d'une relation. L'inventaire du Rookie
est un album photo de ses rencontres.

### 2.5 Boutique (Galets — le bling-bling)

La boutique vend du STYLE, pas du POUVOIR.

| Categorie | Exemples | Prix |
|-----------|---------|------|
| **Skins de boules** | Doree, Titane, Retro, Noire, Cuivre | 150-800 Galets |
| **Cochonnets** | Bleu, Vert, Rouge, Jungle, Multicolor | 50-400 Galets |
| **Accessoires Rookie** | Casquette, bandana, lunettes, chaine | 200-500 Galets |
| **Emotes** | Celebration, provocation, salut | 100-300 Galets |
| **Charges ability** | +1 Focus, +1 charge unique | 300-500 Galets |

**Regle d'or** : aucun item de boutique ne surpasse un item d'heritage
ou un keepsake. La Boule Titane a 800G donne +3% pre/pui.
Les Boules d'Auguste donnent un tir parfait. L'histoire > l'argent.

---

## 3. PHASE 1 — LE DEFI (Solo, 5 matchs)

### 3.0 PROLOGUE — Le Coffret

```
[Ecran noir]

La Ciotat. Berceau de la petanque.

[Interieur maison — pixel art simple, lumiere douce]

Le Rookie range des cartons dans le grenier de sa mere.
Un coffret en bois, poussiereux, coince derriere une malle.
Trois compartiments. Trois jeux de boules.
Gravees au dos : "A."

  Rookie : "C'est quoi, ca ?"
  Mere (depuis en bas) : "Quoi ? ... Touche pas a ca."
  Rookie : "Y'a des initiales. 'A.' C'est a qui ?"
  Mere : "..."
  Mere : "A personne. Range-les."

[Le Rookie descend avec le coffret. Sort de la maison.]
[Exterieur — le boulodrome du village, fin d'apres-midi]

Un vieil homme sur un banc. Beret, moustache, pastis.
Le Papet.

  Papet : "Qu'est-ce que tu trimballes, petit ?"
  [Il voit les boules. Silence.]
  Papet : "... Sacre nom d'une boule."
  Papet : "Ou t'as trouve ca ?"
  Rookie : "Dans le grenier. C'etait a mon grand-pere,
            apparemment."
  Papet : "Ton grand-pere... Auguste.
           Le meilleur joueur que ce boulodrome
           ait jamais connu."
  Rookie : "Ma mere veut pas en parler."
  Papet : "Normal. Il est parti y'a 30 ans.
           Sans explication. Du jour au lendemain."
  Papet : "Mais ces boules... c'est pas rien, ca.
           C'est un heritage, fiston."

  [Le Papet ouvre le coffret. 3 jeux de boules.]

  Papet : "Trois styles. Le pointe, le tir, le milieu.
           Auguste etait complet. Le seul que j'aie
           jamais vu maitriser les trois."
  Papet : "Choisis-en un. C'est ton heritage."

  → LE JOUEUR CHOISIT SON SET DE BOULES D'AUGUSTE
  → Le Papet donne son BERET au Rookie (premier keepsake)

  Papet : "Et maintenant... montre-moi ce que t'as
           dans le sang."
```

### 3.1 Les 5 matchs

**MATCH 1 — Place du Village — PAPI RENE**
- Terrain : Terre battue (friction 1.0)
- Difficulte : ★☆☆☆☆
- Pre-match :
  "Alors c'est toi le petit-fils d'Auguste ?
   Fais voir ces mains... Pas de cal ?
   C'est pas grave. Viens jouer, fiston."
- Post-match :
  "T'as les mains d'un joueur. Ca, ca s'apprend pas.
   Tiens, prends ca."
- **Recompense** : Badge Terre + keepsake possibilite (si defi)
- **Allusion heritage** : "Y'avait un joueur, dans le temps...
  Il tirait exactement comme ca. Bizarre."

**MATCH 2 — Parc Municipal — MAMIE JOSETTE**
- Terrain : Herbe + gravier (friction mixte)
- Difficulte : ★★☆☆☆
- Pre-match :
  "Le petit-fils d'Auguste ! Oh la la !
   Ton grand-pere me battait jamais, tu sais.
   Enfin... PRESQUE jamais. Un pastis ?"
- Post-match :
  "Tu m'as eue, filou ! Comme ton grand-pere,
   tiens. Sauf que lui, il offrait le pastis apres."
- **Recompense** : Badge Herbe + Lunettes de Josette (keepsake)
- **Allusion heritage** : Josette CONNAISSAIT Auguste. Elle lache
  des indices sans s'en rendre compte.

**MATCH 3 — Les Docks — SOFIA**
- Terrain : Dalles beton (friction 0.7)
- Difficulte : ★★★☆☆
- Pre-match :
  "Deux victoires contre des retraites, c'est pas
   une carriere. Les dalles, c'est une autre affaire.
   Ici, tout glisse. Meme la confiance."
- Post-match :
  "Tu ne calcules pas. Tu... sens. C'est rare.
   J'ai analyse 200 joueurs. Aucun comme toi.
   Tiens. Note tout dedans."
- **Recompense** : Badge Dalles + Carnet de Sofia (keepsake)
- **Moment narratif** : Sofia est la premiere a traiter le Rookie
  comme un joueur serieux, pas "le petit-fils de".

**──── LE FENNEC APPARAIT ────**

```
[Apres la victoire contre Sofia]
[Le boulodrome, soir]

Un jeune homme blond s'appuie contre un platane.
Lunettes de soleil, baskets blanches, air suffisant.

  Fennec : "Trois victoires. Wow."
  [Lent applaudissement ironique]
  Fennec : "T'as battu Papi Rene — il a 82 ans.
            Mamie Josette — elle a 72 ans.
            Et Sofia — elle pointe, elle tire pas."
  Fennec : "Tu veux un vrai match ?
            Viens sur la plage.
            Moi c'est Bastien. Le Fennec."
  Rookie : "Pourquoi Le Fennec ?"
  Fennec : "Parce que dans le desert, c'est moi le
            predateur. Et le sable, c'est MON terrain."
  Fennec : "Mais d'abord... faut passer Rizzi.
            Bonne chance sur la colline."
  [Il part. Sourire.]
```

**MATCH 4 — Colline aux Oliviers — RIZZI**
- Terrain : Terre battue + pente
- Difficulte : ★★★☆☆
- Pre-match :
  "Bienvenue sur la colline, amico.
   Ici, les boules ne roulent pas droit.
   Il faut danser avec le terrain."
- Post-match :
  "Bellissimo ! Tu ne danses pas encore,
   mais tu ne tombes plus. Rispetto.
   Tiens — un mouchoir de champion."
- **Recompense** : Badge Devers + Mouchoir de Rizzi (keepsake)

**MATCH 5 — Plage de La Ciotat — LE FENNEC (RIVAL)**
- Terrain : Sable (friction 3.0)
- Difficulte : ★★★★☆
- Pre-match :
  "T'es venu. Bien.
   Tu sais qui etait le dernier champion de ce
   boulodrome ? Mon grand-pere.
   La petanque, ca se transmet. Comme le sang."
  Rookie : "Ou comme les boules d'un coffret."
  Fennec : "... Quoi ?"
  "Joue."
- Post-match (victoire) :
  "... Sur le sable. MON sable.
   T'as gagne. OK.
   [Silence]
   T'es pas juste un touriste."
  Il enleve ses lunettes de soleil. Les tend au Rookie.
  "Tiens. Porte-les. Ca t'ira mieux qu'a moi."
  → Lunettes du Fennec (keepsake, -15% wobble adverse)

  MAIS : Le Fennec ne disparait pas. Il sera la en Phase 2 et 3.
- Post-match (defaite) :
  "Hereditaire. Reviens quand tu seras pret."
  [Possibilite de retenter]

### 3.2 Transition vers Phase 2

```
[Le boulodrome, lendemain matin]
[Le Papet attend le Rookie sur le banc]

  Papet : "Cinq victoires. Pas mal, fiston."
  Rookie : "Merci, Papet."
  Papet : "Remercie pas. C'est que le debut.
           Tu sais ce qu'Auguste disait toujours ?"
  Rookie : "Non."
  Papet : "La petanque, c'est pas un sport
           de solitaire. C'est un sport d'equipe.
           Un bon joueur gagne des matchs.
           Une bonne equipe gagne des tournois."
  Rookie : "Vous voulez que je joue en doublette ?"
  Papet : "Le circuit des doublettes commence la
           semaine prochaine. Mais il te faut
           un partenaire."

[La Choupe debarque en courant]
  Choupe : "MOI ! MOI ! JE VEUX !
            J'ai vu tes matchs ! T'es malin !
            Moi j'suis fort ! Ensemble on serait
            IMBATTABLES !"
  Papet : [soupir] "C'est pas faux."

  Mamie Josette s'approche :
  "Mon petit, si tu veux quelqu'un de calme,
   je suis la. La Choupe va te donner des ulceres."

  Sofia, depuis l'ombre :
  "Si tu veux gagner... prends-moi.
   Les sentiments, c'est pour apres le match."

  → LE JOUEUR CHOISIT SON PARTENAIRE DE DOUBLETTE
    (parmi les personnages battus en Phase 1)
```

---

## 4. PHASE 2 — L'EQUIPE (Doublette 2v2, 5 matchs)

### 4.0 Le jeu en doublette — comment ca marche

- **2 joueurs par equipe**, 3 boules chacun = 6 boules/equipe
- Le joueur controle le Rookie. Le partenaire est **IA**.
- L'IA du partenaire joue selon son archetype :
  - La Choupe → tire presque toujours (shootProbability 0.60)
  - Sofia → pointe presque toujours (shootProbability 0.15)
  - Mamie Josette → pointe calmement (shootProbability 0.08)
  - etc.
- Le partenaire a des **barks specifiques** en doublette :
  - "Belle pointe ! Je tire la prochaine !" (Choupe)
  - "Bien. Mon tour. Laisse-moi placer." (Sofia)
  - "Oh la la, c'est serre. A toi, petit." (Josette)
- **L'equipe la plus loin rejoue** (regle FIPJP).
  Le jeu decide automatiquement qui joue dans l'equipe.

### 4.1 Les duos adverses

Les adversaires en doublette sont des **duos avec une identite**.
Pas juste "2 PNJ random".

| Duo | Joueur 1 | Joueur 2 | Style | Terrain |
|-----|----------|----------|-------|---------|
| **Les Freres Pastis** | Fernand (vieux pointeur) | Raymond (vieux tireur) | Duo rodé, 40 ans ensemble. Silences complices. | Terre |
| **Les Cigales** | Chloe (mere, pointeur) | Nina (fille, tireur) | Telepathie familiale. Nina est la releve. | Herbe |
| **Les Dockers** | Marco (tireur brutal) | Gino (tireur brutal) | Que du tir. Pas de subtilite. Ca casse. | Dalles |
| **Team Fennec** | Le Fennec (tireur) | ??? (son pote) | Le Fennec a trouve un partenaire. Revanche. | Sable |
| **Robineau + Foyot** | Robineau (tireur froid) | Foyot (showman) | Le duo de cauchemar. Le froid et le chaud. | Colline |

### 4.2 Les 5 matchs

**MATCH 6 — Terre — vs LES FRERES PASTIS**
- Difficulte : ★★★☆☆
- Intro :
  "Fernand et Raymond. 40 ans de doublette.
   Ils ne se parlent plus. Mais ils n'en ont pas besoin.
   Un regard suffit."
- Post-match :
  Raymond : "Pas mal, les jeunes."
  Fernand : "Tais-toi Raymond. ... Mais oui, pas mal."
- **Narratif** : Le Rookie decouvre la doublette. Son partenaire
  le guide. Les barks du partenaire expliquent ce qui se passe.

**MATCH 7 — Herbe — vs LES CIGALES**
- Difficulte : ★★★★☆
- Intro :
  "Chloe et Nina. Mere et fille. Nina a 16 ans.
   Elle tire deja comme une pro.
   'Maman pointe, moi je nettoie.'"
- Post-match :
  Nina : "GG ! T'es fort !"
  Chloe : "Nina, on dit 'bien joue'. ... Mais oui, GG."
- **Narratif** : Le Rookie voit ce que l'equipe peut etre —
  un lien familial, pas juste une strategie.

**──── CRISE D'EQUIPE ────**

```
[Apres le match 7]

Le partenaire et le Rookie s'engueulent.
(Le contenu depend du partenaire choisi)

SI LA CHOUPE :
  Choupe : "T'AS VU ? T'as pointe a 2 metres !
            Comment je tire si t'es pas pres ?!"
  Rookie : "Et toi, tu tires dans le vide !
            Arrete de tout casser !"
  [Silence]
  Choupe : "... J'suis nul en doublette, hein ?"
  Rookie : "Non. On est juste... pas encore une equipe."
  Choupe : "OK. Dis-moi quoi faire. J'ecoute."
  Rookie : "Vraiment ?"
  Choupe : "... Oui. Vraiment."
  → Bonus synergie debloque : La Choupe ecoute mieux
    le placement du Rookie (angleDev -2)

SI SOFIA :
  Sofia : "Tu n'as pas suivi le plan. Page 3, ligne 7."
  Rookie : "Y'a pas de plan ! On improvise !"
  Sofia : "L'improvisation, c'est le chaos."
  Rookie : "Le chaos, c'est la petanque !"
  [Silence]
  Sofia : "... Tu n'as pas tort."
  Sofia : "D'accord. On combine. Mon plan. Ton instinct."
  → Bonus synergie debloque : Sofia s'adapte au jeu du
    Rookie (shootProbability +0.10)

SI MAMIE JOSETTE :
  Josette : "Mon petit... tu forces trop."
  Rookie : "On perd si je force pas !"
  Josette : "On perd si tu te fatigues.
             La petanque, c'est la patience."
  [Elle sort un thermos]
  Josette : "Bois. Du tilleul. Ca calme."
  Rookie : [boit] "... C'est pas mauvais."
  Josette : "Je sais. Maintenant, on rejoue. Doucement."
  → Bonus synergie debloque : sang-froid du Rookie +1
    quand Josette est partenaire
```

**MATCH 8 — Dalles — vs LES DOCKERS**
- Difficulte : ★★★★☆
- Intro :
  "Marco et Gino. Pas de finesse. Que du muscle.
   Si une boule est devant eux, ils la tirent.
   Si rien n'est devant, ils tirent quand meme."
- Post-match :
  Marco : "Woh. Z'etes costauds."
  Gino : "On va boire un coup ?"
- **Narratif** : Le Rookie et son partenaire jouent enfin
  comme une equipe. Le bonus synergie se sent.

**MATCH 9 — Sable — vs TEAM FENNEC**
- Difficulte : ★★★★★
- Le Fennec a recrute son propre partenaire (un tireur agressif
  comme lui, ou un pointeur complementaire).
- Pre-match :
  Fennec : "Deuxieme round, Rookie.
            Cette fois j'suis pas seul.
            Et on est meilleurs que toi et ton pote."
- Post-match (victoire) :
  Le Fennec est silencieux. Pour la premiere fois,
  pas de commentaire sarcastique.
  Son partenaire : "Il t'aime bien, en vrai. Dis rien."
  Fennec, de loin : "... La prochaine, c'est en triplette."

**MATCH 10 — Colline — vs ROBINEAU + FOYOT**
- Difficulte : ★★★★★
- Les deux legendes en duo. Le match de la Phase 2.
- Pre-match :
  Foyot : "Le show a DEUX ! Le Rookie et son acolyte
           contre les legendes de Provence !
           Ca va etre MAGNIFIQUE !"
  Robineau : [regarde le terrain] "..."
- Post-match (victoire) :
  Foyot : "Bravo ! Bravo, bravo, bravo !
           Vous etes prets."
  Rookie : "Prets pour quoi ?"
  Foyot : "Pour le Grand Carreau d'Or, bien sur !"

### 4.3 Transition vers Phase 3

```
[Le Papet, le Rookie, et le partenaire au cafe du village]

  Foyot (arrive) : "Mes amis ! J'ai une proposition.
    Le Grand Carreau d'Or. Le plus grand tournoi de
    la region. En triplette. 32 equipes.
    Un seul champion."

  Papet : "Le Carreau d'Or... Ca fait des annees
           que j'en entends parler."

  Foyot : "Auguste l'a gagne. Y'a 30 ans.
           C'etait le premier champion.
           Son carreau en finale... personne l'a jamais
           oublie."

  [Silence]

  Papet : "C'est vrai. J'etais dans le public."

  Rookie : "Mon grand-pere a gagne le Carreau d'Or ?"

  Papet : "Le premier. Et le dernier vrai. Apres son
           depart, le tournoi... c'etait plus pareil."

  Foyot : "Mais cette annee, il revient. Grand format.
           Et j'ai envie de le voir gagner par quelqu'un
           qui le merite."

  Rookie : "On est deux. Il en faut trois."

  Partenaire : "JE CONNAIS QUELQU'UN !" / "J'ai une idee."

  → LE JOUEUR CHOISIT SON TROISIEME MEMBRE
    (parmi TOUS les persos battus, y compris nouvelles options)

  → Composition : 1 pointeur + 1 milieu (Rookie) + 1 tireur
    Le jeu suggere un equilibre mais le joueur est libre.
```

---

## 5. PHASE 3 — LE GRAND CARREAU D'OR (Triplette 3v3, 6 matchs)

### 5.0 Le Grand Carreau d'Or

> *"Le Grand Carreau d'Or. Fonde il y a 31 ans.*
> *32 equipes. 96 joueurs. 5 jours de competition.*
> *Le trophee : une boule en or, gravee du nom du champion.*
> *Le premier nom sur cette boule : Auguste."*

Le Rookie joue le role de **milieu** — le joueur qui s'adapte,
qui comble les manques, qui porte quand ca va mal.
C'est le role naturel du Rookie : l'adaptable.

### 5.1 Le tournoi

```
PHASE 3 — LE GRAND CARREAU D'OR

  ──── OUVERTURE ────
  Un grand boulodrome a ciel ouvert.
  Banderoles de fanions. Gradins en bois. Guirlandes.
  L'odeur de crepes, de merguez, et de pastis.

  Le speaker :
  "Bienvenue au 31e Grand Carreau d'Or !
   32 equipes. 96 joueurs.
   Un seul champion.
   Et cette annee... le petit-fils du fondateur est la."

  [Murmures dans la foule]

  Papet, dans les gradins, serre son pastis.

  Match 11 ─ Terre ─ vs LES CIGALONS
    Equipe locale sympathique. Premier match de triplette.
    Difficulte : ★★★☆☆
    Le Rookie decouvre le jeu a trois.
    Ses coequipiers le guident.

  Match 12 ─ Herbe ─ vs LES VIEUX LOUPS
    Trois veterans. 200 ans d'experience a eux trois.
    Difficulte : ★★★★☆
    "Vous avez du talent, les petits.
     Mais le talent sans experience, c'est du vent."
    Post-match : "On s'est trompes. Le vent peut
     tout renverser."

  Match 13 ─ Dalles ─ vs TEAM FENNEC
    Le Fennec a monte sa triplette.
    Troisieme confrontation. La derniere ?
    Difficulte : ★★★★★
    Pre-match :
      "Troisieme fois, Rookie. Solo, tu m'as eu.
       Doublette, tu m'as eu. Mais cette fois,
       c'est MON equipe. Et on est prets."
    Post-match (victoire) :
      Le Fennec s'approche. Tend la main.
      "T'es fort. Vraiment.
       ... Gagne le tournoi. Pour nous deux."
    → Le Fennec reste dans les gradins. Il encourage.

  ──── DEMI-FINALE ────
  Le speaker :
  "Demi-finale ! L'equipe du Rookie...
   contre l'equipe Suchaud-Fazzino-Rocher !"

  Silence.
  Le Fennec, dans la foule, serre le poing.
  Papet : "Trois contre trois. Mais ces trois-la...
   c'est l'histoire de la petanque qui est en face."

  Match 14 ─ Colline ─ vs SUCHAUD + FAZZINO + ROCHER
    Les trois legendes. Le mur absolu.
    Difficulte : ★★★★★★ (Expert)
    Pre-match :
      Suchaud : "Pret."
      Fazzino : "Calcul en cours."
      Rocher : "La releve ? On va voir."
    Post-match (victoire) :
      Suchaud serre la main. "Tu merites."
      Fazzino : "Pas dans mes calculs. Rare."
      Rocher : "T'es fort. Mais finis le travail."

  ──── FINALE ────
  Le terrain central. Gradins pleins. Silence.
  Tout le monde est la. Josette, Rene, Rizzi,
  La Choupe, Sofia, Le Fennec, Papet.
  Ils regardent tous.

  En face : LEY, FOYOT, ROBINEAU.
  Le trio ultime. Le tireur parfait + le showman + le froid.

  Ley n'a joue aucun match du tournoi avant les quarts.
  Entree directe. Personne ne pose la question.
  C'est Ley.

  Foyot : "Le dernier show de la saison ! Profitez-en !"
  Robineau : [croise les bras]
  Ley : "Quand je tire, ca degage.
         Prouve-moi que t'es pas qu'un nom."

  Match 15 ─ Terre battue pure ─ vs LEY + FOYOT + ROBINEAU
    Pas de gimmick terrain. Terre. Le match le plus pur.
    Difficulte : ★★★★★★★ (Legende)
    Le match qui decide tout.
```

### 5.2 L'ENDING

```
[Le dernier point est marque]
[Silence... puis explosion de joie]

Le speaker : "MESDAMES ET MESSIEURS !
  Le 31e Grand Carreau d'Or a un nouveau champion !
  Et ce champion... porte le meme nom que le premier !"

[Le Rookie regarde ses coequipiers. Ils se prennent dans
 les bras. La foule hurle.]

[Un par un, les adversaires s'approchent]

  Papi Rene : "Bravo, fiston. Auguste serait fier."
  Mamie Josette : "JE LE SAVAIS ! Qui veut du clafoutis ?!"
  Sofia : "Pas dans mes calculs. Mais... bravo."
  Rizzi : "Campione ! Eleganza !"
  La Choupe : "PASTIIIIIIS !"
  Robineau : [pouce en l'air]
  Foyot : "Belle histoire. La plus belle que j'aie vue."
  Suchaud : "Tu merites." [sourire]
  Fazzino : "Le siecle a peut-etre un successeur."
  Rocher : "La releve est assuree."

[Le Fennec s'approche en dernier]
  "... Bien joue.
   L'annee prochaine... c'est mon tour."
  [Il sourit. Pour la premiere fois, c'est sincere.]

[Ley, de loin, hoche la tete. Pas un mot.]

[Le Papet descend des gradins. Il pleure.]
  "Ton grand-pere... il aurait ete tellement fier.
   Tu sais quoi ? Tu joues mieux que lui.
   Et je pensais jamais dire ca."

[Le Rookie prend le trophee. Une boule en or.
 Il la retourne. Les noms des champions.
 Le premier : "AUGUSTE"
 Le dernier, grave par le Papet pendant la ceremonie :
 Le nom du Rookie.]

[Coucher de soleil. Le boulodrome se vide.
 Le Rookie reste seul. Pose le trophee.
 Sort les boules d'Auguste. Les pose a cote.
 Cigales. Silence. Sourire.]

                    FIN

[Credits — musique provencale douce, noms de tous les
 personnages rencontres, et une derniere phrase :]

  "La petanque, c'est pas un sport.
   C'est une histoire qu'on se passe de main en main."

                — Le Papet
```

### 5.3 TEASER POST-CREDITS (uniquement avec le Rookie)

```
[Apres les credits]

[Le Rookie rentre chez lui. Pose le trophee.]
[Sa mere entre.]

  Mere : "C'est... c'est le Carreau d'Or ?"
  Rookie : "Oui. J'ai gagne."
  Mere : "..." [elle touche la boule en or]
  Mere : "Ton grand-pere... il a gagne le premier."
  Rookie : "Je sais. Son nom est grave dessus."
  Mere : "..." [silence]
  Mere : "Il y a une lettre. Dans le coffret.
          Sous le double fond. Je l'ai jamais ouverte."
  Rookie : "..."
  Mere : "Ouvre-la. Il est temps."

[Le Rookie ouvre le double fond du coffret.
 Une enveloppe jaunie. Ecrite a la main.
 "Pour ma fille. Pour quand elle sera prete."]

[Ecran noir]

  "L'histoire continue dans..."
  "L'HERITIER DE LA CIOTAT"

  [A SUIVRE...]
```

---

## 6. LE FENNEC — ARC COMPLET

| Phase | Attitude | Moment cle |
|-------|----------|-----------|
| Prologue | Absent | — |
| Phase 1 (apres match 3) | Meprisant | "Trois victoires contre des retraites ?" |
| Phase 1 (match 5) | Arrogant | Battu sur SON sable. Premier choc. Donne ses lunettes. |
| Phase 2 (match 9) | Rival serieux | A un partenaire. Veut prouver que l'equipe, ca change. Battu. Silencieux. |
| Phase 3 (match 13) | Respectueux | Triplette. Dernier combat. Perd. Tend la main. "Gagne pour nous deux." |
| Ending | Ami | "L'annee prochaine, c'est mon tour." Premier vrai sourire. |

**Stats** : Pre 7, Pui 8, Eff 6, SF 4
**Ability** : "Coup de Bluff" — wobble adverse +20% pendant 1 tour (charges: 2)
**Faiblesse** : sang-froid 4. Il craque quand ca compte.
**Arc** : Arrogance → choc → doute → respect → amitie.

---

## 7. POST-GAME

| Contenu | Acces | Description |
|---------|-------|------------|
| **Circuit des Legendes** | Apres Phase 3 | Rematch TOUS les adversaires, difficulte +2. Nouvelles strategies IA. |
| **Defis du Carreau d'Or** | Apres Phase 3 | Fanny Master, Sans Ability, Speedrun, No Retry, etc. |
| **Matchs de Legende** | Deblocage progressif | Conditions speciales : 1 boule chacun, terrain aleatoire, handicap |
| **Salle des Trophees** | Toujours | Badges, keepsakes, records, titres |
| **Boss Secret : Ley solo** | Apres ending | Match 1v1 contre Ley seul, de nuit sur la plage. Le vrai defi. |
| **Teaser Aventure** | Ending Rookie | La lettre. "L'Heritier de la Ciotat" amorce. |

---

## 8. IMPLEMENTATION — ORDRE DE PRIORITE

### Sprint 1 : Phase 1 solo (faisable MAINTENANT)
1. Refondre `arcade.json` → Phase 1 (5 matchs + narratif)
2. Creer Le Fennec dans `characters.json`
3. Prologue (cutscene coffret + choix boules Auguste)
4. ArcadeScene : cutscenes texte entre matchs
5. Systeme de keepsakes dans SaveManager
6. Endings par personnage (texte)
7. Boules d'Auguste dans `boules.json` (3 sets heritage)
8. Badge system + UI

### Sprint 2 : Phase 2 doublette (~20-25h)
9. Refactorer PetanqueEngine → player IDs + equipes
10. IA partenaire (coequipier joue selon archetype)
11. Barks d'equipe (partenaire reagit)
12. Crise d'equipe (cutscene adaptative)
13. Team select UI
14. 5 duos adverses (Les Freres Pastis, etc.)
15. Transition Phase 2 → Phase 3

### Sprint 3 : Phase 3 triplette
16. Etendre a 3 joueurs/equipe
17. Role selection (pointeur/milieu/tireur)
18. Grand Carreau d'Or (5 matchs + demi + finale)
19. Ending complet + teaser aventure
20. Post-game (Circuit des Legendes, defis)

### Sprint 4 : Polish
21. Boules de Maitre (defis pour debloquer)
22. Boutique elargie (accessoires Rookie)
23. Carte de progression animee
24. Musiques par phase
25. Achievements
