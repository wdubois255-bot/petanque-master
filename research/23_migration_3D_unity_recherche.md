# Recherche : Migration 3D / Unity / Alternatives - Mars 2026

> Recherche exhaustive sur la migration potentielle de Phaser 2D vers Unity 3D,
> les outils IA disponibles, le deploiement mobile, et l'evaluation realiste.

---

## 1. UNITY MCP SERVER - Etat de l'art

### Qu'est-ce qu'un Unity MCP Server ?

Un MCP (Model Context Protocol) Server pour Unity est un pont entre un assistant IA (Claude, Cursor, Copilot) et l'editeur Unity. Il expose des **outils** (tools) que l'IA peut appeler pour manipuler un projet Unity : creer des GameObjects, modifier des scenes, lire les logs, executer du code C#, etc.

### Principaux projets (mars 2026)

| Projet | Stars | Derniere MAJ | Outils exposes | Points forts |
|--------|-------|-------------|----------------|--------------|
| **AnkleBreaker-Studio/unity-mcp-server** | 48 | Mars 2026 (actif) | **200+** outils en 30+ categories | Le plus complet. Build multi-plateforme, terrain, shader graph, NavMesh, particules, animation, screenshots inline. Architecture lazy-loading (~70 core + ~130 avances). |
| **notargs/UnityNaturalMCP** | 163 | Jan 2026 | 5 outils de base | Minimaliste. RefreshAssets, GetConsoleLogs, ClearLogs, RunEditModeTests, RunPlayModeTests. Extensible via SDK C#. Requiert Unity 6000.0+. |
| **isuzu-shiranui/UnityMCP** | 125 | Mai 2025 | Commands, Resources, Prompts | Framework extensible avec handlers. Architecture plugin. TCP/IP. Compatible Unity 2022.3+ et Unity 6.1. |
| **quazaai/UnityMCPIntegration** | 143 | Actif | Scene info, GameObject, code execution, filesystem | Permet l'execution de C# arbitraire dans l'editeur. WebSocket. Lecture/ecriture fichiers restreinte au projet. |
| **swax/UnityMCP-VRC** | 40 | Avr 2025 | Specialise VRChat | Niche : creation de mondes VRChat. |

### Ce que Claude peut faire via Unity MCP

**OUI, realisable :**
- Creer des GameObjects, les positionner, ajouter des composants
- Ecrire des scripts C# et les attacher aux objets
- Creer/modifier des scenes, des prefabs
- Configurer la physique, les materiaux, l'eclairage basique
- Lire les logs de la console, debugger des erreurs de compilation
- Executer des tests unitaires
- Builder le projet pour plusieurs plateformes
- Prendre des screenshots de la scene/game view

**NON, limites majeures :**
- **Pas de creation visuelle fine** : l'IA ne "voit" pas le rendu en temps reel (sauf screenshots ponctuels)
- **Pas de modelisation 3D** : l'IA ne cree pas de meshes, elle manipule des primitives ou importe des assets existants
- **Pas d'animation complexe** : creer un Animator Controller complet avec blend trees est extremement verbeux via MCP
- **Pas de level design** : placer des objets un par un via commandes est lent et imprecis vs l'editeur visuel
- **Boucle de feedback lente** : screenshot -> analyse -> correction -> screenshot... vs un humain qui voit en temps reel
- **C# verbeux** : beaucoup plus de code que JavaScript pour le meme resultat
- **Maturite variable** : ces projets ont 6-18 mois d'existence, aucun n'est "production-ready" au sens enterprise

### Verdict Unity MCP

L'Unity MCP est un **outil d'assistance au developpement**, PAS un outil de creation autonome. Claude peut aider a ecrire du code C#, debugger, et automatiser certaines taches repetitives dans Unity. Mais il ne peut PAS creer un jeu complet de facon autonome -- il a besoin d'un developpeur Unity qui dirige, teste visuellement, et fait le level design.

---

## 2. ALTERNATIVES A UNITY POUR CE TYPE DE JEU

### Godot Engine

| Aspect | Detail |
|--------|--------|
| **Type** | Open source, gratuit, pas de royalties |
| **Langages** | GDScript (Python-like), C#, C++ via GDExtension |
| **2D** | Excellent, moteur 2D dedie (pas du 3D aplati comme Unity) |
| **3D** | Correct mais inferieur a Unity/Unreal pour le rendu |
| **MCP** | **Tres bien supporte** : godot-mcp de Coding-Solo a **2400 stars** (plus que tout Unity MCP). 14+ outils : lancer l'editeur, run projet, debug, creer scenes, ajouter nodes, charger sprites. Autres repos avec 95-149 outils. |
| **Mobile** | Export Android/iOS natif (mais qualite inferieure a Unity sur mobile) |
| **Communaute** | En forte croissance, surtout depuis les changements de licence Unity (2023) |
| **Pour ce jeu** | Excellent choix pour un RPG Pokemon-style. Tilemaps, dialogues, scene system natifs. |

**Avantage majeur de Godot** : le MCP Godot est plus mature et mieux adopte (2.4k stars) que les MCP Unity. GDScript est plus simple que C# pour un projet solo. Le moteur 2D dedie est superieur a Unity pour du 2D pur.

### Unreal Engine

- **Overkill total** pour un RPG style Pokemon
- Concu pour des AAA realistes
- Blueprints complexes, build times enormes
- Pas de MCP mature
- **Non recommande** pour ce projet

### Phaser (actuel)

- Parfait pour du 2D web
- Deploiement instantane (GitHub Pages)
- Ecosystem mature pour ce type de jeu
- Limitation : pas de 3D, pas de deploiement mobile natif sans wrapper

### RPG Maker / RPG in a Box

- Tres simple pour des RPG classiques
- Trop limitant pour un systeme de petanque custom
- Pas de MCP, pas d'AI assistance
- **Non recommande**

### Recommandation

Pour un RPG Pokemon-style avec minigame de petanque :
1. **Phaser (rester en 2D)** = meilleur rapport effort/resultat si le web est la cible
2. **Godot** = meilleur choix si migration vers un moteur complet (2D ou 3D)
3. **Unity** = justifie seulement si la cible est le mobile natif ET la 3D

---

## 3. 2D vs 3D POUR CE STYLE DE JEU

### Comparaison visuelle

| Aspect | 2D Pixel Art (Phaser actuel) | 3D Chibi (Unity/Godot) |
|--------|------------------------------|------------------------|
| **Reference** | Pokemon Rouge/Or/Emeraude, Stardew Valley | Pokemon Brillant Diamond, Bravely Default |
| **Charme** | Nostalgie, pixel art iconique, style retro | Figurines 3D, effets de lumiere, camera dynamique |
| **Effort creation** | Sprites 2D (PixelLab genere en secondes) | Modeles 3D (heures/modele meme avec IA) |
| **Animations** | Spritesheets simples (4-8 frames) | Rigging + animation squelettique (complexe) |
| **Terrain petanque** | Vue top-down ou perspective fausse | Vraie perspective, physique visuelle 3D |
| **Performance** | Ultra-legere (web, mobile, tout device) | Plus lourde (GPU necessaire) |
| **Coherence visuelle** | Facile (tout est pixel art) | Difficile (mixer des assets 3D IA = incoherence) |

### La question cle : la 3D apporte-t-elle vraiment plus ?

**Pour l'exploration (monde ouvert Pokemon)** : la 2D fonctionne parfaitement. Les Pokemon classiques 2D (Gen 1-5) sont adorees. Pokemon BDSP (3D chibi) a ete critique pour son style "fade" compare aux sprites originaux.

**Pour la petanque** : c'est ici que la 3D POURRAIT ajouter de la valeur. Une vue 3D du terrain avec des boules qui roulent avec de vrais eclairages et ombres serait visuellement superieure a une vue top-down 2D. MAIS la physique custom actuelle (2D) simule deja bien le jeu.

**Verdict 2D vs 3D** : le gain visuel de la 3D ne justifie PAS l'explosion de complexite pour un projet solo. Un pixel art bien execute avec des effets de particules et du juice (camera shake, screen flash, son satisfaisant) sera plus attractif qu'une 3D mediocre avec des assets IA incohérents.

---

## 4. PIXELLAB ET LES ALTERNATIVES 3D

### PixelLab en 3D ?

PixelLab genere du **pixel art 2D uniquement**. En 3D, il est **inutile** pour les modeles, mais pourrait encore servir pour :
- Textures/sprites UI
- Portraits de personnages (2D dans une interface 3D, comme Fire Emblem)
- Icones d'items

### Outils IA de generation 3D (mars 2026)

| Outil | Type | Qualite | Prix | Formats export | Limites |
|-------|------|---------|------|----------------|---------|
| **Meshy** | Text-to-3D, Image-to-3D | 4.8/5 (G2). "Borderline game-ready" | Gratuit / Pro $20/mois / Studio $60/mois | FBX, GLB, OBJ, STL, USDZ, BLEND | Manque de coherence stylistique entre modeles. Retouche souvent necessaire. |
| **Tripo (VAST)** | Text-to-3D, Image-to-3D | Professionnel, PBR 4K. 6.5M utilisateurs. Clients : Tencent, Sony, NetEase | Gratuit + plans payants | GLB, FBX, OBJ, USD, STL | Generation ~10s. Auto-rigging + 500 animations. Segmentation intelligente. |
| **Rodin (Hyper)** | Text/Image-to-3D | Haute qualite, oriente gaming | Payant | Divers | Moins accessible, oriente entreprise |
| **CSM (Common Sense Machines)** | Image-to-3D | Bonne | API payante | GLB, OBJ | Oriente developpeurs |
| **Luma Genie** | Text-to-3D | Correcte | Gratuit/payant | GLB | Qualite variable |
| **OpenAI Point-E / Shap-E** | Open source | Basique | Gratuit | Point clouds / meshes | Qualite insuffisante pour un jeu |

### Probleme fondamental de la 3D generee par IA

Le vrai probleme n'est pas la qualite individuelle des modeles, c'est la **coherence stylistique**. Generer 50 modeles 3D pour un jeu via IA donne 50 styles differents. Un artiste 3D maintient une coherence que l'IA ne peut pas garantir.

En pixel art 2D, ce probleme est beaucoup plus facile a gerer : PixelLab avec les memes parametres (palette, taille, style) donne des resultats coherents. En 3D, la variance est enormement plus grande.

### Pipeline 3D realiste avec IA

1. Generer des modeles base via Meshy/Tripo
2. **Retoucher manuellement** dans Blender (topologie, UV, textures) -- necessite des competences 3D
3. Re-texturer pour coherence de style
4. Rigging + animation (auto-rig via Tripo/Mixamo, mais limites)
5. Import dans Unity/Godot

Temps estime par asset 3D : **2-8 heures** (vs 5-30 minutes pour un sprite PixelLab retouche).

---

## 5. DEPLOIEMENT MOBILE

### Option A : Phaser Web -> Mobile (Capacitor / PWA)

**Capacitor (Ionic)**
- Wrappe une app web dans un WebView natif (WKWebView iOS, Chrome WebView Android)
- Acces aux APIs natives via plugins (camera, GPS, notifications, IAP)
- Build vers APK (Play Store) et IPA (App Store)
- Performance : ~80-90% du natif pour des apps classiques, **mais les jeux sont plus exigeants**

| Pro | Contra |
|-----|--------|
| Reutilise 100% du code Phaser existant | Performance WebView < native pour les jeux |
| Un seul codebase web + mobile | Pas de GPU natif (WebGL dans WebView) |
| Deploy web ET mobile | Apple est strict sur les "web app wrappees" (risque de rejet App Store) |
| Gratuit et open source | Latence input superieure au natif |
| Communaute mature (Ionic) | Pas de push notifications avancees sans plugins |

**PWA (Progressive Web App)**
- Pas besoin de Capacitor, juste un manifest + service worker
- Installable depuis le navigateur (Android surtout)
- **Pas distribue via les stores** (sauf PWABuilder pour Microsoft Store)
- Performance identique au navigateur
- Pas d'acces IAP (in-app purchases) natifs

**Cordova** : predecesseur de Capacitor, obsolete, ne pas utiliser.

### Option B : Unity -> Mobile natif

| Pro | Contra |
|-----|--------|
| Performance native (IL2CPP, GPU direct) | Rewrite complet du jeu |
| Build Android + iOS + WebGL | APK plus lourd (~50-100MB vs ~5-10MB web) |
| Acces complet aux APIs natives | Licence Unity : gratuit < $200K revenus, sinon payant |
| Store deployment standard | Temps de build long (minutes vs secondes) |
| In-app purchases natifs | C# au lieu de JavaScript |
| 3D native si voulu | Complexite developpement x3-5 |

### Option C : Godot -> Mobile natif

| Pro | Contra |
|-----|--------|
| Export Android/iOS natif | Qualite mobile inferieure a Unity |
| 100% gratuit, pas de royalties | Moins de plugins store (IAP, ads) |
| GDScript simple a apprendre | Communaute mobile plus petite |
| Leger (~30MB APK) | Moins de documentation mobile |

### Recommandation mobile

**Court terme** : Capacitor est le chemin le plus rapide pour mettre le jeu sur les stores avec le code Phaser existant. Pour un jeu 2D pixel art, la performance WebView est suffisante.

**Long terme** : si le jeu a du succes et necessite des performances optimales, envisager un port Godot ou Unity.

**Attention App Store Apple** : Apple rejette parfois les apps qui sont "juste un site web emball". Il faut ajouter des fonctionnalites natives (notifications, haptics, offline) pour justifier l'app native.

---

## 6. OUTILS IA POUR LE DEVELOPPEMENT 3D (2025-2026)

### MCP Servers pour game engines

| Engine | Meilleur MCP | Stars | Maturite |
|--------|-------------|-------|----------|
| **Godot** | Coding-Solo/godot-mcp | 2400 | Le plus mature. 14+ outils. Actif. |
| **Godot** | tugcantopaloglu/godot-mcp | 38 | 149 outils. Tres complet. |
| **Godot** | HaD0Yun/Gopeak-godot-mcp | 62 | 95+ outils avec GDScript LSP et debugger. |
| **Unity** | AnkleBreaker-Studio/unity-mcp-server | 48 | 200+ outils. Le plus complet Unity. |
| **Unity** | quazaai/UnityMCPIntegration | 143 | Execution C# arbitraire. Filesystem. |
| **Blender** | (plusieurs existent) | ~100-500 | Manipulation meshes, scenes, materials |

### Outils IA complementaires

| Outil | Usage | Integration |
|-------|-------|-------------|
| **Claude Code** | Ecrire du code (C#, GDScript, JS) | Direct (c'est nous) |
| **Meshy / Tripo** | Generer des modeles 3D | API ou web, pas de MCP |
| **PixelLab** | Sprites et tilesets 2D | MCP configure |
| **ElevenLabs** | SFX et voix | MCP configure |
| **Suno / Udio** | Musique generee par IA | Web, pas de MCP |
| **Scenario.gg** | Textures coherentes pour jeux | Web + API |
| **Blockade Labs** | Skyboxes 360 HDRI | Web + API |
| **Kaedim** | Image-to-3D (oriente jeux) | API |
| **Mixamo** | Auto-rigging + animations humanoides | Web gratuit (Adobe) |
| **Cascadeur** | Animation physique realiste | Desktop app |

### Workflow IA realiste pour un jeu 3D

1. **Code** : Claude Code ecrit le code via MCP (Godot ou Unity)
2. **Modeles 3D** : Meshy/Tripo genere, Blender retouche manuellement
3. **Textures** : Scenario.gg ou Meshy pour coherence
4. **Animation** : Mixamo pour humanoides, manuel pour le reste
5. **Audio** : ElevenLabs MCP (SFX) + Suno (musique)
6. **Level design** : Manuel dans l'editeur (l'IA est mauvaise pour ca)
7. **UI** : Code via MCP, iteration visuelle manuelle

---

## 7. EVALUATION REALISTE : CLAUDE CODE + UNITY MCP

### Peut-on produire un jeu "store-quality" ?

**Reponse courte : NON, pas en autonome. OUI, comme assistant.**

### Ce que Claude + Unity MCP peut faire (realiste)

| Tache | Niveau IA | Intervention humaine |
|-------|-----------|---------------------|
| Ecrire des scripts C# (gameplay, UI, IA) | 85% | Review + debug |
| Architecture du projet (patterns, structure) | 90% | Validation |
| Physique de petanque (portage du custom engine) | 95% | Test et tuning |
| Systeme de dialogue | 80% | Contenu + UX tuning |
| Systeme de sauvegarde | 95% | Minime |
| Integration assets (import, setup materials) | 60% | Beaucoup de manuel |
| Eclairage et post-processing | 30% | Tres manuel (artistique) |
| Level design / placement objets | 10% | Presque tout manuel |
| Animation (Animator, blend trees) | 40% | Beaucoup de manuel |
| UI/UX polish | 50% | Iteration visuelle manuelle |
| Build et deploy | 70% | Config + debug |
| Son et musique | 20% (via ElevenLabs) | Choix artistiques |

### Plafond de qualite realiste

**Avec IA seule** : prototype jouable, visuellement basique (cubes colores, assets Unity store gratuits). Qualite "game jam". ~2-3/10 visuellement.

**Avec IA + dev Unity debutant** : jeu fonctionnel avec des assets IA retouches. Qualite indie basique. ~5/10.

**Avec IA + dev Unity intermediaire + artiste** : jeu polish. Qualite store indie. ~7/10.

**Reference** : un jeu comme Pokemon BDSP (3D chibi) a necessite une equipe de ~50 personnes pendant 2+ ans.

### Comparaison avec le setup actuel (Phaser 2D)

| Critere | Phaser 2D actuel | Unity 3D potentiel |
|---------|------------------|-------------------|
| Productivite Claude | Tres haute (JS simple, edit direct) | Moyenne (C#, MCP indirect, feedback lent) |
| Qualite visuelle atteignable | 7/10 (bon pixel art) | 4-6/10 (3D mediocre sans artiste) |
| Temps pour finir le MVP | 2-3 sprints restants | 6-12 mois de rewrite |
| Deploiement web | Instantane (GitHub Pages) | Possible (WebGL) mais lourd |
| Deploiement mobile | Capacitor (rapide) | Natif (meilleur perf) |
| Risque | Faible (tout fonctionne deja) | Eleve (tout a refaire) |

---

## 8. EFFORT DE MIGRATION PHASER 2D -> UNITY 3D

### Ce qui doit etre REFAIT de zero

| Element | Raison | Effort estime |
|---------|--------|---------------|
| Toutes les scenes (Boot, Title, Overworld, Petanque, Dialog, UI) | Phaser scenes != Unity scenes | 3-4 semaines |
| Systeme de mouvement grille | Phaser Arcade -> Unity CharacterController ou custom | 1 semaine |
| Rendering/camera | Totalement different | 1 semaine |
| Systeme de dialogue (rexUI) | Pas d'equivalent direct Unity | 2 semaines |
| Tilemaps | Tiled JSON -> Unity Tilemap ou ProBuilder | 2 semaines |
| Systeme d'input | Phaser input -> Unity Input System | 3 jours |
| UI overlay (HUD, score) | Phaser -> Unity Canvas/UI Toolkit | 1 semaine |
| Tous les assets visuels | Sprites 2D -> modeles 3D | **4-8 semaines** (le plus gros poste) |
| Build pipeline | Vite -> Unity build | 2 jours |

### Ce qui peut etre PRESERVE (partiellement)

| Element | Comment | Effort adaptation |
|---------|---------|-------------------|
| Logique de physique petanque (Ball.js, PetanqueEngine.js) | Portage JS -> C# quasi-direct. Les formules de friction, collision, restitution restent les memes. | 2-3 jours |
| IA petanque (PetanqueAI.js) | Portage direct, la logique est independante du moteur | 1 jour |
| Donnees JSON (npcs.json, boules.json, progression.json) | Reutilisables directement avec JsonUtility ou Newtonsoft | 1 heure |
| Systeme de scoring (PetanqueEngine.js) | Portage direct | 1 jour |
| Regles de jeu (state machine) | Portage direct | 1 jour |
| Contenu textuel (dialogues) | Reutilisable | 0 |
| Architecture conceptuelle (scenes, separation concerns) | Transposable en patterns Unity | Design only |

### Estimation totale de migration

| Scenario | Duree estimee | Prerequis |
|----------|---------------|-----------|
| Dev solo + Claude, jamais utilise Unity | 4-6 mois | Apprendre C# et Unity |
| Dev solo + Claude, connait Unity | 2-3 mois | Avoir des assets 3D |
| Dev + artiste 3D + Claude | 2-4 mois | Budget artiste |

**A comparer avec** : finir le MVP Phaser actuel = **2-4 semaines** (Sprints 4.0 a 4.2 restants).

---

## SYNTHESE ET RECOMMANDATION

### Matrice de decision

| Critere | Rester Phaser 2D | Migrer Godot 2D | Migrer Unity 3D |
|---------|-------------------|-----------------|-----------------|
| Temps pour MVP jouable | **2-4 semaines** | 6-8 semaines | 4-6 mois |
| Qualite visuelle finale | 7/10 (pixel art) | 7/10 (pixel art) | 5-7/10 (3D IA) |
| Effort Claude Code | Maximal (direct JS) | Bon (GDScript + MCP mature) | Moyen (C# + MCP jeune) |
| Deploiement web | Immediat | Export HTML5 | WebGL (lourd) |
| Deploiement mobile | Capacitor | Natif Android/iOS | Natif Android/iOS |
| Cout | 0 EUR | 0 EUR | 0-2000 EUR/an (Unity + assets) |
| Risque | Minimal | Moyen (rewrite partiel) | Eleve (rewrite total + 3D) |
| Fun du joueur | Depend du game feel, PAS du 2D/3D | Idem | Idem |

### Recommandation finale

**RESTER SUR PHASER 2D** pour le MVP et le lancement.

Raisons :
1. Le jeu est a **80% termine** (Sprints 0-3.5 faits). Migrer maintenant = jeter 80% du travail.
2. La 3D ne rend PAS un jeu plus fun. Le game feel (juice, son, feedback) compte 10x plus que le nombre de dimensions.
3. Les assets 3D generes par IA manquent de coherence stylistique. Un bon pixel art bat une mauvaise 3D.
4. Claude Code est **beaucoup plus productif** en JavaScript direct qu'en C# via MCP.
5. Le deploiement mobile via Capacitor est une solution viable et rapide.
6. Les jeux pixel art 2D marchent excellemment sur les stores (Stardew Valley, Coromon, Nexomon).

### Si un jour la 3D est souhaitee

1. **Finir le MVP 2D d'abord** -- valider le gameplay
2. Envisager **Godot** plutot qu'Unity (gratuit, MCP plus mature, GDScript simple)
3. Commencer par la scene de petanque en 3D (la seule ou ca apporterait un vrai plus visuel)
4. Garder l'exploration en 2D (fonctionne parfaitement)
5. Utiliser Meshy/Tripo pour generer des assets boules et terrain, Mixamo pour les personnages

---

## SOURCES

- GitHub : AnkleBreaker-Studio/unity-mcp-server (200+ outils, mars 2026)
- GitHub : notargs/UnityNaturalMCP (163 stars, jan 2026)
- GitHub : isuzu-shiranui/UnityMCP (125 stars, extensible)
- GitHub : quazaai/UnityMCPIntegration (143 stars, code execution)
- GitHub : Coding-Solo/godot-mcp (2400 stars, le plus mature)
- GitHub : tugcantopaloglu/godot-mcp (149 outils)
- GitHub : HaD0Yun/Gopeak-godot-mcp (95+ outils, LSP + debugger)
- Meshy.ai (Text/Image-to-3D, $20-60/mois, FBX/GLB/OBJ)
- Tripo3D.ai (VAST, 6.5M users, clients Sony/Tencent, GLB/FBX/USD)
- Capacitor (Ionic, wrapper web -> natif mobile)
- Docs Godot Engine (2D/3D, GDScript/C#/C++)
- ModelContextProtocol.io (specification officielle MCP)
