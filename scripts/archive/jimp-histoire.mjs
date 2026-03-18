/**
 * Jimp - Generation assets pour "L'Heritier de la Ciotat"
 * Selection optimale + modifications thematiques
 */
import { Jimp, intToRGBA, rgbaToInt } from 'jimp';
import path from 'path';
import fs from 'fs';

const FREE = path.resolve('assets/free_packs');
const PIPOYA_CHARS = path.join(FREE, 'PIPOYA FREE RPG Character Sprites 32x32/PIPOYA FREE RPG Character Sprites 32x32');
const LIVELY = path.join(FREE, 'Lively_NPCs_v3.0/Lively_NPCs_v3.0/sprite sheets/medieval');
const SCHWARNHILD = path.join(FREE, 'summer_village_v1.0/summer_village_v1.0');
const PIPOYA_TILES = path.join(FREE, 'Pipoya RPG Tileset 32x32/Pipoya RPG Tileset 32x32');
const GENERATED = path.resolve('assets/sprites/generated');

const OUT = path.resolve('assets/sprites/histoire-ciotat');
fs.mkdirSync(path.join(OUT, '01_personnages'), { recursive: true });
fs.mkdirSync(path.join(OUT, '02_personnages_nuit'), { recursive: true });
fs.mkdirSync(path.join(OUT, '03_personnages_sepia'), { recursive: true });
fs.mkdirSync(path.join(OUT, '04_portraits_x4'), { recursive: true });
fs.mkdirSync(path.join(OUT, '05_decors_jour'), { recursive: true });
fs.mkdirSync(path.join(OUT, '06_decors_nuit'), { recursive: true });
fs.mkdirSync(path.join(OUT, '07_decors_sunset'), { recursive: true });
fs.mkdirSync(path.join(OUT, '08_decors_provencal'), { recursive: true });
fs.mkdirSync(path.join(OUT, '09_terrains_arenes'), { recursive: true });
fs.mkdirSync(path.join(OUT, '10_props_histoire'), { recursive: true });
fs.mkdirSync(path.join(OUT, '11_scenes'), { recursive: true });
fs.mkdirSync(path.join(OUT, '12_planches'), { recursive: true });

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
let count = 0;

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
    const q2r = (p, q, t) => { if (t<0) t+=1; if (t>1) t-=1; if (t<1/6) return p+(q-p)*6*t; if (t<1/2) return q; if (t<2/3) return p+(q-p)*(2/3-t)*6; return p; };
    const q = l < 0.5 ? l*(1+s) : l+s-l*s, p = 2*l-q;
    r = q2r(p,q,h+1/3); g = q2r(p,q,h); b = q2r(p,q,h-1/3);
  }
  return [clamp(r*255), clamp(g*255), clamp(b*255)];
}

// ---- Transforms ----
function recolorRange(img, hMin, hMax, newH, satM=1) {
  const o = img.clone();
  o.scan(0,0,o.width,o.height,(x,y) => {
    const {r,g,b,a} = intToRGBA(o.getPixelColor(x,y));
    if (a===0) return;
    let [h,s,l] = rgbToHsl(r,g,b);
    if (s>0.08 && h>=hMin && h<=hMax) {
      h = newH + (h-hMin)*0.2; s = Math.min(1, s*satM);
      const [nr,ng,nb] = hslToRgb(h,s,l);
      o.setPixelColor(rgbaToInt(nr,ng,nb,a),x,y);
    }
  });
  return o;
}
function nightify(img) {
  const o = img.clone();
  o.scan(0,0,o.width,o.height,(x,y) => {
    const {r,g,b,a} = intToRGBA(o.getPixelColor(x,y));
    if (a===0) return;
    o.setPixelColor(rgbaToInt(clamp(r*0.28+8), clamp(g*0.28+8), clamp(b*0.5+25), a),x,y);
  });
  return o;
}
function sepia(img) {
  const o = img.clone();
  o.scan(0,0,o.width,o.height,(x,y) => {
    const {r,g,b,a} = intToRGBA(o.getPixelColor(x,y));
    if (a===0) return;
    const gray = 0.299*r + 0.587*g + 0.114*b;
    o.setPixelColor(rgbaToInt(clamp(gray+40), clamp(gray+15), clamp(gray-20), a),x,y);
  });
  return o;
}
function sunset(img) {
  const o = img.clone();
  o.scan(0,0,o.width,o.height,(x,y) => {
    const {r,g,b,a} = intToRGBA(o.getPixelColor(x,y));
    if (a===0) return;
    o.setPixelColor(rgbaToInt(clamp(r*0.8+40), clamp(g*0.55+15), clamp(b*0.35+10), a),x,y);
  });
  return o;
}
function provencal(img) {
  const o = img.clone();
  o.scan(0,0,o.width,o.height,(x,y) => {
    const {r,g,b,a} = intToRGBA(o.getPixelColor(x,y));
    if (a===0) return;
    let [h,s,l] = rgbToHsl(r,g,b);
    if (s>0.05) { h = h*0.4+0.06*0.6; s = Math.min(1, s*1.15+0.05); }
    const [nr,ng,nb] = hslToRgb(h,s,l);
    o.setPixelColor(rgbaToInt(nr,ng,nb,a),x,y);
  });
  return o;
}
function autumnify(img) { return recolorRange(img, 0.2, 0.45, 0.07, 1.2); }
function goldify(img) {
  const o = img.clone();
  o.scan(0,0,o.width,o.height,(x,y) => {
    const {r,g,b,a} = intToRGBA(o.getPixelColor(x,y));
    if (a===0) return;
    const lum = 0.299*r+0.587*g+0.114*b;
    o.setPixelColor(rgbaToInt(clamp(lum*1.2+40), clamp(lum+15), clamp(lum*0.3), a),x,y);
  });
  return o;
}
function addGlow(img, glowR, glowG, glowB) {
  const o = img.clone();
  const edges = [];
  for (let gy=0; gy<o.height; gy++) for (let gx=0; gx<o.width; gx++) {
    const {a} = intToRGBA(o.getPixelColor(gx,gy));
    if (a>0) continue;
    for (const [nx,ny] of [[gx-1,gy],[gx+1,gy],[gx,gy-1],[gx,gy+1],[gx-1,gy-1],[gx+1,gy-1],[gx-1,gy+1],[gx+1,gy+1]]) {
      if (nx>=0 && nx<o.width && ny>=0 && ny<o.height) {
        const {a:na} = intToRGBA(o.getPixelColor(nx,ny));
        if (na>128) { edges.push([gx,gy]); break; }
      }
    }
  }
  for (const [ex,ey] of edges) o.setPixelColor(rgbaToInt(glowR,glowG,glowB,200),ex,ey);
  return o;
}
function extractFrame(img, col, row, fw, fh) {
  const o = new Jimp({width:fw, height:fh, color:0x00000000});
  for (let y=0; y<fh; y++) for (let x=0; x<fw; x++) {
    const sx=col*fw+x, sy=row*fh+y;
    if (sx<img.width && sy<img.height) o.setPixelColor(img.getPixelColor(sx,sy),x,y);
  }
  return o;
}

async function save(img, subdir, name) {
  await img.write(path.join(OUT, subdir, name));
  count++;
}

async function run() {
  console.log('=== GENERATION ASSETS "L\'HERITIER DE LA CIOTAT" ===\n');

  // ============================================================
  // 1. PERSONNAGES PRINCIPAUX (jour + recolors)
  // ============================================================
  console.log('--- PERSONNAGES ---');

  // JOUEUR - Male 02 recolore provencal (t-shirt bleu -> plus chaud)
  const joueur = await Jimp.read(path.join(PIPOYA_CHARS, 'Male/Male 02-1.png'));
  await save(joueur, '01_personnages', 'joueur_base.png');
  const joueurProv = recolorRange(joueur, 0.55, 0.7, 0.1, 1.0); // bleu -> ocre
  await save(joueurProv, '01_personnages', 'joueur_provencal.png');

  // PAPET - schwarnhild old man
  const papet = await Jimp.read(path.join(SCHWARNHILD, 'characters/old_man_spritesheet.png'));
  await save(papet, '01_personnages', 'papet_spritesheet.png');
  // Papet version provencale (vetements plus chauds)
  await save(provencal(papet), '01_personnages', 'papet_provencal.png');

  // MARCEL - farmer_01 recolore terre/brun
  const marcel = await Jimp.read(path.join(LIVELY, 'farmer_01.png'));
  await save(marcel, '01_personnages', 'marcel_base.png');
  const marcelTerre = recolorRange(marcel, 0.0, 0.15, 0.08, 0.9);
  await save(marcelTerre, '01_personnages', 'marcel_terre.png');

  // FANNY - barmaid recoloree vert herbe
  const fanny = await Jimp.read(path.join(LIVELY, 'barmaid.png'));
  await save(fanny, '01_personnages', 'fanny_base.png');
  const fannyHerbe = recolorRange(fanny, 0.0, 0.15, 0.35, 1.0);
  await save(fannyHerbe, '01_personnages', 'fanny_herbe.png');

  // RICARDO - Male 04 recolore sable/beige
  const ricardo = await Jimp.read(path.join(PIPOYA_CHARS, 'Male/Male 04-1.png'));
  await save(ricardo, '01_personnages', 'ricardo_base.png');
  const ricardoSable = recolorRange(ricardo, 0.55, 0.7, 0.12, 0.7);
  await save(ricardoSable, '01_personnages', 'ricardo_sable.png');

  // MARIUS - merchant recolore sombre/puissant
  const marius = await Jimp.read(path.join(LIVELY, 'merchant.png'));
  await save(marius, '01_personnages', 'marius_base.png');
  // Marius en rouge sombre (intimidant)
  const mariusRouge = recolorRange(marius, 0.0, 0.12, 0.0, 1.3);
  await save(mariusRouge, '01_personnages', 'marius_rouge.png');
  // Marius glow rouge (boss aura)
  await save(addGlow(mariusRouge, 200, 40, 40), '01_personnages', 'marius_boss_glow.png');

  // BASTIEN - Male 01 (rival rouge)
  const bastien = await Jimp.read(path.join(PIPOYA_CHARS, 'Male/Male 01-1.png'));
  await save(bastien, '01_personnages', 'bastien_rival.png');
  // Bastien version finale (apres reconciliation, couleurs plus douces)
  const bastienDoux = recolorRange(bastien, 0.0, 0.1, 0.08, 0.6);
  await save(bastienDoux, '01_personnages', 'bastien_apaise.png');

  // AUGUSTE - elder (grand-pere legendaire)
  const auguste = await Jimp.read(path.join(LIVELY, 'elder.png'));
  await save(auguste, '01_personnages', 'auguste_base.png');
  // Auguste dore (legende)
  await save(goldify(auguste), '01_personnages', 'auguste_legende.png');
  // Auguste glow dore
  await save(addGlow(auguste, 255, 200, 60), '01_personnages', 'auguste_aura.png');

  // MAMAN - Female 14
  const maman = await Jimp.read(path.join(PIPOYA_CHARS, 'Female/Female 14-1.png'));
  await save(maman, '01_personnages', 'maman_base.png');
  await save(provencal(maman), '01_personnages', 'maman_provencale.png');

  // PARTENAIRES RECRUTABLES
  const partenaire1 = await Jimp.read(path.join(LIVELY, 'adventurer_03.png'));
  await save(partenaire1, '01_personnages', 'partenaire_lucien.png');
  const partenaire2 = await Jimp.read(path.join(LIVELY, 'adventurer_04.png'));
  await save(partenaire2, '01_personnages', 'partenaire_thierry.png');
  const partenaire3 = await Jimp.read(path.join(PIPOYA_CHARS, 'Female/Female 17-1.png'));
  await save(partenaire3, '01_personnages', 'partenaire_colette.png');
  const partenaire4 = await Jimp.read(path.join(PIPOYA_CHARS, 'Male/Male 03-1.png'));
  await save(partenaire4, '01_personnages', 'partenaire_remy.png');

  // FIGURANTS VILLAGE
  const villager1 = await Jimp.read(path.join(LIVELY, 'villager_01.png'));
  const villager2 = await Jimp.read(path.join(LIVELY, 'villager_02.png'));
  const barkeep = await Jimp.read(path.join(LIVELY, 'barkeep.png'));
  const guard = await Jimp.read(path.join(LIVELY, 'guard.png'));
  const jester = await Jimp.read(path.join(LIVELY, 'jester.png'));
  const dog = await Jimp.read(path.join(LIVELY, 'dog.png'));
  await save(villager1, '01_personnages', 'villageois_1.png');
  await save(villager2, '01_personnages', 'villageois_2.png');
  await save(provencal(villager1), '01_personnages', 'villageois_1_provencal.png');
  await save(provencal(villager2), '01_personnages', 'villageois_2_provencal.png');
  await save(barkeep, '01_personnages', 'cafetier.png');
  await save(guard, '01_personnages', 'gardien_arene.png');
  await save(jester, '01_personnages', 'animateur.png');
  await save(dog, '01_personnages', 'chien_village.png');

  // Marchande de la place
  const marchande = await Jimp.read(path.join(SCHWARNHILD, 'characters/food_merchant_spritesheet.png'));
  await save(marchande, '01_personnages', 'marchande.png');
  await save(provencal(marchande), '01_personnages', 'marchande_provencale.png');

  // Enfants (Male 15 - petit bonhomme)
  const enfant = await Jimp.read(path.join(PIPOYA_CHARS, 'Male/Male 15-1.png'));
  await save(enfant, '01_personnages', 'enfant_village.png');

  // Femme mystere (gypsy -> voyante du village)
  const voyante = await Jimp.read(path.join(LIVELY, 'gypsy.png'));
  await save(voyante, '01_personnages', 'voyante.png');

  // Chat du village
  const chat = await Jimp.read(path.join(PIPOYA_CHARS, 'Animal/Cat 01-1.png'));
  await save(chat, '01_personnages', 'chat_village.png');

  console.log(`  ${count} personnages jour`);

  // ============================================================
  // 2. PERSONNAGES NUIT
  // ============================================================
  const persosPrincipaux = [
    [joueurProv, 'joueur'], [marcelTerre, 'marcel'], [fannyHerbe, 'fanny'],
    [ricardoSable, 'ricardo'], [mariusRouge, 'marius'], [bastien, 'bastien'],
    [auguste, 'auguste'], [papet, 'papet']
  ];
  for (const [img, name] of persosPrincipaux) {
    await save(nightify(img), '02_personnages_nuit', `${name}_nuit.png`);
  }
  console.log(`  + nuit`);

  // ============================================================
  // 3. PERSONNAGES SEPIA (flashbacks d'Auguste)
  // ============================================================
  await save(sepia(auguste), '03_personnages_sepia', 'auguste_flashback.png');
  await save(sepia(goldify(auguste)), '03_personnages_sepia', 'auguste_flashback_dore.png');
  await save(sepia(papet), '03_personnages_sepia', 'papet_jeune_flashback.png');
  await save(sepia(marcel), '03_personnages_sepia', 'marcel_jeune_flashback.png');
  await save(sepia(fanny), '03_personnages_sepia', 'fanny_jeune_flashback.png');
  await save(sepia(marius), '03_personnages_sepia', 'marius_jeune_flashback.png');
  console.log(`  + sepia flashbacks`);

  // ============================================================
  // 4. PORTRAITS x4 (pour dialogues)
  // ============================================================
  // Extraire premiere frame de chaque perso Pipoya (3x4 grid, 32x32 frames)
  const pipoyaPersos = [
    [joueurProv, 'joueur'], [ricardoSable, 'ricardo'], [bastien, 'bastien'],
    [maman, 'maman'], [enfant, 'enfant'], [partenaire4, 'remy']
  ];
  for (const [img, name] of pipoyaPersos) {
    const fw = Math.floor(img.width / 3);
    const fh = Math.floor(img.height / 4);
    const frame = extractFrame(img, 1, 0, fw, fh); // face frame
    const portrait = frame.resize({ w: fw * 4, h: fh * 4 });
    await save(portrait, '04_portraits_x4', `portrait_${name}.png`);
  }
  // Lively persos (variable frame sizes, just upscale the whole thing smartly)
  const livelyPersos = [
    [auguste, 'auguste'], [marcelTerre, 'marcel'], [fannyHerbe, 'fanny'],
    [mariusRouge, 'marius'], [barkeep, 'cafetier'], [voyante, 'voyante']
  ];
  for (const [img, name] of livelyPersos) {
    // Lively sprites are ~32x32 per frame, take first frame
    const fh = img.height;
    const fw = Math.floor(img.width / (img.width > 100 ? 5 : 4));
    const frame = extractFrame(img, 0, 0, fw, fh);
    const portrait = frame.resize({ w: fw * 4, h: fh * 4 });
    await save(portrait, '04_portraits_x4', `portrait_${name}.png`);
  }
  // Papet (Schwarnhild, different format - 8 cols)
  const papetFw = Math.floor(papet.width / 8);
  const papetFh = Math.floor(papet.height / 8);
  const papetFrame = extractFrame(papet, 0, 0, papetFw, papetFh);
  await save(papetFrame.resize({ w: papetFw * 4, h: papetFh * 4 }), '04_portraits_x4', 'portrait_papet.png');
  // Auguste sepia portrait
  const augusteFrame = extractFrame(auguste, 0, 0, Math.floor(auguste.width/5), auguste.height);
  await save(sepia(augusteFrame).resize({ w: augusteFrame.width*4, h: augusteFrame.height*4 }), '04_portraits_x4', 'portrait_auguste_sepia.png');
  console.log(`  + portraits x4`);

  // ============================================================
  // 5-8. DECORS (jour/nuit/sunset/provencal)
  // ============================================================
  console.log('--- DECORS ---');

  const houses = await Jimp.read(path.join(SCHWARNHILD, 'assets/houses.png'));
  const nature = await Jimp.read(path.join(SCHWARNHILD, 'assets/nature_assets.png'));
  const village = await Jimp.read(path.join(SCHWARNHILD, 'assets/village_assets.png'));
  const market = await Jimp.read(path.join(SCHWARNHILD, 'assets/market_assets.png'));
  const envTiles = await Jimp.read(path.join(SCHWARNHILD, 'tiles/environment.png'));
  const cobbleBrown = await Jimp.read(path.join(SCHWARNHILD, 'tiles/cobblestone_tiles_brown.png'));
  const cobbleGrey = await Jimp.read(path.join(SCHWARNHILD, 'tiles/cobblestone_tiles_grey.png'));
  const fenceWood = await Jimp.read(path.join(SCHWARNHILD, 'tiles/wooden_fence.png'));
  const fenceMarble = await Jimp.read(path.join(SCHWARNHILD, 'tiles/marble_fence.png'));

  const decors = [
    [houses, 'maisons'], [nature, 'nature'], [village, 'village_props'],
    [market, 'marche'], [envTiles, 'terrain_env'], [cobbleBrown, 'paves_bruns'],
    [cobbleGrey, 'paves_gris'], [fenceWood, 'cloture_bois'], [fenceMarble, 'cloture_marbre']
  ];

  for (const [img, name] of decors) {
    await save(img, '05_decors_jour', `${name}_jour.png`);
    await save(nightify(img), '06_decors_nuit', `${name}_nuit.png`);
    await save(sunset(img), '07_decors_sunset', `${name}_sunset.png`);
    await save(provencal(img), '08_decors_provencal', `${name}_provencal.png`);
  }

  // Portes
  const door1 = await Jimp.read(path.join(FREE, 'Door_Animation/Door_Animation/Door1_pipo.png'));
  const door2 = await Jimp.read(path.join(FREE, 'Door_Animation/Door_Animation/Door2_pipo.png'));
  await save(door1, '05_decors_jour', 'portes_bois.png');
  await save(door2, '05_decors_jour', 'portes_metal.png');
  await save(provencal(door1), '08_decors_provencal', 'portes_provencales.png');

  // Eau animee
  const water = await Jimp.read(path.join(FREE, 'summer_plains_water_animation_demo/water_animation_demo/water_animation_demo.png'));
  await save(water, '05_decors_jour', 'eau_animee.png');
  await save(nightify(water), '06_decors_nuit', 'eau_nuit.png');

  // BaseChip Pipoya (tilesheet principal)
  const basechip = await Jimp.read(path.join(PIPOYA_TILES, '[Base]BaseChip_pipo.png'));
  await save(basechip, '05_decors_jour', 'basechip_complet.png');
  await save(provencal(basechip), '08_decors_provencal', 'basechip_provencal.png');
  await save(nightify(basechip), '06_decors_nuit', 'basechip_nuit.png');

  // Fleurs
  const flowers = await Jimp.read(path.join(PIPOYA_TILES, '[A]_type1/[A]Flower_pipo.png'));
  await save(flowers, '05_decors_jour', 'fleurs.png');
  // Fleurs lavande (recolorer en violet)
  await save(recolorRange(flowers, 0.1, 0.5, 0.75, 1.0), '08_decors_provencal', 'fleurs_lavande.png');

  // Herbes hautes
  const longGrass = await Jimp.read(path.join(PIPOYA_TILES, '[A]_type1/[A]LongGrass_pipo.png'));
  await save(longGrass, '05_decors_jour', 'herbes_hautes.png');
  await save(autumnify(longGrass), '08_decors_provencal', 'herbes_automne.png');

  // Maisons provencales (toit terracotta)
  await save(recolorRange(houses, 0.25, 0.5, 0.05, 1.0), '08_decors_provencal', 'maisons_terracotta.png');
  // Maisons automne
  await save(autumnify(nature), '08_decors_provencal', 'nature_automne.png');

  console.log(`  decors 4 ambiances`);

  // ============================================================
  // 9. TERRAINS D'ARENE (un par maitre)
  // ============================================================
  console.log('--- TERRAINS ARENES ---');

  // Terrain Marcel - TERRE (dirt chaud)
  const dirt1 = await Jimp.read(path.join(PIPOYA_TILES, '[A]_type1/[A]Dirt1_pipo.png'));
  await save(dirt1, '09_terrains_arenes', 'terrain_marcel_terre.png');
  await save(provencal(dirt1), '09_terrains_arenes', 'terrain_marcel_terre_prov.png');

  // Terrain Fanny - HERBE (green lush)
  const grass1 = await Jimp.read(path.join(PIPOYA_TILES, '[A]_type1/[A]Grass1_pipo.png'));
  await save(grass1, '09_terrains_arenes', 'terrain_fanny_herbe.png');
  // Version fleurie
  const grass2 = await Jimp.read(path.join(PIPOYA_TILES, '[A]_type1/[A]Grass2_pipo.png'));
  await save(grass2, '09_terrains_arenes', 'terrain_fanny_herbe2.png');

  // Terrain Ricardo - SABLE (dirt clair/sable)
  const dirt3 = await Jimp.read(path.join(PIPOYA_TILES, '[A]_type1/[A]Dirt3_pipo.png'));
  await save(dirt3, '09_terrains_arenes', 'terrain_ricardo_sable.png');
  const dirt4 = await Jimp.read(path.join(PIPOYA_TILES, '[A]_type1/[A]Dirt4_pipo.png'));
  await save(dirt4, '09_terrains_arenes', 'terrain_ricardo_sable2.png');

  // Terrain Marius - DALLES (cobblestone = arene de luxe)
  await save(cobbleBrown, '09_terrains_arenes', 'terrain_marius_dalles.png');
  await save(cobbleGrey, '09_terrains_arenes', 'terrain_marius_dalles_gris.png');

  // Versions nuit de tous les terrains
  await save(nightify(dirt1), '09_terrains_arenes', 'terrain_marcel_nuit.png');
  await save(nightify(grass1), '09_terrains_arenes', 'terrain_fanny_nuit.png');
  await save(nightify(dirt3), '09_terrains_arenes', 'terrain_ricardo_nuit.png');
  await save(nightify(cobbleBrown), '09_terrains_arenes', 'terrain_marius_nuit.png');

  // Murs
  const wallUp = await Jimp.read(path.join(PIPOYA_TILES, '[A]_type1/[A]Wall-Up1_pipo.png'));
  await save(wallUp, '09_terrains_arenes', 'murs_arene.png');

  // Eau (pour decor autour terrain)
  const water1 = await Jimp.read(path.join(PIPOYA_TILES, '[A]_type1/not_animation/[A]Water1_pipo.png'));
  await save(water1, '09_terrains_arenes', 'eau_fontaine.png');

  console.log(`  terrains arenes`);

  // ============================================================
  // 10. PROPS DE L'HISTOIRE
  // ============================================================
  console.log('--- PROPS HISTOIRE ---');

  // Coffret d'Auguste (extraire un coffre du market_assets et le dorer)
  // Market assets contient des caisses/tonneaux en bas
  // On va extraire une zone et la modifier
  const coffreZone = extractFrame(market, 0, Math.floor(market.height * 0.6), 64, 32);
  await save(coffreZone, '10_props_histoire', 'coffret_base.png');
  await save(goldify(coffreZone), '10_props_histoire', 'coffret_auguste_dore.png');
  await save(sepia(coffreZone), '10_props_histoire', 'coffret_ancien.png');

  // Boules (from generated PixelLab terrain which has boules)
  try {
    const terrainPetanque = await Jimp.read(path.join(GENERATED, 'terrain_petanque.png'));
    await save(terrainPetanque, '10_props_histoire', 'terrain_petanque.png');
    await save(nightify(terrainPetanque), '10_props_histoire', 'terrain_petanque_nuit.png');
    await save(sunset(terrainPetanque), '10_props_histoire', 'terrain_petanque_sunset.png');
    await save(goldify(terrainPetanque), '10_props_histoire', 'terrain_petanque_legende.png');
  } catch(e) { console.log('  (terrain_petanque skip)'); }

  // Fontaine de la place
  try {
    const fontaine = await Jimp.read(path.join(GENERATED, 'fontaine_place.png'));
    await save(fontaine, '10_props_histoire', 'fontaine_place.png');
    await save(nightify(fontaine), '10_props_histoire', 'fontaine_nuit.png');
    await save(provencal(fontaine), '10_props_histoire', 'fontaine_provencale.png');
  } catch(e) {}

  // Banc
  try {
    const banc = await Jimp.read(path.join(GENERATED, 'banc_bois.png'));
    await save(banc, '10_props_histoire', 'banc_place.png');
    await save(provencal(banc), '10_props_histoire', 'banc_provencal.png');
  } catch(e) {}

  // Terrasse cafe
  try {
    const terrasse = await Jimp.read(path.join(GENERATED, 'terrasse_cafe.png'));
    await save(terrasse, '10_props_histoire', 'terrasse_cafe.png');
    await save(nightify(terrasse), '10_props_histoire', 'terrasse_nuit.png');
    await save(sunset(terrasse), '10_props_histoire', 'terrasse_sunset.png');
  } catch(e) {}

  // Arbre platane
  try {
    const arbre = await Jimp.read(path.join(GENERATED, 'arbre_platane.png'));
    await save(arbre, '10_props_histoire', 'platane.png');
    await save(autumnify(arbre), '10_props_histoire', 'platane_automne.png');
    await save(nightify(arbre), '10_props_histoire', 'platane_nuit.png');
  } catch(e) {}

  // Maison provencale PixelLab
  try {
    const maison = await Jimp.read(path.join(GENERATED, 'maison_provencale.png'));
    await save(maison, '10_props_histoire', 'maison_joueur.png');
    await save(nightify(maison), '10_props_histoire', 'maison_joueur_nuit.png');
    // Maison grenier (version sombre interieur)
    const grenier = maison.clone();
    grenier.scan(0,0,grenier.width,grenier.height,(x,y) => {
      const {r,g,b,a} = intToRGBA(grenier.getPixelColor(x,y));
      if (a===0) return;
      grenier.setPixelColor(rgbaToInt(clamp(r*0.4+15), clamp(g*0.35+10), clamp(b*0.3+8), a),x,y);
    });
    await save(grenier, '10_props_histoire', 'maison_grenier_sombre.png');
  } catch(e) {}

  console.log(`  props histoire`);

  // ============================================================
  // 11. SCENES COMPOSEES
  // ============================================================
  console.log('--- SCENES ---');

  // Scene: Le grenier (decouverte du coffret)
  const sceneGrenier = new Jimp({width: 200, height: 150, color: 0x2A1F18FF}); // brun tres sombre
  // Ajouter un peu de grain pour l'ambiance
  sceneGrenier.scan(0,0,200,150,(x,y) => {
    const {r,g,b,a} = intToRGBA(sceneGrenier.getPixelColor(x,y));
    const n = (Math.random()-0.5)*15;
    sceneGrenier.setPixelColor(rgbaToInt(clamp(r+n), clamp(g+n), clamp(b+n), a),x,y);
  });
  // Coffret dore au centre
  const coffreGold = goldify(coffreZone);
  sceneGrenier.composite(coffreGold, 68, 60);
  await save(sceneGrenier, '11_scenes', 'scene_grenier_coffret.png');

  // Scene: Place du village jour
  const scenePlaceW = 256, scenePlaceH = 160;
  const scenePlace = new Jimp({width: scenePlaceW, height: scenePlaceH, color: 0x90C87EFF});
  try {
    const maisonS = (await Jimp.read(path.join(GENERATED, 'maison_provencale.png'))).resize({w:48,h:48});
    const fontS = (await Jimp.read(path.join(GENERATED, 'fontaine_place.png'))).resize({w:36,h:36});
    const bancS = (await Jimp.read(path.join(GENERATED, 'banc_bois.png'))).resize({w:32,h:20});
    const arbreS = (await Jimp.read(path.join(GENERATED, 'arbre_platane.png'))).resize({w:48,h:48});
    const terrasseS = (await Jimp.read(path.join(GENERATED, 'terrasse_cafe.png'))).resize({w:40,h:32});
    scenePlace.composite(maisonS, 10, 8);
    scenePlace.composite(maisonS.clone().flip({horizontal:true}), 198, 5);
    scenePlace.composite(fontS, 110, 50);
    scenePlace.composite(bancS, 20, 100);
    scenePlace.composite(arbreS, 65, 5);
    scenePlace.composite(arbreS.clone().flip({horizontal:true}), 155, 8);
    scenePlace.composite(terrasseS, 180, 110);
  } catch(e) {}
  await save(scenePlace, '11_scenes', 'scene_place_village_jour.png');
  await save(sunset(scenePlace), '11_scenes', 'scene_place_village_sunset.png');
  await save(nightify(scenePlace), '11_scenes', 'scene_place_village_nuit.png');

  // Scene: Flashback Auguste (sepia + grain)
  const sceneFlashback = sepia(scenePlace);
  sceneFlashback.scan(0,0,sceneFlashback.width,sceneFlashback.height,(x,y) => {
    const {r,g,b,a} = intToRGBA(sceneFlashback.getPixelColor(x,y));
    const n = (Math.random()-0.5)*20;
    sceneFlashback.setPixelColor(rgbaToInt(clamp(r+n), clamp(g+n), clamp(b+n), a),x,y);
  });
  await save(sceneFlashback, '11_scenes', 'scene_flashback_auguste.png');

  // Scene: Match final (nuit dramatique avec glow)
  const sceneFinale = nightify(scenePlace);
  // Ajouter un halo central jaune (eclairage du terrain)
  const cx = scenePlaceW/2, cy = scenePlaceH/2;
  sceneFinale.scan(0,0,scenePlaceW,scenePlaceH,(x,y) => {
    const dist = Math.sqrt((x-cx)**2 + (y-cy)**2);
    if (dist < 60) {
      const {r,g,b,a} = intToRGBA(sceneFinale.getPixelColor(x,y));
      const intensity = (60-dist)/60 * 0.5;
      sceneFinale.setPixelColor(rgbaToInt(
        clamp(r + 80*intensity),
        clamp(g + 60*intensity),
        clamp(b + 20*intensity),
        a
      ),x,y);
    }
  });
  await save(sceneFinale, '11_scenes', 'scene_match_final_nuit.png');

  console.log(`  scenes composees`);

  // ============================================================
  // 12. PLANCHES RECAPITULATIVES
  // ============================================================
  console.log('--- PLANCHES ---');

  // Planche casting complet
  const allPersos = [joueurProv, auguste, papet, marcelTerre, fannyHerbe, ricardoSable, mariusRouge, bastien, maman];
  const names = ['Joueur', 'Auguste', 'Papet', 'Marcel', 'Fanny', 'Ricardo', 'Marius', 'Bastien', 'Maman'];
  const maxPW = Math.max(...allPersos.map(i=>i.width));
  const maxPH = Math.max(...allPersos.map(i=>i.height));
  const castW = allPersos.length * (maxPW + 4) - 4;
  const plancheCast = new Jimp({width: castW, height: maxPH, color: 0x00000000});
  let ox = 0;
  for (const p of allPersos) {
    plancheCast.composite(p, ox, maxPH - p.height);
    ox += maxPW + 4;
  }
  await save(plancheCast, '12_planches', 'planche_casting_complet.png');

  // Planche casting nuit
  const plancheNuit = nightify(plancheCast);
  await save(plancheNuit, '12_planches', 'planche_casting_nuit.png');

  // Planche casting sepia
  await save(sepia(plancheCast), '12_planches', 'planche_casting_sepia.png');

  // Planche maitres d'arene seulement
  const maitres = [marcelTerre, fannyHerbe, ricardoSable, mariusRouge];
  const maitreW = maitres.length * (maxPW + 8) - 8;
  const plancheMaitres = new Jimp({width: maitreW, height: maxPH, color: 0x00000000});
  ox = 0;
  const glowColors = [[180,120,60], [60,180,60], [220,200,120], [200,40,40]]; // terre, herbe, sable, feu
  for (let i=0; i<maitres.length; i++) {
    const glowed = addGlow(maitres[i], ...glowColors[i]);
    plancheMaitres.composite(glowed, ox, maxPH - glowed.height);
    ox += maxPW + 8;
  }
  await save(plancheMaitres, '12_planches', 'planche_4_maitres_glow.png');

  // Planche decors provencaux
  const decorsSmall = [houses, nature, village, market].map(d => provencal(d));
  let totalDecW = 0;
  let maxDecH = 0;
  for (const d of decorsSmall) { totalDecW += d.width + 8; maxDecH = Math.max(maxDecH, d.height); }
  const plancheDecors = new Jimp({width: totalDecW, height: maxDecH, color: 0x00000000});
  ox = 0;
  for (const d of decorsSmall) {
    plancheDecors.composite(d, ox, 0);
    ox += d.width + 8;
  }
  await save(plancheDecors, '12_planches', 'planche_decors_provencaux.png');

  // Planche ambiances (4 versions d'une meme maison)
  // Extraire premiere maison
  const h1 = extractFrame(houses, 0, 0, 160, 145);
  const h1terra = recolorRange(h1, 0.25, 0.5, 0.05, 1.0);
  const ambiances = [h1terra, sunset(h1terra), nightify(h1terra), sepia(h1terra)];
  const ambW = ambiances.length * (h1.width + 4) - 4;
  const plancheAmb = new Jimp({width: ambW, height: h1.height, color: 0x00000000});
  ox = 0;
  for (const a of ambiances) {
    plancheAmb.composite(a, ox, 0);
    ox += h1.width + 4;
  }
  await save(plancheAmb, '12_planches', 'planche_ambiances_4.png');

  console.log(`  planches`);

  console.log(`\n✅ TOTAL: ${count} assets generes dans ${OUT}`);
}

run().catch(console.error);
