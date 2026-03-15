# Recherche : Guide Qualite Sprites PixelLab pour Petanque Master

## 1. Outils PixelLab MCP Disponibles

| Outil | Usage | Cout estime |
|-------|-------|-------------|
| `generate-image-pixflux` | Generer le sprite de base (face sud) | ~$0.10-0.30 |
| `rotate` | Tourner vers est/ouest/nord | ~$0.10-0.30/direction |
| `animate-with-text` | 4 frames de marche par direction | ~$0.20-0.40/direction |

**Cout total par personnage complet** (4 directions x 4 frames) : **~$1.50-3.00**

## 2. Les 10 Regles d'Or du Pixel Art 32x32

### Regle 1 : Palette verrouillee = coherence visuelle
- 16-32 couleurs MAX pour tout le jeu. Chaque sprite utilise 4-8 couleurs max.
- Palette Provencale :
  - Ocres #D4A574, Terracotta #C4854A, Olive #6B8E4E
  - Lavande #9B7BB8, Ciel #87CEEB, Creme #F5E6D0
  - Ombres #3A2E28 (jamais de noir pur)
- Tout asset genere doit etre normalise sur cette palette apres generation.

### Regle 2 : Hue Shifting (LA technique pro)
- Ne jamais assombrir en ajoutant du noir :
  - Ombres -> decaler la teinte vers bleu/violet, desaturer legerement
  - Lumieres -> decaler vers jaune/blanc chaud, saturer legerement
- Exemple : ombre terracotta = brun-violet chaud, pas terracotta fonce

### Regle 3 : Silhouette d'abord
- Si le personnage n'est pas reconnaissable en silhouette noire, redesigner
- A 32x32, chaque pixel compte

### Regle 4 : Les yeux = la personnalite
- Yeux : 2px de large, tiers superieur de la tete
- Deplacer 1 pixel change radicalement l'expression

### Regle 5 : Outline brun chaud #3A2E28
- Technique selout : contour cote lumiere plus clair, cote ombre reste fonce

### Regle 6 : Proportions chibi pour 32x32
- Tete : 8-10px (ratio 1:2 ou 1:2.5 tete/corps)
- Corps : 14-16px. Bras/jambes au moins 2px de large
- Padding : 2-4px haut/bas pour headroom animation

### Regle 7 : Animations economiques mais efficaces
- Marche : 4 frames (contact droit, passing, contact gauche, passing)
- Body bob : 1-2px vertical max
- Timing : 100-150ms par frame
- Tete stable (le joueur suit la tete du regard)

### Regle 8 : L'IA genere un brouillon, pas un asset final
1. Grid snap (aligner pixels sur grille)
2. Palette normalization (remplacer couleurs par palette verrouillee)
3. Fix outlines (uniformiser contour 1px)
4. Test a taille reelle (2x sur fond de jeu)

### Regle 9 : Tilesets seamless avec variations
- Test 2x2 pour verifier absence de coutures
- 2-3 variations de pixels par tile
- Densite de detail coherente

### Regle 10 : Tester dans le contexte du jeu
- Sprite sur fond reel pour verifier contraste
- Fond chaud -> accents frais sur personnage (et vice-versa)
- Contraste de valeur >= 30% entre zones adjacentes

## 3. Parametres PixelLab Optimaux

### Generation de base (face sud)
```json
{
  "description": "[contraintes style] -- [sujet] [details]",
  "image_size": {"width": 64, "height": 64},
  "no_background": true,
  "view": "low top-down",
  "direction": "south",
  "outline": "single color black outline",
  "shading": "medium shading",
  "detail": "medium detail",
  "text_guidance_scale": 8.0
}
```

### Rotation (x3 : east, west, north)
```json
{
  "image_size": {"width": 64, "height": 64},
  "from_image": "<base64_sprite_sud>",
  "from_direction": "south",
  "to_direction": "east",
  "image_guidance_scale": 3.0
}
```

### Animation marche (x4 directions)
```json
{
  "description": "[meme description]",
  "action": "walking",
  "reference_image": "<base64_sprite_direction>",
  "view": "low top-down",
  "direction": "south",
  "n_frames": 4,
  "text_guidance_scale": 8.0,
  "image_guidance_scale": 1.5
}
```

## 4. Prompts Optimises par Personnage

Format : contraintes AVANT sujet

| Personnage | Prompt |
|-----------|--------|
| Joueur | "young provencal man, brown hair, blue polo shirt, khaki pants, friendly expression, petanque player" |
| Papet | "elderly provencal man, blue beret, gray sparse hair, gray bushy mustache, purple mauve shirt, wise mentor" |
| Marcel | "stocky provencal man, white messy hair, red casquette cap, red polo shirt, prominent gold chain, confident veteran" |
| Bastien | "young arrogant man, spiky blonde hair, blue eyes, dark clothing, smirk expression, rival character" |
| Fanny | "provencal woman, auburn wavy hair, green dress outfit, straw hat, cheerful expression" |
| Ricardo | "suave mediterranean man, tanned skin, dark hair, sunglasses, white linen shirt, relaxed pose" |
| Marius | "majestic elderly man, long white beard, wild white hair, gold chain, dark royal outfit, grand master" |

## 5. Tilesets par Biome

| Biome | Prompt |
|-------|--------|
| Village | "provencal stone wall, cream beige, terracotta roof, warm Mediterranean" |
| Route | "beaten earth dirt path, ochre brown, olive green grass edges, provencal countryside" |
| Plage | "cream golden sand, turquoise blue water edge, warm rocks, Mediterranean beach" |
| Parc | "manicured green grass, gravel path, flower beds, provencal park" |
| Place | "warm gray stone pavement, geometric pattern, provencal town square" |

## 6. Pipeline de Qualite

```
1. GENERER via PixelLab MCP (64x64)
2. INSPECTER (grille, couleurs, lisibilite)
3. GRID SNAP (Pixel Snapper ou Aseprite)
4. PALETTE NORMALIZE (palette Provencale)
5. DOWNSCALE 64->32 (sharp nearest-neighbor)
6. CLEANUP OUTLINE (contour 1px brun chaud)
7. ASSEMBLER spritesheet 128x128
8. TEST IN-GAME (fond reel, zoom 2x)
9. ITERER si necessaire
10. SAUVEGARDER assets/sprites/ ou assets/tilesets/
```

## 7. Erreurs Courantes

| Erreur | Solution |
|--------|----------|
| Trop de couleurs | Reduction palette stricte |
| Pixels tailles differentes | Pixel Snapper / nettoyage |
| Anti-aliasing sur contours | Supprimer, bords nets |
| Resolution drift | Verifier compte pixels |
| Proportions incoherentes | Style reference depuis 1er perso |
| Banding | Varier largeur zones couleur |
| Ombres grises | Hue shift vers violet/bleu |

## 8. Budget ($10)

| Priorite | Asset | Cout |
|----------|-------|------|
| 1 | Joueur (heros) | ~$2.50 |
| 2 | Marcel (maitre arene 1) | ~$2.50 |
| 3 | Papet (mentor) | ~$2.50 |
| 4 | Bastien (rival) | ~$2.50 |
| 5+ | Fanny, Ricardo, Marius, dresseurs | Budget sup. |
