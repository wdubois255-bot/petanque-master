# Script Voix Off — Petanque Master Making-Of

> Duree cible : 10-12 minutes
> Ton : direct, personnel, un peu d'humour, honnete
> Style : inspiration EGO (narration calme, pas de face cam) + Dis Cyril (8-10 min, revelation)
> Chiffres a jour : 456 commits, 3158 tests, 19 jours, 12 persos, 73 sessions

---

## SEGMENT 1 — LE HOOK (0:00 - 0:30)

**[VISUEL : Gameplay du jeu final — un carreau parfait avec slow-mo, confettis, son d'impact]**

> 456 commits. 3158 tests. 12 personnages. 5 terrains.
> Un moteur physique de 500 lignes ecrit a la main.
> Et pas une seule ligne de code que j'ai tapee moi-meme.

**[VISUEL : Beat. Ecran noir. Titre "PETANQUE MASTER — Comment 3 IAs ont construit un jeu complet"]**

> Bon, c'est pas tout a fait vrai. Mais c'est pas tout a fait faux non plus.
> Voici l'histoire de comment j'ai cree un jeu de petanque competitif
> en 19 jours, avec l'aide de trois intelligences artificielles.

**DUREE : ~30 secondes**

---

## SEGMENT 2 — L'IDEE ABSURDE (0:30 - 2:00)

**[VISUEL : Screenshots de jeux de petanque existants — mediocres]**

> La petanque. Tout le monde connait. Personne n'en a fait un vrai jeu video.
> Les rares tentatives ? Des simulations ennuyeuses ou des mini-jeux mobiles
> avec des pubs toutes les 30 secondes.

**[VISUEL : Transition vers des images de Street Fighter, Pokemon, Tekken]**

> Et si on prenait la petanque au serieux ?
> Pas comme un passe-temps de dimanche apres-midi.
> Comme un jeu de combat. Avec des personnages,
> des stats, des pouvoirs speciaux, un mode arcade.
> Street Fighter, mais avec des boules en acier.

**[VISUEL : Ecran de selection de personnages du jeu]**

> Le concept est absurde. Et c'est exactement pour ca que ca marche.

**[VISUEL : Palette de couleurs provencale affichee]**

> L'ambiance ? Le sud de la France. Ocre, lavande, terracotta.
> Des cigales en arriere-plan. Pas de noir pur dans tout le jeu.
> Les ombres sont en marron chaud. Meme les menus sentent la Provence.

**DUREE : ~1 min 30**

---

## SEGMENT 3 — LE SETUP : 3 IAs (2:00 - 3:30)

**[VISUEL : Logos Claude + PixelLab + ElevenLabs, apparition un par un]**

> Le pari : construire un jeu complet avec trois IAs.
> Claude pour le code. Tout le code.
> Architecture, moteur physique, IA adversaire, UI, sauvegarde, tests.

**[VISUEL : Screenshot du code dans l'editeur, defilement rapide]**

> PixelLab pour les sprites. 726 images en pixel art.
> Personnages, terrains, boules, decors.

**[VISUEL : Montage rapide de sprites — persos, boules, terrains]**

> ElevenLabs pour l'audio. 14 effets sonores, 2 musiques,
> des ambiances de terrain — cigales, vagues, oiseaux, vent industriel.

**[VISUEL : Forme d'onde audio qui s'anime]**

> Mon role a moi ? La vision. Le game design. Les decisions.
> Et surtout : dire non.
> "Non, la camera fixe c'est mieux."
> "Non, on retire le monde ouvert."
> "Non, le coefficient de restitution c'est 0.62, pas 0.80."
> L'IA propose. L'humain dispose.

**DUREE : ~1 min 30**

---

## SEGMENT 4 — LES FONDATIONS (3:30 - 5:30)

**[VISUEL : Ecran vide → premier cercle qui roule (commit #1)]**

> Jour 1. Un fichier main.js vide.
> Premiere decision, et la plus importante du projet :
> pas de Matter.js.

**[VISUEL : Logo Matter.js barre, puis code Ball.js qui apparait]**

> Matter.js, c'est le moteur physique que tout le monde utilise.
> Plug and play. Sauf que la petanque a une physique tres specifique.
> Une boule d'acier sur du gravier ne rebondit pas comme un ballon.
> Le roulement depend du terrain. Le carreau demande des collisions precises.

**[VISUEL : Visualisation physique — trajectoires a differents angles]**

> On a ecrit 500 lignes de physique maison.
> La formule cle : v0 egale racine de 2 fois friction fois distance.
> Le coefficient de restitution — le COR — de l'acier sur l'acier ?
> 0.62. Donnees reelles du NIST.

**[VISUEL : Visualisation COR — 3 collisions comparees]**

> Et le carreau — chasser la boule adverse avec la sienne —
> est devenu possible naturellement. Pas de hack, pas de triche.
> Juste de la physique correcte.

**[VISUEL : Carreau en jeu avec slow-mo]**

> Jour 2-3. L'ambition RPG.
> Au debut, c'etait un monde ouvert a la Pokemon.
> Un village provencal, des PNJs a defier, une carte, des badges.

**[VISUEL : Screenshots evolution — monde ouvert → migration 32x32 → Provence]**

> On a tout construit. Village, dialogues, sauvegarde, 3 maps.
> Et puis...

**DUREE : ~2 minutes**

---

## SEGMENT 5 — LE PIVOT (5:30 - 7:00)

**[VISUEL : Ecran noir. Texte "JOUR 5 — 56 COMMITS"]**

> Jour 5. Le jour le plus productif du projet.
> 56 commits en une seule journee.
> Et une seule decision qui a tout change :

**[VISUEL : Split screen — RPG a gauche, Arcade a droite]**

> On abandonne le monde ouvert.
> Le coeur du jeu, c'est le match de petanque.
> Le format RPG diluait l'experience.
> Comme si Pokemon se jouait mieux sans les combats.

> Pivot radical : on passe au format arcade.
> Ecran de selection de personnage. Ecran VS cinematique.
> Mode arcade en 5 rounds. La partie petanque devient le centre d'attention.

**[VISUEL : VSIntroScene du jeu — presentation style Tekken]**

> En une journee, Petanque Master est passe de
> "RPG avec mini-jeu de petanque" a "jeu de sport competitif."
> Une des meilleures decisions du projet.
> Parfois, retirer c'est plus dur qu'ajouter.

**DUREE : ~1 min 30**

---

## SEGMENT 6 — LES PERSONNAGES ET L'IA (7:00 - 8:30)

**[VISUEL : Grille roster 12 personnages avec stats]**

> 12 personnages. Chacun avec sa personnalite.
> Le Rookie, le debutant qui evolue.
> La Choupe, la brute avec puissance a 10 sur 10.
> Mamie Josette, precision divine, sang-froid imperturbable.
> Ley, le boss final, 31 points de stats totaux.

**[VISUEL : Pipeline PixelLab — prompt → sprite → integration]**

> Le pipeline pour creer un personnage :
> Game design, prompt PixelLab, retouche Pixelorama,
> integration dans Phaser, comportement IA.
> Chaque perso a son archetype strategique.

**[VISUEL : IA en action — marker de visee qui tremble, decision tir vs point]**

> L'IA ne triche pas. Elle evalue la situation :
> distance au cochonnet, position des boules, score.
> Et elle decide : pointer ou tirer ?
> Le marker de visee oscille selon la precision du perso.
> Un joueur avec 9 en precision a un marker quasi-stable.
> Avec 4 ? Ca tremble. Le stress est visible.

**DUREE : ~1 min 30**

---

## SEGMENT 7 — LES DETAILS OBSESSIONNELS (8:30 - 9:30)

**[VISUEL : Montage rapide de details — confettis, slow-mo, barks, terrains]**

> Les details. C'est la ou un jeu passe de "ca marche" a "c'est satisfaisant."

**[VISUEL : Visualisation terrains — 4 frictions comparees]**

> 5 terrains avec des proprietes physiques differentes.
> Le sable ralentit 3 fois plus que la terre.
> Les dalles, c'est du glissant — les boules filent.
> Le parc a des zones mixtes herbe-gravier.
> La colline a de la pente.

**[VISUEL : Slow-mo pres du cochonnet, vignette]**

> Le slow-mo quand une boule passe pres du cochonnet.
> La pause dramatique avant le score.
> Les confettis de victoire aux couleurs provencales.
> Les cigales ? Generees par code. Du bruit rose filtre.

**[VISUEL : Terminal — 3158 tests qui passent]**

> Et 3158 tests unitaires. Le jeu se teste lui-meme.
> Si je change une constante physique, je sais immediatement
> si j'ai casse quelque chose.

**DUREE : ~1 minute**

---

## SEGMENT 8 — LE RESULTAT (9:30 - 10:30)

**[VISUEL : Gource timelapse accelere — l'arbre du projet qui grandit]**

> 19 jours. 456 commits. 73 sessions de travail.
> De zero a un jeu publie sur itch.io.

**[VISUEL : Compteur anime 0 → 456 commits, puis 0 → 3158 tests]**

**[VISUEL : Gameplay complet — une partie de A a Z, 30 secondes accelerees]**

> 12 personnages jouables avec stats et IA.
> 5 terrains avec physique unique.
> Mode Arcade, Quick Play, boutique, progression.
> Localisation francais-anglais.
> Et un moteur physique ou le carreau est possible
> grace a de la vraie physique. Pas un hack.

**[VISUEL : Page itch.io du jeu]**

**DUREE : ~1 minute**

---

## SEGMENT 9 — LA LECON (10:30 - 11:30)

**[VISUEL : Retour sur le split screen — ecran vide jour 1 / jeu final]**

> La question que tout le monde pose :
> "L'IA a tout fait ?"

> Non. L'IA a execute. Vite et bien.
> Mais les decisions ? C'est moi.
> Camera fixe. Pivot arcade. COR 0.62. Palette provencale.
> Pas de Matter.js. Plombee qui roule 20%.

> L'IA est un multiplicateur de force. Pas un remplacant.
> Elle m'a permis de faire en 19 jours ce qui prend des mois.
> Pas parce qu'elle est meilleure que moi.
> Mais parce qu'elle supprime les blocages.

> Pas graphiste ? PixelLab genere des sprites.
> Pas sound designer ? ElevenLabs cree les SFX.
> Pas sur de l'architecture ? Claude propose et implemente.

> Mais c'est le developpeur qui dit "ca, c'est bien" et "ca, on jette."

**DUREE : ~1 minute**

---

## SEGMENT 10 — OUTRO (11:30 - 12:00)

**[VISUEL : Logo Petanque Master + lien itch.io]**

> Le jeu est gratuit et jouable dans votre navigateur.
> Le lien est dans la description.
> Si le concept vous fait sourire, essayez-le.
> Et si vous faites un carreau, vous comprendrez pourquoi
> j'ai passe 19 jours la-dessus.

**[VISUEL : Fondu. Fin.]**

**DUREE : ~30 secondes**

---

## TIMING TOTAL

| Segment | Duree | Cumul |
|---------|-------|-------|
| 1. Hook | 0:30 | 0:30 |
| 2. Idee | 1:30 | 2:00 |
| 3. Setup | 1:30 | 3:30 |
| 4. Fondations | 2:00 | 5:30 |
| 5. Pivot | 1:30 | 7:00 |
| 6. Personnages | 1:30 | 8:30 |
| 7. Details | 1:00 | 9:30 |
| 8. Resultat | 1:00 | 10:30 |
| 9. Lecon | 1:00 | 11:30 |
| 10. Outro | 0:30 | 12:00 |

**TOTAL : ~12 minutes**

---

## ASSETS VIDEO REQUIS PAR SEGMENT

| Segment | Assets |
|---------|--------|
| 1 | Gameplay carreau slow-mo, titre anime |
| 2 | Screenshots jeux petanque existants, images fighting games, CharSelect, palette |
| 3 | Logos IA, code scroll, montage sprites, waveform audio |
| 4 | Evolution screenshots (8 etapes), physics-viz trajectoires, physics-viz COR, carreau gameplay |
| 5 | Split screen RPG/Arcade, VSIntroScene capture |
| 6 | Roster grid, pipeline PixelLab, IA gameplay avec marker visee |
| 7 | Terrains physics-viz, slow-mo cochonnet, confettis, terminal tests |
| 8 | Gource timelapse, compteurs animes, gameplay complet, page itch.io |
| 9 | Split screen jour1/final |
| 10 | Logo + lien |

## ASSETS DEJA GENERES

- [x] Gource timelapse (gource_timelapse_1080p.mp4 — 20MB)
- [x] Compteur commits (counter_commits.mp4)
- [x] Compteur tests (counter_tests.mp4)
- [x] Slideshow evolution Ken Burns (evolution_slideshow.mp4 — 12.6MB)
- [x] Grille roster (roster_grid_1080p.png)
- [x] Visualisations physique (physics-viz.html — 4 demos)
- [ ] Captures physique video (en cours)
- [ ] Gameplay recordings
- [ ] TTS voix off
