/**
 * Regenerate 5 old pixel-art boules to match the realistic 3D style
 * of the newer balls (doree, bleue, cuivre, titane, rouille).
 *
 * Uses sharp with SVG input for smooth radial gradients and specular highlights.
 * Output: 64x64 PNG with transparency.
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'sprites');

/**
 * Generate a realistic 3D metallic ball SVG.
 * Mimics the style of boule_doree, boule_bleue, etc:
 * - Large radial gradient for base sphere shading (highlight top-left, shadow bottom-right)
 * - Specular highlight (small bright ellipse top-left)
 * - Rim light (subtle lighter edge on bottom-left)
 * - Ambient occlusion shadow at bottom
 */
function generateBallSVG({ base, highlight, shadow, specular, rim, name }) {
  // Parse hex to components for blending
  const size = 64;
  const cx = 32, cy = 32, r = 27; // Ball center and radius

  // Specular highlight position (top-left area)
  const specX = cx - 8, specY = cy - 10;

  // Rim light position (bottom-left edge)
  const rimX = cx - 12, rimY = cy + 14;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Main sphere gradient: highlight top-left to shadow bottom-right -->
    <radialGradient id="sphere_${name}" cx="0.38" cy="0.35" r="0.55" fx="0.35" fy="0.32">
      <stop offset="0%" stop-color="${highlight}" />
      <stop offset="35%" stop-color="${base}" />
      <stop offset="75%" stop-color="${shadow}" />
      <stop offset="100%" stop-color="${darken(shadow, 0.6)}" />
    </radialGradient>

    <!-- Specular highlight gradient -->
    <radialGradient id="spec_${name}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${specular || '#FFFFFF'}" stop-opacity="0.85" />
      <stop offset="50%" stop-color="${specular || '#FFFFFF'}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${specular || '#FFFFFF'}" stop-opacity="0" />
    </radialGradient>

    <!-- Rim light gradient -->
    <radialGradient id="rim_${name}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${rim || highlight}" stop-opacity="0.4" />
      <stop offset="100%" stop-color="${rim || highlight}" stop-opacity="0" />
    </radialGradient>

    <!-- Bottom ambient shadow -->
    <radialGradient id="shadow_${name}" cx="0.5" cy="0.4" r="0.5">
      <stop offset="60%" stop-color="${shadow}" stop-opacity="0" />
      <stop offset="100%" stop-color="${darken(shadow, 0.4)}" stop-opacity="0.5" />
    </radialGradient>

    <!-- Soft edge (anti-aliased circle mask) -->
    <radialGradient id="edge_${name}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="85%" stop-color="black" stop-opacity="0" />
      <stop offset="95%" stop-color="black" stop-opacity="0.15" />
      <stop offset="100%" stop-color="black" stop-opacity="0.4" />
    </radialGradient>

    <!-- Second specular for depth -->
    <radialGradient id="spec2_${name}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Main ball body -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sphere_${name})" />

  <!-- Ambient shadow overlay at edges -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#shadow_${name})" />

  <!-- Dark edge outline effect -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#edge_${name})" />

  <!-- Rim light (bottom-left) -->
  <ellipse cx="${rimX}" cy="${rimY}" rx="10" ry="8" fill="url(#rim_${name})" />

  <!-- Secondary broad highlight (upper area) -->
  <ellipse cx="${cx - 3}" cy="${cy - 6}" rx="16" ry="14" fill="url(#spec2_${name})" />

  <!-- Primary specular highlight (bright spot top-left) -->
  <ellipse cx="${specX}" cy="${specY}" rx="6" ry="5" fill="url(#spec_${name})" />

  <!-- Tiny sharp specular point -->
  <ellipse cx="${specX + 1}" cy="${specY + 1}" rx="2.5" ry="2" fill="white" opacity="0.6" />
</svg>`;
}

function darken(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return '#' + [r, g, b].map(c => Math.round(c * factor).toString(16).padStart(2, '0')).join('');
}

const boules = [
  {
    name: 'acier',
    base: '#8A95A5',    // Blue-steel tint, darker than chrome
    highlight: '#B8C4D4',
    shadow: '#4A5568',
    specular: '#D8E0F0',
    rim: '#9AA8B8',
  },
  {
    name: 'bronze',
    base: '#C07830',
    highlight: '#E0A050',
    shadow: '#7A4A1A',
    specular: '#FFE8C0',
    rim: '#D8A060',
  },
  {
    name: 'chrome',
    base: '#D0D4DC',    // Very bright, mirror-like silver
    highlight: '#F0F2F8',
    shadow: '#888E98',
    specular: '#FFFFFF',
    rim: '#E0E4EC',
  },
  {
    name: 'noire',
    base: '#383840',
    highlight: '#606068',
    shadow: '#18181E',
    specular: '#A0A0B0',
    rim: '#505058',
  },
  {
    name: 'rouge',
    base: '#A82828',
    highlight: '#D84040',
    shadow: '#581010',
    specular: '#FFB0B0',
    rim: '#C04040',
  },
];

async function main() {
  console.log('=== Regenerating 5 boules in realistic 3D style ===\n');

  for (const boule of boules) {
    const svg = generateBallSVG(boule);
    const outPath = path.join(OUT_DIR, `boule_${boule.name}.png`);

    await sharp(Buffer.from(svg))
      .resize(64, 64)
      .png()
      .toFile(outPath);

    const stats = await sharp(outPath).metadata();
    console.log(`  boule_${boule.name}.png -> ${stats.width}x${stats.height} (${stats.channels}ch)`);
  }

  // Clean up old _up64 and _up128 variants (no longer needed since base is 64x64)
  const fs = await import('fs');
  for (const boule of boules) {
    for (const suffix of ['_up64', '_up128']) {
      const variant = path.join(OUT_DIR, `boule_${boule.name}${suffix}.png`);
      if (fs.existsSync(variant)) {
        fs.unlinkSync(variant);
        console.log(`  Deleted old variant: boule_${boule.name}${suffix}.png`);
      }
    }
  }

  console.log('\nDone! Old files backed up in comparison/old_balls/');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
