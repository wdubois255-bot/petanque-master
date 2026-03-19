#!/usr/bin/env node
/** Debug: analyser les couleurs de la zone cheveux de Ley */
import sharp from 'sharp';
import path from 'path';

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100) / 100, Math.round(l * 100) / 100];
}

async function main() {
  const src = 'AssetPetanqueMasterFinal/sprites/personnages/rookie_v2/_base_mirror_128.png';
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  console.log('Pixels zone cheveux (y=5 à 45, non-transparent, non-peau, non-outline):');
  const colors = {};
  for (let y = 5; y < 45; y++) {
    for (let x = 20; x < 80; x++) {
      const i = (y * info.width + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a < 128) continue;
      const [h, s, l] = rgbToHsl(r, g, b);
      // Skip peau et outline
      if (r > 140 && g > 85 && (r - b) > 25) continue; // peau
      if (l < 0.12) continue; // outline noir
      const key = `rgb(${r},${g},${b}) h=${h} s=${s} l=${l}`;
      colors[key] = (colors[key] || 0) + 1;
    }
  }

  const sorted = Object.entries(colors).sort((a, b) => b[1] - a[1]);
  console.log(`\nTop 30 couleurs (hors peau et outline):`);
  sorted.slice(0, 30).forEach(([c, n]) => console.log(`  ${c}  x${n}`));
}
main();
