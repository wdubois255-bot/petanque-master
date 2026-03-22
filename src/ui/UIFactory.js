import { COLORS, CSS, SHADOW_TEXT, SHADOW_HEAVY, GAME_WIDTH, GAME_HEIGHT, UI, FONT_PIXEL, FONT_BODY } from '../utils/Constants.js';
import { loadSave } from '../utils/SaveManager.js';
import { sfxUIClick } from '../utils/SoundManager.js';

/**
 * UIFactory — centralized UI component creation for Petanque Master.
 * V3: Professional pixel art UI system with wood/parchment panels,
 * bitmap font, proper button states, and scene transitions.
 *
 * All methods are static — no instance needed.
 */
export default class UIFactory {

    // ================================================================
    // SHADOWS (reusable presets)
    // ================================================================

    static SHADOW = SHADOW_TEXT;
    static SHADOW_HEAVY = SHADOW_HEAVY;

    // ================================================================
    // TEXT STYLES
    // ================================================================

    static textStyle(fontSize = '14px', color = CSS.CREME, options = {}) {
        const style = {
            fontFamily: options.pixel ? FONT_PIXEL : FONT_BODY,
            fontSize,
            color,
            shadow: options.heavyShadow ? SHADOW_HEAVY : SHADOW_TEXT
        };
        if (options.align) style.align = options.align;
        if (options.wrapWidth) {
            style.wordWrap = { width: options.wrapWidth };
            style.lineSpacing = options.lineSpacing || 2;
        }
        if (options.backgroundColor) style.backgroundColor = options.backgroundColor;
        if (options.padding) style.padding = options.padding;
        return style;
    }

    // ================================================================
    // TEXT CREATION
    // ================================================================

    static addText(scene, x, y, text, fontSize = '12px', color = CSS.CREME, options = {}) {
        const style = UIFactory.textStyle(fontSize, color, options);
        const t = scene.add.text(x, y, text, style);
        if (options.origin !== undefined) {
            t.setOrigin(options.origin);
        } else {
            t.setOrigin(options.originX ?? 0.5, options.originY ?? 0.5);
        }
        if (options.depth !== undefined) t.setDepth(options.depth);
        if (options.alpha !== undefined) t.setAlpha(options.alpha);
        return t;
    }

    static addTitle(scene, x, y, text, options = {}) {
        return UIFactory.addText(scene, x, y, text, options.fontSize || UI.TITLE_SIZE, CSS.OR, {
            heavyShadow: true,
            pixel: true,
            ...options
        });
    }

    // ================================================================
    // PROCEDURAL TEXTURES (generate once at boot)
    // ================================================================

    /**
     * Generate all procedural UI textures. Call once from BootScene.create().
     */
    static generateUITextures(scene) {
        UIFactory._generateWoodPanel(scene, 'ui_wood_panel', 64, 64, 0x8B6B3D, 0x6B4F2D);
        UIFactory._generateWoodPanel(scene, 'ui_wood_dark', 64, 64, 0x5A4030, 0x3A2E28);
        UIFactory._generateWoodButton(scene, 'ui_wood_btn', 128, 48);
        UIFactory._generateWoodButton(scene, 'ui_wood_btn_hover', 128, 48, true);
        UIFactory._generateParchment(scene, 'ui_parchment', 64, 64);
        UIFactory._generateMetalFrame(scene, 'ui_metal_frame', 64, 64);
    }

    static _generateWoodPanel(scene, key, w, h, baseColor, darkColor) {
        if (scene.textures.exists(key)) return;
        const canvas = scene.textures.createCanvas(key, w, h);
        const ctx = canvas.context;
        ctx.imageSmoothingEnabled = false;

        // Base wood color
        const r = (baseColor >> 16) & 0xFF;
        const g = (baseColor >> 8) & 0xFF;
        const b = baseColor & 0xFF;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, w, h);

        // Wood grain lines
        const dr = (darkColor >> 16) & 0xFF;
        const dg = (darkColor >> 8) & 0xFF;
        const db = darkColor & 0xFF;
        for (let y = 0; y < h; y += 3) {
            const offset = Math.sin(y * 0.3) * 2;
            ctx.fillStyle = `rgba(${dr},${dg},${db},${0.1 + Math.sin(y * 0.7) * 0.08})`;
            ctx.fillRect(0, y, w, 1);
            // Knot-like variation
            if (y % 12 === 0) {
                ctx.fillStyle = `rgba(${dr},${dg},${db},0.15)`;
                ctx.fillRect(Math.floor(offset + w * 0.3), y, 8, 2);
            }
        }

        // Border bevel (light top-left, dark bottom-right)
        // Top edge highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(0, 0, w, 2);
        ctx.fillRect(0, 0, 2, h);
        // Bottom edge shadow
        ctx.fillStyle = `rgba(${dr},${dg},${db},0.4)`;
        ctx.fillRect(0, h - 2, w, 2);
        ctx.fillRect(w - 2, 0, 2, h);

        // Corner rivets
        const rivetPositions = [[4, 4], [w - 6, 4], [4, h - 6], [w - 6, h - 6]];
        for (const [rx, ry] of rivetPositions) {
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(rx, ry, 3, 3);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(rx, ry, 1, 1);
        }

        canvas.refresh();
    }

    static _generateWoodButton(scene, key, w, h, hover = false) {
        if (scene.textures.exists(key)) return;
        const canvas = scene.textures.createCanvas(key, w, h);
        const ctx = canvas.context;
        ctx.imageSmoothingEnabled = false;

        const baseR = hover ? 160 : 139, baseG = hover ? 120 : 107, baseB = hover ? 60 : 61;

        // Button body
        ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
        ctx.fillRect(4, 4, w - 8, h - 8);

        // Wood grain
        for (let y = 4; y < h - 4; y += 2) {
            const alpha = 0.06 + Math.sin(y * 0.5) * 0.04;
            ctx.fillStyle = `rgba(60,40,20,${alpha})`;
            ctx.fillRect(4, y, w - 8, 1);
        }

        // Bevel: top/left light
        ctx.fillStyle = hover ? 'rgba(255,230,150,0.35)' : 'rgba(255,255,255,0.2)';
        ctx.fillRect(4, 4, w - 8, 3);
        ctx.fillRect(4, 4, 3, h - 8);

        // Bevel: bottom/right shadow
        ctx.fillStyle = 'rgba(30,20,10,0.35)';
        ctx.fillRect(4, h - 7, w - 8, 3);
        ctx.fillRect(w - 7, 4, 3, h - 8);

        // Outer border
        ctx.fillStyle = '#4A3828';
        ctx.fillRect(2, 0, w - 4, 2); // top
        ctx.fillRect(2, h - 2, w - 4, 2); // bottom
        ctx.fillRect(0, 2, 2, h - 4); // left
        ctx.fillRect(w - 2, 2, 2, h - 4); // right
        // Rounded corners
        ctx.fillRect(2, 2, 2, 2);
        ctx.fillRect(w - 4, 2, 2, 2);
        ctx.fillRect(2, h - 4, 2, 2);
        ctx.fillRect(w - 4, h - 4, 2, 2);

        // Hover glow
        if (hover) {
            ctx.fillStyle = 'rgba(255,215,0,0.12)';
            ctx.fillRect(4, 4, w - 8, h - 8);
        }

        // Corner nails
        const nails = [[8, 8], [w - 10, 8], [8, h - 10], [w - 10, h - 10]];
        for (const [nx, ny] of nails) {
            ctx.fillStyle = '#A08050';
            ctx.fillRect(nx, ny, 3, 3);
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.fillRect(nx, ny, 1, 1);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(nx + 2, ny + 2, 1, 1);
        }

        canvas.refresh();
    }

    static _generateParchment(scene, key, w, h) {
        if (scene.textures.exists(key)) return;
        const canvas = scene.textures.createCanvas(key, w, h);
        const ctx = canvas.context;
        ctx.imageSmoothingEnabled = false;

        // Aged paper base
        ctx.fillStyle = '#E8D5B0';
        ctx.fillRect(0, 0, w, h);

        // Paper texture noise
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const noise = Math.random() * 20 - 10;
                const r = 232 + noise;
                const g = 213 + noise * 0.8;
                const b = 176 + noise * 0.6;
                ctx.fillStyle = `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},0.3)`;
                ctx.fillRect(x, y, 1, 1);
            }
        }

        // Aged edges (darker border)
        ctx.fillStyle = 'rgba(139,107,61,0.2)';
        ctx.fillRect(0, 0, w, 3);
        ctx.fillRect(0, h - 3, w, 3);
        ctx.fillRect(0, 0, 3, h);
        ctx.fillRect(w - 3, 0, 3, h);

        // Stain spots
        for (let i = 0; i < 3; i++) {
            const sx = Math.floor(Math.random() * (w - 8)) + 4;
            const sy = Math.floor(Math.random() * (h - 8)) + 4;
            ctx.fillStyle = 'rgba(180,150,100,0.15)';
            ctx.fillRect(sx, sy, 4, 4);
        }

        canvas.refresh();
    }

    static _generateMetalFrame(scene, key, w, h) {
        if (scene.textures.exists(key)) return;
        const canvas = scene.textures.createCanvas(key, w, h);
        const ctx = canvas.context;
        ctx.imageSmoothingEnabled = false;

        // Dark metal base
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(0, 0, w, h);

        // Metallic gradient stripes
        for (let y = 0; y < h; y++) {
            const brightness = 74 + Math.sin(y * 0.3) * 8;
            ctx.fillStyle = `rgb(${brightness},${brightness},${brightness + 5})`;
            ctx.fillRect(0, y, w, 1);
        }

        // Light edge
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(0, 0, w, 1);
        ctx.fillRect(0, 0, 1, h);

        // Dark edge
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(0, h - 1, w, 1);
        ctx.fillRect(w - 1, 0, 1, h);

        // Rivets
        const rivets = [[3, 3], [w - 5, 3], [3, h - 5], [w - 5, h - 5]];
        for (const [rx, ry] of rivets) {
            ctx.fillStyle = '#7A7A7A';
            ctx.fillRect(rx, ry, 3, 3);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(rx, ry, 1, 1);
        }

        canvas.refresh();
    }

    // ================================================================
    // PANELS (wood/parchment nine-slice based)
    // ================================================================

    static drawPanel(graphics, x, y, w, h, options = {}) {
        const {
            fillColor = COLORS.OMBRE,
            fillAlpha = 0.9,
            strokeColor = COLORS.OCRE,
            strokeAlpha = 0.5,
            strokeWidth = 2,
            radius = 8,
            noStroke = false
        } = options;

        graphics.fillStyle(fillColor, fillAlpha);
        graphics.fillRoundedRect(x, y, w, h, radius);

        if (!noStroke) {
            graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha);
            graphics.strokeRoundedRect(x, y, w, h, radius);
        }
    }

    static createPanel(scene, x, y, w, h, options = {}) {
        const gfx = scene.add.graphics();
        if (options.depth !== undefined) gfx.setDepth(options.depth);
        UIFactory.drawPanel(gfx, x, y, w, h, options);
        return gfx;
    }

    /**
     * Create a wood-textured panel using NineSlice.
     * Falls back to graphics if texture not available.
     */
    static createWoodPanel(scene, x, y, w, h, options = {}) {
        const { depth = UI.DEPTH_PANEL, alpha = 0.95, textureKey = 'ui_wood_panel' } = options;

        if (scene.textures.exists(textureKey)) {
            const panel = scene.add.nineslice(x + w / 2, y + h / 2, textureKey, 0, w, h, 12, 12, 12, 12)
                .setOrigin(0.5)
                .setDepth(depth)
                .setAlpha(alpha);
            return panel;
        }
        // Fallback
        return UIFactory.createPanel(scene, x, y, w, h, {
            fillColor: 0x6B4F2D, fillAlpha: 0.92,
            strokeColor: 0x8B6B3D, strokeWidth: 3, radius: 6,
            depth
        });
    }

    /**
     * Create a parchment-textured panel.
     */
    static createParchmentPanel(scene, x, y, w, h, options = {}) {
        const { depth = UI.DEPTH_PANEL, alpha = 0.93 } = options;

        if (scene.textures.exists('ui_parchment')) {
            const panel = scene.add.nineslice(x + w / 2, y + h / 2, 'ui_parchment', 0, w, h, 8, 8, 8, 8)
                .setOrigin(0.5)
                .setDepth(depth)
                .setAlpha(alpha);
            return panel;
        }
        return UIFactory.createPanel(scene, x, y, w, h, {
            fillColor: 0xE8D5B0, fillAlpha: 0.9,
            strokeColor: 0x8B6B3D, strokeWidth: 2, radius: 4,
            depth
        });
    }

    // ================================================================
    // WOOD BUTTONS (interactive, with press/hover states)
    // ================================================================

    /**
     * Create a wood-textured button with hover and press states.
     * Returns { container, text, setSelected, destroy }
     */
    static createWoodButton(scene, x, y, w, h, label, options = {}) {
        const {
            fontSize = UI.MENU_SIZE,
            textColor = CSS.CREME,
            selectedTextColor = CSS.OR,
            depth = UI.DEPTH_PANEL + 1,
            onDown = null,
            icon = null, // optional icon texture key
            selected = false
        } = options;

        const container = scene.add.container(x, y).setDepth(depth);

        // Button background (graphics-drawn wood panel)
        const bg = scene.add.graphics();
        UIFactory._drawWoodButtonGraphics(bg, -w / 2, -h / 2, w, h, selected);
        container.add(bg);

        // Icon (if any)
        let iconSprite = null;
        let textX = 0;
        if (icon && scene.textures.exists(icon)) {
            iconSprite = scene.add.sprite(-w / 2 + 20, 0, icon, 0)
                .setScale(0.6).setOrigin(0.5);
            container.add(iconSprite);
            textX = 6; // shift text right to accommodate icon
        }

        // Label text
        const txt = scene.add.text(textX, 0, label, {
            fontFamily: FONT_PIXEL,
            fontSize,
            color: selected ? selectedTextColor : textColor,
            shadow: SHADOW_TEXT,
            align: 'center'
        }).setOrigin(0.5);
        container.add(txt);

        // Interactive zone
        const hitZone = scene.add.zone(0, 0, w, h).setOrigin(0.5).setInteractive({ useHandCursor: true });
        container.add(hitZone);

        // Hover state
        hitZone.on('pointerover', () => {
            UIFactory._drawWoodButtonGraphics(bg, -w / 2, -h / 2, w, h, true);
            txt.setColor(selectedTextColor);
            scene.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 100, ease: 'Sine.easeOut' });
        });
        hitZone.on('pointerout', () => {
            if (!container.getData('selected')) {
                UIFactory._drawWoodButtonGraphics(bg, -w / 2, -h / 2, w, h, false);
                txt.setColor(textColor);
            }
            scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100, ease: 'Sine.easeOut' });
        });

        // Press state
        hitZone.on('pointerdown', () => {
            scene.tweens.add({ targets: container, scaleX: 0.95, scaleY: 0.95, duration: 60, ease: 'Sine.easeIn' });
            if (onDown) {
                sfxUIClick();
                scene.time.delayedCall(80, onDown);
            }
        });
        hitZone.on('pointerup', () => {
            scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100, ease: 'Back.easeOut' });
        });

        container.setData('selected', selected);

        const setSelected = (sel) => {
            container.setData('selected', sel);
            UIFactory._drawWoodButtonGraphics(bg, -w / 2, -h / 2, w, h, sel);
            txt.setColor(sel ? selectedTextColor : textColor);
        };

        return { container, text: txt, bg, hitZone, setSelected, icon: iconSprite };
    }

    static _drawWoodButtonGraphics(gfx, x, y, w, h, selected) {
        gfx.clear();

        // Outer border
        gfx.fillStyle(0x3A2818, 1);
        gfx.fillRoundedRect(x, y, w, h, 6);

        // Button body
        const bodyColor = selected ? 0x9B7B45 : 0x7B5B35;
        gfx.fillStyle(bodyColor, 1);
        gfx.fillRoundedRect(x + 2, y + 2, w - 4, h - 4, 5);

        // Wood grain
        for (let gy = y + 4; gy < y + h - 4; gy += 3) {
            const alpha = 0.06 + Math.sin(gy * 0.4) * 0.04;
            gfx.fillStyle(0x3A2818, alpha);
            gfx.fillRect(x + 4, gy, w - 8, 1);
        }

        // Top bevel (light)
        gfx.fillStyle(selected ? 0xFFE8A0 : 0xC4A060, 0.25);
        gfx.fillRoundedRect(x + 3, y + 3, w - 6, h / 3, { tl: 4, tr: 4, bl: 0, br: 0 });

        // Bottom shadow
        gfx.fillStyle(0x1A1008, 0.2);
        gfx.fillRoundedRect(x + 3, y + h * 0.65, w - 6, h / 3, { tl: 0, tr: 0, bl: 4, br: 4 });

        // Selected golden glow
        if (selected) {
            gfx.lineStyle(2, 0xFFD700, 0.6);
            gfx.strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, 6);
        }

        // Corner nails
        const nailColor = selected ? 0xFFD700 : 0xA08050;
        gfx.fillStyle(nailColor, 0.8);
        gfx.fillCircle(x + 8, y + 8, 2);
        gfx.fillCircle(x + w - 8, y + 8, 2);
        gfx.fillCircle(x + 8, y + h - 8, 2);
        gfx.fillCircle(x + w - 8, y + h - 8, 2);
        // Nail highlights
        gfx.fillStyle(0xFFFFFF, 0.3);
        gfx.fillRect(x + 7, y + 7, 1, 1);
        gfx.fillRect(x + w - 9, y + 7, 1, 1);
        gfx.fillRect(x + 7, y + h - 9, 1, 1);
        gfx.fillRect(x + w - 9, y + h - 9, 1, 1);
    }

    // ================================================================
    // MENU PILLS (legacy — kept for backward compat, wraps wood buttons)
    // ================================================================

    static createMenuPill(scene, x, y, w, h, label, options = {}) {
        const {
            selected = false,
            fontSize = UI.MENU_SIZE,
            textColor = CSS.CREME,
            selectedTextColor = CSS.OR,
            depth = 0
        } = options;

        const btn = UIFactory.createWoodButton(scene, x, y, w, h, label, {
            fontSize, textColor, selectedTextColor, depth, selected
        });
        // Return compatible shape
        return { pill: btn.container, txt: btn.text, setSelected: btn.setSelected, woodBtn: btn };
    }

    // ================================================================
    // STAT BARS (enhanced with pixel art style)
    // ================================================================

    static drawStatBar(graphics, x, y, width, height, value, maxValue, color, options = {}) {
        const { bgColor = COLORS.OMBRE_DEEP, bgAlpha = 0.8, barAlpha = 0.85, radius = 3 } = options;

        // Background
        graphics.fillStyle(bgColor, bgAlpha);
        graphics.fillRoundedRect(x, y, width, height, radius);

        // Fill
        const ratio = Math.max(0, Math.min(1, value / maxValue));
        if (ratio > 0) {
            graphics.fillStyle(color, barAlpha);
            graphics.fillRoundedRect(x, y, width * ratio, height, radius);

            // Highlight on top half
            if (options.highlight !== false) {
                graphics.fillStyle(0xFFFFFF, 0.15);
                graphics.fillRoundedRect(x, y, width * ratio, height / 2, radius);
            }
        }

        // Border
        graphics.lineStyle(1, 0x5A4A38, 0.4);
        graphics.strokeRoundedRect(x, y, width, height, radius);
    }

    // ================================================================
    // BUTTONS (interactive text with background — legacy)
    // ================================================================

    static createButton(scene, x, y, label, options = {}) {
        const {
            fontSize = UI.MENU_SIZE,
            textColor = CSS.CREME,
            bgColor = '#C44B3F',
            padding = { x: 20, y: 10 },
            depth = 0,
            onDown = null,
            onHover = null
        } = options;

        const btn = scene.add.text(x, y, label, {
            fontFamily: FONT_PIXEL,
            fontSize,
            color: textColor,
            backgroundColor: bgColor,
            padding,
            shadow: SHADOW_TEXT
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        if (depth) btn.setDepth(depth);
        if (onDown) btn.on('pointerdown', onDown);
        if (onHover) {
            btn.on('pointerover', () => onHover(btn, true));
            btn.on('pointerout', () => onHover(btn, false));
        }

        return btn;
    }

    // ================================================================
    // CONTROLS HINT (bottom of screen)
    // ================================================================

    static addControlsHint(scene, text, options = {}) {
        const { y, depth = 0 } = options;
        const hintY = y ?? scene.scale.height - 16;
        return UIFactory.addText(scene, scene.scale.width / 2, hintY, text, '12px', CSS.GRIS, {
            depth
        });
    }

    // ================================================================
    // FLOATING TEXT (animated text that rises and fades)
    // ================================================================

    static showFloatingText(scene, x, y, text, color = CSS.OR, options = {}) {
        const { fontSize = '20px', rise = 40, duration = 1200, depth = 95 } = options;

        const floater = scene.add.text(x, y, text, {
            fontFamily: FONT_BODY, fontSize, color,
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(depth);

        scene.tweens.add({
            targets: floater,
            y: y - rise, alpha: 0,
            duration, ease: 'Cubic.easeOut',
            onComplete: () => floater.destroy()
        });

        return floater;
    }

    // ================================================================
    // GALETS DISPLAY (reusable currency indicator)
    // ================================================================

    static createGaletsDisplay(scene, x, y, options = {}) {
        const { depth = 50 } = options;
        const save = loadSave();
        const objects = [];

        // Stone icon (galet = petit caillou rond)
        const coinGfx = scene.add.graphics().setDepth(depth);
        coinGfx.fillStyle(0xC4854A, 1);
        coinGfx.fillCircle(x, y, 8);
        coinGfx.lineStyle(1.5, 0x8B6914, 1);
        coinGfx.strokeCircle(x, y, 8);
        // Highlight
        coinGfx.fillStyle(0xFFFFFF, 0.3);
        coinGfx.fillCircle(x - 2, y - 2, 3);
        objects.push(coinGfx);

        const coinLetter = scene.add.text(x, y, 'G', {
            fontFamily: FONT_BODY, fontSize: '10px', color: '#F5E6D0', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(depth + 1);
        objects.push(coinLetter);

        const galetsText = UIFactory.addText(scene, x + 22, y, `${save.galets}`, UI.MENU_SIZE, CSS.OR, {
            originX: 0, originY: 0.5, heavyShadow: true, depth
        });
        objects.push(galetsText);

        return { objects, galetsText, refresh: () => {
            const s = loadSave();
            galetsText.setText(`${s.galets}`);
        }};
    }

    // ================================================================
    // TAB BAR (horizontal tabs with active underline)
    // ================================================================

    static createTabBar(scene, tabs, activeIndex, y, onChange, options = {}) {
        const { depth = 10 } = options;
        const tabWidth = 140;
        const totalW = tabWidth * tabs.length;
        const startX = (GAME_WIDTH - totalW) / 2;
        const objects = [];

        for (let i = 0; i < tabs.length; i++) {
            const x = startX + i * tabWidth + tabWidth / 2;
            const isActive = i === activeIndex;

            const label = UIFactory.addText(scene, x, y,
                tabs[i].label, UI.BODY_SIZE,
                isActive ? CSS.OR : CSS.GRIS,
                { depth }
            );
            label.setInteractive({ useHandCursor: true });
            label.on('pointerdown', () => {
                sfxUIClick();
                onChange(i);
            });
            objects.push(label);

            if (isActive) {
                const underline = scene.add.graphics().setDepth(depth);
                underline.lineStyle(3, COLORS.OR, 0.9);
                underline.lineBetween(x - 40, y + 14, x + 40, y + 14);
                objects.push(underline);
            }
        }
        return { objects };
    }

    // ================================================================
    // BACK BUTTON (bottom-left, binds ESC)
    // ================================================================

    static addBackButton(scene, targetScene, options = {}) {
        const { x = UI.BACK_X, y = UI.BACK_Y, label = '< RETOUR', depth = 50, onBack = null } = options;

        const btn = UIFactory.addText(scene, x, y, label, UI.HINT_SIZE, CSS.OCRE, {
            originX: 0, originY: 0.5, depth
        });
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setColor(CSS.OR));
        btn.on('pointerout', () => btn.setColor(CSS.OCRE));
        btn.on('pointerdown', () => {
            sfxUIClick();
            if (onBack) onBack();
            else UIFactory.transitionTo(scene, targetScene);
        });

        // ESC keybinding
        scene.input.keyboard.on('keydown-ESC', () => {
            sfxUIClick();
            if (onBack) onBack();
            else UIFactory.transitionTo(scene, targetScene);
        });

        return btn;
    }

    // ================================================================
    // SCENE TRANSITIONS
    // ================================================================

    /**
     * Smooth transition between scenes with fade out + fade in.
     */
    static transitionTo(scene, targetScene, data = {}, options = {}) {
        const { duration = UI.TRANSITION_DURATION, color = 0x1A1510 } = options;

        // Prevent double-transitions
        if (scene._transitioning) return;
        scene._transitioning = true;

        scene.cameras.main.fadeOut(duration / 2, (color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF);
        scene.cameras.main.once('camerafadeoutcomplete', () => {
            scene.scene.start(targetScene, data);
        });
    }

    /**
     * Fade in the current scene (call in create()).
     */
    static fadeIn(scene, options = {}) {
        const { duration = UI.TRANSITION_DURATION } = options;
        scene.cameras.main.fadeIn(duration, 26, 21, 16); // OMBRE_DEEP color
    }

    // ================================================================
    // SCENE BACKGROUND (reusable provencal gradient)
    // ================================================================

    static createDarkBackground(scene, options = {}) {
        const { topColor = 0x1A1510, bottomColor = 0x3A2E28, alpha = 1 } = options;
        const bg = scene.add.graphics();
        bg.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, alpha);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        return bg;
    }

    // ================================================================
    // DECORATIVE ELEMENTS
    // ================================================================

    /**
     * Add decorative golden divider line.
     */
    static addDivider(scene, x, y, width, options = {}) {
        const { depth = UI.DEPTH_PANEL, color = COLORS.OR, alpha = 0.5 } = options;
        const gfx = scene.add.graphics().setDepth(depth);

        // Line with diamond center
        const halfW = width / 2;
        gfx.lineStyle(1, color, alpha);
        gfx.beginPath();
        gfx.moveTo(x - halfW, y);
        gfx.lineTo(x - 6, y);
        gfx.strokePath();
        gfx.beginPath();
        gfx.moveTo(x + 6, y);
        gfx.lineTo(x + halfW, y);
        gfx.strokePath();

        // Diamond
        gfx.fillStyle(color, alpha + 0.2);
        gfx.fillRect(x - 3, y - 3, 6, 6);

        return gfx;
    }

    /**
     * Add particle dust/pollen effect.
     */
    static createDustParticles(scene, count = 20, options = {}) {
        const { minY = 0, maxY = GAME_HEIGHT, depth = 3 } = options;
        const particles = [];

        for (let i = 0; i < count; i++) {
            const p = scene.add.graphics().setDepth(depth);
            const size = Phaser.Math.FloatBetween(1, 2.5);
            const color = Phaser.Math.RND.pick([0xFFE8A0, 0xFFD700, 0xF5E6D0, 0xFFFFFF]);
            p.fillStyle(color, Phaser.Math.FloatBetween(0.15, 0.4));
            p.fillCircle(0, 0, size);
            p.x = Phaser.Math.Between(0, GAME_WIDTH);
            p.y = Phaser.Math.Between(minY, maxY);
            p.setData('speedX', Phaser.Math.FloatBetween(-0.3, 0.3));
            p.setData('speedY', Phaser.Math.FloatBetween(-0.5, -0.1));
            p.setData('drift', Phaser.Math.FloatBetween(0, Math.PI * 2));
            particles.push(p);
        }

        return particles;
    }

    /**
     * Update particle positions (call in update loop).
     */
    static updateParticles(particles, delta) {
        if (!particles) return;
        for (const p of particles) {
            const drift = p.getData('drift') + delta * 0.001;
            p.setData('drift', drift);
            p.x += p.getData('speedX') + Math.sin(drift) * 0.3;
            p.y += p.getData('speedY');
            if (p.y < -10) { p.y = GAME_HEIGHT + 10; p.x = Phaser.Math.Between(0, GAME_WIDTH); }
            if (p.x < -10) p.x = GAME_WIDTH + 10;
            if (p.x > GAME_WIDTH + 10) p.x = -10;
        }
    }

    // ================================================================
    // MODAL OVERLAY (centered panel on dark backdrop)
    // ================================================================

    static createModalOverlay(scene, w, h, onClose, options = {}) {
        const { depth = UI.DEPTH_MODAL, title = '' } = options;

        const backdrop = scene.add.graphics().setDepth(depth);
        backdrop.fillStyle(0x1A1510, 0.65);
        backdrop.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        backdrop.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT),
            Phaser.Geom.Rectangle.Contains
        );

        const px = (GAME_WIDTH - w) / 2;
        const py = (GAME_HEIGHT - h) / 2;

        // Wood panel for modal
        const panel = UIFactory.createWoodPanel(scene, px, py, w, h, { depth: depth + 1 });

        const objects = [backdrop, panel];

        if (title) {
            const titleText = UIFactory.addTitle(scene, GAME_WIDTH / 2, py + 28, title, { depth: depth + 2 });
            objects.push(titleText);
        }

        const close = () => {
            objects.forEach(o => o.destroy());
            if (onClose) onClose();
        };
        backdrop.on('pointerdown', close);

        return { objects, close, panelX: px, panelY: py, panelW: w, panelH: h, depth: depth + 2 };
    }
}
