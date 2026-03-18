/**
 * Jimp Demo 3 - Modifications creatives sur les assets FREE PACKS
 * Schwarnhild Summer Village, Pipoya, Lively NPCs
 */
import { Jimp, intToRGBA, rgbaToInt } from 'jimp';
import path from 'path';
import fs from 'fs';

const BASE = path.resolve('assets/free_packs');
const OUT_DIR = path.resolve('assets/sprites/jimp-demo-freepacks');
fs.mkdirSync(OUT_DIR, { recursive: true });

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

// ---- Color helpers ----
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

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
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

function shiftHue(img, shift) {
  const out = img.clone();
  out.scan(0, 0, out.width, out.height, (x, y) => {
    const { r, g, b, a } = intToRGBA(out.getPixelColor(x, y));
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    h = (h + shift) % 1; if (h < 0) h += 1;
    const [nr, ng, nb] = hslToRgb(h, s, l);
    out.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  return out;
}

function recolorRange(img, hueMin, hueMax, newHue, satMult = 1) {
  const out = img.clone();
  out.scan(0, 0, out.width, out.height, (x, y) => {
    const { r, g, b, a } = intToRGBA(out.getPixelColor(x, y));
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    if (s > 0.08 && h >= hueMin && h <= hueMax) {
      h = newHue + (h - hueMin) * 0.2;
      s = Math.min(1, s * satMult);
      const [nr, ng, nb] = hslToRgb(h, s, l);
      out.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
    }
  });
  return out;
}

function nightify(img) {
  const out = img.clone();
  out.scan(0, 0, out.width, out.height, (x, y) => {
    const { r, g, b, a } = intToRGBA(out.getPixelColor(x, y));
    if (a === 0) return;
    out.setPixelColor(rgbaToInt(
      clamp(r * 0.28 + 8),
      clamp(g * 0.28 + 8),
      clamp(b * 0.5 + 25),
      a
    ), x, y);
  });
  return out;
}

function autumnify(img) {
  return recolorRange(img, 0.2, 0.45, 0.07, 1.2);
}

function provencalize(img) {
  // Rendre les couleurs plus chaudes, ocre, terracotta
  const out = img.clone();
  out.scan(0, 0, out.width, out.height, (x, y) => {
    const { r, g, b, a } = intToRGBA(out.getPixelColor(x, y));
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    // Pousser vers les ocres/terracotta
    if (s > 0.05) {
      h = h * 0.4 + 0.06 * 0.6; // tirer vers orange chaud
      s = Math.min(1, s * 1.15 + 0.05);
    }
    const [nr, ng, nb] = hslToRgb(h, s, l);
    out.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  return out;
}

function sunsetify(img) {
  const out = img.clone();
  out.scan(0, 0, out.width, out.height, (x, y) => {
    const { r, g, b, a } = intToRGBA(out.getPixelColor(x, y));
    if (a === 0) return;
    // Coucher de soleil : orange chaud + assombri
    out.setPixelColor(rgbaToInt(
      clamp(r * 0.8 + 40),
      clamp(g * 0.55 + 15),
      clamp(b * 0.35 + 10),
      a
    ), x, y);
  });
  return out;
}

// Helper: extract a rectangle from a spritesheet
function extractRegion(img, rx, ry, rw, rh) {
  const out = new Jimp({ width: rw, height: rh, color: 0x00000000 });
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const sx = rx + x;
      const sy = ry + y;
      if (sx < img.width && sy < img.height) {
        out.setPixelColor(img.getPixelColor(sx, sy), x, y);
      }
    }
  }
  return out;
}

async function run() {
  // ============================================================
  // 1. MAISONS SCHWARNHILD - Extraire et recolorer
  // ============================================================
  console.log('\n=== MAISONS SCHWARNHILD ===');
  const houses = await Jimp.read(path.join(BASE, 'summer_village_v1.0/summer_village_v1.0/assets/houses.png'));

  // Extraire la premiere maison (toit vert, petite) - environ 160x145 en haut a gauche
  const house1 = extractRegion(houses, 0, 0, 160, 145);
  await house1.write(path.join(OUT_DIR, 'maison_01_verte_original.png'));
  console.log('  maison_01_verte_original');

  // Toit terracotta provencal (vert -> orange/rouge)
  const houseTerra = recolorRange(house1, 0.25, 0.5, 0.05, 1.0);
  await houseTerra.write(path.join(OUT_DIR, 'maison_02_toit_terracotta.png'));
  console.log('  maison_02_toit_terracotta');

  // Toit lavande
  const houseLavande = recolorRange(house1, 0.25, 0.5, 0.75, 0.8);
  await houseLavande.write(path.join(OUT_DIR, 'maison_03_toit_lavande.png'));
  console.log('  maison_03_toit_lavande');

  // Toit bleu ciel
  const houseBleuCiel = recolorRange(house1, 0.25, 0.5, 0.55, 0.7);
  await houseBleuCiel.write(path.join(OUT_DIR, 'maison_04_toit_bleu_ciel.png'));
  console.log('  maison_04_toit_bleu_ciel');

  // Extraire la maison bleue (milieu haut) - environ 160x145
  const house2 = extractRegion(houses, 388, 0, 160, 145);
  await house2.write(path.join(OUT_DIR, 'maison_05_bleue_original.png'));
  console.log('  maison_05_bleue_original');

  // Maison bleue -> toit ocre
  const house2Ocre = recolorRange(house2, 0.5, 0.7, 0.1, 1.1);
  await house2Ocre.write(path.join(OUT_DIR, 'maison_06_bleue_vers_ocre.png'));
  console.log('  maison_06_bleue_vers_ocre');

  // Extraire grande maison (bas gauche)
  const house3 = extractRegion(houses, 0, 145, 210, 175);
  await house3.write(path.join(OUT_DIR, 'maison_07_grande_original.png'));
  console.log('  maison_07_grande_original');

  // Grande maison provencale
  const house3Prov = provencalize(house3);
  await house3Prov.write(path.join(OUT_DIR, 'maison_08_grande_provencale.png'));
  console.log('  maison_08_grande_provencale');

  // Toutes les maisons - version nuit
  const housesNuit = nightify(houses);
  await housesNuit.write(path.join(OUT_DIR, 'maisons_09_toutes_nuit.png'));
  console.log('  maisons_09_toutes_nuit');

  // Toutes les maisons - coucher de soleil
  const housesSunset = sunsetify(houses);
  await housesSunset.write(path.join(OUT_DIR, 'maisons_10_toutes_sunset.png'));
  console.log('  maisons_10_toutes_sunset');

  // Toutes les maisons - automne
  const housesAutumn = autumnify(houses);
  await housesAutumn.write(path.join(OUT_DIR, 'maisons_11_toutes_automne.png'));
  await provencalize(houses).write(path.join(OUT_DIR, 'maisons_12_toutes_provencales.png'));
  console.log('  maisons_11_toutes_automne');
  console.log('  maisons_12_toutes_provencales');

  // ============================================================
  // 2. NATURE ASSETS - Saisons
  // ============================================================
  console.log('\n=== NATURE ===');
  const nature = await Jimp.read(path.join(BASE, 'summer_village_v1.0/summer_village_v1.0/assets/nature_assets.png'));

  await nature.clone().write(path.join(OUT_DIR, 'nature_00_original.png'));

  // Automne complet
  const natureAutomne = autumnify(nature);
  await natureAutomne.write(path.join(OUT_DIR, 'nature_01_automne.png'));
  console.log('  nature_01_automne');

  // Hiver (desature, gris-bleu)
  const natureHiver = nature.clone();
  natureHiver.scan(0, 0, natureHiver.width, natureHiver.height, (x, y) => {
    const { r, g, b, a } = intToRGBA(natureHiver.getPixelColor(x, y));
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    s *= 0.2;
    l = l * 0.75 + 0.2;
    h = h * 0.3 + 0.55 * 0.7;
    const [nr, ng, nb] = hslToRgb(h, s, l);
    natureHiver.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
  });
  await natureHiver.write(path.join(OUT_DIR, 'nature_02_hiver.png'));
  console.log('  nature_02_hiver');

  // Nuit
  await nightify(nature).write(path.join(OUT_DIR, 'nature_03_nuit.png'));
  console.log('  nature_03_nuit');

  // Printemps (plus vert vif + fleurs roses aleatoires)
  const naturePrintemps = nature.clone();
  naturePrintemps.scan(0, 0, naturePrintemps.width, naturePrintemps.height, (x, y) => {
    const { r, g, b, a } = intToRGBA(naturePrintemps.getPixelColor(x, y));
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    if (h > 0.2 && h < 0.45 && s > 0.15) {
      s = Math.min(1, s * 1.4);
      l = Math.min(0.85, l * 1.1 + 0.03);
      h = 0.3;
      if (Math.random() < 0.04 && l > 0.45) {
        h = 0.9; s = 0.8; l = 0.7; // fleurs roses
      }
      const [nr, ng, nb] = hslToRgb(h, s, l);
      naturePrintemps.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
    }
  });
  await naturePrintemps.write(path.join(OUT_DIR, 'nature_04_printemps.png'));
  console.log('  nature_04_printemps');

  // Sunset
  await sunsetify(nature).write(path.join(OUT_DIR, 'nature_05_sunset.png'));
  console.log('  nature_05_sunset');

  // ============================================================
  // 3. VILLAGE ASSETS (etals, tonneaux, etc.)
  // ============================================================
  console.log('\n=== VILLAGE ASSETS ===');
  const village = await Jimp.read(path.join(BASE, 'summer_village_v1.0/summer_village_v1.0/assets/village_assets.png'));

  await village.clone().write(path.join(OUT_DIR, 'village_00_original.png'));

  // Provencal
  await provencalize(village).write(path.join(OUT_DIR, 'village_01_provencal.png'));
  console.log('  village_01_provencal');

  // Nuit marche
  await nightify(village).write(path.join(OUT_DIR, 'village_02_nuit.png'));
  console.log('  village_02_nuit');

  // Hue shift pour varier les etals
  await shiftHue(village, 0.15).write(path.join(OUT_DIR, 'village_03_hueshift_bleu.png'));
  await shiftHue(village, 0.3).write(path.join(OUT_DIR, 'village_04_hueshift_violet.png'));
  await shiftHue(village, -0.1).write(path.join(OUT_DIR, 'village_05_hueshift_rouge.png'));
  console.log('  village_03/04/05_hueshift variants');

  // ============================================================
  // 4. PERSONNAGE OLD MAN - recolor spritesheet
  // ============================================================
  console.log('\n=== OLD MAN SPRITESHEET ===');
  const oldMan = await Jimp.read(path.join(BASE, 'summer_village_v1.0/summer_village_v1.0/characters/old_man_spritesheet.png'));

  await oldMan.clone().write(path.join(OUT_DIR, 'oldman_00_original.png'));

  // Vetements bleus (provencal pecheur)
  const oldManBleu = recolorRange(oldMan, 0.1, 0.22, 0.6, 1.0);
  await oldManBleu.write(path.join(OUT_DIR, 'oldman_01_bleu.png'));
  console.log('  oldman_01_bleu');

  // Vetements rouges (rival)
  const oldManRouge = recolorRange(oldMan, 0.1, 0.22, 0.0, 1.2);
  await oldManRouge.write(path.join(OUT_DIR, 'oldman_02_rouge.png'));
  console.log('  oldman_02_rouge');

  // Vetements verts
  const oldManVert = recolorRange(oldMan, 0.1, 0.22, 0.35, 1.0);
  await oldManVert.write(path.join(OUT_DIR, 'oldman_03_vert.png'));
  console.log('  oldman_03_vert');

  // Version nuit
  await nightify(oldMan).write(path.join(OUT_DIR, 'oldman_04_nuit.png'));
  console.log('  oldman_04_nuit');

  // Hue shift global (perso completement different)
  await shiftHue(oldMan, 0.5).write(path.join(OUT_DIR, 'oldman_05_alien.png'));
  console.log('  oldman_05_alien (hue+180)');

  // Peau plus foncee
  const oldManDark = oldMan.clone();
  oldManDark.scan(0, 0, oldManDark.width, oldManDark.height, (x, y) => {
    const { r, g, b, a } = intToRGBA(oldManDark.getPixelColor(x, y));
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    // Pixels peau (teinte orange-beige, saturation moyenne)
    if (h > 0.05 && h < 0.15 && s > 0.2 && s < 0.8 && l > 0.4 && l < 0.85) {
      l *= 0.65;
      s *= 1.1;
      const [nr, ng, nb] = hslToRgb(h, s, l);
      oldManDark.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
    }
  });
  await oldManDark.write(path.join(OUT_DIR, 'oldman_06_peau_foncee.png'));
  console.log('  oldman_06_peau_foncee');

  // Extraire une frame idle (premier frame, en haut a gauche)
  // Le spritesheet semble etre 8 colonnes, chaque frame ~30x48
  const frameW = Math.floor(oldMan.width / 8);
  const frameH = Math.floor(oldMan.height / 8);
  const frame1 = extractRegion(oldMan, 0, 0, frameW, frameH);
  await frame1.write(path.join(OUT_DIR, 'oldman_07_frame_extraite.png'));
  // Upscale x4
  const frame1Big = frame1.clone().resize({ w: frameW * 4, h: frameH * 4 });
  await frame1Big.write(path.join(OUT_DIR, 'oldman_08_frame_x4.png'));
  console.log('  oldman_07_frame + 08_frame_x4');

  // ============================================================
  // 5. FOOD MERCHANT - recolor
  // ============================================================
  console.log('\n=== FOOD MERCHANT ===');
  const merchant = await Jimp.read(path.join(BASE, 'summer_village_v1.0/summer_village_v1.0/characters/food_merchant_spritesheet.png'));

  await merchant.clone().write(path.join(OUT_DIR, 'merchant_00_original.png'));

  // Tablier bleu
  await recolorRange(merchant, 0.1, 0.22, 0.6, 1.0).write(path.join(OUT_DIR, 'merchant_01_tablier_bleu.png'));
  console.log('  merchant_01_tablier_bleu');

  // Tablier vert
  await recolorRange(merchant, 0.1, 0.22, 0.35, 1.0).write(path.join(OUT_DIR, 'merchant_02_tablier_vert.png'));
  console.log('  merchant_02_tablier_vert');

  // Provencal (tons chauds)
  await provencalize(merchant).write(path.join(OUT_DIR, 'merchant_03_provencal.png'));
  console.log('  merchant_03_provencal');

  // ============================================================
  // 6. SUMMER PLAINS CHARACTER - variations
  // ============================================================
  console.log('\n=== SUMMER PLAINS CHARACTER ===');
  const plains = await Jimp.read(path.join(BASE, 'summer_plains_character_demo/character_demo/character_demo.png'));

  await plains.clone().write(path.join(OUT_DIR, 'plains_00_original.png'));

  // Chemise rouge
  const plainsRouge = recolorRange(plains, 0.55, 0.7, 0.0, 1.2);
  await plainsRouge.write(path.join(OUT_DIR, 'plains_01_rouge.png'));
  console.log('  plains_01_rouge');

  // Chemise verte
  const plainsVert = recolorRange(plains, 0.55, 0.7, 0.35, 1.0);
  await plainsVert.write(path.join(OUT_DIR, 'plains_02_vert.png'));
  console.log('  plains_02_vert');

  // Chemise jaune/or
  await recolorRange(plains, 0.55, 0.7, 0.12, 1.3).write(path.join(OUT_DIR, 'plains_03_or.png'));
  console.log('  plains_03_or');

  // Cheveux differents (bruns -> blonds)
  const plainsBlond = plains.clone();
  plainsBlond.scan(0, 0, plainsBlond.width, plainsBlond.height, (x, y) => {
    const { r, g, b, a } = intToRGBA(plainsBlond.getPixelColor(x, y));
    if (a === 0) return;
    let [h, s, l] = rgbToHsl(r, g, b);
    // Cheveux bruns -> blonds
    if (h > 0.05 && h < 0.12 && l < 0.45 && s > 0.3) {
      h = 0.12; l = l + 0.3; s *= 1.3;
      const [nr, ng, nb] = hslToRgb(h, Math.min(1, s), Math.min(0.85, l));
      plainsBlond.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
    }
  });
  await plainsBlond.write(path.join(OUT_DIR, 'plains_04_blond.png'));
  console.log('  plains_04_blond');

  // ============================================================
  // 7. TILES - Variations saisonnieres
  // ============================================================
  console.log('\n=== TILES SCHWARNHILD ===');
  const env = await Jimp.read(path.join(BASE, 'summer_village_v1.0/summer_village_v1.0/tiles/environment.png'));
  await env.clone().write(path.join(OUT_DIR, 'tiles_env_00_original.png'));
  await autumnify(env).write(path.join(OUT_DIR, 'tiles_env_01_automne.png'));
  await nightify(env).write(path.join(OUT_DIR, 'tiles_env_02_nuit.png'));
  await sunsetify(env).write(path.join(OUT_DIR, 'tiles_env_03_sunset.png'));
  console.log('  tiles_env: original, automne, nuit, sunset');

  // Cobblestone -> provencal
  const cobble = await Jimp.read(path.join(BASE, 'summer_village_v1.0/summer_village_v1.0/tiles/cobblestone_tiles_brown.png'));
  await cobble.clone().write(path.join(OUT_DIR, 'tiles_cobble_00_original.png'));
  await provencalize(cobble).write(path.join(OUT_DIR, 'tiles_cobble_01_provencal.png'));
  await nightify(cobble).write(path.join(OUT_DIR, 'tiles_cobble_02_nuit.png'));
  console.log('  tiles_cobble: original, provencal, nuit');

  // ============================================================
  // 8. PLANCHE COMPARATIVE - Jour / Sunset / Nuit
  // ============================================================
  console.log('\n=== PLANCHES COMPARATIVES ===');

  // Maison 1 : jour/terracotta/sunset/nuit
  const compW = house1.width * 4 + 12;
  const compH = house1.height;
  const compMaison = new Jimp({ width: compW, height: compH, color: 0x00000000 });
  compMaison.composite(house1, 0, 0);
  compMaison.composite(houseTerra, house1.width + 4, 0);
  compMaison.composite(sunsetify(house1), house1.width * 2 + 8, 0);
  compMaison.composite(nightify(house1), house1.width * 3 + 12, 0);
  await compMaison.write(path.join(OUT_DIR, '_planche_maison_4versions.png'));
  console.log('  _planche_maison_4versions (jour/terracotta/sunset/nuit)');

  // Nature : 4 saisons
  const natW = nature.width;
  const comp4s = new Jimp({ width: natW * 2 + 4, height: nature.height * 2 + 4, color: 0x00000000 });
  comp4s.composite(naturePrintemps, 0, 0);
  comp4s.composite(nature, natW + 4, 0);
  comp4s.composite(natureAutomne, 0, nature.height + 4);
  comp4s.composite(natureHiver, natW + 4, nature.height + 4);
  await comp4s.write(path.join(OUT_DIR, '_planche_nature_4saisons.png'));
  console.log('  _planche_nature_4saisons');

  // Old man : 4 variantes vetements
  const omW = oldMan.width;
  const compOm = new Jimp({ width: omW * 4 + 12, height: oldMan.height, color: 0x00000000 });
  compOm.composite(oldMan, 0, 0);
  compOm.composite(oldManBleu, omW + 4, 0);
  compOm.composite(oldManRouge, omW * 2 + 8, 0);
  compOm.composite(oldManVert, omW * 3 + 12, 0);
  await compOm.write(path.join(OUT_DIR, '_planche_oldman_4couleurs.png'));
  console.log('  _planche_oldman_4couleurs');

  // Compter
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png'));
  console.log(`\n✅ ${files.length} images generees dans ${OUT_DIR}`);
}

run().catch(console.error);
