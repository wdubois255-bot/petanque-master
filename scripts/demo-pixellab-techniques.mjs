#!/usr/bin/env node
/**
 * demo-pixellab-techniques.mjs
 * Demonstre les techniques PixelLab extraites des 8 videos YouTube :
 * 1. Marcel v2 avec Ley comme ancre de style (style reference)
 * 2. Expressions faciales via description textuelle detaillee
 * 3. UI provencale (panneau bois, boutons)
 * 4. Items boutique en batch coherent
 * 5. Animation de lancer enrichie (animate-with-text)
 *
 * Usage: node scripts/demo-pixellab-techniques.mjs [technique]
 *   technique: all | marcel | expressions | ui | items | throw
 */

import fs from 'fs';
import path from 'path';

// --- Config ---
const API_URL = 'https://api.pixellab.ai';
const OUT_DIR = 'public/assets/sprites/generated';

// Load API key
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
  const match = envContent.match(/PIXELLAB_API_KEY=(.+)/);
  if (match) process.env.PIXELLAB_API_KEY = match[1].trim();
} catch (e) { /* ignore */ }

const API_KEY = process.env.PIXELLAB_API_KEY;
if (!API_KEY) { console.error('PIXELLAB_API_KEY manquant dans .env'); process.exit(1); }

// --- Helpers ---
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function toBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64');
}

function saveBase64(base64, filePath) {
  let data = base64;
  if (data.startsWith('data:')) data = data.split(',')[1];
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  console.log(`  -> Saved: ${filePath} (${fs.statSync(filePath).size} bytes)`);
}

async function callApi(endpoint, body) {
  console.log(`  API: POST ${endpoint}...`);
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${endpoint} HTTP ${res.status}: ${text}`);
  }
  const data = await res.json();
  if (data.usage) console.log(`  Cost: $${data.usage.usd}`);
  return data;
}

// --- TECHNIQUE 1 : Marcel v2 avec ancre Ley (Style Reference) ---
async function generateMarcelV2() {
  console.log('\n========================================');
  console.log('TECHNIQUE 1: Marcel v2 (ancre style = Ley)');
  console.log('========================================');

  const outDir = path.join(OUT_DIR, 'marcel_v2');
  ensureDir(outDir);

  // Charger Ley comme reference de style
  const leyPath = 'public/assets/sprites/ley_animated.png';
  if (!fs.existsSync(leyPath)) {
    console.log('  ! ley_animated.png introuvable, generation texte pur');
  }

  // Description detaillee de Marcel (vieux joueur provencal)
  // Technique video 1 : prompt detaille > mots simples
  const marcelDesc =
    'elderly provencal man, 70 years old, petanque player, ' +
    'wearing a beige flat cap (casquette), red polo shirt with white collar, ' +
    'beige trousers, brown leather shoes, ' +
    'white mustache, tanned wrinkled face, kind wise eyes, ' +
    'standing still relaxed pose, arms at sides, ' +
    'holding a metallic petanque boule in right hand, ' +
    'south of france countryside character, warm sunny atmosphere';

  // Generer Marcel face sud (pose de base)
  const directions = ['south', 'east', 'west', 'north'];

  for (const dir of directions) {
    console.log(`\n  Generating Marcel ${dir}...`);

    const body = {
      description: marcelDesc,
      image_size: { width: 64, height: 64 },
      no_background: true,
      view: 'low top-down',
      direction: dir,
      outline: 'single color black outline',
      shading: 'detailed shading',
      detail: 'highly detailed',
      text_guidance_scale: 8.0
    };

    // Si on a Ley, l'utiliser comme style reference
    if (fs.existsSync(leyPath)) {
      // On extrait la premiere frame (32x32 en haut a gauche du 512x512)
      // Pour simplifier on envoie l'image complete
      body.style_image = {
        base64: toBase64(leyPath),
        strength: 400
      };
    }

    try {
      const data = await callApi('/v1/generate-image-pixflux', body);
      const imgBase64 = data.image?.base64 || data.image;
      saveBase64(imgBase64, path.join(outDir, `marcel_v2_${dir}.png`));
    } catch (err) {
      console.error(`  ERREUR ${dir}: ${err.message}`);
    }
  }

  console.log('\n  Marcel v2 genere dans 4 directions !');
  console.log('  Prochaine etape: assembler en spritesheet + animate-with-text pour walk cycle');
}

// --- TECHNIQUE 2 : Expressions faciales ---
async function generateExpressions() {
  console.log('\n========================================');
  console.log('TECHNIQUE 2: Expressions faciales');
  console.log('========================================');
  console.log('  Technique Inpaint (video 3) : modifier yeux/bouche sans toucher au reste');

  const outDir = path.join(OUT_DIR, 'expressions');
  ensureDir(outDir);

  // On genere des personnages avec differentes expressions
  // Technique video 1 : prompts detailles via LLM
  const baseDesc = 'provencal petanque player, pixel art character, low top-down view, south direction';

  const expressions = [
    {
      name: 'happy',
      desc: `${baseDesc}, wide smile, eyes squinting with joy, eyebrows raised, ` +
            'celebrating victory, fist pump, looking very pleased and satisfied, warm expression'
    },
    {
      name: 'frustrated',
      desc: `${baseDesc}, frowning face, eyebrows angled down in frustration, mouth slightly open in disbelief, hands on hips, disappointed pose, just lost an important point`
    },
    {
      name: 'focused',
      desc: `${baseDesc}, concentrated expression, eyes narrowed, mouth tight, leaning slightly forward, holding petanque boule carefully, aiming stance, deep focus before a crucial throw`
    },
    {
      name: 'victorious',
      desc: `${baseDesc}, triumphant pose, both arms raised above head, huge grin, eyes wide with excitement, jumping slightly, celebrating winning the match, pure joy`
    }
  ];

  for (const expr of expressions) {
    console.log(`\n  Generating expression: ${expr.name}...`);
    try {
      const data = await callApi('/v1/generate-image-pixflux', {
        description: expr.desc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        view: 'low top-down',
        direction: 'south',
        outline: 'single color black outline',
        shading: 'detailed shading',
        detail: 'highly detailed',
        text_guidance_scale: 8.0
      });
      const imgBase64 = data.image?.base64 || data.image;
      saveBase64(imgBase64, path.join(outDir, `expression_${expr.name}.png`));
    } catch (err) {
      console.error(`  ERREUR ${expr.name}: ${err.message}`);
    }
  }
}

// --- TECHNIQUE 3 : UI Provencale ---
async function generateUI() {
  console.log('\n========================================');
  console.log('TECHNIQUE 3: UI Provencale pixel art');
  console.log('========================================');
  console.log('  Technique video 8 : generer UI modulaire avec style coherent');

  const outDir = path.join(OUT_DIR, 'ui');
  ensureDir(outDir);

  const uiElements = [
    {
      name: 'score_panel',
      desc: 'pixel art game UI panel, wooden frame with warm oak texture, ' +
            'golden metal corner decorations, provencal rustic style, ' +
            'rectangular score display board, ornate border, ' +
            'mediterranean warm colors, ochre and terracotta accents, ' +
            'suitable for a petanque game scoreboard',
      width: 128, height: 64
    },
    {
      name: 'button_play',
      desc: 'pixel art game button, wooden rounded rectangle button, ' +
            'warm oak texture, golden border, provencal rustic style, ' +
            'slightly raised 3D effect, press-ready state, ' +
            'mediterranean game UI element, warm ochre tones',
      width: 64, height: 32
    },
    {
      name: 'dialog_frame',
      desc: 'pixel art dialog box frame, parchment paper texture background, ' +
            'wooden border frame, provencal rustic style, ' +
            'warm cream interior, ornate wood corners with golden accents, ' +
            'speech bubble for character dialogue, mediterranean aesthetic',
      width: 128, height: 48
    },
    {
      name: 'power_gauge',
      desc: 'pixel art power meter gauge, horizontal bar, ' +
            'wooden frame surround, gradient fill from green to yellow to red, ' +
            'provencal rustic style, petanque throwing power indicator, ' +
            'warm ochre wood border, small golden decorative elements',
      width: 96, height: 16
    },
    {
      name: 'portrait_frame',
      desc: 'pixel art character portrait frame, square ornate wooden frame, ' +
            'golden corner filigree, provencal rustic mediterranean style, ' +
            'warm oak texture, suitable for character mugshot display, ' +
            'petanque game aesthetic, empty center for portrait',
      width: 48, height: 48
    }
  ];

  for (const ui of uiElements) {
    console.log(`\n  Generating UI: ${ui.name} (${ui.width}x${ui.height})...`);
    try {
      const data = await callApi('/v1/generate-image-pixflux', {
        description: ui.desc,
        image_size: { width: ui.width, height: ui.height },
        no_background: true,
        outline: 'single color black outline',
        shading: 'detailed shading',
        detail: 'highly detailed',
        text_guidance_scale: 8.0
      });
      const imgBase64 = data.image?.base64 || data.image;
      saveBase64(imgBase64, path.join(outDir, `ui_${ui.name}.png`));
    } catch (err) {
      console.error(`  ERREUR ${ui.name}: ${err.message}`);
    }
  }
}

// --- TECHNIQUE 4 : Items boutique batch ---
async function generateShopItems() {
  console.log('\n========================================');
  console.log('TECHNIQUE 4: Items boutique (batch coherent)');
  console.log('========================================');
  console.log('  Technique video 6 : style reference pour batch coherent');

  const outDir = path.join(OUT_DIR, 'items');
  ensureDir(outDir);

  // Style provencal coherent pour tous les items
  const styleBase = 'pixel art game item, top-down view, provencal mediterranean style, ' +
                    'warm ochre palette, clean pixel art, game icon';

  const items = [
    {
      name: 'glove_leather',
      desc: `${styleBase}, brown leather petanque glove, stitched details, worn patina, game equipment`
    },
    {
      name: 'pouch_boules',
      desc: `${styleBase}, canvas boule carrying pouch with leather strap, beige fabric, three boule shapes inside`
    },
    {
      name: 'trophy_bronze',
      desc: `${styleBase}, small bronze trophy cup, petanque championship award, shiny metallic, ornate base`
    },
    {
      name: 'trophy_gold',
      desc: `${styleBase}, golden trophy cup, first place petanque award, gleaming gold, laurel wreath decoration`
    },
    {
      name: 'pastis_bottle',
      desc: `${styleBase}, small pastis bottle, amber yellow liquid, provencal anise drink, game powerup healing item`
    },
    {
      name: 'hat_beret',
      desc: `${styleBase}, traditional french beret hat, dark navy blue, provencal accessory, wearable cosmetic`
    },
    {
      name: 'sunglasses_aviator',
      desc: `${styleBase}, aviator sunglasses, golden metal frame, dark lenses, cool accessory, wearable cosmetic`
    },
    {
      name: 'medal_star',
      desc: `${styleBase}, golden star medal with red ribbon, achievement reward, shiny metallic star shape`
    },
    {
      name: 'chalk_hand',
      desc: `${styleBase}, small bag of hand chalk powder, white powder, improves grip, game consumable item`
    },
    {
      name: 'compass_precision',
      desc: `${styleBase}, brass precision measuring compass, petanque distance tool, mechanical instrument, game utility`
    }
  ];

  for (const item of items) {
    console.log(`\n  Generating item: ${item.name}...`);
    try {
      const data = await callApi('/v1/generate-image-pixflux', {
        description: item.desc,
        image_size: { width: 32, height: 32 },
        no_background: true,
        view: 'high top-down',
        outline: 'single color black outline',
        shading: 'detailed shading',
        detail: 'highly detailed',
        text_guidance_scale: 8.0
      });
      const imgBase64 = data.image?.base64 || data.image;
      saveBase64(imgBase64, path.join(outDir, `item_${item.name}.png`));
    } catch (err) {
      console.error(`  ERREUR ${item.name}: ${err.message}`);
    }
  }
}

// --- TECHNIQUE 5 : Animation lancer enrichie ---
async function generateThrowAnimation() {
  console.log('\n========================================');
  console.log('TECHNIQUE 5: Animation lancer enrichie');
  console.log('========================================');
  console.log('  Technique videos 1+7 : animate-with-text + chaingage frames');

  const outDir = path.join(OUT_DIR, 'throw_anim');
  ensureDir(outDir);

  // Charger un sprite existant comme reference
  // On utilise une generation fraiche comme base
  console.log('\n  Phase 1: Generer pose de base (concentration)...');

  const baseDesc =
    'provencal petanque player, middle-aged man, blue polo shirt, ' +
    'beige trousers, standing on sandy terrain, holding metallic boule, ' +
    'south of france character';

  try {
    // Generer la pose de base
    const baseData = await callApi('/v1/generate-image-pixflux', {
      description: baseDesc + ', standing still, focused expression, holding boule in right hand at waist level',
      image_size: { width: 64, height: 64 },
      no_background: true,
      view: 'low top-down',
      direction: 'south',
      outline: 'single color black outline',
      shading: 'detailed shading',
      detail: 'highly detailed',
      text_guidance_scale: 8.0
    });
    const baseImg = baseData.image?.base64 || baseData.image;
    saveBase64(baseImg, path.join(outDir, 'throw_00_base.png'));

    // Technique video 1 + 7 : animate-with-text avec prompt LLM detaille
    // Phase de lancer : description paragraphe complet
    const throwAction =
      'The petanque player performs a careful throwing motion. ' +
      'He bends his knees slightly, shifts his weight to his back foot, ' +
      'swings his right arm backward holding the boule, ' +
      'then smoothly swings forward releasing the boule in an underhand toss, ' +
      'following through with his arm extending upward, ' +
      'body leaning forward with the momentum of the throw.';

    console.log('\n  Phase 2: Animer le lancer (animate-with-text)...');
    const animData = await callApi('/v1/animate-with-text', {
      description: baseDesc,
      action: throwAction,
      image_size: { width: 64, height: 64 },
      reference_image: { type: 'base64', base64: baseImg },
      view: 'low top-down',
      direction: 'south',
      n_frames: 8,
      text_guidance_scale: 8.0,
      image_guidance_scale: 1.5
    });

    // Sauvegarder chaque frame
    const frames = animData.images || [];
    console.log(`  Got ${frames.length} frames`);

    frames.forEach((frame, i) => {
      const frameB64 = frame.base64 || frame;
      saveBase64(frameB64, path.join(outDir, `throw_${String(i+1).padStart(2,'0')}_frame.png`));
    });

    console.log(`\n  Animation de lancer generee: ${frames.length} frames !`);
    console.log('  Comparer avec nos 4-5 frames actuels -> beaucoup plus fluide');

  } catch (err) {
    console.error(`  ERREUR animation: ${err.message}`);
  }
}

// --- Main ---
async function main() {
  const technique = process.argv[2] || 'all';

  console.log('=== Demo Techniques PixelLab (extraites des 8 videos) ===');
  console.log(`Technique: ${technique}`);
  console.log(`Output: ${OUT_DIR}/`);

  ensureDir(OUT_DIR);

  const startTime = Date.now();

  try {
    if (technique === 'all' || technique === 'marcel') await generateMarcelV2();
    if (technique === 'all' || technique === 'expressions') await generateExpressions();
    if (technique === 'all' || technique === 'ui') await generateUI();
    if (technique === 'all' || technique === 'items') await generateShopItems();
    if (technique === 'all' || technique === 'throw') await generateThrowAnimation();
  } catch (err) {
    console.error('\nERREUR FATALE:', err.message);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== Termine en ${elapsed}s ===`);
  console.log(`Resultats dans: ${OUT_DIR}/`);
  console.log('\nProchaines etapes:');
  console.log('  1. Verifier la qualite des sprites generes');
  console.log('  2. Nettoyer dans Pixelorama si necessaire');
  console.log('  3. Upscale 64->128 pour les personnages (nearest-neighbor)');
  console.log('  4. Integrer dans le jeu');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
