const SPRITE_W = 32;
const SPRITE_H = 32;

// Helper: draw a 2x2 pixel block (maintains detail at doubled resolution)
function px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * 2, y * 2, 2, 2);
}

// Helper: darken a hex color
function darken(hex, amount = 30) {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Helper: lighten a hex color
function lighten(hex, amount = 30) {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Helper: fill a rect in 2x-scaled coordinates
function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * 2, y * 2, w * 2, h * 2);
}

// Generate a character spritesheet: 4 directions x 4 frames = 16 frames
// Layout: row 0 = down, row 1 = left, row 2 = right, row 3 = up
export function generateCharacterSprite(scene, key, palette) {
    const cols = 4;
    const rows = 4;
    const canvas = document.createElement('canvas');
    canvas.width = SPRITE_W * cols;
    canvas.height = SPRITE_H * rows;
    const ctx = canvas.getContext('2d');

    const directions = ['down', 'left', 'right', 'up'];

    for (let dir = 0; dir < 4; dir++) {
        for (let frame = 0; frame < 4; frame++) {
            ctx.save();
            ctx.translate(frame * SPRITE_W, dir * SPRITE_H);
            drawCharacter(ctx, directions[dir], frame, palette);
            ctx.restore();
        }
    }

    scene.textures.addSpriteSheet(key, canvas, {
        frameWidth: SPRITE_W,
        frameHeight: SPRITE_H
    });
}

function drawCharacter(ctx, dir, frame, p) {
    const isMoving = frame > 0;
    const legAnim = isMoving ? (frame % 2 === 0 ? 0 : (frame < 2 ? -1 : 1)) : 0;
    const armSwing = isMoving ? (frame % 2 === 0 ? 0 : (frame < 2 ? 1 : -1)) : 0;

    // Precompute colors
    const shirtDark = darken(p.shirt, 30);
    const shirtLight = lighten(p.shirt, 25);
    const skinDark = darken(p.skin, 25);
    const skinLight = lighten(p.skin, 15);
    const pantsDark = darken(p.pants, 25);
    const pantsLight = lighten(p.pants, 15);
    const hairDark = darken(p.hair, 25);
    const hairLight = lighten(p.hair, 20);
    const shoesDark = darken(p.shoes, 20);

    // All drawing uses px() and rect() which auto-scale x2

    // ============================================
    // SHADOW (soft ellipse)
    // ============================================
    ctx.fillStyle = 'rgba(42,30,21,0.22)';
    ctx.fillRect(4 * 2, 14 * 2, 8 * 2, 2 * 2);
    ctx.fillRect(5 * 2, 13 * 2, 6 * 2, 1 * 2);
    px(ctx, 3, 14, 'rgba(42,30,21,0.10)');
    px(ctx, 12, 14, 'rgba(42,30,21,0.10)');

    // ============================================
    // SHOES (draw first, legs overlap)
    // ============================================
    if (legAnim === 0) {
        rect(ctx, 5, 13, 3, 2, p.shoes);
        px(ctx, 5, 13, shoesDark);
        rect(ctx, 8, 13, 3, 2, p.shoes);
        px(ctx, 8, 13, shoesDark);
        px(ctx, 6, 14, lighten(p.shoes, 25));
        px(ctx, 9, 14, lighten(p.shoes, 25));
    } else if (legAnim < 0) {
        rect(ctx, 4, 13, 3, 2, p.shoes);
        rect(ctx, 9, 12, 3, 2, p.shoes);
        px(ctx, 4, 13, shoesDark);
    } else {
        rect(ctx, 5, 12, 3, 2, p.shoes);
        rect(ctx, 9, 13, 3, 2, p.shoes);
        px(ctx, 9, 13, shoesDark);
    }

    // ============================================
    // LEGS
    // ============================================
    if (legAnim === 0) {
        rect(ctx, 5, 10, 3, 3, p.pants);
        rect(ctx, 8, 10, 3, 3, p.pants);
        px(ctx, 7, 11, pantsDark);
        px(ctx, 8, 11, pantsDark);
        px(ctx, 6, 10, pantsLight);
        px(ctx, 9, 10, pantsLight);
    } else if (legAnim < 0) {
        rect(ctx, 4, 10, 3, 3, p.pants);
        rect(ctx, 9, 10, 3, 2, p.pants);
        px(ctx, 4, 10, pantsDark);
        px(ctx, 5, 10, pantsLight);
    } else {
        rect(ctx, 5, 10, 3, 2, p.pants);
        rect(ctx, 9, 10, 3, 3, p.pants);
        px(ctx, 9, 10, pantsDark);
        px(ctx, 10, 10, pantsLight);
    }
    // Belt line
    rect(ctx, 5, 10, 6, 1, darken(p.pants, 40));

    // ============================================
    // BODY / TORSO
    // ============================================
    rect(ctx, 4, 5, 8, 5, p.shirt);

    // Shirt shading - 3-tone
    rect(ctx, 4, 5, 1, 5, shirtDark);
    rect(ctx, 4, 9, 8, 1, shirtDark);
    px(ctx, 9, 6, shirtLight);
    px(ctx, 10, 6, shirtLight);
    px(ctx, 10, 7, shirtLight);

    // Collar detail (front view)
    if (dir === 'down') {
        px(ctx, 7, 5, p.skin);
        px(ctx, 8, 5, p.skin);
        px(ctx, 6, 5, shirtDark);
        px(ctx, 9, 5, shirtDark);
    }

    // Stripe detail if palette has stripes (mariniere)
    if (p.stripes) {
        rect(ctx, 5, 7, 6, 1, p.stripes);
        rect(ctx, 5, 9, 6, 1, p.stripes);
    }

    // Gold chain if palette has it
    if (p.chain) {
        if (dir === 'down') {
            px(ctx, 7, 6, p.chain);
            px(ctx, 8, 6, p.chain);
            px(ctx, 7, 7, p.chain);
        } else if (dir === 'left') {
            px(ctx, 6, 6, p.chain);
            px(ctx, 5, 7, p.chain);
        } else if (dir === 'right') {
            px(ctx, 9, 6, p.chain);
            px(ctx, 10, 7, p.chain);
        }
    }

    // ============================================
    // ARMS
    // ============================================
    const armLen = 4 + (armSwing !== 0 ? 1 : 0);

    if (dir === 'left') {
        rect(ctx, 3, 6, 2, armLen, p.shirt);
        px(ctx, 3, 6, shirtDark);
        px(ctx, 3, 7, shirtDark);
        rect(ctx, 3, 6 + armLen - 1, 2, 1, p.skin);
        px(ctx, 3, 6 + armLen - 1, skinDark);
    } else if (dir === 'right') {
        rect(ctx, 11, 6, 2, armLen, p.shirt);
        px(ctx, 12, 6, shirtDark);
        px(ctx, 12, 7, shirtDark);
        rect(ctx, 11, 6 + armLen - 1, 2, 1, p.skin);
        px(ctx, 12, 6 + armLen - 1, skinDark);
    } else {
        const leftArmLen = 4 + (armSwing > 0 ? 1 : 0);
        const rightArmLen = 4 + (armSwing < 0 ? 1 : 0);
        rect(ctx, 2, 6, 2, leftArmLen, p.shirt);
        px(ctx, 2, 6, shirtDark);
        rect(ctx, 12, 6, 2, rightArmLen, p.shirt);
        px(ctx, 13, 6, shirtDark);
        rect(ctx, 2, 6 + leftArmLen - 1, 2, 1, p.skin);
        rect(ctx, 12, 6 + rightArmLen - 1, 2, 1, p.skin);
        px(ctx, 2, 6 + leftArmLen - 1, skinDark);
        px(ctx, 13, 6 + rightArmLen - 1, skinDark);
    }

    // ============================================
    // HEAD
    // ============================================
    rect(ctx, 4, 1, 8, 4, p.skin);

    // Face shading - 3-tone for depth
    rect(ctx, 4, 1, 1, 4, skinDark);
    rect(ctx, 4, 4, 8, 1, skinDark);
    if (dir === 'left') {
        rect(ctx, 10, 1, 2, 3, skinDark);
    } else if (dir === 'right') {
        rect(ctx, 4, 1, 2, 3, skinDark);
    }
    // Cheek highlight
    if (dir === 'down') {
        px(ctx, 10, 3, skinLight);
    }

    // ============================================
    // HAIR (different styles per palette)
    // ============================================
    const hairStyle = p.hairStyle || 'default';

    if (hairStyle === 'wild') {
        if (dir === 'down') {
            rect(ctx, 3, 0, 10, 2, p.hair);
            rect(ctx, 2, 0, 2, 2, p.hair);
            rect(ctx, 12, 0, 2, 2, p.hair);
            rect(ctx, 3, 0, 2, 3, p.hair);
            rect(ctx, 11, 0, 2, 3, p.hair);
            px(ctx, 5, 0, hairLight);
            px(ctx, 9, 0, hairLight);
            px(ctx, 2, 1, hairLight);
            px(ctx, 13, 1, hairLight);
        } else if (dir === 'up') {
            rect(ctx, 2, 0, 12, 4, p.hair);
            px(ctx, 5, 0, hairLight);
            px(ctx, 8, 1, hairDark);
            px(ctx, 4, 2, hairLight);
            px(ctx, 10, 1, hairLight);
            px(ctx, 2, 1, hairLight);
            px(ctx, 13, 2, hairLight);
        } else if (dir === 'left') {
            rect(ctx, 3, 0, 10, 2, p.hair);
            rect(ctx, 2, 0, 3, 3, p.hair);
            px(ctx, 2, 0, p.hair);
            px(ctx, 3, 3, hairLight);
        } else {
            rect(ctx, 3, 0, 10, 2, p.hair);
            rect(ctx, 11, 0, 3, 3, p.hair);
            px(ctx, 13, 0, p.hair);
            px(ctx, 12, 3, hairLight);
        }
    } else if (hairStyle === 'spiky') {
        if (dir === 'down') {
            rect(ctx, 3, 0, 10, 2, p.hair);
            rect(ctx, 3, 0, 2, 2, p.hair);
            rect(ctx, 11, 0, 2, 2, p.hair);
            px(ctx, 4, 0, p.hair);
            px(ctx, 7, 0, p.hair);
            px(ctx, 10, 0, p.hair);
            px(ctx, 5, 0, hairLight);
            px(ctx, 9, 0, hairLight);
            px(ctx, 6, 0, hairLight);
        } else if (dir === 'up') {
            rect(ctx, 3, 0, 10, 3, p.hair);
            px(ctx, 4, 0, hairLight);
            px(ctx, 7, 0, hairLight);
            px(ctx, 10, 0, hairLight);
            px(ctx, 6, 1, hairDark);
        } else if (dir === 'left') {
            rect(ctx, 3, 0, 10, 2, p.hair);
            rect(ctx, 3, 0, 3, 3, p.hair);
            px(ctx, 5, 0, hairLight);
            px(ctx, 8, 0, p.hair);
        } else {
            rect(ctx, 3, 0, 10, 2, p.hair);
            rect(ctx, 10, 0, 3, 3, p.hair);
            px(ctx, 10, 0, hairLight);
            px(ctx, 7, 0, p.hair);
        }
    } else if (hairStyle === 'bald_top') {
        if (dir === 'down') {
            rect(ctx, 3, 1, 2, 3, p.hair);
            rect(ctx, 11, 1, 2, 3, p.hair);
            rect(ctx, 3, 0, 10, 1, p.hair);
            px(ctx, 5, 0, hairLight);
        } else if (dir === 'up') {
            rect(ctx, 3, 0, 10, 2, p.hair);
            px(ctx, 6, 1, hairLight);
        } else if (dir === 'left') {
            rect(ctx, 3, 0, 5, 1, p.hair);
            rect(ctx, 3, 0, 3, 3, p.hair);
        } else {
            rect(ctx, 8, 0, 5, 1, p.hair);
            rect(ctx, 10, 0, 3, 3, p.hair);
        }
    } else {
        // Default neat hair
        if (dir === 'down') {
            rect(ctx, 3, 0, 10, 2, p.hair);
            rect(ctx, 3, 0, 2, 3, p.hair);
            rect(ctx, 11, 0, 2, 3, p.hair);
            px(ctx, 5, 0, hairDark);
            px(ctx, 9, 0, hairDark);
            px(ctx, 7, 0, hairLight);
        } else if (dir === 'up') {
            rect(ctx, 3, 0, 10, 4, p.hair);
            px(ctx, 5, 0, hairDark);
            px(ctx, 8, 1, hairDark);
            px(ctx, 6, 2, hairLight);
        } else if (dir === 'left') {
            rect(ctx, 3, 0, 10, 2, p.hair);
            rect(ctx, 3, 0, 3, 4, p.hair);
            px(ctx, 4, 0, hairDark);
            px(ctx, 3, 3, hairLight);
        } else {
            rect(ctx, 3, 0, 10, 2, p.hair);
            rect(ctx, 10, 0, 3, 4, p.hair);
            px(ctx, 11, 0, hairDark);
            px(ctx, 12, 3, hairLight);
        }
    }

    // ============================================
    // EYES (more expressive)
    // ============================================
    const eyeColor = p.eyes || '#3A2E28';

    if (dir === 'down') {
        // Left eye
        rect(ctx, 5, 2, 3, 2, '#FFFFFF');
        px(ctx, 6, 2, eyeColor);
        px(ctx, 6, 3, eyeColor);
        px(ctx, 5, 2, '#FFFFFF');

        // Right eye
        rect(ctx, 9, 2, 3, 2, '#FFFFFF');
        px(ctx, 10, 2, eyeColor);
        px(ctx, 10, 3, eyeColor);
        px(ctx, 9, 2, '#FFFFFF');

        // Eyebrows
        rect(ctx, 5, 1, 3, 1, darken(p.hair, 15));
        rect(ctx, 9, 1, 3, 1, darken(p.hair, 15));

        // Mouth
        px(ctx, 7, 4, darken(p.skin, 35));
        px(ctx, 8, 4, darken(p.skin, 35));

        // Nose hint
        px(ctx, 8, 3, skinDark);

        // Special expressions
        if (p.expression === 'smirk') {
            px(ctx, 9, 4, darken(p.skin, 35));
        } else if (p.expression === 'stern') {
            px(ctx, 5, 1, darken(p.hair, 30));
            px(ctx, 11, 1, darken(p.hair, 30));
        }
    } else if (dir === 'left') {
        rect(ctx, 4, 2, 3, 2, '#FFFFFF');
        px(ctx, 4, 2, eyeColor);
        px(ctx, 4, 3, eyeColor);
        px(ctx, 5, 2, '#FFFFFF');
        rect(ctx, 4, 1, 3, 1, darken(p.hair, 15));
        px(ctx, 3, 3, skinDark);
        px(ctx, 5, 4, darken(p.skin, 35));
    } else if (dir === 'right') {
        rect(ctx, 9, 2, 3, 2, '#FFFFFF');
        px(ctx, 11, 2, eyeColor);
        px(ctx, 11, 3, eyeColor);
        px(ctx, 10, 2, '#FFFFFF');
        rect(ctx, 9, 1, 3, 1, darken(p.hair, 15));
        px(ctx, 12, 3, skinDark);
        px(ctx, 10, 4, darken(p.skin, 35));
    }

    // ============================================
    // FACIAL HAIR (mustache, beard)
    // ============================================
    if (p.mustache) {
        if (dir === 'down') {
            rect(ctx, 6, 3, 4, 1, p.mustache);
            px(ctx, 5, 3, p.mustache);
            px(ctx, 10, 3, p.mustache);
        } else if (dir === 'left') {
            rect(ctx, 4, 3, 3, 1, p.mustache);
        } else if (dir === 'right') {
            rect(ctx, 9, 3, 3, 1, p.mustache);
        }
    }
    if (p.beard) {
        if (dir === 'down') {
            rect(ctx, 5, 4, 6, 1, p.beard);
            px(ctx, 6, 4, darken(p.beard, 15));
        } else if (dir === 'left') {
            rect(ctx, 4, 4, 3, 1, p.beard);
        } else if (dir === 'right') {
            rect(ctx, 9, 4, 3, 1, p.beard);
        }
    }

    // ============================================
    // HAT / BERET / CASQUETTE
    // ============================================
    if (p.hat) {
        const hatDark = darken(p.hat, 30);
        const hatLight = lighten(p.hat, 20);

        if (p.hatStyle === 'beret') {
            if (dir === 'down') {
                rect(ctx, 3, 0, 10, 1, p.hat);
                px(ctx, 2, 0, p.hat);
                px(ctx, 13, 0, p.hat);
                px(ctx, 7, 0, hatLight);
                px(ctx, 8, 0, hatLight);
                rect(ctx, 3, 1, 10, 1, hatDark);
            } else if (dir === 'up') {
                rect(ctx, 3, 0, 10, 1, p.hat);
                px(ctx, 2, 0, p.hat);
                rect(ctx, 3, 1, 10, 1, hatDark);
            } else if (dir === 'left') {
                rect(ctx, 2, 0, 10, 1, p.hat);
                px(ctx, 1, 0, p.hat);
                rect(ctx, 2, 1, 10, 1, hatDark);
            } else {
                rect(ctx, 4, 0, 10, 1, p.hat);
                px(ctx, 14, 0, p.hat);
                rect(ctx, 4, 1, 10, 1, hatDark);
            }
        } else if (p.hatStyle === 'casquette') {
            if (dir === 'down') {
                rect(ctx, 3, 0, 10, 1, p.hat);
                rect(ctx, 2, 1, 12, 1, hatDark);
                px(ctx, 5, 0, hatLight);
            } else if (dir === 'up') {
                rect(ctx, 3, 0, 10, 1, p.hat);
                px(ctx, 7, 0, hatLight);
            } else if (dir === 'left') {
                rect(ctx, 2, 0, 10, 1, p.hat);
                rect(ctx, 1, 1, 5, 1, hatDark);
            } else {
                rect(ctx, 4, 0, 10, 1, p.hat);
                rect(ctx, 10, 1, 5, 1, hatDark);
            }
        } else if (p.hatStyle === 'bandana') {
            rect(ctx, 3, 0, 10, 1, p.hat);
            rect(ctx, 3, 1, 10, 1, hatDark);
        } else if (p.hatStyle === 'country') {
            // Wide-brim country hat (like Marcel's reference)
            if (dir === 'down') {
                rect(ctx, 1, 1, 14, 1, p.hat);       // wide brim
                rect(ctx, 3, 0, 10, 1, hatDark);      // crown
                px(ctx, 1, 1, hatDark);
                px(ctx, 14, 1, hatDark);
                px(ctx, 6, 0, hatLight);
                px(ctx, 7, 0, hatLight);
                // hat band
                rect(ctx, 4, 0, 8, 1, darken(p.hat, 50));
                px(ctx, 6, 0, hatLight);
            } else if (dir === 'up') {
                rect(ctx, 1, 1, 14, 1, p.hat);
                rect(ctx, 3, 0, 10, 1, hatDark);
                px(ctx, 7, 0, hatLight);
            } else if (dir === 'left') {
                rect(ctx, 0, 1, 12, 1, p.hat);
                rect(ctx, 3, 0, 8, 1, hatDark);
                px(ctx, 0, 1, hatDark);
                px(ctx, 5, 0, hatLight);
            } else {
                rect(ctx, 4, 1, 12, 1, p.hat);
                rect(ctx, 5, 0, 8, 1, hatDark);
                px(ctx, 15, 1, hatDark);
                px(ctx, 9, 0, hatLight);
            }
        } else {
            rect(ctx, 3, 0, 10, 1, p.hat);
            rect(ctx, 3, 0, 10, 1, hatDark);
            if (dir === 'down' || dir === 'left') {
                rect(ctx, 2, 1, 3, 1, p.hat);
            }
            if (dir === 'down' || dir === 'right') {
                rect(ctx, 11, 1, 3, 1, p.hat);
            }
        }
    }

    // ============================================
    // GLASSES (regular or sunglasses)
    // ============================================
    if (p.sunglasses) {
        if (dir === 'down') {
            rect(ctx, 5, 2, 3, 2, '#1A1A2E');
            rect(ctx, 9, 2, 3, 2, '#1A1A2E');
            px(ctx, 8, 2, '#3A3A4A');
            px(ctx, 5, 2, '#4A4A6A');
            px(ctx, 9, 2, '#4A4A6A');
        } else if (dir === 'left') {
            rect(ctx, 4, 2, 3, 2, '#1A1A2E');
            px(ctx, 4, 2, '#4A4A6A');
        } else if (dir === 'right') {
            rect(ctx, 9, 2, 3, 2, '#1A1A2E');
            px(ctx, 11, 2, '#4A4A6A');
        }
    }
    if (p.glasses) {
        const frame = '#5A4A3A';
        if (dir === 'down') {
            // Left lens frame
            px(ctx, 5, 2, frame); px(ctx, 7, 2, frame);
            px(ctx, 5, 3, frame); px(ctx, 7, 3, frame);
            // Right lens frame
            px(ctx, 9, 2, frame); px(ctx, 11, 2, frame);
            px(ctx, 9, 3, frame); px(ctx, 11, 3, frame);
            // Bridge
            px(ctx, 8, 2, frame);
            // Lens tint
            px(ctx, 6, 2, 'rgba(180,200,220,0.35)');
            px(ctx, 10, 2, 'rgba(180,200,220,0.35)');
        } else if (dir === 'left') {
            px(ctx, 4, 2, frame); px(ctx, 6, 2, frame);
            px(ctx, 4, 3, frame); px(ctx, 6, 3, frame);
            px(ctx, 5, 2, 'rgba(180,200,220,0.35)');
        } else if (dir === 'right') {
            px(ctx, 9, 2, frame); px(ctx, 11, 2, frame);
            px(ctx, 9, 3, frame); px(ctx, 11, 3, frame);
            px(ctx, 10, 2, 'rgba(180,200,220,0.35)');
        }
    }

    // ============================================
    // BODY OUTLINE (warm, subtle, adds readability)
    // ============================================
    const olAlpha = 'rgba(42,30,21,0.35)';
    if (dir === 'down') {
        for (let x = 4; x < 12; x++) px(ctx, x, 0, olAlpha);
        if (!p.hat) px(ctx, 3, 1, olAlpha);
        if (!p.hat) px(ctx, 12, 1, olAlpha);
        px(ctx, 3, 2, olAlpha);
        px(ctx, 3, 3, olAlpha);
        px(ctx, 12, 2, olAlpha);
        px(ctx, 12, 3, olAlpha);
    }
    px(ctx, 1, 7, olAlpha);
    px(ctx, 14, 7, olAlpha);
}

// ================================================================
// CHARACTER PALETTES - Inspired by real petanque legends
// ================================================================
export const PALETTES = {
    player: {
        skin: '#E8B890',
        hair: '#6B4E3A',
        shirt: '#4A7AB0',
        pants: '#B0A080',
        shoes: '#5A4030',
        eyes: '#3A5A80',
        hairStyle: 'default'
    },
    npc_vieux_maitre: {
        skin: '#D4A880',
        hair: '#C8C8C8',
        shirt: '#5A4A70',
        pants: '#6B6050',
        shoes: '#4A3828',
        eyes: '#3A2E28',
        hat: '#2A4A7A',
        hatStyle: 'beret',
        hairStyle: 'bald_top',
        mustache: '#A0A0A0'
    },
    npc_marcel: {
        skin: '#D4A880',
        hair: '#D0C8A0',
        shirt: '#8B2020',
        pants: '#C4B090',
        shoes: '#5A4030',
        eyes: '#4A3020',
        hat: '#C4A870',
        hatStyle: 'country',
        hairStyle: 'default',
        chain: '#D4AA40',
        mustache: '#A09080',
        expression: 'stern'
    },
    npc_rival: {
        skin: '#E8C8A0',
        hair: '#D4B060',
        shirt: '#2D2D44',
        pants: '#1A1A2E',
        shoes: '#1A1510',
        eyes: '#4A7AB0',
        hairStyle: 'spiky',
        sunglasses: false,
        expression: 'smirk'
    },
    npc_fanny: {
        skin: '#E8C0A0',
        hair: '#8B4020',
        shirt: '#6B8E4E',
        pants: '#4A6A3A',
        shoes: '#5A4030',
        eyes: '#4A8040',
        hat: '#F0E8D0',
        hatStyle: 'beret',
        hairStyle: 'default'
    },
    npc_ricardo: {
        skin: '#C49870',
        hair: '#2A1A10',
        shirt: '#1A2A4A',
        pants: '#C4B090',
        shoes: '#4A3828',
        eyes: '#3A2E28',
        glasses: true,
        hairStyle: 'default'
    },
    npc_villager_1: {
        skin: '#E8C8A0',
        hair: '#C4854A',
        shirt: '#6B8E4E',
        pants: '#4A6A3A',
        shoes: '#503A28',
        eyes: '#3A2E28',
        hairStyle: 'default'
    },
    npc_villager_2: {
        skin: '#E8B890',
        hair: '#8B6B4A',
        shirt: '#9B7BB8',
        pants: '#6B5A80',
        shoes: '#3A2E28',
        eyes: '#3A2E28',
        hairStyle: 'default'
    },
    npc_dresseur: {
        skin: '#E8C8A0',
        hair: '#3A2E28',
        shirt: '#E8C840',
        pants: '#4A7AB0',
        shoes: '#3A2E28',
        eyes: '#3A2E28',
        hat: '#C44B3F',
        hatStyle: 'casquette',
        hairStyle: 'default'
    },
    npc_dresseur_2: {
        skin: '#E8C8A0',
        hair: '#C4854A',
        shirt: '#FFFFFF',
        stripes: '#3A5A80',
        pants: '#6B5A80',
        shoes: '#3A2E28',
        eyes: '#3A2E28',
        hairStyle: 'default'
    },
    npc_dresseur_3: {
        skin: '#D4A880',
        hair: '#C0C0C0',
        shirt: '#6B8E4E',
        pants: '#4A6A3A',
        shoes: '#503A28',
        eyes: '#3A2E28',
        hat: '#8B6B4A',
        hatStyle: 'beret',
        hairStyle: 'bald_top',
        mustache: '#909090'
    },
    npc_gate: {
        skin: '#D4A880',
        hair: '#4A3020',
        shirt: '#4A5A6A',
        pants: '#3A4A5A',
        shoes: '#3A2E28',
        eyes: '#3A2E28',
        hat: '#3A4A5A',
        hatStyle: 'casquette',
        hairStyle: 'default'
    },
    npc_marius: {
        skin: '#D4A880',
        hair: '#C8C8C8',
        shirt: '#5A1A3A',
        pants: '#2A2A3A',
        shoes: '#2A1A10',
        eyes: '#3A2E28',
        chain: '#D4AA40',
        beard: '#B0B0B0',
        mustache: '#B0B0B0',
        hairStyle: 'wild',
        expression: 'stern'
    }
};
