---
name: build-assets
description: Optimize all game assets (compress PNGs, convert audio, verify integrity). Manual only.
user-invocable: true
disable-model-invocation: true
allowed-tools: Bash, Glob, Read, Write
---

# Build & Optimize Assets

Process all assets for production deployment.

## Steps

### 1. Inventory all assets
```bash
find assets/ -type f | sort
```
Report: total files, total size

### 2. Optimize PNG sprites and tilesets
For each PNG in `assets/sprites/` and `assets/tilesets/`:
- Run `optipng -o2` if available, or `pngquant --quality 90-100`
- Verify no visual degradation (pixel art must stay crisp)
- Report size savings

### 3. Convert audio to web formats
For each WAV in `assets/audio/`:
- Convert to OGG Vorbis (smaller, good browser support): `ffmpeg -i input.wav -c:a libvorbis -q:a 4 output.ogg`
- Convert to MP3 as fallback: `ffmpeg -i input.wav -b:a 128k output.mp3`
- Keep both formats (Phaser auto-selects)

### 4. Verify tileset integrity
For each PNG in `assets/tilesets/`:
- Check dimensions are multiples of 16 (16x16 tile grid)
- Report any misaligned tilesets

### 5. Verify spritesheet integrity
For each character spritesheet in `assets/sprites/`:
- Check dimensions match expected format (e.g., 64x96 for 4x4 frames at 16x24)
- Report any issues

### 6. Size report
```
Total sprites: X files, Y KB
Total tilesets: X files, Y KB
Total audio: X files, Y KB
Total maps: X files, Y KB
GRAND TOTAL: X files, Y KB
Budget: < 5 MB (target), < 10 MB (max)
```

## Example

```
/build-assets
```
