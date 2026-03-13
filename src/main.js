import Phaser from 'phaser';
import config from './config.js';

const game = new Phaser.Game(config);
window.__PHASER_GAME__ = game;
