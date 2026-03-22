import { COLORS, CSS, SHADOW_TEXT, SHADOW_HEAVY, GAME_WIDTH, GAME_HEIGHT, UI } from '../utils/Constants.js';
import { loadSave } from '../utils/SaveManager.js';
import { sfxUIClick } from '../utils/SoundManager.js';

/**
 * UIFactory — centralized UI component creation for Petanque Master.
 * Eliminates ~400 lines of duplicated panel/button/text code across scenes.
 *
 * All methods are static — no instance needed.
 */
export default class UIFactory {

    // ================================================================
    // TEXT STYLES (reusable presets)
    // ================================================================

    static SHADOW = SHADOW_TEXT;
    static SHADOW_HEAVY = SHADOW_HEAVY;

    static textStyle(fontSize = '14px', color = CSS.CREME, options = {}) {
        const style = {
            fontFamily: 'monospace',
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

    static addText(scene, x, y, text, fontSize = '14px', color = CSS.CREME, options = {}) {
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
        return UIFactory.addText(scene, x, y, text, options.fontSize || '28px', CSS.OR, {
            heavyShadow: true,
            ...options
        });
    }

    // ================================================================
    // PANELS (rounded rect backgrounds)
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

    // ================================================================
    // MENU PILLS (selectable menu items)
    // ================================================================

    static createMenuPill(scene, x, y, w, h, label, options = {}) {
        const {
            selected = false,
            radius = 8,
            fontSize = '22px',
            textColor = CSS.CREME,
            selectedTextColor = CSS.OR,
            depth = 0
        } = options;

        const pill = scene.add.graphics();
        if (depth) pill.setDepth(depth);

        if (selected) {
            pill.fillStyle(0x5A4030, 0.85);
            pill.fillRoundedRect(x - w / 2, y - h / 2, w, h, radius);
            pill.lineStyle(2, COLORS.OR, 0.6);
            pill.strokeRoundedRect(x - w / 2, y - h / 2, w, h, radius);
        } else {
            pill.fillStyle(COLORS.OMBRE, 0.75);
            pill.fillRoundedRect(x - w / 2, y - h / 2, w, h, radius);
            pill.lineStyle(1, COLORS.OCRE, 0.3);
            pill.strokeRoundedRect(x - w / 2, y - h / 2, w, h, radius);
        }

        const txt = scene.add.text(x, y, label, {
            fontFamily: 'monospace',
            fontSize,
            color: selected ? selectedTextColor : textColor,
            align: 'center',
            shadow: SHADOW_TEXT
        }).setOrigin(0.5);
        if (depth) txt.setDepth(depth + 1);

        return { pill, txt };
    }

    // ================================================================
    // STAT BARS
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
    }

    // ================================================================
    // BUTTONS (interactive text with background)
    // ================================================================

    static createButton(scene, x, y, label, options = {}) {
        const {
            fontSize = '22px',
            textColor = CSS.CREME,
            bgColor = '#C44B3F',
            padding = { x: 20, y: 10 },
            depth = 0,
            onDown = null,
            onHover = null
        } = options;

        const btn = scene.add.text(x, y, label, {
            fontFamily: 'monospace',
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
            fontFamily: 'monospace', fontSize, color,
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
        objects.push(coinGfx);

        const coinLetter = scene.add.text(x, y, 'G', {
            fontFamily: 'monospace', fontSize: '10px', color: '#F5E6D0', fontStyle: 'bold'
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
        const { x = UI.BACK_X, y = UI.BACK_Y, label = '< RETOUR', depth = 50 } = options;

        const btn = UIFactory.addText(scene, x, y, label, UI.HINT_SIZE, CSS.OCRE, {
            originX: 0, originY: 0.5, depth
        });
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setColor(CSS.OR));
        btn.on('pointerout', () => btn.setColor(CSS.OCRE));
        btn.on('pointerdown', () => {
            sfxUIClick();
            scene.scene.start(targetScene);
        });

        // ESC keybinding (will be cleaned by removeAllListeners in _shutdown)
        scene.input.keyboard.on('keydown-ESC', () => {
            sfxUIClick();
            scene.scene.start(targetScene);
        });

        return btn;
    }

    // ================================================================
    // MODAL OVERLAY (centered panel on dark backdrop)
    // ================================================================

    static createModalOverlay(scene, w, h, onClose, options = {}) {
        const { depth = 100, title = '' } = options;

        // Dark backdrop
        const backdrop = scene.add.graphics().setDepth(depth);
        backdrop.fillStyle(0x1A1510, 0.65);
        backdrop.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        backdrop.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT),
            Phaser.Geom.Rectangle.Contains
        );

        // Panel
        const px = (GAME_WIDTH - w) / 2;
        const py = (GAME_HEIGHT - h) / 2;
        const panel = scene.add.graphics().setDepth(depth + 1);
        UIFactory.drawPanel(panel, px, py, w, h, {
            fillColor: 0x2A2018, fillAlpha: 0.95,
            strokeColor: COLORS.OR, strokeAlpha: 0.5, strokeWidth: 2
        });

        const objects = [backdrop, panel];

        // Title
        if (title) {
            const titleText = UIFactory.addText(scene, GAME_WIDTH / 2, py + 24, title,
                UI.MENU_SIZE, CSS.OR, { depth: depth + 2, heavyShadow: true });
            objects.push(titleText);
        }

        // Close on ESC or backdrop click
        const close = () => {
            objects.forEach(o => o.destroy());
            if (onClose) onClose();
        };
        backdrop.on('pointerdown', close);

        return { objects, close, panelX: px, panelY: py, panelW: w, panelH: h, depth: depth + 2 };
    }
}
