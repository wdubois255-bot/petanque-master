#!/usr/bin/env node
/**
 * Generate HD petanque ball sprites via PixelLab API
 * Generates 64x64 and 128x128 versions for comparison
 *
 * Usage: node scripts/generate-boules-hd.mjs [--size 64|128|both] [--only acier,bronze,...]
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = '8c105f99-2b2c-45d1-b537-28ce76936441';
const API_HOST = 'api.pixellab.ai';

// Ball definitions matching existing DA
const BOULES = [
    {
        id: 'acier',
        filename: 'boule_acier',
        prompt: 'single metallic steel petanque boule ball, steel gray silver color, specular highlight top-left, spherical shading with 7+ color tones, smooth polished metal surface, pixel art style, centered on transparent background, no outline, warm ambient lighting',
        color: '#A8B5C2'
    },
    {
        id: 'bronze',
        filename: 'boule_bronze',
        prompt: 'single bronze copper petanque boule ball, warm bronze golden-brown color, specular highlight top-left, spherical shading with 7+ color tones, aged patina metal surface, pixel art style, centered on transparent background, no outline, warm ambient lighting',
        color: '#CD7F32'
    },
    {
        id: 'chrome',
        filename: 'boule_chrome',
        prompt: 'single polished chrome petanque boule ball, bright shiny silver mirror-like surface, strong specular highlight top-left, spherical shading with 7+ color tones, reflective metal, pixel art style, centered on transparent background, no outline, warm ambient lighting',
        color: '#E8E8E8'
    },
    {
        id: 'noire',
        filename: 'boule_noire',
        prompt: 'single dark black steel petanque boule ball, very dark charcoal matte surface, subtle specular highlight top-left, spherical shading with 7+ dark tones, carbide steel, pixel art style, centered on transparent background, no outline, warm ambient lighting',
        color: '#3A3A4A'
    },
    {
        id: 'rouge',
        filename: 'boule_rouge',
        prompt: 'single red painted petanque boule ball, vibrant deep red color, specular highlight top-left, spherical shading with 7+ color tones, painted metal with subtle groove lines, pixel art style, centered on transparent background, no outline, warm ambient lighting',
        color: '#CC3333'
    }
];

const COCHONNETS = [
    {
        id: 'classique',
        filename: 'cochonnet',
        prompt: 'single small wooden petanque jack ball (cochonnet), warm golden boxwood color, small round ball, specular highlight top-left, spherical wood grain shading, pixel art style, centered on transparent background, no outline, warm ambient lighting',
        color: '#FFD700'
    },
    {
        id: 'bleu',
        filename: 'cochonnet_bleu',
        prompt: 'single small blue competition petanque jack ball (cochonnet), deep blue resin color, small round ball, specular highlight top-left, spherical shading, smooth plastic surface, pixel art style, centered on transparent background, no outline, warm ambient lighting',
        color: '#3344DD'
    },
    {
        id: 'vert',
        filename: 'cochonnet_vert',
        prompt: 'single small green resin petanque jack ball (cochonnet), vibrant green color, small round ball, specular highlight top-left, spherical shading, smooth resin surface, pixel art style, centered on transparent background, no outline, warm ambient lighting',
        color: '#33BB44'
    }
];

function apiCall(endpoint, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = https.request({
            hostname: API_HOST,
            port: 443,
            path: `/v1/${endpoint}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Length': Buffer.byteLength(data)
            }
        }, (res) => {
            let chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                const raw = Buffer.concat(chunks).toString();
                try {
                    const json = JSON.parse(raw);
                    if (res.statusCode !== 200) {
                        reject(new Error(`API ${res.statusCode}: ${JSON.stringify(json)}`));
                    } else {
                        resolve(json);
                    }
                } catch (e) {
                    reject(new Error(`Parse error: ${raw.substring(0, 200)}`));
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function generateBall(ball, size, outputDir) {
    const outPath = path.join(outputDir, `${ball.filename}_${size}.png`);

    // Skip if already exists
    if (fs.existsSync(outPath)) {
        console.log(`  [SKIP] ${outPath} already exists`);
        return outPath;
    }

    console.log(`  Generating ${ball.filename} at ${size}x${size}...`);

    const result = await apiCall('generate-image-pixflux', {
        description: ball.prompt,
        image_size: { width: size, height: size },
        no_background: true,
        view: 'high top-down',
        direction: 'south',
        style: 'pixel art, single round ball object centered, warm provencal ambient light',
        shading: size >= 128 ? 'detailed shading' : 'medium shading',
        detail: size >= 128 ? 'highly detailed' : 'medium detail',
        text_guidance_scale: 8.0,
        image_guidance_scale: 1.5
    });

    if (result.image && result.image.base64) {
        const buf = Buffer.from(result.image.base64, 'base64');
        fs.writeFileSync(outPath, buf);
        const cost = result.usage?.usd || '?';
        console.log(`  [OK] ${outPath} (${buf.length} bytes, $${cost})`);
        return outPath;
    } else {
        console.error(`  [FAIL] ${ball.filename}: unexpected response`, Object.keys(result));
        return null;
    }
}

async function main() {
    const args = process.argv.slice(2);

    // Parse --size
    let sizes = [64, 128];
    const sizeIdx = args.indexOf('--size');
    if (sizeIdx !== -1 && args[sizeIdx + 1]) {
        const val = args[sizeIdx + 1];
        sizes = val === 'both' ? [64, 128] : [parseInt(val)];
    }

    // Parse --only
    let onlyIds = null;
    const onlyIdx = args.indexOf('--only');
    if (onlyIdx !== -1 && args[onlyIdx + 1]) {
        onlyIds = args[onlyIdx + 1].split(',');
    }

    const outputDir = path.resolve('public/assets/sprites');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const allBalls = [...BOULES, ...COCHONNETS];
    const filtered = onlyIds
        ? allBalls.filter(b => onlyIds.includes(b.id) || onlyIds.includes(b.filename))
        : allBalls;

    console.log(`\n=== Petanque Master - Ball HD Generation ===`);
    console.log(`Sizes: ${sizes.join(', ')}`);
    console.log(`Balls: ${filtered.map(b => b.id).join(', ')}`);
    console.log(`Output: ${outputDir}\n`);

    let totalCost = 0;
    let generated = 0;

    for (const size of sizes) {
        console.log(`\n--- ${size}x${size} ---`);
        for (const ball of filtered) {
            try {
                const result = await generateBall(ball, size, outputDir);
                if (result) generated++;
                // Small delay between API calls
                await new Promise(r => setTimeout(r, 500));
            } catch (err) {
                console.error(`  [ERROR] ${ball.id} ${size}x${size}: ${err.message}`);
            }
        }
    }

    console.log(`\n=== Done! Generated ${generated} sprites ===`);
    console.log(`Files saved to ${outputDir}/`);
    console.log(`\nTo compare, open the PNGs side by side.`);
    console.log(`To integrate: update BootScene.js to load the chosen size.\n`);
}

main().catch(console.error);
