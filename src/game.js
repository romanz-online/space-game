import Phaser from 'phaser';
import TestScene from './scenes/test';
import OverlayScene from './scenes/overlay';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-body',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [TestScene, OverlayScene]
    // scene: TestScene
};

const game = new Phaser.Game(config);