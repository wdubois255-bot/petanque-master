import { GAME_WIDTH, GAME_HEIGHT, FEEDBACK_URL, IS_MOBILE } from '../utils/Constants.js';
import { loadSave } from '../utils/SaveManager.js';
import { sfxUIClick, sfxUIHover } from '../utils/SoundManager.js';
import I18n from '../utils/I18n.js';

/**
 * FeedbackWidget — modal in-game feedback form.
 *
 * Shows a quick rating (3 emoji-style buttons) + optional text comment.
 * Collects game context automatically (scene, terrain, scores, device, errors).
 * Stores feedback locally in localStorage and optionally sends to FEEDBACK_URL webhook.
 *
 * Usage:
 *   FeedbackWidget.open(scene)                     — from any Phaser scene
 *   FeedbackWidget.open(scene, { gameContext })     — with extra context
 */

const STORAGE_KEY = 'petanque_feedback';
const MAX_LOCAL_ENTRIES = 50;
const DEPTH = 300;

export default class FeedbackWidget {

    /**
     * Open the feedback modal on top of any scene.
     * @param {Phaser.Scene} scene
     * @param {object} [options]
     * @param {string} [options.scene]    — current scene name
     * @param {string} [options.terrain]  — terrain ID
     * @param {object} [options.scores]   — { player, opponent }
     * @param {string} [options.opponent] — opponent name
     * @param {number} [options.mene]     — current mène
     */
    static open(scene, options = {}) {
        if (scene._feedbackWidgetActive) return;
        scene._feedbackWidgetActive = true;

        const ctx = FeedbackWidget._collectContext(scene, options);
        const elements = [];
        let selectedRating = null;
        let commentText = '';

        const CX = GAME_WIDTH / 2;
        const CY = GAME_HEIGHT / 2;
        const pw = 380, ph = 260;
        const px = CX - pw / 2, py = CY - ph / 2;

        // === Overlay ===
        const overlay = scene.add.graphics().setDepth(DEPTH);
        overlay.fillStyle(0x1A1510, 0.75);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        overlay.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT),
            Phaser.Geom.Rectangle.Contains
        );
        elements.push(overlay);

        // === Panel ===
        const panel = scene.add.graphics().setDepth(DEPTH + 1);
        panel.fillStyle(0x3A2E28, 0.98);
        panel.fillRoundedRect(px, py, pw, ph, 10);
        panel.lineStyle(2, 0xD4A574, 0.85);
        panel.strokeRoundedRect(px, py, pw, ph, 10);
        // Header bar
        panel.fillStyle(0x5A3E28, 0.5);
        panel.fillRoundedRect(px, py, pw, 40, { tl: 10, tr: 10, bl: 0, br: 0 });
        elements.push(panel);

        // === Title ===
        const title = scene.add.text(CX, py + 20, I18n.t('feedback.title'), {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(DEPTH + 2);
        elements.push(title);

        // === Rating question ===
        const question = scene.add.text(CX, py + 58, I18n.t('feedback.how_fun'), {
            fontFamily: 'monospace', fontSize: '11px', color: '#F5E6D0',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(DEPTH + 2);
        elements.push(question);

        // === Rating buttons (3 choices) ===
        const ratings = [
            { label: I18n.t('feedback.rating_good'), value: 'good', color: '#6B8E4E', hoverColor: '#8BAE6E' },
            { label: I18n.t('feedback.rating_ok'), value: 'ok', color: '#C4854A', hoverColor: '#D4954A' },
            { label: I18n.t('feedback.rating_bad'), value: 'bad', color: '#C44B3F', hoverColor: '#D45B4F' }
        ];

        const ratingBtns = [];
        const btnW = 100, btnH = 32;
        const startX = CX - (ratings.length * (btnW + 10) - 10) / 2;

        ratings.forEach((r, i) => {
            const bx = startX + i * (btnW + 10);
            const by = py + 80;

            const bg = scene.add.graphics().setDepth(DEPTH + 2);
            const drawNormal = (selected) => {
                bg.clear();
                const c = Phaser.Display.Color.HexStringToColor(r.color).color;
                bg.fillStyle(c, selected ? 1 : 0.7);
                bg.fillRoundedRect(bx, by, btnW, btnH, 5);
                if (selected) {
                    bg.lineStyle(2, 0xFFD700, 1);
                    bg.strokeRoundedRect(bx, by, btnW, btnH, 5);
                }
            };
            const drawHover = () => {
                bg.clear();
                const c = Phaser.Display.Color.HexStringToColor(r.hoverColor).color;
                bg.fillStyle(c, 1);
                bg.fillRoundedRect(bx, by, btnW, btnH, 5);
                bg.lineStyle(1, 0xFFD700, 0.5);
                bg.strokeRoundedRect(bx, by, btnW, btnH, 5);
            };
            drawNormal(false);

            const lbl = scene.add.text(bx + btnW / 2, by + btnH / 2, r.label, {
                fontFamily: 'monospace', fontSize: '11px', color: '#F5E6D0',
                shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
            }).setOrigin(0.5).setDepth(DEPTH + 3);

            const zone = scene.add.zone(bx + btnW / 2, by + btnH / 2, btnW, btnH)
                .setInteractive({ useHandCursor: true }).setDepth(DEPTH + 4);
            zone.on('pointerover', () => { drawHover(); sfxUIHover(); });
            zone.on('pointerout', () => drawNormal(selectedRating === r.value));
            zone.on('pointerdown', () => {
                sfxUIClick();
                selectedRating = r.value;
                // Update all buttons
                ratingBtns.forEach((btn, j) => {
                    btn.draw(ratings[j].value === r.value);
                });
            });

            ratingBtns.push({ draw: drawNormal, bg, lbl, zone });
            elements.push(bg, lbl, zone);
        });

        // === Comment label ===
        const commentLabel = scene.add.text(px + 16, py + 124, I18n.t('feedback.comment_label'), {
            fontFamily: 'monospace', fontSize: '10px', color: '#D4A574'
        }).setDepth(DEPTH + 2);
        elements.push(commentLabel);

        // === Comment input (DOM text input overlaid) ===
        const inputX = px + 16;
        const inputY = py + 140;
        const inputW = pw - 32;
        const inputH = 44;

        // Visual background for the input area
        const inputBg = scene.add.graphics().setDepth(DEPTH + 2);
        inputBg.fillStyle(0x1A1510, 0.6);
        inputBg.fillRoundedRect(inputX, inputY, inputW, inputH, 4);
        inputBg.lineStyle(1, 0xD4A574, 0.4);
        inputBg.strokeRoundedRect(inputX, inputY, inputW, inputH, 4);
        elements.push(inputBg);

        // Use a DOM element for text input (Phaser has no native text input)
        const domInput = document.createElement('textarea');
        domInput.style.cssText = `
            position: absolute; z-index: 1000;
            background: rgba(26,21,16,0.85); color: #F5E6D0;
            border: 1px solid #D4A574; border-radius: 4px;
            font-family: monospace; font-size: 11px;
            padding: 6px; resize: none; outline: none;
            box-sizing: border-box;
        `;
        domInput.maxLength = 300;
        domInput.placeholder = I18n.t('feedback.comment_placeholder');
        // Prevent Phaser from capturing keyboard events while typing
        domInput.addEventListener('keydown', (e) => e.stopPropagation());
        domInput.addEventListener('keyup', (e) => e.stopPropagation());

        // Position the DOM input to match the canvas coordinates
        const updateInputPosition = () => {
            const canvas = scene.game.canvas;
            const rect = canvas.getBoundingClientRect();
            const scaleX = rect.width / GAME_WIDTH;
            const scaleY = rect.height / GAME_HEIGHT;
            domInput.style.left = `${rect.left + inputX * scaleX}px`;
            domInput.style.top = `${rect.top + inputY * scaleY}px`;
            domInput.style.width = `${inputW * scaleX}px`;
            domInput.style.height = `${inputH * scaleY}px`;
            domInput.style.fontSize = `${Math.max(10, 11 * scaleY)}px`;
        };
        updateInputPosition();
        document.body.appendChild(domInput);

        domInput.addEventListener('input', () => {
            commentText = domInput.value;
        });

        // === Send button (DOM — above canvas like textarea) ===
        const sendY = py + ph - 48;
        const sendW = pw - 32;
        const sendH = 32;
        const domSendBtn = document.createElement('button');
        domSendBtn.textContent = I18n.t('feedback.send');
        domSendBtn.style.cssText = `
            position: absolute; z-index: 1001; cursor: pointer;
            background: rgba(42,90,42,0.9); color: #44FF44;
            border: 1px solid #44CC44; border-radius: 6px;
            font-family: monospace; font-size: 13px; font-weight: bold;
            box-sizing: border-box; outline: none;
            transition: background 0.15s;
        `;
        domSendBtn.addEventListener('mouseenter', () => {
            domSendBtn.style.background = 'rgba(58,122,58,1)';
        });
        domSendBtn.addEventListener('mouseleave', () => {
            domSendBtn.style.background = 'rgba(42,90,42,0.9)';
        });
        const updateSendPosition = () => {
            const canvas = scene.game.canvas;
            const rect = canvas.getBoundingClientRect();
            const scaleX = rect.width / GAME_WIDTH;
            const scaleY = rect.height / GAME_HEIGHT;
            domSendBtn.style.left = `${rect.left + (px + 16) * scaleX}px`;
            domSendBtn.style.top = `${rect.top + sendY * scaleY}px`;
            domSendBtn.style.width = `${sendW * scaleX}px`;
            domSendBtn.style.height = `${sendH * scaleY}px`;
            domSendBtn.style.fontSize = `${Math.max(11, 13 * scaleY)}px`;
        };
        updateSendPosition();
        document.body.appendChild(domSendBtn);

        domSendBtn.addEventListener('click', () => {
            sfxUIClick();
            const entry = {
                rating: selectedRating || 'none',
                comment: commentText.trim().slice(0, 300),
                context: ctx,
                timestamp: new Date().toISOString()
            };
            FeedbackWidget._store(entry);
            FeedbackWidget._sendToWebhook(entry);
            cleanup();
            FeedbackWidget._showConfirmation(scene);
        });

        // === Close / cancel (small X top-right) ===
        const closeBtn = scene.add.text(px + pw - 14, py + 8, 'X', {
            fontFamily: 'monospace', fontSize: '14px', color: '#A09080'
        }).setOrigin(0.5).setDepth(DEPTH + 3)
          .setInteractive({ useHandCursor: true });
        closeBtn.on('pointerover', () => { closeBtn.setColor('#FFD700'); sfxUIHover(); });
        closeBtn.on('pointerout', () => closeBtn.setColor('#A09080'));
        closeBtn.on('pointerdown', () => { sfxUIClick(); cleanup(); });
        elements.push(closeBtn);

        // === Cleanup function ===
        const cleanup = () => {
            elements.forEach(el => { if (el?.active !== false) el.destroy(); });
            if (domInput.parentNode) domInput.parentNode.removeChild(domInput);
            if (domSendBtn.parentNode) domSendBtn.parentNode.removeChild(domSendBtn);
            scene._feedbackWidgetActive = false;
        };

        // Close on overlay click outside panel
        overlay.on('pointerdown', (pointer) => {
            const lx = pointer.x, ly = pointer.y;
            if (lx < px || lx > px + pw || ly < py || ly > py + ph) {
                sfxUIClick();
                cleanup();
            }
        });
    }

    // ================================================================
    // CONTEXT COLLECTION
    // ================================================================
    static _collectContext(scene, options) {
        const save = loadSave();
        const errors = (typeof globalThis !== 'undefined' && globalThis.__GAME_ERRORS__) || [];

        return {
            scene: options.scene || scene.scene?.key || 'unknown',
            terrain: options.terrain || null,
            scores: options.scores || null,
            opponent: options.opponent || null,
            mene: options.mene ?? null,
            device: IS_MOBILE ? 'mobile' : 'desktop',
            screen: `${window.innerWidth}x${window.innerHeight}`,
            userAgent: navigator.userAgent.slice(0, 120),
            lang: I18n.currentLang || 'fr',
            arcadeProgress: save.arcadeProgress || 0,
            totalMatches: save.stats?.totalMatches || 0,
            totalWins: save.stats?.totalWins || 0,
            playtime: save.playtime || 0,
            errors: errors.length > 0 ? errors.slice(-5) : []
        };
    }

    // ================================================================
    // LOCAL STORAGE
    // ================================================================
    static _store(entry) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            list.push(entry);
            if (list.length > MAX_LOCAL_ENTRIES) list.splice(0, list.length - MAX_LOCAL_ENTRIES);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch (_) { /* localStorage full or disabled — silent fail */ }
    }

    // ================================================================
    // WEBHOOK SEND (best-effort, no error shown if it fails)
    // Google Apps Script redirects (302) — the POST body is received
    // before the redirect. The browser CORS error on the redirect
    // response is expected and harmless (data already processed).
    // Feedback is always saved locally first — webhook is bonus.
    // ================================================================
    static _sendToWebhook(entry) {
        if (!FEEDBACK_URL || FEEDBACK_URL.includes('PLACEHOLDER')) return;
        try {
            fetch(FEEDBACK_URL, {
                method: 'POST',
                body: JSON.stringify(entry)
            }).catch(() => { /* CORS error on redirect — expected, data was received */ });
        } catch (_) { /* fetch not available */ }
    }

    // ================================================================
    // CONFIRMATION TOAST
    // ================================================================
    static _showConfirmation(scene) {
        const msg = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40,
            I18n.t('feedback.thanks'), {
                fontFamily: 'monospace', fontSize: '13px', color: '#6B8E4E',
                shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
            }).setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        scene.tweens.add({
            targets: msg, alpha: 1, duration: 300, ease: 'Sine.easeOut',
            onComplete: () => {
                scene.tweens.add({
                    targets: msg, alpha: 0, y: msg.y - 20,
                    delay: 2000, duration: 600,
                    onComplete: () => msg.destroy()
                });
            }
        });
    }

    // ================================================================
    // RETRIEVE LOCAL FEEDBACK (for dev/debug)
    // ================================================================
    static getLocalFeedback() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (_) { return []; }
    }
}
