/**
 * Generate 5 new boule sprites via PixelLab API
 * Style: pixel art, 64x64, top-down view, transparent background
 * Matching existing boule style (highlight top-left, shadow bottom-right)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.PIXELLAB_API_KEY || fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').match(/PIXELLAB_API_KEY=(.+)/)?.[1]?.trim();
const API_URL = 'https://api.pixellab.ai/v1/generate-image-pixflux';
const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'sprites');

if (!API_KEY) { console.error('Missing PIXELLAB_API_KEY'); process.exit(1); }

const boules = [
    {
        id: 'boule_doree',
        prompt: 'A single petanque ball seen from directly above, top-down view. Polished gold metal with fine engraved cross-hatch lines. Rich warm golden color (#D4A040). Bright white specular highlight on upper-left quadrant. Dark warm shadow (#5A4020) on lower-right. Pixel art style, clean round shape, transparent background.'
    },
    {
        id: 'boule_rouille',
        prompt: 'A single petanque ball seen from directly above, top-down view. Weathered rusty iron with orange-brown patina and darker rust spots. Colors: rusty orange (#B86830), dark brown rust (#6A3A18), lighter oxidation patches (#D48840). White highlight upper-left. Pixel art style, round shape, transparent background. Aged vintage look.'
    },
    {
        id: 'boule_bleue',
        prompt: 'A single petanque ball seen from directly above, top-down view. Anodized blue steel with subtle metallic sheen. Deep blue (#3A5A9A) with lighter blue highlight (#6A8AC0) on upper-left. Dark navy shadow (#1A2A5A) on lower-right. Fine vertical stripe engravings. Pixel art style, round shape, transparent background.'
    },
    {
        id: 'boule_cuivre',
        prompt: 'A single petanque ball seen from directly above, top-down view. Polished copper metal with warm reddish-orange tones. Main color: copper (#B87340), highlight: bright copper (#E8A060) upper-left. Shadow: dark copper (#7A4A28) lower-right. Subtle patina green spots (#5A8A5A) on edges. Pixel art style, round shape, transparent background.'
    },
    {
        id: 'boule_titane',
        prompt: 'A single petanque ball seen from directly above, top-down view. Brushed titanium with cool grey-purple iridescent sheen. Main color: titanium grey (#8A8A98), purple tint (#9A8AAA) on edge. Bright white highlight upper-left. Dark grey shadow (#4A4A58) lower-right. Ultra modern sleek look. Pixel art style, round shape, transparent background.'
    }
];

async function generateBoule(boule) {
    console.log(`Generating ${boule.id}...`);
    const body = {
        description: boule.prompt,
        image_size: { width: 64, height: 64 },
        no_background: true,
        view: 'high top-down',
        direction: 'south',
        outline: 'single color black outline',
        shading: 'medium shading',
        detail: 'highly detailed',
        text_guidance_scale: 8.0
    };

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const text = await res.text();
        console.error(`  FAILED ${res.status}: ${text.substring(0, 200)}`);
        return false;
    }

    const data = await res.json();
    if (data.image?.base64) {
        const buffer = Buffer.from(data.image.base64, 'base64');
        const outPath = path.join(OUT_DIR, `${boule.id}.png`);
        fs.writeFileSync(outPath, buffer);
        console.log(`  OK -> ${outPath} (${buffer.length} bytes)`);
        return true;
    }
    console.error(`  No image in response`);
    return false;
}

async function main() {
    console.log('=== Generating 5 new boule sprites via PixelLab ===\n');
    let success = 0;
    for (const boule of boules) {
        try {
            if (await generateBoule(boule)) success++;
        } catch (err) {
            console.error(`  ERROR: ${err.message}`);
        }
        // Rate limit pause
        await new Promise(r => setTimeout(r, 1500));
    }
    console.log(`\nDone: ${success}/${boules.length} generated`);
}

main();
