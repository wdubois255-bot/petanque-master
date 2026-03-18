/**
 * Jimp Demo - Showcase des capacites d'edition d'image
 * Genere des variations des sprites PixelLab dans assets/sprites/jimp-demo/
 */
import { Jimp, intToRGBA, rgbaToInt } from 'jimp';
import path from 'path';
import fs from 'fs';

const SRC_DIR = path.resolve('assets/sprites/generated');
const OUT_DIR = path.resolve('assets/sprites/jimp-demo');

// Sprites a modifier
const SPRITES = [
  { file: 'joueur_south_v2.png', name: 'joueur' },
  { file: 'marcel_south_v2.png', name: 'marcel' },
  { file: 'bastien_south_v2.png', name: 'bastien' },
  { file: 'papet_south_v2.png', name: 'papet' },
];

// Creer le dossier de sortie
fs.mkdirSync(OUT_DIR, { recursive: true });

// Helper: clamp 0-255
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

// ============================================================
// TRANSFORMATIONS
// ============================================================

async function run() {
  for (const sprite of SPRITES) {
    const srcPath = path.join(SRC_DIR, sprite.file);
    console.log(`\n=== ${sprite.name.toUpperCase()} ===`);
    const img = await Jimp.read(srcPath);

    // 0. Original (copie reference)
    const original = img.clone();
    await original.write(path.join(OUT_DIR, `${sprite.name}_00_original.png`));
    console.log('  00_original');

    // 1. MIROIR HORIZONTAL (flip)
    const flipped = img.clone().flip({ horizontal: true });
    await flipped.write(path.join(OUT_DIR, `${sprite.name}_01_flip.png`));
    console.log('  01_flip');

    // 2. TEINTE SEPIA / SUNSET (palette chaude provencale)
    const sepia = img.clone();
    sepia.scan(0, 0, sepia.width, sepia.height, (x, y) => {
      const pixel = sepia.getPixelColor(x, y);
      const { r, g, b, a } = intToRGBA(pixel);
      if (a === 0) return; // skip transparent
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const sr = clamp(gray + 40);
      const sg = clamp(gray + 15);
      const sb = clamp(gray - 20);
      const color = rgbaToInt(sr, sg, sb, a);
      sepia.setPixelColor(color, x, y);
    });
    await sepia.write(path.join(OUT_DIR, `${sprite.name}_02_sepia.png`));
    console.log('  02_sepia');

    // 3. PALETTE SWAP - Teinte bleue (version "nuit/eau")
    const blue = img.clone();
    blue.scan(0, 0, blue.width, blue.height, (x, y) => {
      const pixel = blue.getPixelColor(x, y);
      const { r, g, b, a } = intToRGBA(pixel);
      if (a === 0) return;
      const nr = clamp(r * 0.5);
      const ng = clamp(g * 0.7);
      const nb = clamp(b * 1.4 + 30);
      blue.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
    });
    await blue.write(path.join(OUT_DIR, `${sprite.name}_03_nuit.png`));
    console.log('  03_nuit');

    // 4. PALETTE SWAP - Teinte rouge/feu (adversaire puissant)
    const red = img.clone();
    red.scan(0, 0, red.width, red.height, (x, y) => {
      const pixel = red.getPixelColor(x, y);
      const { r, g, b, a } = intToRGBA(pixel);
      if (a === 0) return;
      const nr = clamp(r * 1.4 + 30);
      const ng = clamp(g * 0.5);
      const nb = clamp(b * 0.4);
      red.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
    });
    await red.write(path.join(OUT_DIR, `${sprite.name}_04_feu.png`));
    console.log('  04_feu');

    // 5. PALETTE SWAP - Teinte verte/nature (style foret)
    const green = img.clone();
    green.scan(0, 0, green.width, green.height, (x, y) => {
      const pixel = green.getPixelColor(x, y);
      const { r, g, b, a } = intToRGBA(pixel);
      if (a === 0) return;
      const nr = clamp(r * 0.5);
      const ng = clamp(g * 1.3 + 20);
      const nb = clamp(b * 0.6);
      green.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
    });
    await green.write(path.join(OUT_DIR, `${sprite.name}_05_foret.png`));
    console.log('  05_foret');

    // 6. PALETTE SWAP - Doré/champion (couleurs dorées)
    const gold = img.clone();
    gold.scan(0, 0, gold.width, gold.height, (x, y) => {
      const pixel = gold.getPixelColor(x, y);
      const { r, g, b, a } = intToRGBA(pixel);
      if (a === 0) return;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const nr = clamp(lum * 1.2 + 40);
      const ng = clamp(lum * 1.0 + 15);
      const nb = clamp(lum * 0.3);
      gold.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
    });
    await gold.write(path.join(OUT_DIR, `${sprite.name}_06_dore.png`));
    console.log('  06_dore');

    // 7. LUMINOSITE + (version eclairee, plein soleil)
    const bright = img.clone();
    bright.scan(0, 0, bright.width, bright.height, (x, y) => {
      const pixel = bright.getPixelColor(x, y);
      const { r, g, b, a } = intToRGBA(pixel);
      if (a === 0) return;
      bright.setPixelColor(rgbaToInt(clamp(r + 50), clamp(g + 50), clamp(b + 50), a), x, y);
    });
    await bright.write(path.join(OUT_DIR, `${sprite.name}_07_soleil.png`));
    console.log('  07_soleil');

    // 8. LUMINOSITE - (version sombre, crepuscule)
    const dark = img.clone();
    dark.scan(0, 0, dark.width, dark.height, (x, y) => {
      const pixel = dark.getPixelColor(x, y);
      const { r, g, b, a } = intToRGBA(pixel);
      if (a === 0) return;
      dark.setPixelColor(rgbaToInt(clamp(r - 60), clamp(g - 60), clamp(b - 40), a), x, y);
    });
    await dark.write(path.join(OUT_DIR, `${sprite.name}_08_crepuscule.png`));
    console.log('  08_crepuscule');

    // 9. CONTRASTE AUGMENTE (couleurs plus vives)
    const contrast = img.clone();
    contrast.scan(0, 0, contrast.width, contrast.height, (x, y) => {
      const pixel = contrast.getPixelColor(x, y);
      const { r, g, b, a } = intToRGBA(pixel);
      if (a === 0) return;
      const factor = 1.5;
      const nr = clamp((r - 128) * factor + 128);
      const ng = clamp((g - 128) * factor + 128);
      const nb = clamp((b - 128) * factor + 128);
      contrast.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
    });
    await contrast.write(path.join(OUT_DIR, `${sprite.name}_09_contraste.png`));
    console.log('  09_contraste');

    // 10. SILHOUETTE NOIRE (shadow/ombre)
    const shadow = img.clone();
    shadow.scan(0, 0, shadow.width, shadow.height, (x, y) => {
      const pixel = shadow.getPixelColor(x, y);
      const { a } = intToRGBA(pixel);
      if (a === 0) return;
      shadow.setPixelColor(rgbaToInt(58, 46, 40, clamp(a * 0.7)), x, y); // #3A2E28
    });
    await shadow.write(path.join(OUT_DIR, `${sprite.name}_10_ombre.png`));
    console.log('  10_ombre');

    // 11. SILHOUETTE BLANCHE (fantome/flash)
    const ghost = img.clone();
    ghost.scan(0, 0, ghost.width, ghost.height, (x, y) => {
      const pixel = ghost.getPixelColor(x, y);
      const { a } = intToRGBA(pixel);
      if (a === 0) return;
      ghost.setPixelColor(rgbaToInt(255, 255, 255, clamp(a * 0.8)), x, y);
    });
    await ghost.write(path.join(OUT_DIR, `${sprite.name}_11_fantome.png`));
    console.log('  11_fantome');

    // 12. OUTLINE GLOW (contour lumineux)
    const glow = img.clone();
    const glowColor = rgbaToInt(255, 220, 80, 200); // jaune dore
    // D'abord, trouver les pixels de contour (transparent a cote d'un opaque)
    const edgeMap = [];
    for (let gy = 0; gy < glow.height; gy++) {
      for (let gx = 0; gx < glow.width; gx++) {
        const { a } = intToRGBA(glow.getPixelColor(gx, gy));
        if (a > 0) continue; // on cherche les pixels transparents
        // Verifier les 4 voisins
        const neighbors = [
          [gx - 1, gy], [gx + 1, gy], [gx, gy - 1], [gx, gy + 1],
          [gx - 1, gy - 1], [gx + 1, gy - 1], [gx - 1, gy + 1], [gx + 1, gy + 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < glow.width && ny >= 0 && ny < glow.height) {
            const { a: na } = intToRGBA(glow.getPixelColor(nx, ny));
            if (na > 128) {
              edgeMap.push([gx, gy]);
              break;
            }
          }
        }
      }
    }
    for (const [ex, ey] of edgeMap) {
      glow.setPixelColor(glowColor, ex, ey);
    }
    await glow.write(path.join(OUT_DIR, `${sprite.name}_12_glow.png`));
    console.log('  12_glow (contour dore)');

    // 13. OUTLINE ROUGE (contour ennemi)
    const outline = img.clone();
    const outlineColor = rgbaToInt(220, 40, 40, 220);
    for (const [ex, ey] of edgeMap) {
      outline.setPixelColor(outlineColor, ex, ey);
    }
    await outline.write(path.join(OUT_DIR, `${sprite.name}_13_outline_rouge.png`));
    console.log('  13_outline_rouge');

    // 14. UPSCALE x2 NEAREST NEIGHBOR (zoom pixel-perfect)
    const upscaled = img.clone().resize({ w: img.width * 2, h: img.height * 2 });
    await upscaled.write(path.join(OUT_DIR, `${sprite.name}_14_upscale_x2.png`));
    console.log('  14_upscale_x2');

    // 15. UPSCALE x4 NEAREST NEIGHBOR
    const upscaled4 = img.clone().resize({ w: img.width * 4, h: img.height * 4 });
    await upscaled4.write(path.join(OUT_DIR, `${sprite.name}_15_upscale_x4.png`));
    console.log('  15_upscale_x4');

    // 16. ROTATION 90
    const rot90 = img.clone().rotate(-90);
    await rot90.write(path.join(OUT_DIR, `${sprite.name}_16_rot90.png`));
    console.log('  16_rot90');

    // 17. LAVANDE - couleurs provencales (violet/lavande)
    const lavande = img.clone();
    lavande.scan(0, 0, lavande.width, lavande.height, (x, y) => {
      const pixel = lavande.getPixelColor(x, y);
      const { r, g, b, a } = intToRGBA(pixel);
      if (a === 0) return;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const nr = clamp(lum * 0.8 + 50);
      const ng = clamp(lum * 0.5 + 20);
      const nb = clamp(lum * 1.1 + 40);
      lavande.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
    });
    await lavande.write(path.join(OUT_DIR, `${sprite.name}_17_lavande.png`));
    console.log('  17_lavande');

    // 18. NEGATIF (inversion des couleurs)
    const invert = img.clone();
    invert.scan(0, 0, invert.width, invert.height, (x, y) => {
      const pixel = invert.getPixelColor(x, y);
      const { r, g, b, a } = intToRGBA(pixel);
      if (a === 0) return;
      invert.setPixelColor(rgbaToInt(255 - r, 255 - g, 255 - b, a), x, y);
    });
    await invert.write(path.join(OUT_DIR, `${sprite.name}_18_negatif.png`));
    console.log('  18_negatif');

    // 19. SEMI-TRANSPARENT (effet fantome/disparition)
    const semiTransp = img.clone();
    semiTransp.scan(0, 0, semiTransp.width, semiTransp.height, (x, y) => {
      const pixel = semiTransp.getPixelColor(x, y);
      const { r, g, b, a } = intToRGBA(pixel);
      if (a === 0) return;
      semiTransp.setPixelColor(rgbaToInt(r, g, b, clamp(a * 0.4)), x, y);
    });
    await semiTransp.write(path.join(OUT_DIR, `${sprite.name}_19_transparent.png`));
    console.log('  19_transparent');

    // 20. PIXELISE (downscale puis upscale = gros pixels)
    const pixelated = img.clone()
      .resize({ w: Math.max(8, Math.floor(img.width / 4)), h: Math.max(8, Math.floor(img.height / 4)) })
      .resize({ w: img.width, h: img.height });
    await pixelated.write(path.join(OUT_DIR, `${sprite.name}_20_pixelise.png`));
    console.log('  20_pixelise');

    // 21. COMPOSITE - joueur + ombre en dessous
    const withShadow = new Jimp({ width: img.width, height: img.height + 4, color: 0x00000000 });
    // Ombre decalee en bas
    const shadowCopy = img.clone();
    shadowCopy.scan(0, 0, shadowCopy.width, shadowCopy.height, (x, y) => {
      const pixel = shadowCopy.getPixelColor(x, y);
      const { a } = intToRGBA(pixel);
      if (a === 0) return;
      shadowCopy.setPixelColor(rgbaToInt(58, 46, 40, clamp(a * 0.3)), x, y);
    });
    withShadow.composite(shadowCopy, 2, 4);
    withShadow.composite(img, 0, 0);
    await withShadow.write(path.join(OUT_DIR, `${sprite.name}_21_avec_ombre.png`));
    console.log('  21_avec_ombre');
  }

  // ============================================================
  // 22. PLANCHE CONTACT (tous les originaux cote a cote)
  // ============================================================
  const allImgs = [];
  for (const sprite of SPRITES) {
    allImgs.push(await Jimp.read(path.join(SRC_DIR, sprite.file)));
  }
  const maxH = Math.max(...allImgs.map(i => i.height));
  const totalW = allImgs.reduce((sum, i) => sum + i.width + 4, -4);
  const contact = new Jimp({ width: totalW, height: maxH, color: 0x00000000 });
  let offsetX = 0;
  for (const i of allImgs) {
    contact.composite(i, offsetX, maxH - i.height);
    offsetX += i.width + 4;
  }
  await contact.write(path.join(OUT_DIR, '_planche_originaux.png'));
  console.log('\n  _planche_originaux');

  // 23. PLANCHE - versions nuit
  const nightImgs = [];
  for (const sprite of SPRITES) {
    nightImgs.push(await Jimp.read(path.join(OUT_DIR, `${sprite.name}_03_nuit.png`)));
  }
  const contactNight = new Jimp({ width: totalW, height: maxH, color: 0x00000000 });
  offsetX = 0;
  for (const i of nightImgs) {
    contactNight.composite(i, offsetX, maxH - i.height);
    offsetX += i.width + 4;
  }
  await contactNight.write(path.join(OUT_DIR, '_planche_nuit.png'));
  console.log('  _planche_nuit');

  // 24. PLANCHE - versions glow
  const glowImgs = [];
  for (const sprite of SPRITES) {
    glowImgs.push(await Jimp.read(path.join(OUT_DIR, `${sprite.name}_12_glow.png`)));
  }
  const contactGlow = new Jimp({ width: totalW + 8, height: maxH + 2, color: 0x00000000 });
  offsetX = 0;
  for (const i of glowImgs) {
    contactGlow.composite(i, offsetX, maxH + 2 - i.height);
    offsetX += i.width + 4;
  }
  await contactGlow.write(path.join(OUT_DIR, '_planche_glow.png'));
  console.log('  _planche_glow');

  const count = SPRITES.length * 22 + 3;
  console.log(`\n✅ ${count} images generees dans ${OUT_DIR}`);
}

run().catch(console.error);
