/**
 * Commentator — Affiche des phrases de commentaire TV en haut de l'ecran.
 * Texte uniquement (pas de synthese vocale). Fond semi-transparent, 3s visible.
 *
 * Usage:
 *   const comm = new Commentator(scene);
 *   comm.loadPhrases(cache);   // appeler dans create()
 *   comm.say('carreau');       // appeler sur les events de jeu
 *   comm.destroy();            // appeler dans shutdown()
 */
export default class Commentator {
    constructor(scene) {
        this.scene = scene;
        this._phrases = null;
        this._lastCategory = null;
        this._lastTime = 0;
        this._cooldown = 3000;   // 3s minimum entre deux commentaires
        this._sameRepeat = 8000; // 8s avant de repeter la meme categorie
        this._textObj = null;
        this._bgObj = null;
        this._tween = null;
    }

    /** Charger les phrases depuis le cache Phaser (apres que PetanqueScene a charge JSON). */
    loadPhrases(cache) {
        try {
            this._phrases = cache.json.get('commentator');
        } catch (_) {
            this._phrases = null;
        }
    }

    /**
     * Afficher un commentaire pour la categorie donnee.
     * Respecte cooldown + anti-spam meme categorie.
     * Priorite : si un commentaire est deja visible, on l'ignore sauf si c'est une categorie importante.
     *
     * @param {string} category - cle dans commentator.json
     * @param {boolean} [force=false] - ignorer le cooldown (pour les events tres importants)
     */
    say(category, force = false) {
        if (!this._phrases) return;
        const pool = this._phrases[category];
        if (!pool || pool.length === 0) return;

        const now = Date.now();
        if (!force) {
            if (now - this._lastTime < this._cooldown) return;
            if (category === this._lastCategory && now - this._lastTime < this._sameRepeat) return;
        }

        const text = pool[Math.floor(Math.random() * pool.length)];
        this._display(text);
        this._lastCategory = category;
        this._lastTime = now;
    }

    _display(text) {
        // Nettoyer l'affichage precedent immediatement
        this._clearDisplay();

        const scene = this.scene;
        const w = scene.scale.width;

        // Fond semi-transparent (style commentaire TV)
        this._bgObj = scene.add.graphics().setDepth(98);
        const padding = { x: 14, y: 7 };
        // On dessine le fond apres avoir cree le texte pour connaitre ses dimensions
        // Donc on cree le texte d'abord avec alpha 0

        this._textObj = scene.add.text(w / 2, 14, text, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#FFD700',
            align: 'center',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5, 0).setDepth(99).setAlpha(0);

        // Dessiner le fond maintenant qu'on connait la taille du texte
        const tw = this._textObj.width + padding.x * 2;
        const th = this._textObj.height + padding.y * 2;
        const tx = w / 2 - tw / 2;
        const ty = 12;
        this._bgObj.fillStyle(0x1A1510, 0.72);
        this._bgObj.fillRoundedRect(tx, ty, tw, th, 4);
        this._bgObj.setAlpha(0);

        // Tween : fade in 200ms, stay 2500ms, fade out 300ms
        const targets = [this._textObj, this._bgObj];
        scene.tweens.add({
            targets, alpha: 1, duration: 200, ease: 'Linear',
            onComplete: () => {
                scene.time.delayedCall(2500, () => {
                    if (!this._textObj) return;
                    scene.tweens.add({
                        targets, alpha: 0, duration: 300, ease: 'Linear',
                        onComplete: () => this._clearDisplay()
                    });
                });
            }
        });
    }

    _clearDisplay() {
        if (this._textObj) { try { this._textObj.destroy(); } catch (_) {} this._textObj = null; }
        if (this._bgObj) { try { this._bgObj.destroy(); } catch (_) {} this._bgObj = null; }
    }

    destroy() {
        this._clearDisplay();
        this._phrases = null;
    }
}
