# Recherche : Workflow PixelLab pour Spritesheets RPG

## Cout par personnage complet (4 directions x 4 frames marche)
- 1 generation base : ~$0.10-0.30
- 4 rotations : ~$0.40-1.20
- 4 animations marche (4 frames chacune) : ~$0.80-1.60
- **Total : ~$1.50-3.00 USD par personnage**
- Budget $10 = **3 a 6 personnages complets**

## Workflow exact

### Etape 1 : Generer le personnage de base (face sud)
```
POST /v1/generate-image-pixflux
{
  "description": "old provencal man, white hair, red polo, gold chain, petanque veteran",
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

### Etape 2 : Rotation vers les 3 autres directions
```
POST /v1/rotate
{
  "image_size": {"width": 64, "height": 64},
  "from_image": {"type": "base64", "base64": "<base64_du_sprite_sud>"},
  "from_direction": "south",
  "to_direction": "east",    // puis "west", "north"
  "image_guidance_scale": 3.0
}
```
Tailles acceptees pour /rotate : 16, 32, 64, 128 UNIQUEMENT.

### Etape 3 : Animation de marche par direction
```
POST /v1/animate-with-text
{
  "image_size": {"width": 64, "height": 64},
  "description": "old provencal man, white hair, red polo",
  "action": "walking",
  "reference_image": {"type": "base64", "base64": "<base64_du_sprite_direction>"},
  "view": "low top-down",
  "direction": "south",     // pour chaque direction
  "n_frames": 4,
  "text_guidance_scale": 8.0,
  "image_guidance_scale": 1.5
}
```
Output : tableau de Base64Image (1 par frame).
A 64x64 : 16 frames par requete (4x4 grid) = 20 credits.

### Etape 4 : Downscale + assemblage
- sharp resize 64x64 -> 32x32 nearest-neighbor
- Assembler en spritesheet 128x128 (4 cols x 4 rows)
- Row 0 = walk south, Row 1 = walk west, Row 2 = walk east, Row 3 = walk north

## Directions disponibles
- 4 principales : south, east, north, west
- 4 diagonales : south-east, north-east, north-west, south-west

## Vues disponibles
- `side` : vue laterale classique
- `low top-down` : leger angle du dessus (IDEAL pour RPG top-down)
- `high top-down` : vue directement du dessus

## Parametres recommandes pour Petanque Master
```json
{
  "view": "low top-down",
  "outline": "single color black outline",
  "shading": "medium shading",
  "detail": "medium detail",
  "no_background": true,
  "text_guidance_scale": 8.0,
  "image_guidance_scale": 1.5
}
```

## Priorite de generation (budget $10)
1. Joueur (~$2.50) - PRIORITE ABSOLUE
2. Marcel (~$2.50) - 1er maitre, le plus presente
3. Papet (~$2.50) - mentor, scenes intro
4. Bastien (~$2.50) - rival recurrent
Total : ~$10 pour les 4 personnages principaux.
Fanny, Ricardo, Marius, dresseurs = canvas ameliore ou budget supplementaire.
