#!/usr/bin/env node
/**
 * Enhance 64x64 ball sprites programmatically:
 * - Anti-alias jagged edges (smooth staircase contour)
 * - Add subtle dark outline for readability
 * - Enhance spherical shading (darken edges, brighten highlights)
 * - Add specular highlight spot
 * - Add rim light for depth
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SIZE = 64;
const SPRITES_DIR = path.resolve('public/assets/sprites');

// Ball definitions with their center color for shading reference
const BALLS = [
    { name: 'boule_acier',    lightColor: [200, 210, 220], darkColor: [60, 65, 80],   specular: true,  rimLight: [180, 190, 210] },
    { name: 'boule_bronze',   lightColor: [240, 200, 150], darkColor: [70, 45, 20],   specular: true,  rimLight: [220, 180, 120] },
    { name: 'boule_chrome',   lightColor: [245, 245, 255], darkColor: [50, 50, 65],   specular: true,  rimLight: [220, 220, 240] },
    { name: 'boule_noire',    lightColor: [100, 100, 115], darkColor: [15, 15, 22],   specular: false, rimLight: [70, 70, 85] },
    { name: 'boule_rouge',    lightColor: [240, 120, 120], darkColor: [60, 15, 15],   specular: true,  rimLight: [200, 80, 80] },
    { name: 'cochonnet',      lightColor: [230, 200, 140], darkColor: [70, 50, 25],   specular: false, rimLight: [200, 170, 110] },
    { name: 'cochonnet_bleu', lightColor: [120, 140, 240], darkColor: [15, 20, 60],   specular: true,  rimLight: [80, 100, 200] },
    { name: 'cochonnet_vert', lightColor: [100, 220, 120], darkColor: [15, 50, 20],   specular: true,  rimLight: [70, 180, 90] },
];

function clamp(v, min = 0, max = 255) { return Math.max(min, Math.min(max, Math.round(v))); }

function getPixel(data, x, y) {
    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return [0, 0, 0, 0];
    const i = (y * SIZE + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function setPixel(data, x, y, r, g, b, a) {
    const i = (y * SIZE + x) * 4;
    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
    data[i + 3] = clamp(a);
}

function blendOver(base, overlay, alpha) {
    return base * (1 - alpha) + overlay * alpha;
}

async function enhanceBall(ball) {
    const filePath = path.join(SPRITES_DIR, ball.name + '.png');
    const { data, info } = await sharp(filePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const pixels = new Uint8Array(data);
    const out = new Uint8Array(pixels); // copy to work on

    // 1. Find ball center and radius by analyzing alpha
    let cx = 0, cy = 0, count = 0;
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const a = getPixel(pixels, x, y)[3];
            if (a > 128) { cx += x; cy += y; count++; }
        }
    }
    cx = count > 0 ? cx / count : SIZE / 2;
    cy = count > 0 ? cy / count : SIZE / 2;

    // Find approximate radius
    let maxDist = 0;
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (getPixel(pixels, x, y)[3] > 128) {
                const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                if (d > maxDist) maxDist = d;
            }
        }
    }
    const radius = maxDist;

    // Light direction (top-left)
    const lightX = -0.45, lightY = -0.5;
    const lightLen = Math.sqrt(lightX * lightX + lightY * lightY);
    const lx = lightX / lightLen, ly = lightY / lightLen;

    // 2. Apply enhancements per pixel
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const [r, g, b, a] = getPixel(pixels, x, y);
            if (a < 10) continue; // skip fully transparent

            const dx = x - cx, dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const normDist = dist / radius; // 0 = center, 1 = edge

            // Normal vector on sphere surface
            const nx = dx / (radius || 1);
            const ny = dy / (radius || 1);
            const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

            // Diffuse lighting (dot product with light direction)
            const diffuse = Math.max(0, -(nx * lx + ny * ly) * 0.7 + nz * 0.5);

            // === ENHANCEMENT A: Spherical shading overlay ===
            // Darken edges, brighten center based on sphere normal
            const shadeFactor = 0.15; // strength of the effect
            const shade = (diffuse - 0.4) * shadeFactor;

            let nr = r + shade * 255;
            let ng = g + shade * 255;
            let nb = b + shade * 255;

            // === ENHANCEMENT B: Edge darkening (ambient occlusion) ===
            if (normDist > 0.75) {
                const edgeFade = (normDist - 0.75) / 0.25; // 0→1 at edge
                const darken = edgeFade * 0.25;
                nr = blendOver(nr, ball.darkColor[0], darken);
                ng = blendOver(ng, ball.darkColor[1], darken);
                nb = blendOver(nb, ball.darkColor[2], darken);
            }

            // === ENHANCEMENT C: Rim light (opposite side of light = subtle backlight) ===
            const rimDot = (nx * lx + ny * ly); // positive = away from light
            if (rimDot > 0.3 && normDist > 0.6) {
                const rimStrength = (rimDot - 0.3) * (normDist - 0.6) * 1.5;
                const rim = Math.min(0.2, rimStrength);
                nr = blendOver(nr, ball.rimLight[0], rim);
                ng = blendOver(ng, ball.rimLight[1], rim);
                nb = blendOver(nb, ball.rimLight[2], rim);
            }

            // === ENHANCEMENT D: Specular highlight ===
            if (ball.specular) {
                // Specular = reflection of light (Phong model)
                const reflX = 2 * nz * nx - 0; // simplified
                const reflY = 2 * nz * ny - 0;
                const specDot = -(reflX * lx + reflY * ly + nz * 0.8);
                if (specDot > 0.7) {
                    const specPow = Math.pow((specDot - 0.7) / 0.3, 3);
                    const specStrength = specPow * 0.6;
                    nr = blendOver(nr, 255, specStrength);
                    ng = blendOver(ng, 255, specStrength);
                    nb = blendOver(nb, 255, specStrength);
                }
            }

            setPixel(out, x, y, nr, ng, nb, a);
        }
    }

    // 3. Anti-alias edges: smooth alpha at the ball boundary
    const aaOut = new Uint8Array(out);
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const [r, g, b, a] = getPixel(out, x, y);
            // Check if this is an edge pixel (has transparent neighbor)
            if (a > 20 && a < 250) continue; // already semi-transparent
            if (a < 20) continue;

            let hasTransparentNeighbor = false;
            for (const [ox, oy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                if (getPixel(out, x + ox, y + oy)[3] < 20) {
                    hasTransparentNeighbor = true;
                    break;
                }
            }

            if (hasTransparentNeighbor) {
                // Count opaque neighbors for smoother alpha
                let opaqueCount = 0;
                for (const [ox, oy] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
                    if (getPixel(out, x + ox, y + oy)[3] > 128) opaqueCount++;
                }
                // Soften alpha based on neighbor count
                const newAlpha = clamp(a * (opaqueCount / 8) + a * 0.3);
                setPixel(aaOut, x, y, r, g, b, newAlpha);
            }
        }
    }

    // 4. Add 1px dark outline around the ball
    const finalOut = new Uint8Array(aaOut);
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (getPixel(aaOut, x, y)[3] > 20) continue; // skip opaque pixels

            // Check if any neighbor is opaque
            let hasOpaqueNeighbor = false;
            for (const [ox, oy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                if (getPixel(aaOut, x + ox, y + oy)[3] > 128) {
                    hasOpaqueNeighbor = true;
                    break;
                }
            }
            if (hasOpaqueNeighbor) {
                // Dark outline pixel (warm dark, not pure black per project rules)
                setPixel(finalOut, x, y, 58, 46, 40, 140); // #3A2E28 with ~55% alpha
            }
        }
    }

    // Write back
    const outBuf = Buffer.from(finalOut);
    await sharp(outBuf, { raw: { width: SIZE, height: SIZE, channels: 4 } })
        .png()
        .toBuffer()
        .then(buf => fs.writeFileSync(filePath, buf));

    console.log(`  [OK] ${ball.name}.png enhanced (${fs.statSync(filePath).size} bytes)`);
}

async function main() {
    console.log('\n=== Enhance 64x64 Ball Sprites ===\n');

    for (const ball of BALLS) {
        try {
            await enhanceBall(ball);
        } catch (err) {
            console.error(`  [ERROR] ${ball.name}: ${err.message}`);
        }
    }

    console.log('\nDone! Refresh the game to see results.\n');
}

main().catch(console.error);
