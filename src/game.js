import Phaser from 'phaser';
import TestScene from './scenes/test';
import OverlayScene from './scenes/overlay';

const resolutionConfig = {
    width: 1280,
    height: 720
};

const config = {
    type: Phaser.AUTO,
    width: resolutionConfig.width,
    height: resolutionConfig.height,
    parent: 'game-body',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [TestScene, OverlayScene]
};

const game = new Phaser.Game(config);

// Pass the resolutionConfig to the scenes
const testScene = new TestScene(resolutionConfig);
const overlayScene = new OverlayScene(resolutionConfig);

// Add the scenes to the game
game.scene.add('TestScene', testScene);
game.scene.add('OverlayScene', overlayScene);