#!/usr/bin/env node
/**
 * Generate terrain decoration sprites via PixelLab API
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');
const SPRITES_DIR = path.join(PROJECT, 'public', 'assets', 'sprites');

const envFile = fs.readFileSync(path.join(PROJECT, '.env'), 'utf8');
const API_KEY = envFile.match(/PIXELLAB_API_KEY=(.+)/)?.[1]?.trim();
const API_BASE = 'https://api.pixellab.ai/v1';

const ITEMS = [
    {
        name: 'terrain_caillou_1',
        desc: 'small group of 3-4 pebbles stones on dirt ground, earth tones beige brown, scattered natural arrangement, top down view',
        size: 32
    },
    {
        name: 'terrain_caillou_2',
        desc: 'single medium rounded rock pebble on earth ground, brownish gray stone, natural shape, top down view',
        size: 32
    },
    {
        name: 'terrain_racine',
        desc: 'exposed tree root on dirt ground, brown organic curved shape, emerging from packed earth, top down view',
        size: 32
    },
    {
        name: 'terrain_herbe_touffe',
        desc: 'small tuft of wild grass blades on dirt, olive green wild grass sticking up from brown earth, top down view',
        size: 32
    },
    {
        name: 'terrain_fissure',
        desc: 'crack in dry earth ground, thin branching line crack in packed dirt, dried out terrain detail, top down view',
        size: 32
    },
    {
        name: 'terrain_planche_bord',
        desc: 'wooden plank border for petanque terrain, horizontal worn wood grain texture, dark brown oak plank, side view',
        size: 64
    }
];

async function generate(item) {
    console.log(`Generating ${item.name} (${item.size}x${item.size})...`);
    const res = await fetch(`${API_BASE}/generate-image-pixflux`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            description: item.desc,
            image_size: { width: item.size, height: item.size },
            no_background: true,
            view: 'high top-down',
            direction: 'south',
            style: 'pixel art, top-down view, warm provencal earth tones, no pure black outlines use dark brown #3A2E28',
            text_guidance_scale: 8.0
        })
    });

    if (!res.ok) {
        const err = await res.text();
        console.log(`  ❌ Failed (${res.status}): ${err.substring(0, 100)}`);
        return;
    }

    const data = await res.json();
    if (data.image?.base64) {
        const buf = Buffer.from(data.image.base64, 'base64');
        const outPath = path.join(SPRITES_DIR, `${item.name}.png`);
        fs.writeFileSync(outPath, buf);
        console.log(`  ✅ Saved ${item.name}.png (${buf.length} bytes, $${data.usage?.usd?.toFixed(4) || '?'})`);
    } else {
        console.log(`  ❌ No image in response`);
    }
}

async function main() {
    console.log(`Generating ${ITEMS.length} terrain sprites...\n`);
    for (const item of ITEMS) {
        await generate(item);
    }
    console.log('\n=== Done ===');
}

main().catch(err => { console.error('ERROR:', err); process.exit(1); });
