import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CSS, UI, FONT_PIXEL, ROOKIE_MAX_POINTS } from '../utils/Constants.js';
import { loadSave, setSelectedBoule, setSelectedCochonnet, formatPlaytime } from '../utils/SaveManager.js';
import { setSoundScene, sfxUIClick } from '../utils/SoundManager.js';
import UIFactory from '../ui/UIFactory.js';

const SHADOW = UIFactory.SHADOW;

// Layout constants
const LEFT_W = 220;       // Character panel width
const RIGHT_X = LEFT_W;   // Content area start
const TAB_Y = 52;         // Tab bar Y position
const CONTENT_Y = 80;     // Content area Y start
const CONTENT_W = GAME_WIDTH - LEFT_W - 20;

export default class PlayerScene extends Phaser.Scene {
    constructor() {
        super('PlayerScene');
    }

    init() {
        this._activeTab = 0;
        this._contentElements = [];
        this._hoverTooltip = null;
    }

    create() {
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();
        setSoundScene(this);
        UIFactory.fadeIn(this);

        this._save = loadSave();

        this._drawBackground();
        this._drawCharacterPanel();
        this._drawTabBar();
        this._drawTabContent();

        // Galets display
        UIFactory.createGaletsDisplay(this, UI.GALETS_X, UI.GALETS_Y);

        // Back button
        UIFactory.addBackButton(this, 'TitleScene');

        // Controls hint
        UIFactory.addControlsHint(this, 'Clic  Equiper / Selectionner     Echap  Retour');

        // Keyboard tab switching
        this.input.keyboard.on('keydown-ONE', () => this._switchTab(0));
        this.input.keyboard.on('keydown-TWO', () => this._switchTab(1));
        this.input.keyboard.on('keydown-THREE', () => this._switchTab(2));

        this.events.on('shutdown', this._shutdown, this);
    }

    _shutdown() {
        this.input.keyboard.removeAllListeners();
        this.tweens.killAll();
    }

    // ================================================================
    // BACKGROUND
    // ================================================================
    _drawBackground() {
        const bg = this.add.graphics();
        // Warm dark gradient
        bg.fillGradientStyle(0x1A1510, 0x1A1510, 0x2A2520, 0x2A2520, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Subtle texture dots
        for (let i = 0; i < 80; i++) {
            const gx = Phaser.Math.Between(0, GAME_WIDTH);
            const gy = Phaser.Math.Between(0, GAME_HEIGHT);
            bg.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.01, 0.03));
            bg.fillRect(gx, gy, 1, 1);
        }

        // Left panel background (warm darker area for character)
        const lpg = this.add.graphics().setDepth(0);
        lpg.fillStyle(0x2A2018, 0.6);
        lpg.fillRect(0, 0, LEFT_W, GAME_HEIGHT);
        // Separator line
        lpg.lineStyle(1, 0xD4A574, 0.3);
        lpg.lineBetween(LEFT_W, 40, LEFT_W, GAME_HEIGHT - 40);
    }

    // ================================================================
    // LEFT: CHARACTER PANEL (always visible)
    // ================================================================
    _drawCharacterPanel() {
        const save = this._save;
        const rookie = save.rookie;
        const stats = rookie.stats;
        const cx = LEFT_W / 2;

        // Character sprite (large, centered)
        if (this.textures.exists('rookie_animated')) {
            this._charSprite = this.add.sprite(cx, 100, 'rookie_animated', 0)
                .setScale(1.8).setOrigin(0.5).setDepth(2);

            // Idle breathing animation
            this.tweens.add({
                targets: this._charSprite,
                scaleY: 1.84, scaleX: 1.76,
                duration: 2500, yoyo: true, repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Character name
        this.add.text(cx, 170, 'LE ROOKIE', {
            fontFamily: FONT_PIXEL, fontSize: '14px',
            color: CSS.OR, shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(2);

        // Archetype badge
        const badgeBg = this.add.graphics().setDepth(2);
        badgeBg.fillStyle(0x3A2E28, 0.8);
        badgeBg.fillRoundedRect(cx - 40, 186, 80, 18, 9);
        badgeBg.lineStyle(1, 0xD4A574, 0.5);
        badgeBg.strokeRoundedRect(cx - 40, 186, 80, 18, 9);

        this.add.text(cx, 195, 'Adaptable', {
            fontFamily: 'monospace', fontSize: '9px',
            color: CSS.OCRE, shadow: SHADOW
        }).setOrigin(0.5).setDepth(3);

        // ===== STAT BARS (compact, clean) =====
        const barDefs = [
            { key: 'precision', label: 'PRE', color: COLORS.STAT_PRECISION, icon: '\u25CE' },
            { key: 'puissance', label: 'PUI', color: COLORS.STAT_PUISSANCE, icon: '\u25B2' },
            { key: 'effet', label: 'EFF', color: COLORS.STAT_EFFET, icon: '\u25C6' },
            { key: 'sang_froid', label: 'S-F', color: COLORS.STAT_ADAPTABILITE, icon: '\u25A0' }
        ];

        const gfx = this.add.graphics().setDepth(2);
        const barStartY = 218;
        const barW = 100;
        const barH = 8;
        const barX = 55;

        // Total stats display
        const totalPts = rookie.totalPoints;
        this.add.text(cx, barStartY - 10, `${totalPts}/${ROOKIE_MAX_POINTS} pts`, {
            fontFamily: 'monospace', fontSize: '8px',
            color: CSS.OCRE, shadow: SHADOW
        }).setOrigin(0.5).setDepth(2);

        barDefs.forEach((def, i) => {
            const by = barStartY + 4 + i * 22;
            const val = stats[def.key] || 0;

            // Label
            this.add.text(barX - 26, by + 1, def.label, {
                fontFamily: 'monospace', fontSize: '8px',
                color: CSS.OCRE, shadow: SHADOW
            }).setOrigin(0, 0.5).setDepth(2);

            // Bar background
            gfx.fillStyle(0x1A1510, 0.6);
            gfx.fillRoundedRect(barX, by - 4, barW, barH, 2);

            // Bar fill
            const fillW = (val / 10) * barW;
            gfx.fillStyle(def.color, 0.9);
            gfx.fillRoundedRect(barX, by - 4, fillW, barH, 2);

            // Highlight
            gfx.fillStyle(0xFFFFFF, 0.15);
            gfx.fillRect(barX + 1, by - 3, fillW - 2, barH / 2 - 1);

            // Value number
            this.add.text(barX + barW + 6, by + 1, `${val}`, {
                fontFamily: 'monospace', fontSize: '9px',
                color: CSS.CREME, shadow: SHADOW
            }).setOrigin(0, 0.5).setDepth(2);
        });

        // ===== XP PROGRESS BAR =====
        const xpY = barStartY + barDefs.length * 22 + 12;
        const thresholds = [
            { pts: 18, name: "L'Instinct" },
            { pts: 26, name: 'Determination' },
            { pts: 34, name: 'Le Naturel' }
        ];

        let nextT = thresholds.find(t => totalPts < t.pts);
        if (nextT) {
            const prevPts = thresholds.indexOf(nextT) === 0 ? 14 : thresholds[thresholds.indexOf(nextT) - 1].pts;
            const progress = Math.min(1, (totalPts - prevPts) / (nextT.pts - prevPts));

            this.add.text(cx, xpY, `Prochaine : ${nextT.name}`, {
                fontFamily: 'monospace', fontSize: '7px',
                color: '#87CEEB', shadow: SHADOW
            }).setOrigin(0.5).setDepth(2);

            // XP bar
            gfx.fillStyle(0x1A1510, 0.6);
            gfx.fillRoundedRect(25, xpY + 10, LEFT_W - 50, 6, 3);
            gfx.fillStyle(COLORS.OR, 0.8);
            gfx.fillRoundedRect(25, xpY + 10, (LEFT_W - 50) * progress, 6, 3);

            this.add.text(cx, xpY + 22, `${totalPts}/${nextT.pts}`, {
                fontFamily: 'monospace', fontSize: '7px',
                color: CSS.OCRE, shadow: SHADOW
            }).setOrigin(0.5).setDepth(2);
        } else {
            this.add.text(cx, xpY + 5, 'MAX LEVEL', {
                fontFamily: FONT_PIXEL, fontSize: '8px',
                color: CSS.OR, shadow: SHADOW
            }).setOrigin(0.5).setDepth(2);
        }

        // ===== ABILITIES (compact icons) =====
        const abY = xpY + 36;
        const abIcons = [
            { key: 'instinct', name: "L'Instinct", icon: '\u26A1', color: '#FFD700' },
            { key: 'determination', name: 'Determin.', icon: '\uD83D\uDCAA', color: '#FF8844' },
            { key: 'naturel', name: 'Naturel', icon: '\u2728', color: '#87CEEB' }
        ];

        const abSpacing = (LEFT_W - 20) / 3;
        abIcons.forEach((ab, i) => {
            const ax = 10 + abSpacing * i + abSpacing / 2;
            const unlocked = rookie.abilitiesUnlocked.includes(ab.key);

            // Circle background
            gfx.fillStyle(unlocked ? 0x3A5A2A : 0x2A2018, 0.8);
            gfx.fillCircle(ax, abY, 12);
            gfx.lineStyle(1, unlocked ? parseInt(ab.color.replace('#', ''), 16) : 0x4A4A3A, 0.7);
            gfx.strokeCircle(ax, abY, 12);

            // Icon
            this.add.text(ax, abY, ab.icon, {
                fontSize: '10px', color: unlocked ? ab.color : '#4A4A3A'
            }).setOrigin(0.5).setDepth(3);

            // Label below
            this.add.text(ax, abY + 17, ab.name, {
                fontFamily: 'monospace', fontSize: '6px',
                color: unlocked ? CSS.CREME : '#4A4A3A', shadow: SHADOW
            }).setOrigin(0.5).setDepth(2);
        });

        // ===== EQUIPPED BOULE (bottom of panel) =====
        this._equippedElements = [];
        this._refreshEquippedDisplay();
    }

    // Refreshable equipped boule/cochonnet display (bottom-left panel)
    _refreshEquippedDisplay() {
        // Clear previous
        this._equippedElements.forEach(el => { try { el.destroy(); } catch (_) {} });
        this._equippedElements = [];

        const eqY = GAME_HEIGHT - 68;
        const boulesData = this.cache.json.get('boules');
        const equipped = boulesData?.sets?.find(s => s.id === this._save.selectedBoule);

        if (equipped) {
            const sprKey = `ball_${this._save.selectedBoule}`;
            if (this.textures.exists(sprKey)) {
                this._equippedElements.push(
                    this.add.image(30, eqY, sprKey).setScale(0.7).setOrigin(0.5).setDepth(2)
                );
            }
            this._equippedElements.push(
                this.add.text(50, eqY - 6, equipped.name, {
                    fontFamily: 'monospace', fontSize: '9px',
                    color: CSS.CREME, shadow: SHADOW
                }).setOrigin(0, 0.5).setDepth(2)
            );

            const bonusTxt = equipped.bonus
                ? equipped.bonus.replace('friction_x', 'Friction x').replace('knockback_x', 'Impact x').replace('retro_x', 'Retro x').replace('restitution_x', 'Rebond x')
                : 'Standard';
            this._equippedElements.push(
                this.add.text(50, eqY + 7, bonusTxt, {
                    fontFamily: 'monospace', fontSize: '7px',
                    color: equipped.bonus ? '#87CEEB' : CSS.GRIS, shadow: SHADOW
                }).setOrigin(0, 0.5).setDepth(2)
            );
        }

        // Cochonnet mini display
        const cochId = this._save.selectedCochonnet || 'classique';
        const cochSprKey = cochId === 'classique' ? 'ball_cochonnet' : `ball_cochonnet_${cochId}`;
        if (this.textures.exists(cochSprKey)) {
            this._equippedElements.push(
                this.add.image(LEFT_W - 30, eqY, cochSprKey).setScale(0.5).setOrigin(0.5).setDepth(2)
            );
        }
    }

    // Called when player equips a boule or cochonnet — no scene restart
    _onEquipChange() {
        this._save = loadSave();
        this._refreshEquippedDisplay();
        this._clearContent();
        this._drawTabContent();
    }

    // ================================================================
    // TAB BAR
    // ================================================================
    _drawTabBar() {
        const tabs = [
            { label: '[1] STATS', key: 'stats' },
            { label: '[2] EQUIPEMENT', key: 'equip' },
            { label: '[3] CARRIERE', key: 'career' }
        ];

        this._tabButtons = [];
        const tabW = CONTENT_W / tabs.length;
        const tabH = 24;

        tabs.forEach((tab, i) => {
            const tx = RIGHT_X + 10 + i * tabW + tabW / 2;
            const isActive = i === this._activeTab;

            // Tab background
            const tbg = this.add.graphics().setDepth(5);
            this._drawTabBg(tbg, tx - tabW / 2 + 2, TAB_Y, tabW - 4, tabH, isActive);

            // Tab label
            const txt = this.add.text(tx, TAB_Y + tabH / 2, tab.label, {
                fontFamily: FONT_PIXEL, fontSize: '8px',
                color: isActive ? CSS.OR : CSS.GRIS,
                shadow: SHADOW
            }).setOrigin(0.5).setDepth(6);

            // Hit zone
            const zone = this.add.zone(tx, TAB_Y + tabH / 2, tabW - 4, tabH)
                .setOrigin(0.5).setInteractive({ useHandCursor: true });
            zone.on('pointerdown', () => this._switchTab(i));
            zone.on('pointerover', () => {
                if (i !== this._activeTab) txt.setColor(CSS.OCRE);
            });
            zone.on('pointerout', () => {
                if (i !== this._activeTab) txt.setColor(CSS.GRIS);
            });

            this._tabButtons.push({ bg: tbg, txt, zone, tab });
        });
    }

    _drawTabBg(g, x, y, w, h, active) {
        g.clear();
        if (active) {
            g.fillStyle(0x3A2E28, 0.9);
            g.fillRoundedRect(x, y, w, h, { tl: 6, tr: 6, bl: 0, br: 0 });
            g.lineStyle(1, 0xD4A574, 0.6);
            g.strokeRoundedRect(x, y, w, h, { tl: 6, tr: 6, bl: 0, br: 0 });
            // Gold underline
            g.fillStyle(0xFFD700, 0.8);
            g.fillRect(x + 8, y + h - 2, w - 16, 2);
        } else {
            g.fillStyle(0x2A2018, 0.5);
            g.fillRoundedRect(x, y, w, h, { tl: 6, tr: 6, bl: 0, br: 0 });
        }
    }

    _switchTab(index) {
        if (index === this._activeTab) return;
        sfxUIClick();
        this._activeTab = index;

        // Update tab visuals
        this._tabButtons.forEach((tb, i) => {
            const isActive = i === index;
            this._drawTabBg(tb.bg, RIGHT_X + 10 + i * (CONTENT_W / this._tabButtons.length) + 2, TAB_Y,
                CONTENT_W / this._tabButtons.length - 4, 24, isActive);
            tb.txt.setColor(isActive ? CSS.OR : CSS.GRIS);
        });

        // Redraw content with slide animation
        this._clearContent();
        this._drawTabContent();
    }

    // ================================================================
    // CONTENT AREA
    // ================================================================
    _clearContent() {
        this._contentElements.forEach(el => {
            if (el && typeof el.destroy === 'function') {
                try { el.destroy(); } catch (_) {}
            }
        });
        this._contentElements = [];
    }

    _drawTabContent() {
        switch (this._activeTab) {
            case 0: this._drawStatsTab(); break;
            case 1: this._drawEquipTab(); break;
            case 2: this._drawCareerTab(); break;
        }
    }

    _addContent(el) {
        this._contentElements.push(el);
        // Fade in animation
        if (el && typeof el.setAlpha === 'function') {
            el.setAlpha(0);
            this.tweens.add({ targets: el, alpha: 1, duration: 200, ease: 'Sine.easeOut' });
        }
        return el;
    }

    // ================================================================
    // TAB 1: STATS (detailed character info)
    // ================================================================
    _drawStatsTab() {
        const save = this._save;
        const rookie = save.rookie;
        const stats = rookie.stats;
        const x = RIGHT_X + 20;
        const y = CONTENT_Y + 6;

        // Section title
        this._addContent(this.add.text(x, y, 'STATISTIQUES DETAILLEES', {
            fontFamily: FONT_PIXEL, fontSize: '10px', color: CSS.OR, shadow: SHADOW
        }).setDepth(5));

        // Divider
        const div = this.add.graphics().setDepth(5);
        div.lineStyle(1, 0xD4A574, 0.4);
        div.lineBetween(x, y + 16, x + CONTENT_W - 40, y + 16);
        this._addContent(div);

        // Detailed stat cards
        const barDefs = [
            { key: 'precision', label: 'PRECISION', color: COLORS.STAT_PRECISION,
                desc: (v) => v >= 8 ? 'Chirurgical — quasi aucune dispersion' : v >= 5 ? 'Correct — dispersion moderee' : 'Imprecis — la boule devie souvent' },
            { key: 'puissance', label: 'PUISSANCE', color: COLORS.STAT_PUISSANCE,
                desc: (v) => v >= 8 ? 'Devastateur — portee maximale' : v >= 5 ? 'Normal — portee standard' : 'Faible — portee limitee' },
            { key: 'effet', label: 'EFFET', color: COLORS.STAT_EFFET,
                desc: (v) => v >= 8 ? 'Maitre retro — controle total du spin' : v >= 5 ? 'Bon spin — retro efficace' : 'Peu de retro — trajectoires droites' },
            { key: 'sang_froid', label: 'SANG-FROID', color: COLORS.STAT_ADAPTABILITE,
                desc: (v) => v >= 8 ? 'Imperturbable — zero tremblement' : v >= 5 ? 'Stable — leger tremblement sous pression' : 'Nerveux — tremble quand le score est serre' }
        ];

        const cardW = (CONTENT_W - 60) / 2;
        const cardH = 56;

        barDefs.forEach((def, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const cx = x + col * (cardW + 15);
            const cy = y + 24 + row * (cardH + 10);
            const val = stats[def.key] || 0;

            // Card background
            const cg = this.add.graphics().setDepth(5);
            cg.fillStyle(0x2A2018, 0.7);
            cg.fillRoundedRect(cx, cy, cardW, cardH, 4);
            cg.lineStyle(1, def.color, 0.3);
            cg.strokeRoundedRect(cx, cy, cardW, cardH, 4);
            this._addContent(cg);

            // Stat label + value
            this._addContent(this.add.text(cx + 8, cy + 8, def.label, {
                fontFamily: 'monospace', fontSize: '9px', color: CSS.OCRE, shadow: SHADOW
            }).setDepth(6));

            this._addContent(this.add.text(cx + cardW - 8, cy + 8, `${val}/10`, {
                fontFamily: FONT_PIXEL, fontSize: '10px', color: CSS.CREME, shadow: SHADOW
            }).setOrigin(1, 0).setDepth(6));

            // Bar
            const barW = cardW - 16;
            const barX = cx + 8;
            const barY = cy + 24;
            cg.fillStyle(0x1A1510, 0.6);
            cg.fillRoundedRect(barX, barY, barW, 8, 2);
            const fillW = (val / 10) * barW;
            cg.fillStyle(def.color, 0.9);
            cg.fillRoundedRect(barX, barY, fillW, 8, 2);
            cg.fillStyle(0xFFFFFF, 0.15);
            cg.fillRect(barX + 1, barY + 1, fillW - 2, 3);

            // Description
            this._addContent(this.add.text(cx + 8, cy + 36, def.desc(val), {
                fontFamily: 'monospace', fontSize: '7px', color: CSS.GRIS, shadow: SHADOW,
                wordWrap: { width: cardW - 16 }
            }).setDepth(6));
        });

        // Bottom section: Abilities unlocked
        const abY = y + 24 + 2 * (cardH + 10) + 10;
        this._addContent(this.add.text(x, abY, 'CAPACITES SPECIALES', {
            fontFamily: FONT_PIXEL, fontSize: '9px', color: CSS.OR, shadow: SHADOW
        }).setDepth(5));

        const abilities = [
            { key: 'instinct', name: "L'Instinct", pts: 18, desc: 'Slow-mo 2s sur chaque tir', icon: '\u26A1', color: '#FFD700' },
            { key: 'determination', name: 'Determination', pts: 26, desc: '-50% wobble apres une defaite', icon: '\uD83D\uDCAA', color: '#FF8844' },
            { key: 'naturel', name: 'Le Naturel', pts: 34, desc: 'Un tir parfait par match', icon: '\u2728', color: '#87CEEB' }
        ];

        abilities.forEach((ab, i) => {
            const ax = x + i * ((CONTENT_W - 40) / 3);
            const unlocked = rookie.abilitiesUnlocked.includes(ab.key);

            const abg = this.add.graphics().setDepth(5);
            abg.fillStyle(unlocked ? 0x2A3A1A : 0x1A1510, 0.7);
            abg.fillRoundedRect(ax, abY + 16, (CONTENT_W - 60) / 3, 50, 4);
            if (unlocked) {
                abg.lineStyle(1, parseInt(ab.color.replace('#', ''), 16), 0.5);
                abg.strokeRoundedRect(ax, abY + 16, (CONTENT_W - 60) / 3, 50, 4);
            }
            this._addContent(abg);

            this._addContent(this.add.text(ax + 8, abY + 24, `${ab.icon} ${ab.name}`, {
                fontFamily: 'monospace', fontSize: '8px',
                color: unlocked ? ab.color : '#4A4A3A', shadow: SHADOW
            }).setDepth(6));

            this._addContent(this.add.text(ax + 8, abY + 38, unlocked ? ab.desc : `Deverrouille a ${ab.pts} pts`, {
                fontFamily: 'monospace', fontSize: '7px',
                color: unlocked ? CSS.CREME : '#3A3A2A', shadow: SHADOW,
                wordWrap: { width: (CONTENT_W - 80) / 3 }
            }).setDepth(6));
        });
    }

    // ================================================================
    // TAB 2: EQUIPEMENT (boules, cochonnets)
    // ================================================================
    _drawEquipTab() {
        const save = this._save;
        const x = RIGHT_X + 20;
        const y = CONTENT_Y + 6;
        const boulesData = this.cache.json.get('boules');

        // ===== BOULES SECTION =====
        this._addContent(this.add.text(x, y, 'MES BOULES', {
            fontFamily: FONT_PIXEL, fontSize: '10px', color: CSS.OR, shadow: SHADOW
        }).setDepth(5));

        const normBoule = (id) => id.replace(/^boule_/, '');
        const allBouleIds = ['acier'];
        const addBoule = (raw) => { const id = normBoule(raw); if (!allBouleIds.includes(id)) allBouleIds.push(id); };
        save.purchases.filter(p => p.startsWith('boule_') || p === 'acier').forEach(addBoule);
        (save.unlockedBoules || []).forEach(addBoule);

        const itemSize = 52;
        const itemGap = 8;
        const cols = 5;
        const gridX = x;
        const gridY = y + 18;

        allBouleIds.forEach((id, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const bx = gridX + col * (itemSize + itemGap) + itemSize / 2;
            const by = gridY + row * (itemSize + 20) + itemSize / 2;
            const isEquipped = save.selectedBoule === id;

            // Card background
            const cg = this.add.graphics().setDepth(5);
            cg.fillStyle(isEquipped ? 0x3A4A2A : 0x2A2018, 0.7);
            cg.fillRoundedRect(bx - itemSize / 2, by - itemSize / 2, itemSize, itemSize + 14, 4);
            if (isEquipped) {
                cg.lineStyle(2, COLORS.OR, 0.8);
                cg.strokeRoundedRect(bx - itemSize / 2, by - itemSize / 2, itemSize, itemSize + 14, 4);
            }
            this._addContent(cg);

            // Sprite
            const sprKey = `ball_${id}`;
            if (this.textures.exists(sprKey)) {
                const img = this.add.image(bx, by - 2, sprKey).setScale(0.65).setOrigin(0.5).setDepth(6)
                    .setInteractive({ useHandCursor: true });

                img.on('pointerdown', () => {
                    setSelectedBoule(id);
                    sfxUIClick();
                    this._onEquipChange();
                });

                // Hover effect
                img.on('pointerover', () => {
                    this.tweens.add({ targets: img, scaleX: 0.75, scaleY: 0.75, duration: 100 });
                    this._showBouleTooltip(bx, by - itemSize / 2 - 10, id, boulesData);
                });
                img.on('pointerout', () => {
                    this.tweens.add({ targets: img, scaleX: 0.65, scaleY: 0.65, duration: 100 });
                    this._hideTooltip();
                });

                this._addContent(img);
            }

            // Name
            const displayName = id.charAt(0).toUpperCase() + id.slice(1).replace('_retro', ' R');
            this._addContent(this.add.text(bx, by + itemSize / 2 + 2, displayName, {
                fontFamily: 'monospace', fontSize: '7px',
                color: isEquipped ? CSS.OR : CSS.GRIS, shadow: SHADOW
            }).setOrigin(0.5).setDepth(6));

            // Equipped badge
            if (isEquipped) {
                this._addContent(this.add.text(bx + itemSize / 2 - 4, by - itemSize / 2 + 2, '\u2713', {
                    fontSize: '10px', color: '#44CC44'
                }).setOrigin(0.5).setDepth(7));
            }
        });

        // ===== COCHONNETS SECTION =====
        const cochY = gridY + Math.ceil(allBouleIds.length / cols) * (itemSize + 20) + 16;

        this._addContent(this.add.text(x, cochY, 'MES COCHONNETS', {
            fontFamily: FONT_PIXEL, fontSize: '10px', color: CSS.OR, shadow: SHADOW
        }).setDepth(5));

        const normCoch = (id) => id.replace(/^cochonnet_/, '');
        const allCochIds = ['classique'];
        const addCoch = (raw) => { const id = normCoch(raw); if (!allCochIds.includes(id)) allCochIds.push(id); };
        save.purchases.filter(p => p.startsWith('cochonnet_')).forEach(addCoch);
        (save.unlockedCochonnets || []).forEach(addCoch);

        const cochGridY = cochY + 18;

        allCochIds.forEach((id, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = gridX + col * (itemSize + itemGap) + itemSize / 2;
            const cy = cochGridY + row * (itemSize + 20) + itemSize / 2;
            const isEquipped = save.selectedCochonnet === id;

            // Card
            const cg = this.add.graphics().setDepth(5);
            cg.fillStyle(isEquipped ? 0x3A4A2A : 0x2A2018, 0.7);
            cg.fillRoundedRect(cx - itemSize / 2, cy - itemSize / 2, itemSize, itemSize + 14, 4);
            if (isEquipped) {
                cg.lineStyle(2, COLORS.OR, 0.8);
                cg.strokeRoundedRect(cx - itemSize / 2, cy - itemSize / 2, itemSize, itemSize + 14, 4);
            }
            this._addContent(cg);

            const sprKey = id === 'classique' ? 'ball_cochonnet' : `ball_cochonnet_${id}`;
            if (this.textures.exists(sprKey)) {
                const img = this.add.image(cx, cy - 2, sprKey).setScale(0.65).setOrigin(0.5).setDepth(6)
                    .setInteractive({ useHandCursor: true });
                img.on('pointerdown', () => { setSelectedCochonnet(id); sfxUIClick(); this._onEquipChange(); });
                img.on('pointerover', () => this.tweens.add({ targets: img, scaleX: 0.75, scaleY: 0.75, duration: 100 }));
                img.on('pointerout', () => this.tweens.add({ targets: img, scaleX: 0.65, scaleY: 0.65, duration: 100 }));
                this._addContent(img);
            }

            const displayName = id.charAt(0).toUpperCase() + id.slice(1);
            this._addContent(this.add.text(cx, cy + itemSize / 2 + 2, displayName, {
                fontFamily: 'monospace', fontSize: '7px',
                color: isEquipped ? CSS.OR : CSS.GRIS, shadow: SHADOW
            }).setOrigin(0.5).setDepth(6));

            if (isEquipped) {
                this._addContent(this.add.text(cx + itemSize / 2 - 4, cy - itemSize / 2 + 2, '\u2713', {
                    fontSize: '10px', color: '#44CC44'
                }).setOrigin(0.5).setDepth(7));
            }
        });
    }

    // ================================================================
    // TAB 3: CARRIERE (career stats, unlocked characters)
    // ================================================================
    _drawCareerTab() {
        const save = this._save;
        const x = RIGHT_X + 20;
        const y = CONTENT_Y + 6;

        // ===== MATCH STATS =====
        this._addContent(this.add.text(x, y, 'BILAN DES MATCHS', {
            fontFamily: FONT_PIXEL, fontSize: '10px', color: CSS.OR, shadow: SHADOW
        }).setDepth(5));

        const totalMatches = save.totalWins + save.totalLosses;
        const winRate = totalMatches > 0 ? Math.round(save.totalWins / totalMatches * 100) : 0;

        // Win/Loss cards
        const cardW = 130;
        const cardH = 70;
        const statsCards = [
            { label: 'VICTOIRES', value: `${save.totalWins}`, sub: `${winRate}%`, color: 0x44CC44 },
            { label: 'DEFAITES', value: `${save.totalLosses}`, sub: `${100 - winRate}%`, color: 0xCC4444 },
            { label: 'CARREAUX', value: `${save.totalCarreaux || 0}`, sub: 'Tirs parfaits', color: 0xFFD700 },
            { label: 'TEMPS', value: formatPlaytime(save.playtime || 0), sub: 'de jeu total', color: 0x87CEEB }
        ];

        statsCards.forEach((card, i) => {
            const col = i % 4;
            const cx = x + col * (cardW + 8);
            const cy = y + 18;

            const cg = this.add.graphics().setDepth(5);
            cg.fillStyle(0x2A2018, 0.7);
            cg.fillRoundedRect(cx, cy, cardW, cardH, 6);
            cg.lineStyle(1, card.color, 0.3);
            cg.strokeRoundedRect(cx, cy, cardW, cardH, 6);
            // Top accent bar
            cg.fillStyle(card.color, 0.6);
            cg.fillRect(cx + 4, cy + 2, cardW - 8, 3);
            this._addContent(cg);

            this._addContent(this.add.text(cx + cardW / 2, cy + 20, card.label, {
                fontFamily: 'monospace', fontSize: '7px', color: CSS.OCRE, shadow: SHADOW
            }).setOrigin(0.5).setDepth(6));

            this._addContent(this.add.text(cx + cardW / 2, cy + 38, card.value, {
                fontFamily: FONT_PIXEL, fontSize: '14px', color: CSS.CREME, shadow: SHADOW
            }).setOrigin(0.5).setDepth(6));

            this._addContent(this.add.text(cx + cardW / 2, cy + 56, card.sub, {
                fontFamily: 'monospace', fontSize: '7px', color: CSS.GRIS, shadow: SHADOW
            }).setOrigin(0.5).setDepth(6));
        });

        // ===== ARCADE PROGRESS =====
        const arcY = y + 100;
        this._addContent(this.add.text(x, arcY, 'PROGRESSION ARCADE', {
            fontFamily: FONT_PIXEL, fontSize: '10px', color: CSS.OR, shadow: SHADOW
        }).setDepth(5));

        const arcadeMatches = this.cache.json.get('arcade')?.matches || [];
        const arcProgress = save.arcadeProgress || 0;

        // Progress dots
        arcadeMatches.forEach((match, i) => {
            const dx = x + i * 110;
            const dy = arcY + 22;
            const done = i < arcProgress;
            const current = i === arcProgress;

            const ag = this.add.graphics().setDepth(5);

            // Circle
            ag.fillStyle(done ? 0x44CC44 : current ? 0xFFD700 : 0x2A2018, done ? 0.8 : 0.5);
            ag.fillCircle(dx + 14, dy + 14, 14);
            ag.lineStyle(2, done ? 0x44CC44 : current ? 0xFFD700 : 0x4A4A3A, 0.6);
            ag.strokeCircle(dx + 14, dy + 14, 14);

            // Connector line
            if (i < arcadeMatches.length - 1) {
                ag.lineStyle(2, done ? 0x44CC44 : 0x3A3A2A, 0.4);
                ag.lineBetween(dx + 30, dy + 14, dx + 110, dy + 14);
            }
            this._addContent(ag);

            // Round number
            this._addContent(this.add.text(dx + 14, dy + 14, `${i + 1}`, {
                fontFamily: FONT_PIXEL, fontSize: '9px',
                color: done ? '#FFFFFF' : current ? CSS.OR : '#4A4A3A', shadow: SHADOW
            }).setOrigin(0.5).setDepth(6));

            // Opponent name
            const charNames = { la_choupe: 'La Choupe', mamie_josette: 'Mamie J.', fazzino: 'Fazzino', suchaud: 'Suchaud', ley: 'Ley' };
            this._addContent(this.add.text(dx + 14, dy + 34, charNames[match.opponent] || match.opponent, {
                fontFamily: 'monospace', fontSize: '7px',
                color: done ? CSS.CREME : CSS.GRIS, shadow: SHADOW
            }).setOrigin(0.5).setDepth(6));

            // Terrain
            this._addContent(this.add.text(dx + 14, dy + 44, match.terrain, {
                fontFamily: 'monospace', fontSize: '6px',
                color: done ? CSS.OCRE : '#3A3A2A', shadow: SHADOW
            }).setOrigin(0.5).setDepth(6));
        });

        if (save.arcadePerfect) {
            this._addContent(this.add.text(x + arcadeMatches.length * 110 + 20, arcY + 34, '\u2605 PERFECT RUN', {
                fontFamily: FONT_PIXEL, fontSize: '8px', color: CSS.OR, shadow: SHADOW
            }).setDepth(6));
        }

        // ===== PERSONNAGES DEBLOQUES =====
        const charsY = arcY + 80;
        this._addContent(this.add.text(x, charsY, 'PERSONNAGES DEBLOQUES', {
            fontFamily: FONT_PIXEL, fontSize: '10px', color: CSS.OR, shadow: SHADOW
        }).setDepth(5));

        const charNames = {
            rookie: 'Le Rookie', la_choupe: 'La Choupe', ley: 'Ley',
            foyot: 'Foyot', suchaud: 'Suchaud', fazzino: 'Fazzino',
            rocher: 'Rocher', robineau: 'Robineau', mamie_josette: 'Mamie Josette',
            sofia: 'Sofia', papi_rene: 'Papi Rene', rizzi: 'Rizzi'
        };

        const unlocked = save.unlockedCharacters || [];
        const charCols = 4;

        unlocked.forEach((id, i) => {
            const col = i % charCols;
            const row = Math.floor(i / charCols);
            const ccx = x + col * 145;
            const ccy = charsY + 18 + row * 28;

            // Character sprite mini (if available)
            const sprKey = `${id}_animated`;
            if (this.textures.exists(sprKey)) {
                this._addContent(
                    this.add.sprite(ccx + 8, ccy + 8, sprKey, 0).setScale(0.25).setOrigin(0.5).setDepth(6)
                );
            } else {
                this._addContent(this.add.text(ccx, ccy + 4, '\u2713', {
                    fontSize: '10px', color: '#44CC44'
                }).setOrigin(0.5).setDepth(6));
            }

            this._addContent(this.add.text(ccx + 20, ccy + 8, charNames[id] || id, {
                fontFamily: 'monospace', fontSize: '9px',
                color: CSS.CREME, shadow: SHADOW
            }).setOrigin(0, 0.5).setDepth(6));
        });
    }

    // ================================================================
    // TOOLTIP
    // ================================================================
    _showBouleTooltip(bx, by, bouleId, boulesData) {
        this._hideTooltip();
        const boule = boulesData?.sets?.find(s => s.id === bouleId);
        if (!boule) return;

        const tipW = 140;
        const tipH = 50;
        const tx = Math.min(bx - tipW / 2, GAME_WIDTH - tipW - 10);
        const ty = Math.max(by - tipH, 10);

        const g = this.add.graphics().setDepth(100);
        g.fillStyle(0x3A2E28, 0.95);
        g.fillRoundedRect(tx, ty, tipW, tipH, 4);
        g.lineStyle(1, 0xD4A574, 0.6);
        g.strokeRoundedRect(tx, ty, tipW, tipH, 4);

        const name = this.add.text(tx + 8, ty + 8, boule.name, {
            fontFamily: 'monospace', fontSize: '9px', color: CSS.CREME, shadow: SHADOW
        }).setDepth(101);

        const mass = this.add.text(tx + 8, ty + 22, `${boule.stats.masse}g`, {
            fontFamily: 'monospace', fontSize: '8px', color: CSS.OCRE, shadow: SHADOW
        }).setDepth(101);

        const bonusTxt = boule.bonus
            ? boule.bonus.replace('friction_x', 'Friction x').replace('knockback_x', 'Impact x').replace('retro_x', 'Retro x').replace('restitution_x', 'Rebond x')
            : 'Standard';
        const bonus = this.add.text(tx + 8, ty + 34, bonusTxt, {
            fontFamily: 'monospace', fontSize: '7px',
            color: boule.bonus ? '#87CEEB' : CSS.GRIS, shadow: SHADOW
        }).setDepth(101);

        this._hoverTooltip = [g, name, mass, bonus];
    }

    _hideTooltip() {
        if (this._hoverTooltip) {
            this._hoverTooltip.forEach(el => el.destroy());
            this._hoverTooltip = null;
        }
    }
}
