# Recherche 11 : MCP Servers pour Game Dev - Petanque Master

## STACK MCP RECOMMANDEE

| Priorite | MCP Server | Role | Cout |
|----------|-----------|------|------|
| CRITIQUE | PixelLab MCP | Sprites, tilesets, animations pixel art | ~9-22$/mois |
| HAUTE | Phaser Editor MCP | Gestion scenes/assets Phaser | Gratuit |
| HAUTE | ElevenLabs MCP | SFX (impacts, foule, ambiance) | Free tier dispo |
| MOYENNE | Suno MCP | Musique chiptune | Free tier dispo |
| BASSE | Replicate MCP | Fallback image gen, experimentation | Pay per use |
| UTILE | Image Process MCP | Post-traitement, assemblage sprites | Gratuit |
| UTILE | MCP Audio Tweaker | Conversion/optimisation audio | Gratuit |

---

## 1. IMAGE - PIXEL ART SPECIFIQUE

### PixelLab MCP (PRIORITE #1)
- **Source** : github.com/pixellab-code/pixellab-mcp
- **Backend** : PixelLab.ai API
- **Features** : Personnages 4/8 directions, animations walk/run/idle, Wang tilesets seamless, sprite sheets
- **Transport** : HTTP remote (`https://api.pixellab.ai/mcp`)
- **Auth** : `PIXELLAB_SECRET` API key
- **Config Claude Code** :
```json
{
  "mcpServers": {
    "pixellab": {
      "url": "https://api.pixellab.ai/mcp",
      "transport": "http",
      "env": {
        "PIXELLAB_SECRET": "<CLE_API>"
      }
    }
  }
}
```

### pixel-mcp (Aseprite Integration)
- **Source** : github.com/willibrandon/pixel-mcp
- **Backend** : Aseprite local
- **Features** : Creer/editer sprites via langage naturel, animations, palettes retro, export sprite sheets
- **Requis** : Aseprite installe localement
- **Usage** : Retouche et edition fine des sprites generes

### Game Asset Generator MCP (Hugging Face)
- **Source** : github.com/MubarakHAlketbi/game-asset-mcp
- **Backend** : Hugging Face Spaces (Flux-2D-Game-Assets-LoRA)
- **Features** : Assets 2D (pixel art, sprites) depuis prompts texte
- **Auth** : `HF_TOKEN` env var
- **Usage** : Alternative gratuite pour generation bulk

---

## 2. IMAGE - GENERALISTE

### Replicate MCP (Flux, SD, etc.)
- **Source** : mcp.replicate.com (remote) ou `mcp-server-replicate` (local)
- **Backend** : Replicate API (milliers de modeles)
- **Modeles utiles** :
  - `nerijs/pixel-art-xl` (LoRA pixel art)
  - `cjwbw/sd_pixelart_spritesheet_generator` (sprite sheets)
  - `flux-sprites` (sprites Flux)
- **Prix** : Pay per inference (~0.01-0.05$/gen)
- **Usage** : Experimentation, concept art, batch generation

### Leonardo AI MCP
- **Source** : docs.leonardo.ai/docs/connect-to-leonardoai-mcp
- **Backend** : Leonardo AI API
- **Features** : Generation image complete
- **Prix** : 150 credits/jour gratuits
- **Usage** : Concept art, mood boards

### image-gen-mcp-server (Multi-Provider)
- **Source** : github.com/merlinrabens/image-gen-mcp-server
- **Backend** : OpenAI DALL-E, Stability AI, Gemini, Ideogram, BFL, Clipdrop
- **Usage** : Flexibilite multi-provider, fallback automatique

### imagegen-mcp (OpenAI)
- **Source** : github.com/spartanz51/imagegen-mcp
- **Backend** : OpenAI (text-to-image, image-to-image avec masque)
- **Usage** : Si vous avez deja une cle OpenAI

---

## 3. AUDIO / MUSIQUE

### ElevenLabs MCP (Officiel) - SFX
- **Source** : github.com/elevenlabs/elevenlabs-mcp
- **Backend** : ElevenLabs API
- **Features** :
  - Generation effets sonores depuis texte
  - Text-to-speech (voix PNJ?)
  - Voice cloning
  - Transcription audio
- **Install** : Necessite `uv` (Python)
- **Prix** : Free tier disponible
- **Usage Petanque Master** :
  - "Clac metallique de boule de petanque sur gravier"
  - "Applaudissements d'une petite foule"
  - "Ambiance cigales sud de la France"
  - "Boule roulant sur terre battue"

### ElevenLabs MCP Player
- **Source** : github.com/elevenlabs/elevenlabs-mcp-player
- **Features** : Generation musique depuis prompts + TTS + SFX
- **Usage** : Version etendue avec generation musicale

### Suno MCP - Musique
- **Source** : github.com/sandraschi/suno-mcp
- **Backend** : Suno API
- **Features** : Generer musique avec paroles, tags de style, titres
- **Usage Petanque Master** :
  - "Chiptune provencal ensoleille, guitare acoustique 8-bit, tempo tranquille"
  - "Musique de combat retro NES, rythme petanque, tension"
  - "Theme titre pixel art, melodie joyeuse, sud de la France"

### MiniMax Music MCP
- **Source** : github.com/falahgs/mcp-minimax-music-server
- **Backend** : MiniMax Music API
- **Usage** : Alternative a Suno pour generation musicale

### Kie.ai MCP (Multi-Tool)
- **Source** : npm `@felores/kie-ai-mcp-server`
- **Backend** : Suno (musique) + ElevenLabs (TTS/SFX) + image gen + video
- **Features** : 24 outils IA en un seul package
- **Usage** : All-in-one si on veut simplifier la config

### MCP Audio Tweaker
- **Source** : github.com/DeveloperZo/mcp-audio-tweaker
- **Backend** : FFmpeg local
- **Features** : Conversion sample rate, bitrate, volume, format batch
- **Usage** : Post-traiter les sons generes vers formats web optimaux (OGG/MP3)

---

## 4. GAME DEV / PHASER

### Phaser Editor MCP (OFFICIEL)
- **Source** : github.com/phaserjs/editor-mcp-server
- **Backend** : Phaser Editor v5
- **Features** :
  - Gestion de scenes
  - Gestion d'assets
  - Edition tilemaps
  - Gestion animations
  - LLMs peuvent creer/modifier scenes, gerer assets, generer niveaux
- **Install** : npm package
- **Templates** : github.com/phaserjs/editor-starter-template-cursor-javascript
- **Usage Petanque Master** : Gestion centralisee des scenes Phaser, placement d'objets, configuration tilemaps

---

## 5. TRAITEMENT D'IMAGES

### Image Process MCP
- **Source** : `npx image-process-mcp-server`
- **Backend** : Sharp (local)
- **Features** : Resize, conversion format, crop, rotation, batch processing
- **Usage** : Redimensionner sprites, convertir formats, assembler sheets

### Magick Convert MCP (ImageMagick)
- **Source** : pulsemcp.com/servers/aroglahcim-magick-convert
- **Backend** : ImageMagick CLI local
- **Features** : Commandes ImageMagick completes, `montage` pour sprite sheets
- **Usage** : Assemblage sprite sheets, manipulation batch, conversion

### Sharp MCP
- **Source** : github.com/greatSumini/sharp-mcp
- **Backend** : Sharp (local)
- **Features** : Sessions image, metadata, extraction couleurs
- **Usage** : Analyse palette, verification consistance

---

## 6. REGISTRES ET DECOUVERTE MCP

### Registre officiel
- registry.modelcontextprotocol.io (lance sept. 2025, 10,000+ serveurs)

### Agregateurs
- PulseMCP : pulsemcp.com
- mcpservers.org
- LobeHub MCP : lobehub.com/mcp
- mcp.so
- Glama.ai : glama.ai/mcp/servers
- Awesome MCP Servers : github.com/punkpeye/awesome-mcp-servers

---

## 7. INSTALLATION RECOMMANDEE

### Etape 1 : Configurer Claude Code MCP (fichier settings)
```json
{
  "mcpServers": {
    "pixellab": {
      "url": "https://api.pixellab.ai/mcp",
      "transport": "http",
      "env": { "PIXELLAB_SECRET": "<CLE>" }
    },
    "elevenlabs": {
      "command": "uvx",
      "args": ["elevenlabs-mcp"],
      "env": { "ELEVENLABS_API_KEY": "<CLE>" }
    }
  }
}
```

### Etape 2 : Installer Phaser Editor MCP
```bash
npm install @phaserjs/editor-mcp-server
```

### Etape 3 : APIs a obtenir
1. **PixelLab** : pixellab.ai -> compte -> API key
2. **ElevenLabs** : elevenlabs.io -> compte gratuit -> API key
3. **Suno** : via API ou Kie.ai wrapper
4. **Replicate** (optionnel) : replicate.com -> API token
