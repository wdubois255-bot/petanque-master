# 53 — Narrative Design & Dialogue Writing

> A lire quand : on ecrit les dialogues de l'Arcade, les catchphrases, les textes du Pere Fernand, ou les barks des persos.
> Complementaire a : research/19 (legendes petanque), research/25s (story game design), STORY.md

---

## 1. LE TON PETANQUE MASTER

### 1.1 L'identite narrative

Petanque Master n'est pas un jeu serieux. C'est un jeu **chaleureux, drole et decale** qui celebre la culture provencale avec tendresse et humour.

| Dimension | Notre ton | Ce qu'on evite |
|-----------|----------|---------------|
| **Humour** | Caricature affectueuse, jeux de mots, autodérision | Humour mechant, moquerie, cynisme |
| **Chaleur** | Familiarite ("peuchère", "fada"), accueil | Froideur, distance, formalisme |
| **Drame** | Faux-epique ("LE CARREAU DU SIECLE !") | Drame reel, gravite, tension stressante |
| **Rivalite** | Taquinerie entre potes ("Tu vas voir !") | Hostilite, insultes, toxicite |
| **Provencalisme** | Expressions du sud, ambiance terroir | Cliches offensants, accent moque |

### 1.2 Les 3 registres

| Registre | Quand | Exemple |
|---------|-------|---------|
| **Epique-comique** | VS screen, debut de match | "Le terrain tremble sous ses pas..." (pour un gars en polo) |
| **Familier-chaleureux** | Boutique, menus, dialogues | "Allez, montre-leur ce que tu sais faire, fiston !" |
| **Factuel-pixel** | HUD, score, instructions | "Tour de Marcel — 2 boules restantes" |

---

## 2. DIALOGUES DE L'ARCADE

### 2.1 Structure narrative de l'Arcade

```
INTRO → MATCH 1 → INTER 1 → MATCH 2 → INTER 2 → MATCH 3 → ENDING
```

Chaque moment a un type de dialogue :

| Moment | Type | Duree | Ton |
|--------|------|-------|-----|
| **INTRO** | Cutscene texte (2-3 slides) | 15-20s | Epique-comique, mise en scene |
| **Pre-match** | Bark adversaire (1 phrase) | 3s | Taquinerie, defi |
| **Post-victoire** | Bark adversaire (1 phrase) | 3s | Respect ou frustration legere |
| **Post-defaite** | Bark adversaire (1 phrase) | 3s | Moquerie douce |
| **INTER** | Cutscene texte (1-2 slides) | 10s | Progression, motivation |
| **ENDING** | Cutscene texte (3-4 slides) | 20-30s | Triomphe, reconnaissance |

### 2.2 Intro Arcade

```
SLIDE 1:
"Le Tournoi des Quatre.
Trois adversaires. Un seul terrain de petanque.
Et toi, le Rookie, qui debarque avec tes baskets neuves."

SLIDE 2:
"Ils vont te sous-estimer.
Ils ont tort."

SLIDE 3:
"Montre-leur ce que tu vaux."
[COMMENCER]
```

**Regles** :
- Max 3 lignes par slide (la resolution 832x480 ne permet pas plus)
- Jamais plus de 4 slides (le joueur veut jouer, pas lire)
- Le Rookie ne parle pas (c'est le joueur = avatar silencieux)
- Le narrateur est une "voix" exterieure, complice du joueur

### 2.3 Dialogues pre-match par adversaire

**La Choupe (Match 1 — Village)**
```
Pre-match :
  "T'es qui toi ? Ah, le nouveau... Bon, on va pas y passer la nuit.
   Je tire, je casse, je gagne. C'est simple."

Post-victoire (joueur gagne) :
  "... Pas mal pour un debutant. Reviens quand t'auras du poil au menton."

Post-defaite (joueur perd) :
  "BOUM ! Comme ca c'est fait. Allez, retente ta chance, peuchère."
```

**Marcel (Match 2 — Parc)**
```
Pre-match :
  "Ah, c'est toi qui as battu La Choupe ?
   Impressionnant... ou alors il etait fatigue.
   Moi, j'ai 40 ans de terrain dans les doigts."

Post-victoire (joueur gagne) :
  "Hé bé... Le p'tit a du talent. Mes felicitations, gamin."

Post-defaite (joueur perd) :
  "T'inquiete pas, a ton age j'etais pareil. Reviens demain."
```

**Le Magicien (Match 3 — Colline)**
```
Pre-match :
  "Intéressant. J'ai observé tes matchs precedents.
   Tu as du potentiel... mais du potentiel, ça ne suffit pas.
   La colline, c'est mon terrain. Ici, la boule obeit a celui qui comprend."

Post-victoire (joueur gagne) :
  "... Remarquable. Tu lis le terrain mieux que je ne le pensais.
   Je te revaudrai ca."

Post-defaite (joueur perd) :
  "Ne sois pas decu. La colline ne se dompte pas en un jour."
```

### 2.4 Intermedes (entre les matchs)

**Apres Match 1 (victoire)**
```
"La Choupe n'en revient pas.
Le Rookie a du repondant.
Mais le prochain adversaire, c'est une autre histoire..."
```

**Apres Match 2 (victoire)**
```
"Marcel enlève son chapeau.
40 ans de petanque, battu par le nouveau.
Il te reste un dernier obstacle : Le Magicien.
Le meilleur joueur de la region."
```

### 2.5 Ending Arcade

```
SLIDE 1:
"Le Magicien recule d'un pas.
Pour la premiere fois, il sourit."

SLIDE 2:
"'Tu as gagne. Pas par la force, pas par la chance.
Par le terrain. Tu as compris le terrain.'
Il te tend la main."

SLIDE 3:
"Le Tournoi des Quatre a un nouveau champion.
Ton nom resonnera sur les boulodromes de Provence."

SLIDE 4:
"FELICITATIONS !
Tu as debloque Reyes et le mode Quick Play complet.
L'aventure ne fait que commencer..."
[RETOUR AU MENU]
```

---

## 3. CATCHPHRASES & BARKS

### 3.1 Regles d'ecriture des catchphrases

| Regle | Pourquoi | Exemple |
|-------|----------|---------|
| **Max 50 caracteres** | Doit tenir sur une ligne a 12px | "J'apprends vite." (17 chars) ✅ |
| **Revele la personnalite** | C'est la premiere impression | "BOUM !" → La Choupe est explosif |
| **Memorisable** | Le joueur doit s'en souvenir | "Le terrain me parle." → mystique |
| **Pas generique** | "Je suis fort" = ennuyeux | "Je vise pas, je sais." → specifique |
| **Pas d'explication** | La catchphrase intrigue, ne raconte pas | ✅ "Tu ne passeras pas" / ❌ "Je suis un defenseur" |

### 3.2 Catchphrases actuelles — Audit

| Perso | Catchphrase actuelle | Verdict |
|-------|---------------------|---------|
| Rookie | "J'apprends vite." | ✅ Simple, humble, prometteur |
| Ley | "Je vise pas, je sais." | ✅ Arrogant, instinctif — parfait |
| Marcel | "J'ai oublie plus que t'apprendras jamais." | ✅ Vieux sage, piquant |
| La Choupe | "BOUM !" | ✅ Court, explosif, memorable |
| Le Magicien | "Le terrain me parle." | ✅ Mystique, intelligent |
| Reyes | "Tu ne passeras pas." | ✅ Defensif, imposant |

**Verdict** : toutes les catchphrases sont bonnes. Pas de changement necessaire.

### 3.3 Barks in-game (pendant le match)

Les barks sont des phrases courtes qui apparaissent pendant le jeu, declenchees par des evenements :

| Evenement | Qui parle | Exemples (pool aleatoire) |
|-----------|----------|--------------------------|
| **Bon lancer joueur** | Adversaire | "Pas mal...", "Hmm.", "Chanceux..." |
| **Mauvais lancer joueur** | Adversaire | "Ha !", "C'est tout ?", "Dommage..." |
| **Bon lancer adversaire** | Adversaire | "Et voila.", "Regarde et apprends.", "Facile." |
| **Carreau joueur** | Adversaire | "Quoi ?!", "Non non non...", "Bien joue..." |
| **Carreau adversaire** | Adversaire | "CARREAU !", "Ca c'est de la petanque !", "Admire." |
| **Match point** | Adversaire | "C'est pas fini !", "Reste concentre.", "..." |
| **Victoire** | Gagnant | Catchphrase ou variante |
| **Defaite** | Perdant | Reaction specifique au perso |

### 3.4 Barks par personnage

**La Choupe** (expressif, bruyant) :
```
Bon lancer joueur : "Pfff... coup de bol."  |  "Mouais."
Mauvais lancer joueur : "HAHA ! Pas terrible !"  |  "T'es sur de toi la ?"
Son bon lancer : "PATATRA !"  |  "Et BOUM !"  |  "Ca c'est envoye !"
Carreau joueur : "HE ! Attends la !"  |  "T'as du culot..."
Son carreau : "BOOOOOM !"  |  "Ca fait mal hein ?"
Match point : "C'EST PAS FINI !"
```

**Marcel** (calme, philosophe) :
```
Bon lancer joueur : "Joli."  |  "Bien place."
Mauvais lancer joueur : "On peut pas tout reussir."  |  "Ca arrive."
Son bon lancer : "Tranquille."  |  "Comme d'habitude."
Carreau joueur : "Ho ho... interessant."  |  "Tu me rappelles quelqu'un."
Son carreau : "40 ans de metier."  |  "On oublie pas."
Match point : "La partie n'est jamais finie."
```

**Le Magicien** (analytique, pose) :
```
Bon lancer joueur : "Hmm. Correct."  |  "Pas mal. Pas parfait."
Mauvais lancer joueur : "Le vent, peut-etre."  |  "Dommage."
Son bon lancer : "Comme prevu."  |  "La physique ne ment pas."
Carreau joueur : "... Inattendu."  |  "Il faudra que j'analyse ca."
Son carreau : "Inevitable."  |  "Le terrain me l'avait dit."
Match point : "Les chiffres sont en ma faveur."
```

### 3.5 Implementation technique des barks

```javascript
// src/data/barks.json
{
  "la_choupe": {
    "opponent_good_throw": ["Pfff... coup de bol.", "Mouais."],
    "opponent_bad_throw": ["HAHA ! Pas terrible !", "T'es sur de toi la ?"],
    "own_good_throw": ["PATATRA !", "Et BOUM !", "Ca c'est envoye !"],
    "opponent_carreau": ["HE ! Attends la !", "T'as du culot..."],
    "own_carreau": ["BOOOOOM !", "Ca fait mal hein ?"],
    "match_point": ["C'EST PAS FINI !"]
  }
}

// Dans PetanqueScene.js
showBark(characterId, event) {
  const barks = barkData[characterId]?.[event];
  if (!barks || barks.length === 0) return;

  const text = barks[Math.floor(Math.random() * barks.length)];

  // Bulle de dialogue au-dessus du perso
  const bubble = this.add.text(this.opponent.x, this.opponent.y - 40, text, {
    fontSize: '10px', fontFamily: '"Press Start 2P"',
    backgroundColor: '#2A231C', padding: { x: 6, y: 4 },
    color: '#F5E6CC'
  }).setOrigin(0.5);

  // Disparition apres 2s
  this.tweens.add({
    targets: bubble, alpha: 0, y: bubble.y - 20,
    duration: 500, delay: 1500,
    onComplete: () => bubble.destroy()
  });
}
```

---

## 4. TEXTES DU PERE FERNAND (BOUTIQUE)

### 4.1 Personnalite

Le Pere Fernand est un **vieux marchand provencal** :
- Age : 65-70 ans
- Accent : Sud prononce (peuchere, fada, boulegan)
- Temperament : chaleureux, un peu baratineur, drole
- Il connait tout le monde au village
- Il est fier de sa marchandise (meme si c'est juste des boules)

### 4.2 Pool de dialogues

**Accueil (aleatoire a chaque visite)** :
```
"Ah, un client ! Bienvenue chez Fernand, le meilleur — le seul — marchand de boules du village !"
"Peuchère, regarde-moi ces merveilles ! Du titane, du bronze, du chrome... que du beau !"
"Entre, entre ! Aujourd'hui j'ai de la marchandise fraiche. Enfin, c'est du metal, ca fraichit pas, mais tu comprends."
"Tiens, le champion ! Alors, on vient se faire plaisir ?"
"Le mistral souffle, les cigales chantent, et mes boules brillent. Que demander de plus ?"
"Ah te voila ! J'ai mis de cote quelques pepites pour toi."
```

**Achat reussi** :
```
"Excellent choix ! Cette boule-la, c'est ma preferee. Enfin, elles sont toutes mes preferees."
"Tu vas faire des jaloux sur le terrain, garanti !"
"Avec ca, meme La Choupe va trembler. Enfin, La Choupe tremble jamais, mais tu vois l'idee."
"Merci pour ta visite ! Et vise bien, hein !"
"Elle est a toi ! Fais-en bon usage, peuchère."
```

**Pas assez d'Ecus** :
```
"Oh, il te manque quelques pieces... Reviens apres un match ou deux !"
"Peuchère, j'aimerais bien te la donner gratis, mais ma femme surveille les comptes."
"Tu veux que je te fasse credit ? ...Non, j'rigole. Allez, va gagner des Ecus !"
"C'est pas encore dans ton budget. Mais ca viendra, fiston !"
```

**Au revoir** :
```
"A la prochaine ! Et n'oublie pas : c'est la boule qui fait le joueur !"
"Allez, file sur le terrain ! Et reviens me voir, hein !"
"Bonne chance, champion ! Enfin, t'auras pas besoin de chance avec ce materiel."
```

---

## 5. TEXTES UI ET SYSTEME

### 5.1 Principe : informer sans ennuyer

Les textes systeme (HUD, menus, notifications) doivent etre :
- **Courts** (max 2 lignes)
- **Clairs** (pas d'ambiguite)
- **Coherents** (toujours le meme terme pour le meme concept)

### 5.2 Glossaire terminologique

| Terme in-game | Signification | Ne PAS utiliser |
|---------------|--------------|----------------|
| **Mene** | Un round (toutes les boules jouees) | Round, tour, set |
| **Tour** | Le moment ou un joueur lance | Action, phase |
| **Boule** | L'objet lance | Balle, sphere |
| **Cochonnet** | La cible | But, jack, bouchon |
| **Carreau** | La boule prend la place exacte de l'adversaire | Remplacement, echange |
| **Tirer** | Lancer fort pour deloger | Frapper, shooter |
| **Pointer** | Lancer doucement pour se rapprocher | Placer, rouler |
| **Ecus** | La monnaie du jeu | Pieces, coins, credits |
| **Focus** | Le pouvoir de stabilisation | Concentration, calme |

### 5.3 Notifications in-game

| Evenement | Texte | Duree |
|-----------|-------|-------|
| Debut de mene | "Mene 3 — A vous !" | 1.5s |
| Changement de tour | "Tour de Marcel" | 1s |
| Point marque | "+2 points !" | 1.5s |
| Carreau | "CARREAU !" | 2s |
| Mene gagnee | "Mene gagnee ! +3 points" | 2s |
| Match point | "MATCH POINT !" | 2s |
| Victoire | "VICTOIRE !" | permanent (ecran resultat) |
| Deblocage perso | "La Choupe est maintenant jouable !" | 3s |
| Ecus gagnes | "+50 Ecus" | 2s |
| Level up Rookie | "Nouveau point de competence !" | 2s |
| Capacite debloquee | "Capacite debloquee : Coup d'Oeil !" | 3s |

### 5.4 Descriptions des boules (boutique)

Chaque boule a une description **courte et evocatrice** (pas technique) :

| Boule | Description boutique |
|-------|---------------------|
| Acier | "Classique et fiable. La boule de tout le monde." |
| Bronze | "Forgee dans le cuivre provencal. Tape plus fort, vise un peu moins." |
| Chrome | "Polie comme un miroir. Precise comme un horloger suisse." |
| Noire | "Sombre et mysterieuse. Pour ceux qui aiment l'elegance." |
| Rouge | "Couleur passion. Elle ne passe pas inapercue." |
| Doree | "L'or du Midi. Un peu de tout, en mieux." |
| Rouille | "Elle a vecu. Les marques du temps lui donnent du caractere." |
| Bleue | "Bleue comme la Mediterranee. Douce au toucher." |
| Cuivre | "Chaude et brillante. L'ame de la Provence." |
| Titane | "Le summum de la technologie bouliste. Precision et puissance." |

---

## 6. REGLES D'ECRITURE

### 6.1 Longueurs par contexte

| Contexte | Max caracteres | Max lignes | Police |
|----------|---------------|-----------|--------|
| Catchphrase | 50 | 1 | 10px |
| Bark in-game | 40 | 1 | 10px |
| Dialogue cutscene | 120 | 3 | 12px |
| Description boutique | 80 | 2 | 10px |
| Notification | 50 | 1 | 12px |
| Tooltip | 100 | 2 | 10px |
| Nom de perso | 20 | 1 | 14px |
| Titre de perso | 30 | 1 | 10px |

### 6.2 Expressions provencales utilisables

| Expression | Signification | Qui l'utilise |
|-----------|--------------|--------------|
| "Peuchère" | Oh la la / Mon pauvre | Fernand, Marcel |
| "Fada" | Fou (affectueux) | Choupe, Fernand |
| "Boulegan" | Ca bouge ! | Choupe |
| "Galinette" | Terme affectueux (poule) | Marcel |
| "Minot" | Gamin | Marcel, Fernand |
| "Cagole/cagol" | Frimeur (amical) | Choupe |
| "Fan de chichourle !" | Juron provencal doux | Fernand |
| "Zou !" | Allez ! On y va ! | Tout le monde |
| "Adieu !" | Bonjour (pas au revoir !) | Fernand |
| "Bonne mere !" | Expression de surprise | Fernand, Marcel |

### 6.3 Ce qu'on ne fait PAS

| Interdit | Pourquoi |
|----------|----------|
| Insultes reelles | Jeu familial |
| Accent ecrit ("ch'uis", "j'te dis") | Illisible, condescendant |
| References politiques | Divisif |
| Humour sexuel | Public trop large |
| Vocabulaire technique de petanque non explique | Le joueur ne connait pas forcement |
| Dialogues de plus de 3 lignes | Le joueur decroche |
| Le Rookie qui parle | C'est l'avatar silencieux du joueur |

---

## 7. FICHIERS CONCERNES

| Fichier | Contenu narratif |
|---------|-----------------|
| `public/data/characters.json` | Catchphrases, titres, descriptions |
| `public/data/barks.json` | Pool de barks par perso et par evenement (NOUVEAU) |
| `public/data/arcade.json` | Dialogues intro/inter/ending Arcade |
| `public/data/shop.json` | Descriptions des items |
| `src/ui/DialogBox.js` | Composant d'affichage des dialogues |
| `src/scenes/ArcadeScene.js` | Cutscenes narratives |
| `src/scenes/PetanqueScene.js` | Affichage des barks |

---

## 8. CONTENU A ECRIRE — PRIORITES

| Contenu | Quantite | Effort | Priorite |
|---------|---------|--------|----------|
| Intro Arcade (3 slides) | 1 | 30 min | P1 |
| Pre/post match barks (3 adversaires) | 18 phrases | 1h | P1 |
| Inter-match textes (2) | 2 slides chacun | 30 min | P1 |
| Ending Arcade (4 slides) | 1 | 30 min | P1 |
| Barks in-game (5 persos × 6 events × 2-3 variantes) | ~75 phrases | 2h | P2 |
| Dialogues Pere Fernand (6+5+4+3 phrases) | ~18 phrases | 1h | P2 |
| Descriptions boules (10) | 10 phrases | 30 min | P2 |
| Tooltips et notifications | ~15 textes | 30 min | P1 |
| **Total** | ~130 textes | **~7h** | — |

---

## 9. LOCALIZATION-READY

Tous les textes narratifs doivent etre dans des fichiers JSON, pas hardcodes :

```javascript
// MAUVAIS
this.add.text(x, y, "VICTOIRE !");

// BON
this.add.text(x, y, I18n.t('results.victory'));
```

Pour les barks et dialogues, le fichier JSON est deja la structure de traduction (voir research/44).

Les expressions provencales (peuchère, fada) restent en francais dans toutes les langues — elles font partie de l'identite du jeu, comme les termes japonais dans les jeux de combat.
