import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './utils/Constants.js';

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
import DevTestScene from './scenes/DevTestScene.js';


const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: COLORS.OMBRE,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, TitleScene, CharSelectScene, QuickPlayScene, ArcadeScene, VSIntroScene, ResultScene, OverworldScene, PetanqueScene, LevelUpScene, ShopScene, TutorialScene, PlayerScene, DevTestScene]
};

export default config;
