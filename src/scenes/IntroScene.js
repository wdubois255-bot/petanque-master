import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants.js';
import { saveGame } from '../utils/SaveManager.js';

const INTRO_DIALOGUE = [
    "Ah, te voila gamin ! Approche, approche.",
    "Moi c'est le Papet. Ancien champion du canton.",
    "7 fois vainqueur du Grand Tournoi... avant le lumbago.",
    "Tu sais comment est nee la petanque ?",
    "Un vieux a rhumatismes qui pouvait plus courir...",
    "Alors il a plante ses pieds au sol et il a lance.",
    "Pes tanquats. Pieds plantes. Petanque.",
    "Et depuis, c'est devenu un art. UN ART !",
    "Il y a 3 Maitres d'Arene dans ce canton.",
    "Marcel sur la terre. Fanny sur l'herbe. Ricardo sur le sable.",
    "Et au bout du chemin... le Grand Marius. L'Ogre.",
    "Personne l'a battu depuis 20 ans.",
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

        // Maitre sprite area (simple placeholder)
        const g = this.add.graphics();
        g.fillStyle(COLORS.OCRE, 0.3);
        g.fillRoundedRect(GAME_WIDTH / 2 - 30, 20, 60, 60, 4);
        this.add.text(GAME_WIDTH / 2, 50, '👴', { fontSize: '28px' }).setOrigin(0.5);

        // Dialogue box
        this._dialogBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 40, GAME_WIDTH - 20, 55, 0x3A2E28, 0.92);
        this._dialogBg.setStrokeStyle(1, COLORS.OCRE);
        this._dialogText = this.add.text(18, GAME_HEIGHT - 62, '', {
            fontFamily: 'monospace',
            fontSize: '8px',
            color: '#F5E6D0',
            wordWrap: { width: GAME_WIDTH - 40 },
            lineSpacing: 3
        });
        this._dialogArrow = this.add.text(GAME_WIDTH - 22, GAME_HEIGHT - 18, 'v', {
            fontFamily: 'monospace', fontSize: '8px', color: '#D4A574'
        }).setOrigin(0.5);
        this.tweens.add({ targets: this._dialogArrow, alpha: { from: 1, to: 0.2 }, duration: 500, yoyo: true, repeat: -1 });

        this._showDialogue();

        // Input
        this.enterKey = this.input.keyboard.addKey('ENTER');
        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.on('pointerdown', () => this._advance());
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
        const startX = 30;
        const cardW = 110;
        const cardH = 100;
        const gap = 12;

        for (let i = 0; i < 3; i++) {
            const set = BOULE_SETS[i];
            const cx = startX + i * (cardW + gap) + cardW / 2;
            const cy = 50 + cardH / 2;

            // Card bg
            const card = this.add.rectangle(cx, cy, cardW, cardH, 0x4A3E28, 0.9);
            card.setStrokeStyle(1, i === this._selectedBoule ? 0xF5E6D0 : 0x6B5A40);
            this._uiElements.push(card);

            // Boule circle
            const boule = this.add.graphics();
            boule.fillStyle(set.color, 1);
            boule.fillCircle(cx, cy - 28, 10);
            boule.fillStyle(0xFFFFFF, 0.3);
            boule.fillCircle(cx - 3, cy - 31, 3);
            this._uiElements.push(boule);

            // Name
            const nameT = this.add.text(cx, cy - 8, set.name, {
                fontFamily: 'monospace', fontSize: '7px', color: '#F5E6D0', align: 'center'
            }).setOrigin(0.5);
            this._uiElements.push(nameT);

            // Desc
            const descT = this.add.text(cx, cy + 8, set.desc, {
                fontFamily: 'monospace', fontSize: '6px', color: '#D4A574', align: 'center', lineSpacing: 2
            }).setOrigin(0.5);
            this._uiElements.push(descT);

            // Stats bars
            this._drawStatBar(cx - 30, cy + 28, 'PRE', set.stats.precision, 4);
            this._drawStatBar(cx - 30, cy + 36, 'PUI', set.stats.puissance, 4);

            // Click zone
            card.setInteractive();
            card.on('pointerdown', () => {
                this._selectedBoule = i;
                this._updateSelection();
            });
        }

        // Controls hint
        const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12,
            '←→  Choisir     Espace  Confirmer', {
                fontFamily: 'monospace', fontSize: '6px', color: '#9E9E8E', align: 'center'
            }).setOrigin(0.5);
        this._uiElements.push(hint);
    }

    _drawStatBar(x, y, label, value, max) {
        const lbl = this.add.text(x, y, label, {
            fontFamily: 'monospace', fontSize: '5px', color: '#9E9E8E'
        });
        this._uiElements.push(lbl);

        const barG = this.add.graphics();
        for (let i = 0; i < max; i++) {
            barG.fillStyle(i < value ? 0xD4A574 : 0x4A3E28, 1);
            barG.fillRect(x + 20 + i * 12, y + 1, 10, 5);
        }
        this._uiElements.push(barG);
    }

    _updateSelection() {
        // Redraw cards with correct border
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

        // Auto-save
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
