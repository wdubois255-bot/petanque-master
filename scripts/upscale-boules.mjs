#!/usr/bin/env node
/**
 * Upscale existing 32x32 ball sprites to 64x64 and 128x128 via PixelLab /rotate
 * Uses the same direction (south→south) to preserve style while upscaling
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = '8c105f99-2b2c-45d1-b537-28ce76936441';
const API_HOST = 'api.pixellab.ai';

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
                        reject(new Error(`API ${res.statusCode}: ${JSON.stringify(json).substring(0, 300)}`));
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

const BALLS = [
    'boule_acier', 'boule_bronze', 'boule_chrome',
    'boule_noire', 'boule_rouge',
    'cochonnet', 'cochonnet_bleu', 'cochonnet_vert'
];

async function upscaleBall(name, srcPath, targetSize, outDir) {
    const outPath = path.join(outDir, `${name}_up${targetSize}.png`);

    if (fs.existsSync(outPath)) {
        console.log(`  [SKIP] ${outPath} exists`);
        return outPath;
    }

    const srcBuf = fs.readFileSync(srcPath);
    const srcB64 = srcBuf.toString('base64');

    console.log(`  Upscaling ${name} → ${targetSize}x${targetSize}...`);

    const result = await apiCall('rotate', {
        image_size: { width: targetSize, height: targetSize },
        from_image: {
            type: 'base64',
            base64: srcB64
        },
        from_direction: 'south',
        to_direction: 'south',
        image_guidance_scale: 3.0
    });

    if (result.image && result.image.base64) {
        const buf = Buffer.from(result.image.base64, 'base64');
        fs.writeFileSync(outPath, buf);
        const cost = result.usage?.usd || '?';
        console.log(`  [OK] ${outPath} (${buf.length} bytes, $${cost})`);
        return outPath;
    } else {
        console.error(`  [FAIL] ${name}: unexpected response`);
        return null;
    }
}

async function main() {
    const oldDir = path.resolve('public/assets/sprites/old');
    const outDir = path.resolve('public/assets/sprites');

    // Verify old sprites exist
    for (const name of BALLS) {
        const p = path.join(oldDir, `${name}_old.png`);
        if (!fs.existsSync(p)) {
            console.error(`Missing: ${p}`);
            process.exit(1);
        }
    }

    console.log(`\n=== Upscale Old Boules via PixelLab /rotate ===\n`);

    const sizes = [64, 128];

    for (const size of sizes) {
        console.log(`\n--- ${size}x${size} ---`);
        for (const name of BALLS) {
            const srcPath = path.join(oldDir, `${name}_old.png`);
            try {
                await upscaleBall(name, srcPath, size, outDir);
                await new Promise(r => setTimeout(r, 500));
            } catch (err) {
                console.error(`  [ERROR] ${name} ${size}: ${err.message}`);
            }
        }
    }

    console.log(`\n=== Done! ===`);
    console.log(`Open http://localhost:8083/compare-boules.html to compare\n`);
}

main().catch(console.error);
