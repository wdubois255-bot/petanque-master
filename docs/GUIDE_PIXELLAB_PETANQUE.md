# Guide PixelLab - Petanque Master

Guide pas-a-pas pour generer les assets du jeu sur pixellab.ai.
Chaque section = 1 technique, avec ou aller, quoi ecrire, et les reglages optimaux.

---

## Avant de commencer

1. Va sur **https://pixellab.ai** et connecte-toi
2. Ouvre **Pixelorama** (editeur en ligne) : c'est la meilleure interface pour tout faire
3. Garde sous la main le sprite de Ley (`public/assets/sprites/ley_animated.png`) — c'est notre **ancre de style**

### Reglages globaux a toujours utiliser

| Parametre | Valeur | Pourquoi |
|-----------|--------|----------|
| View | `low top-down` | C'est la vue de notre jeu |
| Direction | `south` (puis les autres) | Face camera d'abord |
| Outline | `single color black outline` | Coherent avec nos sprites |
| Shading | `detailed shading` | Bon niveau de detail pour 64x64 |
| Detail | `highly detailed` | Maximise la qualite |
| No Background | **TOUJOURS cocher** | Fond transparent obligatoire |
| Taille | `64x64` pour persos, `32x32` pour items/tiles | Notre standard |

---

## TECHNIQUE 1 : Regenerer Marcel (Style Reference)

**Ou** : Pixelorama → Create Image → **Create from Style Reference** (Pro)

### Etape 1 — Preparer les references de style
- Clique "Add style image"
- Upload **5-10 frames de nos personnages existants** (pas le spritesheet entier !) :
  - Extrais des frames individuelles 128x128 de `ley_animated.png` (face sud)
  - Extrais des frames de `la_choupe_animated.png`, `reyes_animated.png`
  - L'idee : montrer a PixelLab notre style visuel

### Etape 2 — Ecrire le prompt Marcel

```
elderly provencal petanque player, 70 years old man,
wearing a beige flat cap casquette on his head,
red polo shirt with white collar, beige cotton trousers, brown leather shoes,
thick white mustache, tanned weathered face with wrinkles, small kind wise eyes,
standing still in a relaxed upright pose, arms resting at sides,
holding a shiny metallic petanque boule in his right hand,
south of france countryside old champion, warm and dignified expression
```

**Pourquoi c'est long** : les videos montrent que les prompts detailles donnent de bien meilleurs resultats que "old man with hat".

### Etape 3 — Style Description (champ avance)
```
pixel art RPG character, low top-down view, warm provencal palette,
ochre and terracotta tones, clean readable silhouette
```

### Etape 4 — Generer et choisir
- Tu obtiens 4-16 variations selon la taille
- Choisis celui qui ressemble le plus a nos autres persos
- **Astuce video 2** : si la tete est un peu floue, copie-colle la tete depuis la version statique vers les frames animees dans Pixelorama

### Etape 5 — Rotations
Avec le resultat face sud, utilise **Rotate** pour generer est, ouest, nord.
Ou regenere dans chaque direction avec le meme prompt.

---

## TECHNIQUE 2 : Expressions faciales (Inpaint)

**Ou** : Pixelorama → Edit Image → **Inpaint v3**

C'est la technique la plus rapide et la moins chere. On modifie juste une zone du sprite.

### Etape 1 — Ouvrir le sprite de base
- Importe le sprite face sud d'un personnage (ex: Ley)
- C'est notre image de depart

### Etape 2 — Peindre la zone a modifier
- Active le mode Inpainting (calque special)
- Peins UNIQUEMENT sur les yeux et la bouche (zone ~10x10 pixels)
- Le reste du corps ne sera PAS touche

### Etape 3 — Prompts par expression

**Content (point marque)** :
```
wide happy smile, eyes squinting with joy, eyebrows slightly raised,
pleased and satisfied expression
```

**Frustre (point perdu)** :
```
frowning face, eyebrows angled downward, mouth slightly open in disbelief,
disappointed annoyed expression
```

**Concentre (avant le lancer)** :
```
focused concentrated expression, eyes narrowed and sharp,
mouth tight with determination, intense gaze
```

**Victorieux (mene gagnee)** :
```
huge excited grin, eyes wide open with excitement,
mouth open celebrating, pure joy and triumph
```

### Etape 4 — Generer
- Methode de sortie : "New layer" (pour comparer avec l'original)
- Cocher "Remove background"
- Si le resultat ne convient pas, regenere avec un seed different

### Repetition
Faire ca pour les 6 personnages = 24 sprites d'expression (6 persos x 4 expressions).
Cout tres faible (inpaint = generations les moins cheres).

---

## TECHNIQUE 3 : Animation de lancer enrichie (Animate with Text)

**Ou** : Pixelorama → Animate → **Animate with Text (New)**

C'est LE gros upgrade pour notre jeu. Nos lancers actuels ont 4-5 frames, on peut monter a 8-16.

### Etape 1 — Preparer l'image de reference
- Ouvre le sprite face sud du personnage (64x64)
- Ce sera la frame 1 de l'animation (preservee automatiquement)

### Etape 2 — Choisir le nombre de frames
- En 64x64 : jusqu'a **16 frames** possibles
- Recommande : **8 frames** (bon compromis fluidite/cout)

### Etape 3 — Ecrire le prompt d'animation

**CRUCIAL** : ne pas juste ecrire "throw". Ecrire un paragraphe detaille.

**Prompt generique lancer petanque** :
```
The petanque player shifts weight to back foot, bends knees slightly,
swings right arm backward holding a metallic boule at hip level,
pauses briefly in concentration, then smoothly accelerates arm forward
in an underhand throwing motion, releases the boule at the lowest point
of the swing, follows through with arm extending upward and forward,
body leaning into the throw with momentum
```

**Variantes par personnage** :

Marcel (vieux maitre, geste precis et economique) :
```
The elderly player makes a careful measured throw, minimal body movement,
precise wrist flick releasing the boule with practiced accuracy,
subtle knee bend, arm swings smoothly in a gentle controlled arc,
experienced economical motion with perfect form
```

Ley (puissant, athlétique) :
```
The athletic player performs a powerful throwing motion,
deep knee bend loading energy, explosive arm swing backward then forward,
releasing the boule with force, body rotating with the throw,
dynamic follow-through with arm fully extended, strong momentum
```

La Choupe (brute, lancer de force) :
```
The muscular player winds up aggressively, wide stance power position,
arm pulls far back with the boule, explosive forward thrust,
releasing with raw power, body lunging forward with the throw,
intense forceful follow-through
```

Le Magicien (elegant, geste artistique) :
```
The mysterious player performs an elegant theatrical throw,
graceful arm movement in a smooth arc, precise delicate wrist motion,
the boule seems to float from the hand, minimal effort maximum control,
stylish follow-through with a flourish
```

### Etape 4 — Chaingage pour animations longues (Astuce video 7)
Si 8 frames ne suffisent pas :
1. Prends la **derniere frame** generee
2. Remets-la comme **image de reference**
3. Ecris un nouveau prompt pour la phase suivante (ex: "recovery, standing back up")
4. Genere 4-8 frames supplementaires
5. Assemble le tout → animation de 12-16 frames !

### Reglages recommandes
- `text_guidance_scale` : 8.0 (defaut, bon equilibre)
- `image_guidance_scale` : 1.4 (defaut, respecte le sprite original)

---

## TECHNIQUE 4 : UI Provencale (Generate UI)

**Ou** : Pixelorama → Create Image → **Generate UI Elements** (Pro)

### Etape 1 — Generer le panneau principal (ancre UI)
Taille : 128x64

```
rustic wooden game scoreboard panel, warm oak wood texture,
golden metal corner ornaments, provencal mediterranean style,
petanque game score display, ochre and terracotta color palette,
hand-carved wooden frame, pixel art game UI
```

### Etape 2 — Utiliser comme image conceptuelle pour le reste
Une fois le panneau genere, utilise-le comme **concept image** pour tous les autres elements :

**Bouton jouer** (64x32) :
```
rounded wooden button, same warm oak style, golden border,
slightly raised 3D press effect, game menu button
```

**Boite de dialogue** (128x48) :
```
parchment paper dialog box, wooden border frame,
cream interior, speech bubble for character dialogue
```

**Jauge de puissance** (96x16) :
```
horizontal power meter bar, wooden frame surround,
gradient fill green to yellow to red, throwing power indicator
```

**Cadre portrait** (48x48) :
```
square ornate wooden portrait frame, golden corner filigree,
empty center for character mugshot
```

**Palette** : utilise la palette provencale du jeu
- Ocre : #D4A574
- Terracotta : #C4854A
- Olive : #6B8E4E
- Creme : #F5E6D0
- Lavande : #9B7BB8

---

## TECHNIQUE 5 : Items boutique en batch (Style Reference)

**Ou** : Pixelorama → Create Image → **Create from Style Reference** (Pro)

### Etape 1 — Preparer les references
Upload nos sprites de boules existants comme references de style :
- `boule_acier.png`, `boule_bronze.png`, `boule_chrome.png` etc.
- Ca definit notre style "objet de jeu petanque"
- Taille : 32x32

### Etape 2 — Prompts pour les items

En 32x32, on peut obtenir jusqu'a **64 items d'un coup** ! Mais mieux vaut faire par theme.

**Equipement** :
```
leather petanque glove, stitched details, game equipment item
```
```
canvas boule carrying pouch with strap, three boule shapes inside
```
```
hand chalk powder bag, white powder, grip improvement item
```
```
brass precision measuring compass, distance tool
```

**Trophees et recompenses** :
```
small bronze trophy cup, petanque award, ornate base
```
```
golden trophy cup, first place award, laurel wreath
```
```
golden star medal with red ribbon, achievement reward
```

**Cosmetiques** :
```
traditional french beret hat, dark navy blue
```
```
aviator sunglasses, golden frame, dark lenses
```
```
provencal straw hat, wide brim, summer accessory
```

**Consommables** :
```
small pastis bottle, amber yellow liquid, healing powerup
```
```
lavender sachet, purple fabric, luck boost item
```

### Style Description (avance) :
```
pixel art game icon, top-down view, warm provencal palette,
clean readable silhouette, 32x32 game item
```

---

## TECHNIQUE 6 : Animations environnement (Animate with Text)

**Ou** : Pixelorama → Animate → **Animate with Text (New)**

Pour donner vie a nos terrains de petanque.

### Fontaine animee (terrain Village)
- Taille : 32x32, jusqu'a 16 frames
- Reference : sprite `decor_fontaine.png`
```
stone fountain with flowing water, water splashing upward then falling,
continuous water cycle loop, sparkling droplets
```

### Arbre au vent
- Reference : sprite `decor_olivier.png`
```
olive tree gently swaying in a warm breeze, leaves rustling,
subtle branch movement, peaceful mediterranean wind
```

### Drapeaux/fanions
- Taille 32x32
```
small triangular pennant flag fluttering in the wind,
provencal colored fabric, gentle waving motion loop
```

---

## TECHNIQUE 7 : Walk Cycles complets (Character Creator)

**Ou** : Page **Characters** (https://pixellab.ai/characters)

Pour l'Overworld, on aura besoin de walk cycles 8 directions pour les NPCs.

### Etape 1 — Importer le sprite existant
- "Import your own character"
- Upload le sprite face sud 64x64
- Ou utilise "Create from concept" avec une image de reference

### Etape 2 — Generer les rotations
- Le Character Creator genere automatiquement 4 ou 8 directions
- Choisir 4 directions pour commencer (sud, est, ouest, nord)

### Etape 3 — Ajouter l'animation de marche
- Clique "Add your first animation"
- Choisir "Walk" → 6 frames
- Direction de depart : sud-est
- **Astuce video 2** : utiliser le miroir pour SO a partir de SE (si perso symetrique)

### Etape 4 — Nettoyage obligatoire
- Ouvrir dans Pixelorama
- **Copier-coller la tete** des rotations statiques vers les frames animees
- Corriger les inconsistances (sac a dos, accessoires qui changent de taille)
- Cette etape est CRITIQUE pour un rendu propre

---

## Recapitulatif : par ou commencer

| Priorite | Technique | Temps estime | Cout estime |
|----------|-----------|-------------|-------------|
| 1 | Expressions faciales (Inpaint) | 30 min | Tres faible |
| 2 | Animation lancer enrichie | 1h | Moyen |
| 3 | Marcel v2 (Style Reference) | 45 min | Moyen |
| 4 | UI provencale | 30 min | Moyen |
| 5 | Items boutique batch | 20 min | Faible (32x32) |
| 6 | Animations environnement | 30 min | Moyen |
| 7 | Walk cycles NPCs | 1h+ par perso | Eleve |

**Commence par les expressions** — c'est le plus rapide, le moins cher, et ca donne un feedback visuel immediat dans le jeu (reactions des personnages quand ils marquent/perdent).

---

## Conseils generaux (extraits des 8 videos)

1. **Prompt detaille > prompt court** : "walking" donne un resultat OK, un paragraphe detaille donne un resultat excellent
2. **Utiliser un LLM pour les prompts** : demande a Claude d'ecrire les descriptions d'animation
3. **Toujours nettoyer dans Pixelorama** : l'IA genere 80% du travail, tu fais les 20% de polish
4. **Copier-coller la tete** : c'est LE tip #1 de la video 2 — la tete des rotations est toujours plus nette
5. **Chaingage de frames** : derniere frame → nouvelle reference → generer la suite
6. **Image conceptuelle = style lock** : pour l'UI, genere 1 element, puis utilise-le comme ref pour tous les autres
7. **Moins c'est plus** : en pixel art, 8 frames bien choisies > 16 frames moyennes
8. **Miroir pour les directions** : SE → SO en un clic si le perso est symetrique

---

## Export et integration

Une fois tes sprites prets dans Pixelorama :
1. **Export** → Sprite sheet → PNG → Taille max (1000%)
2. Copie dans `public/assets/sprites/`
3. Dis-moi ce que tu as genere, je m'occupe de :
   - Charger les nouveaux assets dans BootScene
   - Creer les animations Phaser
   - Integrer dans les scenes (expressions, lancer, UI)
   - Mettre a jour les constantes et le code
