import Phaser from 'phaser';
import config from './config.js';
import I18n from './utils/I18n.js';

await I18n.load(I18n.detect());
const game = new Phaser.Game(config);
if (typeof globalThis !== 'undefined') globalThis.__PHASER_GAME__ = game;
