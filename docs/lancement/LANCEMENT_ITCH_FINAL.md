# LANCEMENT ITCH.IO — Checklist Finale

> **Date** : 27 mars 2026
> **Objectif** : Publier Petanque Master sur itch.io, maximiser la visibilite, mesurer les resultats
> **Statut** : Pre-lancement

---

## TABLE DES MATIERES

1. [Objectifs & metriques de reference](#1-objectifs--metriques-de-reference)
2. [Metriques tracables](#2-metriques-tracables)
3. [Phase 1 — Preparation des assets visuels (J-7 a J-3)](#3-phase-1--preparation-des-assets-visuels-j-7-a-j-3)
4. [Phase 2 — Fichiers techniques bloquants (J-5)](#4-phase-2--fichiers-techniques-bloquants-j-5)
5. [Phase 3 — Creation de la page itch.io (J-2)](#5-phase-3--creation-de-la-page-itchio-j-2)
6. [Phase 4 — Build, upload et tests (J-1)](#6-phase-4--build-upload-et-tests-j-1)
7. [Phase 5 — Teaser pre-lancement (J-1)](#7-phase-5--teaser-pre-lancement-j-1)
8. [Phase 6 — JOUR J (Mardi ou Mercredi, 14h-16h UTC)](#8-phase-6--jour-j-mardi-ou-mercredi-14h-16h-utc)
9. [Phase 7 — Semaine 1 : Game Jams + suivi (J+1 a J+7)](#9-phase-7--semaine-1--game-jams--suivi-j1-a-j7)
10. [Phase 8 — Semaine 2-3 : Contenu & analyse (J+7 a J+21)](#10-phase-8--semaine-2-3--contenu--analyse-j7-a-j21)
11. [Phase 9 — Mois 1 : Decision strategique (J+21 a J+30)](#11-phase-9--mois-1--decision-strategique-j21-a-j30)
12. [Analytics in-game (optionnel)](#12-analytics-in-game-optionnel)
13. [Ce qui ne marche pas](#13-ce-qui-ne-marche-pas)
14. [Resume : ordre de priorite](#14-resume--ordre-de-priorite)

---

## 1. OBJECTIFS & METRIQUES DE REFERENCE

### Qu'est-ce qu'un bon retour pour un premier lancement itch.io ?

Contexte realiste : jeu web gratuit, pixel art, pas de communaute preexistante.

| Metrique | Moyen | Bon | Tres bon |
|---|---|---|---|
| Vues page (1er mois) | 100-300 | 500-1000 | 2000+ |
| Parties lancees | 30-80 | 150-300 | 500+ |
| Temps moyen de session | 2-5 min | 5-15 min | 15+ min |
| Taux de retention (revient) | 2-5% | 10-15% | 20%+ |
| Commentaires | 0-2 | 5-10 | 15+ |
| Ratings | 1-3 | 5-15 | 20+ |

**Le vrai signal positif** : des commentaires qualitatifs. "J'ai passe 30 min dessus", "quand est-ce que le multi arrive ?", "j'adore le style". Un seul commentaire enthousiaste vaut plus que 500 vues silencieuses.

### Seuils d'alerte — quand reagir

| Metrique | Objectif | Si en dessous | Action corrective |
|---|---|---|---|
| Conversion vues → plays | > 30% | < 20% | Probleme de fiche : changer le GIF, la description, les screenshots |
| Session moyenne | > 5 min | < 3 min | Probleme d'onboarding : les joueurs ne comprennent pas assez vite |
| Retention (revient jouer) | > 10% | < 5% | Pas de hooks : implementer Daily Challenge + Achievements |
| Rating itch.io | > 4/5 | < 3.5 | Bug ou frustration : lire les commentaires en detail |

---

## 2. METRIQUES TRACABLES

### Gratuit — Dashboard itch.io

Disponible automatiquement sans rien installer :

- **Vues de la page** — combien de personnes voient la fiche
- **Nombre de "plays"** — combien lancent effectivement le jeu (le ratio vues/plays = qualite de la fiche)
- **Telechargements** — si version offline proposee
- **Ratings** — note sur 5, visible publiquement
- **Commentaires** — feedback qualitatif direct
- **Sources de trafic** — d'ou viennent les visiteurs (Reddit, Twitter, Google, itch.io browse...)

### Optionnel — Analytics in-game

Voir [section 12](#12-analytics-in-game-optionnel) pour les details. En resume : tracker via PostHog ou Plausible (gratuit) :
- Parties completes vs abandonnees
- Personnage le plus joue
- Ou les joueurs decrochent (apres tuto ? match 3 ?)
- Temps moyen par match
- Utilisation de la boutique

---

## 3. PHASE 1 — PREPARATION DES ASSETS VISUELS (J-7 a J-3)

> Sans ces assets, la page itch.io ne convertit pas. C'est la priorite absolue.

- [ ] **1.1 — Cover art 630x500px**
  C'est LA thumbnail qui fait cliquer dans les listings itch.io. C'est la premiere chose que les joueurs voient quand ils scrollent la page d'accueil ou les resultats de recherche.
  - Montage pixel art : logo Petanque Master + 2-3 personnages (Rookie, Mamie Josette, Papi Rene) + terrain + boules
  - Format minimum 630x500px (itch.io le redimensionne pour les vignettes)
  - Doit etre lisible meme en tout petit (pas de texte fin, couleurs contrastees)
  - Utiliser la palette provencale : ocre (#D4A574), terracotta (#C4854A), lavande (#9B7BB8), ciel (#87CEEB)

- [ ] **1.2 — GIF header anime (3-5 secondes)**
  Le GIF est le 2e element le plus important. Il montre le gameplay en action et transforme un visiteur curieux en joueur. Un bon GIF = +50% de conversion.
  - Capturer une sequence : lancer en arc → boule qui roule vers le cochonnet → slow-mo quand elle s'approche → commentaire qui s'affiche → score qui s'incremente
  - Taille cible : < 3 MB, 832px de large, 15 FPS
  - Outils recommandes :
    - **ScreenToGif** (Windows, gratuit) — le plus simple
    - **ShareX** — capture GIF directe
    - **OBS + ffmpeg** : `ffmpeg -i recording.mp4 -vf "fps=15,scale=832:-1" -loop 0 header.gif`
  - Astuce : capturer un carreau (tir qui chasse une boule adverse) — c'est le geste le plus spectaculaire de la petanque

- [ ] **1.3 — 5 screenshots varies**
  Montrer la diversite du jeu, pas 5 fois le meme ecran. Chaque screenshot doit repondre a une question du joueur potentiel.
  | # | Contenu | Ce que ca montre au joueur |
  |---|---|---|
  | 1 | Ecran titre avec soleil provencal | L'ambiance, la premiere impression, le style visuel |
  | 2 | Match en cours sur Place du Village | Le gameplay core — c'est a ca qu'on joue |
  | 3 | Match sur Plage ou Docks | Variete visuelle — le jeu n'est pas monotone |
  | 4 | Ecran VS Intro (Rookie vs adversaire) | Les personnages, le charme, la personnalite |
  | 5 | Boutique avec boules et items | Profondeur, progression — il y a des choses a debloquer |

---

## 4. PHASE 2 — FICHIERS TECHNIQUES BLOQUANTS ✅ COMPLET

> Tous les fichiers techniques sont en place.

- [x] **2.1 — Scene Credits** (`src/scenes/CreditsScene.js`)
  Developpeur, outils (Phaser 4, Vite), licences, inspirations. Accessible depuis le menu Parametres.

- [x] **2.2 — Privacy Policy** (`public/privacy.html`)
  localStorage uniquement, pas de cookies, pas de tracking, pas de donnees personnelles.

- [x] **2.3 — Licence** (`LICENSE` a la racine)
  En place.

- [x] **2.4 — Meta og:tags** (dans `index.html`)
  og:title, og:description, og:image, og:type configures.
  > Note : mettre a jour og:image avec l'URL du cover art une fois uploade sur itch.io.

- [x] **2.5 — Version 1.0.0** (dans `package.json`)
  Version 1.0.0 en place.

---

## 5. PHASE 3 — CREATION DE LA PAGE ITCH.IO (J-2)

> Tout configurer en mode brouillon. Ne PAS publier encore.

- [ ] **3.1 — Creer le projet HTML5 sur itch.io en DRAFT**
  Aller sur itch.io → Dashboard → Create new project. Type : HTML. Le mode brouillon permet de tout configurer tranquillement, tester le rendu, partager avec des beta-testeurs via le lien prive.

- [ ] **3.2 — Configurer les parametres techniques**
  | Parametre | Valeur | Pourquoi |
  |---|---|---|
  | Type | HTML5 | Jeu web, pas de telechargement |
  | Dimensions | 832 x 480 | Resolution native du jeu |
  | Fullscreen | Oui | Indispensable pour le confort |
  | Mobile friendly | Oui | Touch controls deja implementes |
  | Prix | Gratuit | PAS "pay what you want" — ca cree une friction inutile au lancement |
  | Release status | Released | Quand on publie |
  | Communaute | Commentaires actives | Feedback gratuit |

- [ ] **3.3 — Upload les visuels**
  Cover art en premier, puis GIF header, puis les 5 screenshots dans l'ordre. Le GIF doit etre le premier element visuel visible sur la page (les joueurs scrollent vite).

- [ ] **3.4 — Coller la description EN + FR**
  Description complete deja redigee dans `docs/ITCH_IO.md`. L'anglais en premier (audience majoritaire sur itch.io), le francais en section separee en dessous. Verifier le rendu markdown dans la preview itch.io — parfois les listes ou les titres cassent.

- [ ] **3.5 — Configurer les tags**
  ```
  petanque, pixel-art, sports, arcade, casual, french, bocce, turn-based,
  singleplayer, strategy, cozy, retro, provence
  ```
  Les 8 premiers tags comptent le plus pour la decouverte. "bocce" est essentiel car 80% de l'audience anglophone ne connait pas le mot "petanque".

- [ ] **3.6 — Activer devlog + commentaires**
  Les commentaires = feedback gratuit et direct des joueurs. Le devlog = outil de visibilite itch.io (les devlogs recents apparaissent dans le feed de la plateforme et sont indexes par Google).

- [ ] **3.7 — Devlog #1 : "Why I made a petanque game"**
  Publier 1-3 jours avant le lancement. C'est un teaser qui cree de l'anticipation.
  - **Hook** : "Petanque was invented in 1907 because a man with rheumatism couldn't run anymore. His friends let him play standing still. This game is about that spirit."
  - **3 GIFs** : un carreau spectaculaire, un pointage au millimetre, une Fanny (13-0)
  - **Le pitch** : "12 characters, 5 terrains, custom physics. No Matter.js. Every ball rolls differently on sand vs stone."
  - **Call to action** : "Launching [DATE]. Follow to get notified."
  - Objectif : indexation Google + apparition dans le feed itch.io "devlogs recents"

---

## 6. PHASE 4 — BUILD, UPLOAD ET TESTS (J-1)

> La derniere verification technique avant le grand jour.

- [ ] **4.1 — Build final propre**
  ```bash
  npm run build && npx vitest run
  ```
  Verifier : 0 erreurs de build, tous les tests passent (3089/3089 au 30 mars 2026). Le dossier `dist/` (~11 MB avec assets) contient le jeu complet pret a uploader.

- [ ] **4.2 — Zipper le contenu de dist/**
  IMPORTANT : zipper le CONTENU de dist/, pas le dossier lui-meme. Si le ZIP contient un dossier "dist" a la racine, itch.io ne trouvera pas l'index.html.
  - **Windows** : ouvrir le dossier dist/, tout selectionner (Ctrl+A), clic droit → Envoyer vers → Dossier compresse
  - **Bash** : `cd dist && zip -r ../petanque-master-v1.0.0.zip .`

- [ ] **4.3 — Upload le ZIP sur itch.io**
  Sur la page du projet : Upload files → selectionner le ZIP → cocher "This file will be played in the browser". Attendre que le traitement se termine.

- [ ] **4.4 — Tester le jeu sur la page itch.io**
  Ouvrir la preview (bouton "View page" en mode draft) et tester sur :
  - **Chrome desktop** : verifier gameplay complet, son, fullscreen
  - **Firefox** : verifier compatibilite
  - **Telephone** : verifier touch controls, rotation portrait overlay, performance
  - Points critiques a verifier : le son se lance bien, le fullscreen fonctionne, pas de crash au chargement, les sauvegardes marchent

---

## 7. PHASE 5 — TEASER PRE-LANCEMENT (J-1)

> Creer de la curiosite la veille, sans donner le lien.

- [ ] **5.1 — Post r/PixelArt** (~1.5M membres)
  Screenshot du terrain le plus beau + personnages. PAS de lien vers le jeu (regles du subreddit : pas de promotion directe). Titre du style : "I made a provencal petanque game in pixel art". Le but est de creer de la curiosite. Si les gens demandent "ou on peut jouer ?", repondre "demain !" — ca cree de l'anticipation.

---

## 8. PHASE 6 — JOUR J (Mardi ou Mercredi, 14h-16h UTC)

> Le timing compte. Mardi/mercredi = meilleurs jours pour les posts gaming sur Reddit et Twitter. 14h UTC (16h Paris) = les europeens sont encore la et les americains arrivent. Eviter lundi (noye dans le bruit) et vendredi (personne ne regarde le week-end).

- [ ] **6.1 — Publier la page itch.io**
  Passer de DRAFT a Released. Le jeu est maintenant public et jouable par tous.

- [ ] **6.2 — Post r/WebGames** (~300k membres)
  LE subreddit numero 1 pour les jeux web. Lien direct vers la page itch.io, titre accrocheur. C'est le plus gros levier de trafic immediat pour un jeu web gratuit. Format : titre court et punchy, GIF ou screenshot en embed si possible.

- [ ] **6.3 — Post r/indiegames** (~800k membres)
  GIF de gameplay + titre "I made a petanque game in pixel art". Sur ce sub, le visuel prime. Le lien va en commentaire, pas dans le titre. Un bon GIF = des milliers de vues en quelques heures.

- [ ] **6.4 — Post r/petanque** (~15k membres)
  Niche mais ultra-ciblee. Ces gens AIMENT la petanque et apprecieront la fidelite aux regles FIPJP. Titre personnel : "I spent months making the most detailed petanque game ever — with real FIPJP rules". Communaute petite mais le taux d'engagement sera eleve.

- [ ] **6.5 — Post r/casualgames**
  Lien + description courte. Audience qui cherche des jeux rapides a prendre en main.

- [ ] **6.6 — Thread Twitter/X**
  Tweet principal :
  ```
  I just released Petanque Master — a pixel art petanque game
  with custom physics, 12 characters, and provencal charm.

  It's free. Play it now: [lien]

  Thread...
  ```
  Puis 4-5 tweets avec :
  - GIF du slow-mo (le plus spectaculaire)
  - GIF d'un carreau (le geste roi de la petanque)
  - Screenshot comparatif des 5 terrains
  - "This ball physics took me 500 lines of code and zero Matter.js"
  - "Every character has their own personality. Mamie Josette judges your throws."

  Hashtags : `#indiedev #gamedev #pixelart #petanque #webgame #phaser`

  Frequence post-launch : 1 GIF tous les 2-3 jours pendant 2 semaines. Utiliser #screenshotsaturday chaque samedi.

- [ ] **6.7 — Devlog #2 itch.io : "It's live!"**
  Court et enthousiaste, avec le lien. Ca alimente le feed itch.io une 2e fois (double exposition). Inclure 1-2 GIFs et remercier les premiers joueurs.

- [ ] **6.8 — REPONDRE A TOUS LES COMMENTAIRES (6 premieres heures)**
  Les 6 premieres heures sont DECISIVES. L'algorithme itch.io booste les jeux qui ont de l'engagement (commentaires, ratings). Chaque commentaire merite une reponse personnalisee — meme un simple "merci !". Un developpeur reactif = un joueur qui revient et qui note le jeu.

---

## 9. PHASE 7 — SEMAINE 1 : GAME JAMS + SUIVI (J+1 a J+7)

> Les Game Jams sont le meilleur levier de visibilite sur itch.io, de loin.

- [ ] **7.1 — Inscription a 1-2 Game Jams itch.io**
  C'est le secret le mieux garde d'itch.io. Beaucoup de jams acceptent les projets deja existants (verifier les regles). En participant, tu obtiens :
  - **Visibilite** : les participants jouent aux jeux des autres pour noter
  - **Ratings** : chaque participant note les jeux → boost algorithmique
  - **Feedback** : les devs qui notent laissent souvent des commentaires detailles
  - **Communaute** : tu rencontres d'autres indie devs
  Jams a chercher : "Sports Games Jam", "Pixel Art Jam", "French Games Jam", "Cozy Games Jam"

- [ ] **7.2 — Post r/gamedev (Feedback Friday)**
  Chaque vendredi, r/gamedev (~1.3M membres) a un thread dedie : "Feedback Friday". Tu postes ton jeu et les devs testent et donnent du feedback constructif. Excellent pour des retours techniques et game design.

- [ ] **7.3 — Post r/gamedev (post-mortem technique)**
  Vers J+3-5. Format tres apprecie sur ce sub : "comment j'ai fait". Angle technique : physique custom 500 lignes, pas de Matter.js, chaque surface a sa friction. Les devs adorent les details techniques.

- [ ] **7.4 — Cross-post sur Newgrounds**
  Meme build HTML5, nouvelle audience. Newgrounds a une communaute active de joueurs web qui laissent des reviews detaillees. Bon complement a itch.io.

- [ ] **7.5 — Poster 1 GIF tous les 2-3 jours sur Twitter/X**
  Maintenir la presence. Carreaux spectaculaires, personnages rigolos, situations improbables. Hashtag #screenshotsaturday le samedi. Taguer @itchio et @randomindiedev pour des RT potentiels.

- [ ] **7.6 — Collecter et analyser les metriques itch.io**
  Dashboard itch.io : vues page, nombre de plays, taux conversion, ratings, sources de trafic. Comparer aux objectifs definis en section 1. Noter quelle source amene le plus de trafic (Reddit ? Twitter ? itch.io browse ?) pour savoir ou investir l'effort.

---

## 10. PHASE 8 — SEMAINE 2-3 : CONTENU & ANALYSE (J+7 a J+21)

> Transformer les premiers retours en ameliorations visibles.

- [ ] **8.1 — Devlog #3 : "What players taught me in one week"**
  Transparence = confiance. Partager les chiffres reels (vues, plays, taux conversion), les retours marquants, et ce que tu vas ameliorer. Ce format est populaire sur itch.io et renforce le lien avec les joueurs.

- [ ] **8.2 — Hotfixes rapides si bugs remontes**
  Reagir vite aux bugs signales en commentaires. Uploader une nouvelle version corrigee + repondre "Fixed!" au commentaire original. Un developpeur reactif transforme un joueur frustre en fan fidele.

- [ ] **8.3 — Video making-of (TikTok 30-60s ou YouTube 5-10 min)**
  Format "I made a Petanque RPG" — extremement populaire sur ces plateformes. Tu as tous les journaux de session (making-of/) et les screenshots pour ca. Deux formats :
  - **TikTok/Shorts (30-60s)** : montage rapide, avant/apres, musique catchy. Audience large.
  - **YouTube (5-10 min)** : devlog detaille avec voix off. Audience plus engagee.
  C'est le moment de capitaliser sur l'histoire du developpement.

- [ ] **8.4 — Serveurs Discord indie francais**
  GameDev FR, Indie Game Francophone, etc. Partager le jeu dans les canaux dedies aux sorties, PAS en spam. Participer aux discussions d'abord, puis mentionner le jeu naturellement. Les communautes francophones sont souvent tres accueillantes.

- [ ] **8.5 — Fiche IndieDB**
  Fiche du jeu gratuite sur IndieDB. Bon pour le SEO (Google indexe bien IndieDB) et pour la decouverte par des joueurs qui ne sont pas sur itch.io.

- [ ] **8.6 — Presse niche (bonus, pas d'attente)**
  Un mail court et personnel a 2-3 blogs indie francais : Canard PC, Game Side Story, Geeks and Com. Inclure : 1 phrase pitch, 1 GIF, le lien. Ne pas s'attendre a une reponse — si ca prend, c'est un bonus enorme.

---

## 11. PHASE 9 — MOIS 1 : DECISION STRATEGIQUE (J+21 a J+30)

> Les metriques reelles dictent la suite. Pas les suppositions.

- [ ] **9.1 — Bilan complet des metriques**
  Compiler toutes les donnees :
  | Metrique | Resultat | Objectif | Verdict |
  |---|---|---|---|
  | Vues page | ? | 500-1000 | |
  | Parties lancees | ? | 150-300 | |
  | Conversion vues→plays | ? | > 30% | |
  | Session moyenne | ? | > 5 min | |
  | Retention | ? | > 10% | |
  | Rating | ? | > 4/5 | |
  | Commentaires | ? | > 5 | |

- [ ] **9.2 — Diagnostic si metriques faibles**
  | Symptome | Diagnostic probable | Action |
  |---|---|---|
  | Conversion < 20% | La fiche ne donne pas envie | Changer le GIF, recrire la description, nouveaux screenshots |
  | Session < 3 min | L'onboarding perd les joueurs | Simplifier les 30 premieres secondes, tuto plus clair |
  | Retention < 5% | Pas de raison de revenir | Implementer Daily Challenge + Achievements |
  | Rating < 3.5 | Bug ou frustration | Lire tous les commentaires, identifier le pattern |
  | Peu de vues | Le marketing n'a pas pris | Essayer d'autres canaux, participer a plus de jams |

- [ ] **9.3 — Decision : suite du plan**
  Basee sur les metriques reelles :
  - **Metriques bonnes** → soumission CrazyGames (build `VITE_PLATFORM=crazygames`)
  - **Metriques moyennes** → iterer (quick wins, polish, plus de marketing)
  - **Metriques faibles** → pivoter (identifier le probleme fondamental avant d'investir plus)

---

## 12. ANALYTICS IN-GAME (optionnel mais recommande)

> Comprendre OU le jeu perd les joueurs pour prioriser les ameliorations.

- [ ] **12.1 — Choisir un service de tracking**
  Options gratuites recommandees :
  - **PostHog** — gratuit jusqu'a 1M events/mois, dashboard complet, open source
  - **Plausible** — leger, respectueux de la vie privee, self-hosted gratuit
  - **Google Analytics** — le plus complet mais plus lourd et questions RGPD

- [ ] **12.2 — Implementer le tracking des events cles**
  Utiliser le PortalSDK deja integre ou ajouter un service dedié. Events a tracker :
  | Event | Ce que ca revele |
  |---|---|
  | Partie lancee (arcade/quickplay) | Quel mode attire |
  | Partie terminee vs abandonnee | Ou les joueurs decrochent |
  | Personnage choisi | Popularite des personnages |
  | Match specifique atteint (match 1, 2, 3, 4, 5) | Le "mur" de difficulte |
  | Boutique ouverte / achat effectue | Engagement avec la progression |
  | Tuto complete / skippee | Qualite de l'onboarding |
  | Temps par match | Equilibre du rythme |
  | Langue selectionnee | Repartition FR/EN de l'audience |

---

## 13. CE QUI NE MARCHE PAS

A eviter absolument :

- **Spammer des liens partout sans engagement** — Les communautes Reddit/Discord detectent et bannissent le spam. Participer d'abord, partager ensuite.
- **Payer pour des pubs** — ROI nul sur un jeu web gratuit sans communaute etablie. L'argent est mieux depense en temps de developpement.
- **Attendre que itch.io te mette en avant** — Ca n'arrive que si tu as deja du trafic. La plateforme amplifie le succes existant, elle ne le cree pas.
- **Poster le meme texte partout** — Chaque subreddit a sa culture. r/PixelArt veut voir de l'art, r/WebGames veut jouer, r/gamedev veut des details techniques. Adapter le message a chaque audience.
- **Lancer un vendredi ou un lundi** — Vendredi = oublie pour le week-end. Lundi = noye dans le bruit du debut de semaine.

---

## 14. RESUME : ORDRE DE PRIORITE

Du plus important au moins important — si tu manques de temps, fais dans cet ordre :

| # | Action | Impact | Pourquoi c'est prioritaire |
|---|---|---|---|
| 1 | Cover art + GIF + Screenshots | Critique | Sans ca, personne ne clique sur la fiche |
| 2 | Page itch.io soignee (description, tags) | Critique | C'est la vitrine — elle convertit ou elle repousse |
| 3 | Post r/WebGames le jour J | Tres fort | Plus gros levier de trafic immediat |
| 4 | Game Jams itch.io (semaine 1) | Tres fort | Meilleur levier de visibilite sur la plateforme |
| 5 | Thread Twitter/X avec GIFs | Fort | Viralite potentielle, surtout avec un GIF de carreau |
| 6 | Devlog making-of TikTok/YouTube | Fort | Audience large, format populaire |
| 7 | Analytics in-game | Moyen | Pour les decisions post-lancement |
| 8 | Presse niche / IndieDB | Bonus | Cherry on top si le reste est fait |

---

## RECAPITULATIF TIMELINE

```
J-7 a J-3 ... Assets visuels (cover, GIF, screenshots)
J-5 ....... Fichiers bloquants (credits, privacy, licence, og:tags, version)
J-2 ....... Page itch.io en DRAFT (config, visuels, description, tags)
J-1 ....... Build + upload + test + devlog #1 + teaser r/PixelArt
JOUR J .... LANCEMENT : publier + Reddit + Twitter + devlog #2 + repondre a tout
J+1-J+7 ... Game Jams + Feedback Friday + Newgrounds + GIFs quotidiens
J+7-J+21 .. Devlog #3 + hotfixes + video making-of + Discord + IndieDB + presse
J+21-J+30 . Bilan metriques + decision strategique (CrazyGames ? iterer ? pivoter ?)
```

---

*Document cree le 27 mars 2026*
*Basé sur : ITCH_IO.md, PLAN_PHASE4.md, recherche marche indie 2026*
*Ref : docs/ITCH_IO.md pour les descriptions completes et builds par plateforme*
