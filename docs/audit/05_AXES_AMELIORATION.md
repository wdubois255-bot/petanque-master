# 05 - Axes d'amelioration

Tous les axes identifies, classes par priorite et impact.

---

## PRIORITE 1 : Game Feel & Immersion (Sprint 4.0)
*Ce qui rend le jeu FUN et memorable*

### 1.1 Ralenti dramatique
**Etat :** Non implemente (prevu Sprint 4.0)
**Quoi :** Quand la boule passe a <40px du cochonnet et vitesse <2, passer en slow-motion 0.3x
**Pourquoi :** C'est LE moment de tension en petanque. Sans ralenti, les beaux coups passent inapercus.
**Impact :** ENORME sur le game feel
**Effort :** 2h

### 1.2 Animation de lancer du personnage
**Etat :** Le personnage est statique au moment du tir
**Quoi :** Ajouter des frames de lancer (bras en arriere -> lancer -> follow-through)
**Pourquoi :** Le moment du tir est le climax de l'action, il doit etre visuellement impactant
**Impact :** Fort
**Effort :** 3h (sprites + integration)

### 1.3 Reactions des personnages
**Etat :** Aucune reaction visuelle apres un point
**Quoi :** Sprites de joie (saut, poing en l'air), deception (tete basse, main sur visage)
**Pourquoi :** Le feedback emotionnel des personnages cree l'attachement
**Impact :** Fort
**Effort :** 4h (sprites + animations + triggers)

### 1.4 Musique de fond
**Etat :** Silence total
**Quoi :** Chiptune legere provencale pendant les matchs, theme titre, jingle victoire/defaite
**Pourquoi :** La musique definit 50% de l'ambiance. Un jeu muet perd enormement.
**Impact :** ENORME
**Effort :** 3h (Beepbox + integration)

### 1.5 SFX plus riches
**Etat :** Audio procedural basique (Web Audio oscillateurs)
**Quoi :** Remplacer par des vrais samples : clac metallique, roulement gravier, ambiance cigales
**Pourquoi :** Les SFX actuels sonnent "synthetique". Des vrais sons = immersion
**Impact :** Fort
**Effort :** 2h (ElevenLabs MCP + integration)

### 1.6 Trails et particles au lancer
**Etat :** La boule vole sans trace
**Quoi :** Trail de poussiere au sol, particules a l'impact, etoiles au carreau
**Pourquoi :** "Juice" visuel = satisfaction du joueur
**Impact :** Moyen-Fort
**Effort :** 2h

### 1.7 Celebration inter-menes
**Etat :** Score mis a jour silencieusement
**Quoi :** Animation de transition entre menes (score qui monte, flash, son)
**Pourquoi :** Chaque mene gagnee doit etre un moment de satisfaction
**Impact :** Moyen
**Effort :** 1h30

---

## PRIORITE 2 : UX & Accessibilite
*Ce qui rend le jeu jouable et comprehensible*

### 2.1 Tutoriel / Premier match guide
**Etat :** Aucun tutoriel
**Quoi :** Premier match d'arcade avec instructions step-by-step :
  - "Glissez pour viser" -> "Relachez pour lancer" -> "Choisissez votre technique"
**Pourquoi :** Le drag-and-release n'est PAS intuitif. Les 4 modes de loft sont confusants.
**Impact :** CRITIQUE pour la retention des nouveaux joueurs
**Effort :** 4h

### 2.2 Ecran de pause
**Etat :** Aucun moyen de quitter un match en cours
**Quoi :** Touche Echap -> menu pause (Reprendre / Recommencer / Quitter)
**Pourquoi :** Fonctionnalite standard attendue par tout joueur
**Impact :** Fort
**Effort :** 1h30

### 2.3 Menu options
**Etat :** Aucun parametre accessible
**Quoi :** Volume musique, volume SFX, vitesse du jeu, controles
**Pourquoi :** Standard dans tout jeu
**Impact :** Moyen
**Effort :** 2h

### 2.4 Indicateur de tour plus visible
**Etat :** Fleche de tour presente mais subtile
**Quoi :** Bande laterale coloree + nom du joueur actif + highlight du personnage actif
**Pourquoi :** Clarifier qui joue, surtout pour les spectateurs
**Impact :** Moyen
**Effort :** 1h

### 2.5 Navigation clavier complete
**Etat :** Certaines scenes ne supportent que la souris
**Quoi :** Toutes les scenes navigables au clavier (fleches + Entree)
**Pourquoi :** Accessibilite, confort, support gamepad futur
**Impact :** Moyen
**Effort :** 3h

### 2.6 Support mobile / touch
**Etat :** Non teste, potentiellement fonctionnel via Phaser input
**Quoi :** Tester et adapter le drag-and-release pour ecrans tactiles
**Pourquoi :** Le web = beaucoup de joueurs mobiles
**Impact :** Fort (audience)
**Effort :** 4h (test + fix)

---

## PRIORITE 3 : Contenu & Profondeur
*Ce qui donne de la rejouabilite*

### 3.1 Portraits HD personnages
**Etat :** Dossier portraits vide, aucun portrait genere
**Quoi :** 6 portraits haute-resolution (128x128 ou 256x256) via PixelLab
**Pourquoi :** Le modele Fire Emblem GBA (sprite + portrait) est la vision du projet.
  Les portraits donnent de la personnalite et du "wow" a la selection personnage.
**Impact :** Fort (premiere impression)
**Effort :** 3h (generation + integration)

### 3.2 Systeme de deblocage
**Etat :** progression.json existe mais n'est pas integre
**Quoi :** Debloquer boules, terrains, cochonnets en jouant. Criteres : victoires, carreaux, scores.
**Pourquoi :** Boucle de retention : jouer -> debloquer -> rejouer avec du nouveau
**Impact :** Fort (rejouabilite)
**Effort :** 4h

### 3.3 Statistiques joueur
**Etat :** Aucune stat persistee
**Quoi :** Victoires, defaites, carreaux, meilleur score mene, temps joue, par personnage
**Pourquoi :** Les stats donnent un sentiment de progression et de maitrise
**Impact :** Moyen
**Effort :** 3h

### 3.4 Mode entrainement
**Etat :** Absent
**Quoi :** Terrain libre, boules infinies, pas de score. Pour pratiquer les techniques.
**Pourquoi :** Permet d'apprendre sans la pression du match
**Impact :** Moyen
**Effort :** 2h (variante de QuickPlay sans IA, boules illimitees)

### 3.5 Variantes de regles
**Etat :** Uniquement FIPJP standard
**Quoi :** Options : victoire a 11 points, 5 boules/joueur, terrain random, etc.
**Pourquoi :** Variete = rejouabilite
**Impact :** Moyen
**Effort :** 2h

### 3.6 Personnage additionnel / DLC gratuit
**Etat :** 6 personnages (dont 1 secret)
**Quoi :** Ajouter 2-3 personnages avec des archetypes nouveaux (Le Debutant, Le Veterane, Le Tricheur)
**Pourquoi :** Plus de personnages = plus de rejouabilite, plus de matchups
**Impact :** Moyen
**Effort :** 4h par personnage (stats + sprites + AI archetype + integration)

---

## PRIORITE 4 : Qualite technique
*Ce qui evite les bugs et facilite le developpement*

### 4.1 Centraliser _getCharSpriteKey()
**Etat :** Duplique dans 4+ fichiers
**Quoi :** Un seul helper dans Character.js ou utils/
**Pourquoi :** DRY, maintenance
**Effort :** 30min

### 4.2 ButtonFactory / style constants
**Etat :** Styles boutons dupliques dans chaque scene
**Quoi :** Factoriser les styles dans Constants.js ou une classe ButtonFactory
**Pourquoi :** Coherence visuelle, maintenance
**Effort :** 1h

### 4.3 Cache de textures canvas
**Etat :** TerrainRenderer regenere le terrain a chaque match
**Quoi :** Cacher les textures par cle (terrain_type + seed), ne pas regenerer si deja en memoire
**Pourquoi :** Performance au demarrage du match
**Effort :** 2h

### 4.4 Tests en CI/CD
**Etat :** Tests existent mais ne tournent pas automatiquement
**Quoi :** GitHub Actions workflow : npm test + npm run build a chaque push
**Pourquoi :** Detecter les regressions automatiquement
**Effort :** 2h

### 4.5 Guards FSM
**Etat :** PetanqueEngine change d'etat sans validation
**Quoi :** Ajouter une matrice de transitions valides, rejeter les transitions illegales
**Pourquoi :** Eviter les etats impossibles (bug scoring)
**Effort :** 2h

### 4.6 Tests unitaires SaveManager & SoundManager
**Etat :** 0% de couverture
**Quoi :** Tests basiques : save/load, format, erreurs, audio init/play
**Pourquoi :** Ces modules touchent au systeme (localStorage, Web Audio) = fragiles
**Effort :** 2h

---

## PRIORITE 5 : Vision long terme
*Ce qui transforme le jeu en produit complet*

### 5.1 Mode aventure (overworld)
**Etat :** Scaffold 30% (Player, NPC, MapManager existent, maps non deployees)
**Quoi :** Monde ouvert explorable avec PNJ, arenes, quetes
**Pourquoi :** La vision originale du projet (STORY.md, CAHIER_DES_CHARGES.md)
**Impact :** ENORME (differenciation)
**Effort :** 20-30h

### 5.2 Multijoueur en ligne (async)
**Etat :** Non implemente, prevu dans GAME_DESIGN.md
**Quoi :** Turn-based async : chaque joueur joue son tour, synchro via serveur minimal
**Pourquoi :** Le versus en ligne est le mode le plus engage
**Impact :** ENORME
**Effort :** 15-20h (necessite un backend minimal)

### 5.3 Doublette (2v2) et Triplette (3v3)
**Etat :** Non implemente, regles definies
**Quoi :** 2v2 (6 boules/equipe) et 3v3 (6 boules/equipe, 2 par joueur)
**Pourquoi :** Formats officiels de la petanque, variete
**Impact :** Fort
**Effort :** 8-12h

### 5.4 Leaderboard / classement
**Etat :** Absent
**Quoi :** Classement local (meilleurs scores) + en ligne (si backend)
**Pourquoi :** Competition, motivation
**Impact :** Moyen
**Effort :** 4h (local) / 10h (en ligne)

### 5.5 Systeme de collection
**Etat :** Scaffold dans boules.json
**Quoi :** Collectionner des boules speciales, cochonnets rares, accessoires personnages
**Pourquoi :** Boucle de collection = retention long terme
**Impact :** Moyen
**Effort :** 6h

### 5.6 Integration histoire (STORY.md)
**Etat :** Scenario complet ecrit, non integre
**Quoi :** Integrer "L'Heritier de la Ciotat" comme mode campagne narratif
**Pourquoi :** L'histoire est riche (Auguste, Bastien, Marius) et differenciante
**Impact :** Fort
**Effort :** 15-20h

---

## Matrice priorite / impact / effort

### Quick wins (haut impact, faible effort)
| Axe | Impact | Effort |
|-----|--------|--------|
| 1.7 Celebration inter-menes | Moyen | 1h30 |
| 2.2 Ecran de pause | Fort | 1h30 |
| 4.1 Centraliser _getCharSpriteKey | Maintenance | 30min |
| 2.4 Indicateur de tour plus visible | Moyen | 1h |

### Investissements strategiques (haut impact, effort modere)
| Axe | Impact | Effort |
|-----|--------|--------|
| 1.1 Ralenti dramatique | ENORME | 2h |
| 1.4 Musique de fond | ENORME | 3h |
| 1.5 SFX plus riches | Fort | 2h |
| 2.1 Tutoriel | CRITIQUE | 4h |
| 3.1 Portraits HD | Fort | 3h |
| 1.6 Trails et particules | Moyen-Fort | 2h |

### Gros chantiers (haut impact, effort eleve)
| Axe | Impact | Effort |
|-----|--------|--------|
| 5.1 Mode aventure | ENORME | 20-30h |
| 5.2 Multijoueur en ligne | ENORME | 15-20h |
| 5.6 Integration histoire | Fort | 15-20h |
| 5.3 Doublette/Triplette | Fort | 8-12h |

---

## Ordre de mise en oeuvre recommande

### Phase A : Game Feel immediat (1-2 sessions)
1. Ralenti dramatique (1.1)
2. Musique chiptune (1.4)
3. SFX reels (1.5)
4. Trails/particules (1.6)
5. Celebration inter-menes (1.7)

### Phase B : UX fondamentale (1-2 sessions)
6. Tutoriel premier match (2.1)
7. Ecran de pause (2.2)
8. Portraits HD (3.1)
9. Indicateur de tour (2.4)
10. Menu options basique (2.3)

### Phase C : Profondeur (2-3 sessions)
11. Animation lancer personnage (1.2)
12. Reactions personnages (1.3)
13. Systeme de deblocage (3.2)
14. Statistiques joueur (3.3)
15. Mode entrainement (3.4)

### Phase D : Technique (en continu)
16. Centraliser code duplique (4.1, 4.2)
17. Cache textures (4.3)
18. CI/CD tests (4.4)
19. Guards FSM (4.5)

### Phase E : Vision (moyen-long terme)
20. Mode aventure (5.1)
21. Multijoueur async (5.2)
22. Doublette/triplette (5.3)
23. Integration histoire (5.6)
24. Systeme de collection (5.5)
