import Phaser from 'phaser';
import { COLORS } from './utils/Constants.js';
import Layout from './utils/Layout.js';

import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import CharSelectScene from './scenes/CharSelectScene.js';
import QuickPlayScene from './scenes/QuickPlayScene.js';
import ArcadeScene from './scenes/ArcadeScene.js';
import VSIntroScene from './scenes/VSIntroScene.js';
import ResultScene from './scenes/ResultScene.js';
import OverworldScene from './scenes/OverworldScene.js';
import PetanqueScene from './scenes/PetanqueScene.js';
import LevelUpScene from './scenes/LevelUpScene.js';
import ShopScene from './scenes/ShopScene.js';
import TutorialScene from './scenes/TutorialScene.js';
import PlayerScene from './scenes/PlayerScene.js';
import CreditsScene from './scenes/CreditsScene.js';

// Dev-only scenes: dynamic import → tree-shaken en build production.
// import.meta.env.DEV est statiquement remplace par "false" en prod par Vite,
// donc le bundle final ne contient ni DevTestScene ni SpriteTestScene.
const devScenes = [];
if (import.meta.env.DEV) {
    const DevTestScene = (await import('./scenes/DevTestScene.js')).default;
    const SpriteTestScene = (await import('./scenes/SpriteTestScene.js')).default;
    devScenes.push(DevTestScene, SpriteTestScene);
}

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: Layout.W,
    height: Layout.H,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: COLORS.OMBRE,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        activePointers: 3
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        BootScene, TitleScene, CharSelectScene, QuickPlayScene, ArcadeScene,
        VSIntroScene, ResultScene, OverworldScene, PetanqueScene, LevelUpScene,
        ShopScene, TutorialScene, PlayerScene, CreditsScene,
        ...devScenes
    ]
};

export default config;
