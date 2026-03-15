# Recherche 10 : Outils IA pour Pixel Art Game Assets (2025-2026)

## LE PROBLEME FONDAMENTAL DU 16x16

La plupart des IA generatives echouent en 16x16 car :
- Entrainees sur images haute resolution (512x1024+)
- A 16x16, chaque pixel compte - zero marge pour artefacts anti-aliasing
- Le tiling necessite des bords mathematiquement exacts
- La discipline de palette (couleurs limitees) entre en conflit avec le fonctionnement des modeles de diffusion

**Ce qui marche en 2026** :
1. Outils natifs pixel art (PixelLab, Retro Diffusion) - entraines specifiquement sur du pixel art basse resolution
2. IA pour brouillons + nettoyage manuel en Aseprite
3. Style anchoring : creer 3-4 tiles de reference a la main, puis IA genere des variations
4. Pipeline post-traitement Python (palette enforcement, grid snapping, color quantization)

---

## 1. PIXELLAB - RECOMMENDATION #1

**Site** : pixellab.ai
**Type** : IA specialisee pixel art jeux video
**MCP Server** : Oui, officiel (`pixellab-code/pixellab-mcp`)

### Fonctionnalites cles
- **Tilesets Wang** : decrire tile interieur ("eau") et exterieur ("sable") -> transitions seamless automatiques
- **Dual-grid 15-tilesets** et **3x3 tilesets** avec edge matching automatique
- **Rotation 4/8 directions** d'un personnage a partir d'un seul sprite
- **Animations IA** : walk, run, idle depuis un prompt texte
- **Generation de maps** pour jeux top-down

### Qualite 16x16
- **Excellente** : specifiquement concu pour les resolutions de jeu
- Supporte 16x16, 32x32, et plus
- Comprend les contraintes de pixel grid

### Prix
- ~9$/mois (tier 1) a ~22$/mois (tier 2)
- Generation basique = 1 credit/request
- Modeles avances = 40 credits/request

### Integration MCP
```json
{
  "mcpServers": {
    "pixellab": {
      "url": "https://api.pixellab.ai/mcp",
      "transport": "http",
      "env": {
        "PIXELLAB_SECRET": "<votre-cle-api>"
      }
    }
  }
}
```
-> Generer des assets directement depuis Claude Code pendant le dev

### Pertinence Petanque Master
- Generer tilesets provencaux (terre battue, herbe, sable, lavande, toits terracotta)
- Sprites personnages 16x24 avec walk cycle 4 directions
- Sprites boules, cochonnet, terrain petanque
- UI elements (cadre dialogue, icones badges)

---

## 2. RETRO DIFFUSION - COMPLEMENT ASEPRITE

**Site** : astropulse.itch.io/retrodiffusion
**Type** : Extension Aseprite avec modele de diffusion custom
**MCP Server** : Non (mais pixel-mcp existe pour Aseprite)

### Fonctionnalites
- Modele de diffusion entraine SPECIFIQUEMENT pour pixel art (pas downscale de haute res)
- Genere directement dans Aseprite (pas d'export/import)
- Reduction intelligente de couleurs
- Creation de palette guidee par texte
- Color Style Transfer, Pose Editor

### Qualite 16x16
- **Tres bonne** : "astronomiquement meilleur que tout modele concurrent" selon les reviews
- Resultats pixel-perfect sans nettoyage

### Limitations
- PAS d'animations / sprite sheets animees
- Sprites statiques uniquement
- Necessite Aseprite (20$ sur Steam)

### Prix
- 65$ one-time (full) ou 20$ (Lite)
- Pas d'abonnement, pas de credits
- Utilise Runware cloud pour inference

### Pertinence Petanque Master
- Hero sprites des maitres d'arene (Marcel, Fanny, Ricardo, Marius)
- Portraits haute qualite pour panneau score
- Tiles custom provencaux uniques
- Nettoyage/retouche de sprites generes par PixelLab

---

## 3. SCENARIO.GG - CONSISTANCE DE STYLE

**Site** : scenario.com
**Type** : Plateforme IA game art avec entrainement custom
**MCP Server** : Non

### Fonctionnalites
- Entrainer un modele custom sur VOTRE style pixel art
- Garantit la consistance visuelle sur des centaines de generations
- Composition Control et Pixel-Perfect Inpainting
- API-first

### Qualite 16x16
- Pas optimise specifiquement pixel art, mais supporte
- Force = consistance, pas resolution

### Prix
- Gratuit pour projets perso
- Payant a partir de 20$/mois

### Pertinence Petanque Master
- Creer 5-10 sprites de reference a la main
- Entrainer un modele -> generer tous les PNJ restants dans le meme style
- Overkill pour MVP, puissant pour version finale

---

## 4. SERVICES IA GENERALISTES (pour concept art uniquement)

### Leonardo AI
- **API** : Oui. **MCP Server** : Oui (`ish-joshi/leonardo-mcp-server`)
- **16x16** : Moyen. A des modeles pixel art communautaires mais pas pixel-perfect
- **Prix** : 150 credits/jour gratuits, API depuis 9$/mois
- **Usage** : concept art, mood boards, references visuelles

### Midjourney
- **API** : Oui (officielle depuis fin 2025)
- **16x16** : Mauvais. Genere du beau mais pas du vrai pixel art grid-aligned
- **Prix** : 10-30$/mois
- **Usage** : Mood boards et direction artistique uniquement

### GPT-4o / DALL-E
- **API** : Oui (OpenAI). **MCP Server** : Oui (multiples)
- **16x16** : Mauvais. Genere a 1024x1024+, ne comprend pas les pixel grids
- **Usage** : Concept art et brainstorming visuel

### Stable Diffusion + LoRAs Pixel Art
- **API** : Via Replicate. **MCP Server** : Oui (Replicate MCP)
- **Modeles** : `nerijs/pixel-art-xl`, `sd_pixelart_spritesheet_generator`
- **16x16** : Moyen. LoRAs ameliorent le style mais pas la precision grid
- **Prix** : ~0.01-0.05$/generation sur Replicate
- **Usage** : Batch generation avec post-traitement

### Flux Models
- **16x16** : Moyen-bas. Mieux a 128x128+
- **Modele specialise** : `flux-sprites` sur Replicate
- **Usage** : Pas recommande pour 16x16 specifiquement

---

## 5. NANO BANANA - PAS PERTINENT

Nano Banana est un editeur IA generaliste base sur Google Gemini. Il a un "LoRA" qui convertit des photos en style pixel art 8-bit/16-bit, mais c'est un FILTRE DE STYLE, pas un outil de game dev. Ne genere pas de tilesets, sprite sheets, ou assets game-ready.

**Verdict : ne pas utiliser pour ce projet.**

---

## 6. OUTILS MANUELS (complementaires)

### Aseprite (20$ Steam)
- Le standard industrie pour pixel art
- Layers, animation, onion skinning, export sprite sheets
- + Retro Diffusion pour IA integree
- + pixel-mcp pour controle via Claude Code

### Piskel (gratuit, en ligne)
- piskelapp.com
- Bon pour prototypage rapide et animations simples
- Export sprite sheet PNG

### Libresprite (gratuit, desktop)
- Fork open-source d'Aseprite
- Memes fonctionnalites de base

### Tiled (gratuit)
- mapeditor.org
- Standard pour tilemaps, export JSON natif Phaser

---

## 7. WORKFLOW RECOMMANDE PETANQUE MASTER

### Phase 1 : Placeholders (Sprint 1-2)
- Rectangles colores et formes simples
- Focus sur le gameplay, pas les assets

### Phase 2 : Assets IA (Sprint 3-4)
1. **PixelLab MCP** pour 80% des assets :
   - Tilesets provencaux (terre, herbe, sable, chemins, murs, toits)
   - Walk cycles personnages (4 directions x 4 frames)
   - Sprites PNJ de base
   - Elements UI (cadres, icones)

2. **Retro Diffusion + Aseprite** pour 20% des hero assets :
   - Protagoniste (sprite definitif)
   - 5 maitres d'arene (sprites + portraits)
   - Boules metalliques (3 types)
   - Cochonnet

3. **Nettoyage manuel** en Aseprite :
   - Alignement pixel grid
   - Harmonisation palette provencale
   - Ajustement animations

### Phase 3 : Polish
- Scenario.gg si besoin de consistance sur beaucoup de PNJ
- Post-traitement batch avec Image Process MCP

### Budget estime assets
| Outil | Cout |
|-------|------|
| PixelLab (2 mois) | ~18-44$ |
| Retro Diffusion | 65$ (one-time) |
| Aseprite | 20$ (one-time) |
| **Total** | **~103-129$** |
| Alternative 100% gratuit : Piskel + Libresprite + assets CC0 | 0$ |
