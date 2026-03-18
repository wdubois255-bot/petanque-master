#!/usr/bin/env node
/**
 * Generate rolling ball spritesheets (4 rotation frames each) via PixelLab API
 * Output: 128x32 PNG spritesheets (4 frames of 32x32)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');
const SPRITES_DIR = path.join(PROJECT, 'public', 'assets', 'sprites');

const envFile = fs.readFileSync(path.join(PROJECT, '.env'), 'utf8');
const API_KEY = envFile.match(/PIXELLAB_API_KEY=(.+)/)?.[1]?.trim();
const API_BASE = 'https://api.pixellab.ai/v1';

const BALLS = [
    {
        id: 'acier',
        outputName: 'boule_acier_roll',
        frames: [
            'metallic steel silver petanque boule ball, shiny specular highlight on top-left, chrome steel surface, round sphere, top-down view on dirt ground',
            'metallic steel silver petanque boule ball, shiny specular highlight on top-right, chrome steel surface, round sphere, top-down view on dirt ground',
            'metallic steel silver petanque boule ball, shiny specular highlight on bottom-right, chrome steel surface, round sphere, top-down view on dirt ground',
            'metallic steel silver petanque boule ball, shiny specular highlight on bottom-left, chrome steel surface, round sphere, top-down view on dirt ground'
        ]
    },
    {
        id: 'bronze',
        outputName: 'boule_bronze_roll',
        frames: [
            'bronze golden petanque boule ball, warm highlight on top-left, aged bronze patina surface, round sphere, top-down view on dirt ground',
            'bronze golden petanque boule ball, warm highlight on top-right, aged bronze patina surface, round sphere, top-down view on dirt ground',
            'bronze golden petanque boule ball, warm highlight on bottom-right, aged bronze patina surface, round sphere, top-down view on dirt ground',
            'bronze golden petanque boule ball, warm highlight on bottom-left, aged bronze patina surface, round sphere, top-down view on dirt ground'
        ]
    },
    {
        id: 'chrome',
        outputName: 'boule_chrome_roll',
        frames: [
            'polished chrome white petanque boule ball, bright specular highlight on top-left, mirror finish surface, round sphere, top-down view on dirt ground',
            'polished chrome white petanque boule ball, bright specular highlight on top-right, mirror finish surface, round sphere, top-down view on dirt ground',
            'polished chrome white petanque boule ball, bright specular highlight on bottom-right, mirror finish surface, round sphere, top-down view on dirt ground',
            'polished chrome white petanque boule ball, bright specular highlight on bottom-left, mirror finish surface, round sphere, top-down view on dirt ground'
        ]
    },
    {
        id: 'noire',
        outputName: 'boule_noire_roll',
        frames: [
            'dark black carbon steel petanque boule ball, subtle highlight on top-left, matte dark surface, round sphere, top-down view on dirt ground',
            'dark black carbon steel petanque boule ball, subtle highlight on top-right, matte dark surface, round sphere, top-down view on dirt ground',
            'dark black carbon steel petanque boule ball, subtle highlight on bottom-right, matte dark surface, round sphere, top-down view on dirt ground',
            'dark black carbon steel petanque boule ball, subtle highlight on bottom-left, matte dark surface, round sphere, top-down view on dirt ground'
        ]
    },
    {
        id: 'rouge',
        outputName: 'boule_rouge_roll',
        frames: [
            'red painted petanque boule ball with grooves, highlight on top-left, textured red surface, round sphere, top-down view on dirt ground',
            'red painted petanque boule ball with grooves, highlight on top-right, textured red surface, round sphere, top-down view on dirt ground',
            'red painted petanque boule ball with grooves, highlight on bottom-right, textured red surface, round sphere, top-down view on dirt ground',
            'red painted petanque boule ball with grooves, highlight on bottom-left, textured red surface, round sphere, top-down view on dirt ground'
        ]
    },
    {
        id: 'cochonnet',
        outputName: 'cochonnet_roll',
        frames: [
            'small wooden cochonnet jack ball for petanque, golden wood texture, highlight on top-left, small round sphere, top-down view on dirt ground',
            'small wooden cochonnet jack ball for petanque, golden wood texture, highlight on top-right, small round sphere, top-down view on dirt ground',
            'small wooden cochonnet jack ball for petanque, golden wood texture, highlight on bottom-right, small round sphere, top-down view on dirt ground',
            'small wooden cochonnet jack ball for petanque, golden wood texture, highlight on bottom-left, small round sphere, top-down view on dirt ground'
        ]
    },
    {
        id: 'cochonnet_bleu',
        outputName: 'cochonnet_bleu_roll',
        frames: [
            'small blue resin cochonnet jack ball for petanque, bright blue surface, highlight on top-left, small round sphere, top-down view on dirt ground',
            'small blue resin cochonnet jack ball for petanque, bright blue surface, highlight on top-right, small round sphere, top-down view on dirt ground',
            'small blue resin cochonnet jack ball for petanque, bright blue surface, highlight on bottom-right, small round sphere, top-down view on dirt ground',
            'small blue resin cochonnet jack ball for petanque, bright blue surface, highlight on bottom-left, small round sphere, top-down view on dirt ground'
        ]
    },
    {
        id: 'cochonnet_vert',
        outputName: 'cochonnet_vert_roll',
        frames: [
            'small green resin cochonnet jack ball for petanque, bright green surface, highlight on top-left, small round sphere, top-down view on dirt ground',
            'small green resin cochonnet jack ball for petanque, bright green surface, highlight on top-right, small round sphere, top-down view on dirt ground',
            'small green resin cochonnet jack ball for petanque, bright green surface, highlight on bottom-right, small round sphere, top-down view on dirt ground',
            'small green resin cochonnet jack ball for petanque, bright green surface, highlight on bottom-left, small round sphere, top-down view on dirt ground'
        ]
    }
];

async function apiCall(body, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const res = await fetch(`${API_BASE}/generate-image-pixflux`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
            body: JSON.stringify(body)
        });
        if (res.ok) return res.json();
        if (res.status >= 500 && attempt < retries) {
            console.log(`    Retry ${attempt + 1}...`);
            await new Promise(r => setTimeout(r, 3000));
            continue;
        }
        const err = await res.text();
        throw new Error(`API failed (${res.status}): ${err.substring(0, 100)}`);
    }
}

async function generateBall(ball) {
    console.log(`\n=== ${ball.id} ===`);
    const frameBufs = [];

    for (let i = 0; i < 4; i++) {
        console.log(`  Frame ${i + 1}/4...`);
        const data = await apiCall({
            description: ball.frames[i],
            image_size: { width: 32, height: 32 },
            no_background: true,
            view: 'high top-down',
            direction: 'south',
            style: 'pixel art, single round ball object centered, warm earth tones background removed, no outline',
            text_guidance_scale: 8.0
        });
        console.log(`    Cost: $${data.usage?.usd?.toFixed(4) || '?'}`);
        frameBufs.push(Buffer.from(data.image.base64, 'base64'));
    }

    // Assemble into 128x32 spritesheet (4 frames side by side)
    const sheet = sharp({
        create: { width: 128, height: 32, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).png();

    const overlays = frameBufs.map((buf, i) => ({
        input: buf,
        left: i * 32,
        top: 0
    }));

    const outPath = path.join(SPRITES_DIR, `${ball.outputName}.png`);
    await sheet.composite(overlays).toFile(outPath);
    console.log(`  ✅ Saved ${ball.outputName}.png (128x32)`);
}

async function main() {
    const target = process.argv[2];
    const balls = target ? BALLS.filter(b => b.id === target) : BALLS;

    console.log(`Generating ${balls.length} ball spritesheet(s)...\n`);
    for (const ball of balls) {
        await generateBall(ball);
    }
    console.log('\n=== All done! ===');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
