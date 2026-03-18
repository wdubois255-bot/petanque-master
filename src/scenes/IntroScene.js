import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants.js';
import { saveGame } from '../utils/SaveManager.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

const INTRO_DIALOGUE = [
    "Ah, te voila ! Approche, approche.",
    "Moi c'est le Papet. Ancien champion du canton.",
    "7 fois vainqueur du Grand Tournoi... avant le lumbago.",
    "Tu sais comment est nee la petanque ?",
    "Un vieux a rhumatismes qui pouvait plus courir...",
    "Alors il a plante ses pieds au sol et il a lance.",
    "Pes tanquats. Pieds plantes. Petanque.",
    "Et depuis, c'est devenu un art. UN ART !",
    "Au boulodrome de La Ciotat, y'a 4 joueurs.",
    "Ley le tireur. Le Magicien le pointeur.",
    "La Choupe le bourrin. Et Marcel le malin.",
    "Chaque dimanche, ils s'affrontent.",
    "Le Tournoi des Quatre, c'est aujourd'hui.",
    "Mais d'abord... il te faut de bonnes boules.",
    "Choisis bien. C'est le debut de tout."
];

const BOULE_SETS = [
    {
        id: 'acier',
        name: 'Acier Classic',
        desc: 'L\'equilibre du milieu.\nPointer ou tirer, a toi de choisir.',
        stats: { precision: 3, puissance: 3 },
        color: 0xA8B5C2
    },
    {
        id: 'bronze',
        name: 'Bronze du Tireur',
        desc: 'Lourdes comme un pastis.\nFaites pour le carreau !',
        stats: { precision: 2, puissance: 4 },
        color: 0xCD7F32
    },
    {
        id: 'chrome',
        name: 'Chrome du Pointeur',
        desc: 'Legeres et precises.\nLa plombee parfaite.',
        stats: { precision: 4, puissance: 2 },
        color: 0xDCDCDC
    }
];

export default class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }

    create() {
        this.cameras.main.fadeIn(300);
        this._phase = 'dialogue'; // dialogue | choose | confirm
        this._dialogueIndex = 0;
        this._selectedBoule = 0;
        this._uiElements = [];

        // Background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.OMBRE);

        // Maitre sprite area
        const g = this.add.graphics();
        g.fillStyle(COLORS.OCRE, 0.3);
        g.fillRoundedRect(GAME_WIDTH / 2 - 60, 32, 120, 120, 8);
        this.add.text(GAME_WIDTH / 2, 92, '\ud83d\udc74', { fontSize: '56px' }).setOrigin(0.5);

        // Dialogue box
        this._dialogBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 76, GAME_WIDTH - 32, 116, 0x3A2E28, 0.92);
        this._dialogBg.setStrokeStyle(2, COLORS.OCRE);
        this._dialogText = this.add.text(32, GAME_HEIGHT - 124, '', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#F5E6D0',
            wordWrap: { width: GAME_WIDTH - 72 },
            lineSpacing: 6,
            shadow: SHADOW
        });
        this._dialogArrow = this.add.text(GAME_WIDTH - 40, GAME_HEIGHT - 32, '\u25bc', {
            fontFamily: 'monospace', fontSize: '20px', color: '#D4A574',
            shadow: SHADOW
        }).setOrigin(0.5);
        this.tweens.add({ targets: this._dialogArrow, alpha: { from: 1, to: 0.2 }, duration: 500, yoyo: true, repeat: -1 });

        this._showDialogue();

        // Input
        this.enterKey = this.input.keyboard.addKey('ENTER');
        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.cursors = this.input.keyboard.createCursorKeys();
        this._onPointerDown = () => this._advance();
        this.input.on('pointerdown', this._onPointerDown);

        this.events.on('shutdown', this._shutdown, this);
    }

    _shutdown() {
        this.input.removeAllListeners();
        this.input.keyboard.removeAllListeners();
        this.tweens.killAll();
    }

    _showDialogue() {
        this._dialogText.setText(INTRO_DIALOGUE[this._dialogueIndex]);
        this._dialogArrow.setVisible(true);
    }

    _advance() {
        if (this._phase === 'dialogue') {
            this._dialogueIndex++;
            if (this._dialogueIndex < INTRO_DIALOGUE.length) {
                this._showDialogue();
            } else {
                this._phase = 'choose';
                this._dialogArrow.setVisible(false);
                this._dialogText.setText('Quel set de boules veux-tu ?');
                this._showBouleChoice();
            }
        } else if (this._phase === 'confirm') {
            this._confirmChoice();
        }
    }

    _showBouleChoice() {
        const startX = 52;
        const cardW = 230;
        const cardH = 210;
        const gap = 20;

        for (let i = 0; i < 3; i++) {
            const set = BOULE_SETS[i];
            const cx = startX + i * (cardW + gap) + cardW / 2;
            const cy = 96 + cardH / 2;

            // Card bg
            const card = this.add.rectangle(cx, cy, cardW, cardH, 0x4A3E28, 0.9);
            card.setStrokeStyle(i === this._selectedBoule ? 3 : 2, i === this._selectedBoule ? 0xFFD700 : 0x6B5A40);
            this._uiElements.push(card);

            // Boule circle (bigger)
            const boule = this.add.graphics();
            boule.fillStyle(set.color, 1);
            boule.fillCircle(cx, cy - 56, 24);
            boule.fillStyle(0xFFFFFF, 0.3);
            boule.fillCircle(cx - 8, cy - 64, 8);
            this._uiElements.push(boule);

            // Name
            const nameT = this.add.text(cx, cy - 16, set.name, {
                fontFamily: 'monospace', fontSize: '18px', color: '#FFD700', align: 'center',
                shadow: SHADOW
            }).setOrigin(0.5);
            this._uiElements.push(nameT);

            // Desc
            const descT = this.add.text(cx, cy + 20, set.desc, {
                fontFamily: 'monospace', fontSize: '16px', color: '#D4A574', align: 'center',
                lineSpacing: 4, shadow: SHADOW
            }).setOrigin(0.5);
            this._uiElements.push(descT);

            // Stats bars
            this._drawStatBar(cx - 70, cy + 60, 'PRE', set.stats.precision, 4);
            this._drawStatBar(cx - 70, cy + 80, 'PUI', set.stats.puissance, 4);

            // Click zone
            card.setInteractive();
            card.on('pointerdown', () => {
                this._selectedBoule = i;
                this._updateSelection();
            });
        }

        // Controls hint
        const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 24,
            '\u2190\u2192  Choisir     Espace  Confirmer', {
                fontFamily: 'monospace', fontSize: '16px', color: '#9E9E8E',
                align: 'center', shadow: SHADOW
            }).setOrigin(0.5);
        this._uiElements.push(hint);
    }

    _drawStatBar(x, y, label, value, max) {
        const lbl = this.add.text(x, y, label, {
            fontFamily: 'monospace', fontSize: '14px', color: '#9E9E8E',
            shadow: SHADOW
        });
        this._uiElements.push(lbl);

        const barG = this.add.graphics();
        for (let i = 0; i < max; i++) {
            barG.fillStyle(i < value ? 0xD4A574 : 0x4A3E28, 1);
            barG.fillRect(x + 44, y + 2, 20, 12);
            barG.lineStyle(2, 0x6B5A40, 0.5);
            barG.strokeRect(x + 44 + i * 26, y + 2, 20, 12);
            barG.fillStyle(i < value ? 0xD4A574 : 0x4A3E28, 1);
            barG.fillRect(x + 44 + i * 26, y + 2, 20, 12);
        }
        this._uiElements.push(barG);
    }

    _updateSelection() {
        this._uiElements.forEach(e => e.destroy());
        this._uiElements = [];
        this._showBouleChoice();
    }

    _confirmChoice() {
        const set = BOULE_SETS[this._selectedBoule];
        const gameState = this.registry.get('gameState');
        gameState.bouleType = set.id;
        gameState.flags.intro_done = true;
        this.registry.set('gameState', gameState);

        const slot = this.registry.get('currentSlot') || 0;
        saveGame(slot, gameState);

        this.cameras.main.fadeOut(400);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('OverworldScene', {
                map: 'village_depart',
                spawnX: 14,
                spawnY: 20
            });
        });
    }

    update() {
        const confirm = Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey);
        const left = Phaser.Input.Keyboard.JustDown(this.cursors.left);
        const right = Phaser.Input.Keyboard.JustDown(this.cursors.right);

        if (this._phase === 'dialogue' && confirm) {
            this._advance();
        } else if (this._phase === 'choose') {
            if (left) {
                this._selectedBoule = Math.max(0, this._selectedBoule - 1);
                this._updateSelection();
            }
            if (right) {
                this._selectedBoule = Math.min(2, this._selectedBoule + 1);
                this._updateSelection();
            }
            if (confirm) {
                this._phase = 'confirm';
                const set = BOULE_SETS[this._selectedBoule];
                this._dialogText.setText(`Les ${set.name} ! ${set.id === 'bronze' ? 'Un choix de tireur !' : set.id === 'chrome' ? 'Un choix de pointeur !' : 'L\'equilibre, le choix des grands !'} On y va ?`);
                this._dialogArrow.setVisible(true);
            }
        } else if (this._phase === 'confirm' && confirm) {
            this._confirmChoice();
        }
    }
}
