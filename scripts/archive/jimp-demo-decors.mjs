/**
 * Jimp Demo 2 - Transformations creatives sur les decors/props
 * Montre des techniques differentes de la demo 1
 */
import { Jimp, intToRGBA, rgbaToInt } from 'jimp';
import path from 'path';
import fs from 'fs';

const SRC_DIR = path.resolve('assets/sprites/generated');
const OUT_DIR = path.resolve('assets/sprites/jimp-demo-decors');
fs.mkdirSync(OUT_DIR, { recursive: true });

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

// Helper: RGB -> HSL
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
  return [h, s, l];
}

// Helper: HSL -> RGB
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [clamp(r * 255), clamp(g * 255), clamp(b * 255)];
}

// Helper: shift hue of entire image
function shiftHue(img, hueShift) {
  const out = img.clone();
  out.scan(0, 0, out.width, out.height, (x, y) => {
    const px = out.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    h = (h + hueShift) % 1;
    if (h < 0) h += 1;
    const [nr, ng, nb] = hslToRgb(h, s, l);
    out.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  return out;
}

// Helper: adjust saturation
function adjustSaturation(img, factor) {
  const out = img.clone();
  out.scan(0, 0, out.width, out.height, (x, y) => {
    const px = out.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    s = Math.min(1, s * factor);
    const [nr, ng, nb] = hslToRgb(h, s, l);
    out.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  return out;
}

// Helper: replace a color range with another
function replaceColorRange(img, targetHueMin, targetHueMax, newHue, satMult = 1) {
  const out = img.clone();
  out.scan(0, 0, out.width, out.height, (x, y) => {
    const px = out.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    if (s > 0.1 && h >= targetHueMin && h <= targetHueMax) {
      h = newHue + (h - targetHueMin) * 0.3; // keep some variation
      s = Math.min(1, s * satMult);
      const [nr, ng, nb] = hslToRgb(h, s, l);
      out.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
    }
  });
  return out;
}

// Helper: add noise/grain
function addGrain(img, amount) {
  const out = img.clone();
  out.scan(0, 0, out.width, out.height, (x, y) => {
    const px = out.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    const noise = (Math.random() - 0.5) * amount;
    out.setPixelColor(rgbaToInt(clamp(r + noise), clamp(g + noise), clamp(b + noise), a), x, y);
  });
  return out;
}

// Helper: dithering effect (checker pattern darkening)
function dither(img) {
  const out = img.clone();
  out.scan(0, 0, out.width, out.height, (x, y) => {
    if ((x + y) % 2 !== 0) return;
    const px = out.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    out.setPixelColor(rgbaToInt(clamp(r * 0.7), clamp(g * 0.7), clamp(b * 0.7), a), x, y);
  });
  return out;
}

async function run() {
  // ============================================================
  // MAISON PROVENCALE
  // ============================================================
  console.log('\n=== MAISON ===');
  const maison = await Jimp.read(path.join(SRC_DIR, 'maison_provencale.png'));

  // Original
  await maison.clone().write(path.join(OUT_DIR, 'maison_00_original.png'));

  // Toit bleu (remplacer les teintes rouges/oranges du toit par du bleu)
  const maisonBleu = replaceColorRange(maison, 0.0, 0.12, 0.6, 0.9);
  await maisonBleu.write(path.join(OUT_DIR, 'maison_01_toit_bleu.png'));
  console.log('  01_toit_bleu');

  // Toit vert
  const maisonVert = replaceColorRange(maison, 0.0, 0.12, 0.35, 0.8);
  await maisonVert.write(path.join(OUT_DIR, 'maison_02_toit_vert.png'));
  console.log('  02_toit_vert');

  // Toit violet/lavande
  const maisonViolet = replaceColorRange(maison, 0.0, 0.12, 0.75, 0.9);
  await maisonViolet.write(path.join(OUT_DIR, 'maison_03_toit_lavande.png'));
  console.log('  03_toit_lavande');

  // Murs roses (remplacer les teintes jaunes/beiges des murs)
  const maisonRose = replaceColorRange(maison, 0.1, 0.2, 0.95, 1.2);
  await maisonRose.write(path.join(OUT_DIR, 'maison_04_murs_roses.png'));
  console.log('  04_murs_roses');

  // Version automne (hue shift global + saturation reduite)
  const maisonAutomne = adjustSaturation(shiftHue(maison, 0.05), 0.7);
  await maisonAutomne.write(path.join(OUT_DIR, 'maison_05_automne.png'));
  console.log('  05_automne');

  // Version hiver (desature + bleu)
  const maisonHiver = maison.clone();
  maisonHiver.scan(0, 0, maisonHiver.width, maisonHiver.height, (x, y) => {
    const px = maisonHiver.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    s *= 0.3; // tres desature
    l = l * 0.8 + 0.15; // plus clair
    h = (h * 0.3 + 0.58 * 0.7); // tirer vers le bleu
    const [nr, ng, nb] = hslToRgb(h, s, l);
    maisonHiver.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  await maisonHiver.write(path.join(OUT_DIR, 'maison_06_hiver.png'));
  console.log('  06_hiver');

  // Miroir (2eme maison differente)
  const maisonMiroir = maison.clone().flip({ horizontal: true });
  await maisonMiroir.write(path.join(OUT_DIR, 'maison_07_miroir.png'));
  console.log('  07_miroir');

  // Rangee de maisons (3 maisons cote a cote, couleurs differentes)
  const row = new Jimp({ width: maison.width * 3 + 8, height: maison.height, color: 0x00000000 });
  row.composite(maison, 0, 0);
  row.composite(maisonBleu, maison.width + 4, 0);
  row.composite(maisonViolet, maison.width * 2 + 8, 0);
  await row.write(path.join(OUT_DIR, 'maison_08_rangee_village.png'));
  console.log('  08_rangee_village');

  // Nuit (fenetre qui brille)
  const maisonNuit = maison.clone();
  maisonNuit.scan(0, 0, maisonNuit.width, maisonNuit.height, (x, y) => {
    const px = maisonNuit.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    // Detecter les pixels bleu clair (fenetres) -> les rendre jaune lumineux
    if (h > 0.5 && h < 0.7 && s > 0.3 && l > 0.4) {
      // Fenetre -> lumiere chaude
      maisonNuit.setPixelColor(rgbaToInt(
        clamp(255),
        clamp(220),
        clamp(100),
        a
      ), x, y);
    } else {
      // Reste -> sombre bleu nuit
      const nr = clamp(r * 0.3 + b * 0.1);
      const ng = clamp(g * 0.3 + b * 0.1);
      const nb = clamp(b * 0.5 + 30);
      maisonNuit.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
    }
  });
  await maisonNuit.write(path.join(OUT_DIR, 'maison_09_nuit_fenetre.png'));
  console.log('  09_nuit_fenetre');

  // Grain/weathered (vieille maison)
  const maisonVieille = addGrain(adjustSaturation(maison, 0.5), 40);
  await maisonVieille.write(path.join(OUT_DIR, 'maison_10_vieille.png'));
  console.log('  10_vieille');

  // ============================================================
  // ARBRE
  // ============================================================
  console.log('\n=== ARBRE ===');
  const arbre = await Jimp.read(path.join(SRC_DIR, 'arbre_platane.png'));
  await arbre.clone().write(path.join(OUT_DIR, 'arbre_00_original.png'));

  // Automne (verts -> orange/rouge)
  const arbreAutomne = replaceColorRange(arbre, 0.2, 0.45, 0.08, 1.2);
  await arbreAutomne.write(path.join(OUT_DIR, 'arbre_01_automne.png'));
  console.log('  01_automne');

  // Automne rouge profond
  const arbreRouge = replaceColorRange(arbre, 0.2, 0.45, 0.0, 1.3);
  await arbreRouge.write(path.join(OUT_DIR, 'arbre_02_rouge.png'));
  console.log('  02_rouge');

  // Printemps (verts -> vert clair + rose fleurs)
  const arbrePrintemps = arbre.clone();
  arbrePrintemps.scan(0, 0, arbrePrintemps.width, arbrePrintemps.height, (x, y) => {
    const px = arbrePrintemps.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    if (h > 0.2 && h < 0.45 && s > 0.15) {
      // Vert -> plus clair, plus jaune-vert
      l = Math.min(0.85, l * 1.2 + 0.05);
      s = Math.min(1, s * 1.3);
      h = 0.25; // jaune-vert
      // Quelques pixels deviennent roses (fleurs)
      if (Math.random() < 0.08 && l > 0.4) {
        h = 0.9; s = 0.7; l = 0.75;
      }
      const [nr, ng, nb] = hslToRgb(h, s, l);
      arbrePrintemps.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
    }
  });
  await arbrePrintemps.write(path.join(OUT_DIR, 'arbre_03_printemps_fleurs.png'));
  console.log('  03_printemps_fleurs');

  // Hiver (sans feuilles = desature, gris-bleu)
  const arbreHiver = arbre.clone();
  arbreHiver.scan(0, 0, arbreHiver.width, arbreHiver.height, (x, y) => {
    const px = arbreHiver.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    if (h > 0.2 && h < 0.45 && s > 0.15) {
      s *= 0.15;
      l = l * 0.7 + 0.15;
      h = 0.58;
    }
    const [nr, ng, nb] = hslToRgb(h, s, l);
    arbreHiver.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  await arbreHiver.write(path.join(OUT_DIR, 'arbre_04_hiver.png'));
  console.log('  04_hiver');

  // Cerisier (vert -> rose)
  const cerisier = replaceColorRange(arbre, 0.2, 0.45, 0.9, 0.8);
  await cerisier.write(path.join(OUT_DIR, 'arbre_05_cerisier.png'));
  console.log('  05_cerisier');

  // Arbre enchante (vert -> cyan lumineux)
  const arbreMagique = replaceColorRange(arbre, 0.2, 0.45, 0.5, 1.5);
  const arbreMag2 = arbreMagique;
  arbreMag2.scan(0, 0, arbreMag2.width, arbreMag2.height, (x, y) => {
    const px = arbreMag2.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    if (h > 0.4 && h < 0.6 && s > 0.3) {
      l = Math.min(0.9, l + 0.15);
    }
    const [nr, ng, nb] = hslToRgb(h, s, l);
    arbreMag2.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  await arbreMag2.write(path.join(OUT_DIR, 'arbre_06_enchante.png'));
  console.log('  06_enchante');

  // Foret (3 arbres dont un flip, couleurs variees)
  const foret = new Jimp({ width: arbre.width * 3 - 16, height: arbre.height + 6, color: 0x00000000 });
  foret.composite(arbreAutomne, 0, 3);
  foret.composite(arbre, arbre.width - 10, 0);
  foret.composite(arbre.clone().flip({ horizontal: true }), arbre.width * 2 - 20, 5);
  await foret.write(path.join(OUT_DIR, 'arbre_07_foret.png'));
  console.log('  07_foret (composition)');

  // Planche 4 saisons
  const saisons = new Jimp({ width: arbre.width * 4 + 12, height: arbre.height, color: 0x00000000 });
  saisons.composite(arbrePrintemps, 0, 0);
  saisons.composite(arbre, arbre.width + 4, 0);
  saisons.composite(arbreAutomne, arbre.width * 2 + 8, 0);
  saisons.composite(arbreHiver, arbre.width * 3 + 12, 0);
  await saisons.write(path.join(OUT_DIR, 'arbre_08_4saisons.png'));
  console.log('  08_4saisons (planche)');

  // ============================================================
  // TERRASSE CAFE
  // ============================================================
  console.log('\n=== TERRASSE ===');
  const terrasse = await Jimp.read(path.join(SRC_DIR, 'terrasse_cafe.png'));
  await terrasse.clone().write(path.join(OUT_DIR, 'terrasse_00_original.png'));

  // Parasol bleu
  const terrasseBleu = replaceColorRange(terrasse, 0.0, 0.12, 0.6, 1.0);
  await terrasseBleu.write(path.join(OUT_DIR, 'terrasse_01_parasol_bleu.png'));
  console.log('  01_parasol_bleu');

  // Parasol vert
  const terrasseVert = replaceColorRange(terrasse, 0.0, 0.12, 0.35, 0.9);
  await terrasseVert.write(path.join(OUT_DIR, 'terrasse_02_parasol_vert.png'));
  console.log('  02_parasol_vert');

  // Parasol jaune
  const terrasseJaune = replaceColorRange(terrasse, 0.0, 0.12, 0.15, 1.2);
  await terrasseJaune.write(path.join(OUT_DIR, 'terrasse_03_parasol_jaune.png'));
  console.log('  03_parasol_jaune');

  // Nuit avec ambiance
  const terrasseNuit = terrasse.clone();
  terrasseNuit.scan(0, 0, terrasseNuit.width, terrasseNuit.height, (x, y) => {
    const px = terrasseNuit.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    const nr = clamp(r * 0.35 + 10);
    const ng = clamp(g * 0.3 + 10);
    const nb = clamp(b * 0.55 + 25);
    terrasseNuit.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  await terrasseNuit.write(path.join(OUT_DIR, 'terrasse_04_nuit.png'));
  console.log('  04_nuit');

  // Dithered retro
  const terrasseDither = dither(terrasse);
  await terrasseDither.write(path.join(OUT_DIR, 'terrasse_05_dither.png'));
  console.log('  05_dither');

  // ============================================================
  // FONTAINE
  // ============================================================
  console.log('\n=== FONTAINE ===');
  const fontaine = await Jimp.read(path.join(SRC_DIR, 'fontaine_place.png'));
  await fontaine.clone().write(path.join(OUT_DIR, 'fontaine_00_original.png'));

  // Fontaine doree (pierre -> or)
  const fontaineOr = fontaine.clone();
  fontaineOr.scan(0, 0, fontaineOr.width, fontaineOr.height, (x, y) => {
    const px = fontaineOr.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    if (s < 0.4) { // pixels gris/pierre
      h = 0.12; s = Math.min(1, s + 0.5); // dorer
    }
    const [nr, ng, nb] = hslToRgb(h, s, l);
    fontaineOr.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  await fontaineOr.write(path.join(OUT_DIR, 'fontaine_01_doree.png'));
  console.log('  01_doree');

  // Fontaine eau verte (mare)
  const fontaineVerte = replaceColorRange(fontaine, 0.5, 0.7, 0.35, 1.3);
  await fontaineVerte.write(path.join(OUT_DIR, 'fontaine_02_eau_verte.png'));
  console.log('  02_eau_verte');

  // Fontaine nuit
  const fontaineNuit = fontaine.clone();
  fontaineNuit.scan(0, 0, fontaineNuit.width, fontaineNuit.height, (x, y) => {
    const px = fontaineNuit.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    // Eau -> luminescente bleu clair
    if (h > 0.5 && h < 0.7 && s > 0.2) {
      l = Math.min(0.8, l + 0.2);
      s = Math.min(1, s + 0.3);
    } else {
      l *= 0.4;
      s *= 0.3;
      h = h * 0.4 + 0.6 * 0.6;
    }
    const [nr, ng, nb] = hslToRgb(h, s, l);
    fontaineNuit.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  await fontaineNuit.write(path.join(OUT_DIR, 'fontaine_03_nuit_lueur.png'));
  console.log('  03_nuit_lueur');

  // ============================================================
  // BANC
  // ============================================================
  console.log('\n=== BANC ===');
  const banc = await Jimp.read(path.join(SRC_DIR, 'banc_bois.png'));
  await banc.clone().write(path.join(OUT_DIR, 'banc_00_original.png'));

  // Banc blanc (peint)
  const bancBlanc = banc.clone();
  bancBlanc.scan(0, 0, bancBlanc.width, bancBlanc.height, (x, y) => {
    const px = bancBlanc.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    if (h > 0.05 && h < 0.15 && s > 0.2) { // bois
      s *= 0.1;
      l = Math.min(0.95, l * 0.5 + 0.5);
    }
    const [nr, ng, nb] = hslToRgb(h, s, l);
    bancBlanc.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  await bancBlanc.write(path.join(OUT_DIR, 'banc_01_blanc.png'));
  console.log('  01_blanc');

  // Banc vert (parc)
  const bancVert = replaceColorRange(banc, 0.05, 0.15, 0.35, 1.2);
  await bancVert.write(path.join(OUT_DIR, 'banc_02_vert.png'));
  console.log('  02_vert');

  // Banc bleu provence
  const bancBleu = replaceColorRange(banc, 0.05, 0.15, 0.58, 1.0);
  await bancBleu.write(path.join(OUT_DIR, 'banc_03_bleu.png'));
  console.log('  03_bleu');

  // Banc vieux (grain + desature)
  const bancVieux = addGrain(adjustSaturation(banc, 0.4), 35);
  await bancVieux.write(path.join(OUT_DIR, 'banc_04_vieux.png'));
  console.log('  04_vieux');

  // ============================================================
  // TERRAIN PETANQUE
  // ============================================================
  console.log('\n=== TERRAIN ===');
  const terrain = await Jimp.read(path.join(SRC_DIR, 'terrain_petanque.png'));
  await terrain.clone().write(path.join(OUT_DIR, 'terrain_00_original.png'));

  // Terrain sable clair
  const terrainSable = terrain.clone();
  terrainSable.scan(0, 0, terrainSable.width, terrainSable.height, (x, y) => {
    const px = terrainSable.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    if (h > 0.05 && h < 0.2 && s > 0.1) {
      l = Math.min(0.9, l + 0.15);
      s *= 0.6;
      h = 0.12;
    }
    const [nr, ng, nb] = hslToRgb(h, s, l);
    terrainSable.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  await terrainSable.write(path.join(OUT_DIR, 'terrain_01_sable_clair.png'));
  console.log('  01_sable_clair');

  // Terrain terre rouge
  const terrainRouge = terrain.clone();
  terrainRouge.scan(0, 0, terrainRouge.width, terrainRouge.height, (x, y) => {
    const px = terrainRouge.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    if (h > 0.05 && h < 0.2) {
      h = 0.02; s = Math.min(1, s * 1.5 + 0.1);
    }
    const [nr, ng, nb] = hslToRgb(h, s, l);
    terrainRouge.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  await terrainRouge.write(path.join(OUT_DIR, 'terrain_02_terre_rouge.png'));
  console.log('  02_terre_rouge');

  // Terrain nuit
  const terrainNuit = terrain.clone();
  terrainNuit.scan(0, 0, terrainNuit.width, terrainNuit.height, (x, y) => {
    const px = terrainNuit.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    terrainNuit.setPixelColor(rgbaToInt(
      clamp(r * 0.3 + 5),
      clamp(g * 0.3 + 5),
      clamp(b * 0.5 + 20),
      a
    ), x, y);
  });
  await terrainNuit.write(path.join(OUT_DIR, 'terrain_03_nuit.png'));
  console.log('  03_nuit');

  // ============================================================
  // SCENE COMPOSEE - Place du village
  // ============================================================
  console.log('\n=== SCENE COMPOSEE ===');
  const sceneW = 200;
  const sceneH = 120;

  // Scene jour
  const sceneJour = new Jimp({ width: sceneW, height: sceneH, color: 0x90C87EFF }); // fond herbe
  // Sol terrain petanque au centre
  const terrainSmall = terrain.clone().resize({ w: 64, h: 64 });
  sceneJour.composite(terrainSmall, 68, 40);
  // Maisons en arriere-plan
  const maisonSmall = maison.clone().resize({ w: 40, h: 40 });
  sceneJour.composite(maisonSmall, 10, 5);
  sceneJour.composite(maisonBleu.clone().resize({ w: 40, h: 40 }), 55, 2);
  sceneJour.composite(maisonViolet.clone().resize({ w: 40, h: 40 }), 140, 8);
  // Arbres
  const arbreSmall = arbre.clone().resize({ w: 40, h: 40 });
  sceneJour.composite(arbreSmall, 100, 0);
  sceneJour.composite(arbreSmall.clone().flip({ horizontal: true }), 155, 3);
  // Banc
  const bancSmall = banc.clone().resize({ w: 28, h: 16 });
  sceneJour.composite(bancSmall, 5, 75);
  // Fontaine
  const fontaineSmall = fontaine.clone().resize({ w: 32, h: 32 });
  sceneJour.composite(fontaineSmall, 140, 60);
  // Terrasse
  const terrasseSmall = terrasse.clone().resize({ w: 36, h: 30 });
  sceneJour.composite(terrasseSmall, 15, 90);
  await sceneJour.write(path.join(OUT_DIR, 'scene_01_village_jour.png'));
  console.log('  scene_01_village_jour');

  // Scene nuit (meme composition, couleurs nuit)
  const sceneNuit = sceneJour.clone();
  sceneNuit.scan(0, 0, sceneNuit.width, sceneNuit.height, (x, y) => {
    const px = sceneNuit.getPixelColor(x, y);
    const { r, g, b, a } = intToRGBA(px);
    if (a === 0) return;
    sceneNuit.setPixelColor(rgbaToInt(
      clamp(r * 0.25 + 10),
      clamp(g * 0.25 + 10),
      clamp(b * 0.5 + 30),
      a
    ), x, y);
  });
  await sceneNuit.write(path.join(OUT_DIR, 'scene_02_village_nuit.png'));
  console.log('  scene_02_village_nuit');

  // Scene automne
  const sceneAutomne = new Jimp({ width: sceneW, height: sceneH, color: 0xA8B060FF });
  sceneAutomne.composite(terrainSmall, 68, 40);
  sceneAutomne.composite(maisonSmall, 10, 5);
  sceneAutomne.composite(maisonAutomne.clone().resize({ w: 40, h: 40 }), 55, 2);
  sceneAutomne.composite(maisonSmall, 140, 8);
  const arbreAutSmall = arbreAutomne.clone().resize({ w: 40, h: 40 });
  sceneAutomne.composite(arbreAutSmall, 100, 0);
  sceneAutomne.composite(arbreRouge.clone().resize({ w: 40, h: 40 }), 155, 3);
  sceneAutomne.composite(bancSmall, 5, 75);
  sceneAutomne.composite(fontaineSmall, 140, 60);
  sceneAutomne.composite(terrasseSmall, 15, 90);
  await sceneAutomne.write(path.join(OUT_DIR, 'scene_03_village_automne.png'));
  console.log('  scene_03_village_automne');

  // Compter les fichiers
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png'));
  console.log(`\n✅ ${files.length} images generees dans ${OUT_DIR}`);
}

run().catch(console.error);
